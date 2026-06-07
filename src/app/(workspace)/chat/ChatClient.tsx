"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  InputBase,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ArrowUpwardOutlined,
  AttachFileOutlined,
  AutoAwesomeOutlined,
} from "@mui/icons-material";

import { io, type Socket } from "socket.io-client";

import { useWorkspace } from "@/src/providers/workspace-provider";
import { useFeedback } from "@/src/providers/feedback-provider";
import { HEADER_HEIGHT } from "@/src/components/ui/Sidebar";
import type { components } from "@/src/types/api";
import { sendChatMessage, pollChatMessage, getSocketTicket } from "./actions";

type ChatMessage = components["schemas"]["ChatMessageResponseDTO"];

// Mantido em sincronia com CHAT_STATUS_EVENT no backend (src/consts.ts).
const CHAT_STATUS_EVENT = "chat:status";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

const SUGGESTIONS = [
  "Resuma minhas tarefas em andamento e o que priorizar essa semana.",
  "Quais tarefas estão atrasadas?",
  "O que está bloqueando o time agora?",
] as const;

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 40; // ~80s de teto

interface Props {
  initialMessages: ChatMessage[];
}

export default function ChatClient({ initialMessages }: Props) {
  const theme = useTheme();
  const { show } = useFeedback();
  const { user } = useWorkspace();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const socketRef = useRef<Socket | null>(null);
  // Mensagens (ids reais) aguardando resposta — usadas para acionar o
  // fallback de polling caso o socket caia.
  const pendingIdsRef = useRef<Set<string>>(new Set());
  // Ids já em polling, para não abrir loops duplicados.
  const polledIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    const timers = timersRef.current;
    return () => {
      mountedRef.current = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  // Auto-scroll para a última mensagem.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const userInitials = useMemo(
    () =>
      (user.name ?? "")
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("") || "EU",
    [user.name],
  );

  const isAwaiting = sending || messages.some((m) => isPending(m));

  const pollUntilDelivered = useCallback(
    (messageId: string) => {
      let attempts = 0;

      const tick = async () => {
        if (!mountedRef.current) return;

        const result = await pollChatMessage(messageId);
        if (!mountedRef.current) return;

        if (result.success) {
          const updated = result.data;
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? updated : m)),
          );

          if (updated.status === "DELIVERED") {
            pendingIdsRef.current.delete(messageId);
            return;
          }
          if (updated.status === "FAILED") {
            pendingIdsRef.current.delete(messageId);
            show("A IA não conseguiu responder. Tente novamente.", "error");
            return;
          }
        }

        attempts += 1;
        if (attempts >= POLL_MAX_ATTEMPTS) {
          show("A resposta está demorando mais que o esperado.", "info");
          return;
        }

        timersRef.current.push(setTimeout(tick, POLL_INTERVAL_MS));
      };

      timersRef.current.push(setTimeout(tick, POLL_INTERVAL_MS));
    },
    [show],
  );

  // Fallback: faz polling de uma mensagem no máximo uma vez (evita loops
  // duplicados quando o socket reconecta/derruba várias vezes).
  const startPolling = useCallback(
    (messageId: string) => {
      if (polledIdsRef.current.has(messageId)) return;
      polledIdsRef.current.add(messageId);
      pollUntilDelivered(messageId);
    },
    [pollUntilDelivered],
  );

  // Conexão WebSocket: recebe as atualizações de status em tempo real.
  // Caminho primário; se falhar/cair, o polling assume (ver startPolling).
  useEffect(() => {
    if (!WS_URL) return; // sem WS configurado → modo polling-only

    let socket: Socket | null = null;
    let cancelled = false;

    const connect = async () => {
      const ticket = await getSocketTicket();
      if (cancelled || !mountedRef.current || !ticket.success) return;

      socket = io(WS_URL, {
        auth: { ticket: ticket.data.ticket },
        transports: ["websocket"],
      });
      socketRef.current = socket;

      socket.on(CHAT_STATUS_EVENT, (msg: ChatMessage) => {
        if (!mountedRef.current) return;
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));

        if (msg.status === "DELIVERED" || msg.status === "FAILED") {
          pendingIdsRef.current.delete(msg.id);
          if (msg.status === "FAILED") {
            show("A IA não conseguiu responder. Tente novamente.", "error");
          }
        }
      });

      // Se o socket cair com mensagens ainda pendentes, religa o polling.
      const fallbackPending = () => {
        pendingIdsRef.current.forEach((id) => startPolling(id));
      };
      socket.on("disconnect", fallbackPending);
      socket.on("connect_error", fallbackPending);
    };

    void connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [show, startPolling]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    const tempId = `temp-${messages.length}-${text.length}`;
    const optimistic: ChatMessage = {
      id: tempId,
      userId: user.id,
      content: text,
      response: null,
      status: "QUEUED",
      filters: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendChatMessage(text);
    setSending(false);
    if (!mountedRef.current) return;

    if (!result.success) {
      show(result.message, "error");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? result.data : m)),
    );

    // Aguarda a resposta: socket é o caminho primário; sem conexão, polling.
    pendingIdsRef.current.add(result.data.id);
    if (!socketRef.current?.connected) {
      startPolling(result.data.id);
    }
  }, [input, sending, messages.length, user.id, show, startPolling]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          px: { xs: theme.spacing(2), md: theme.spacing(4) },
          py: { xs: theme.spacing(2.5), md: 0 },
          minHeight: { md: HEADER_HEIGHT },
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing(2),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(1.5) }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: `${theme.shape.borderRadius}px`,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutoAwesomeOutlined sx={{ fontSize: 18, color: theme.palette.primary.main }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.2 }}>
              Solut AI
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Pergunte sobre suas tarefas, projetos e prioridades
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            fontSize: "0.75rem",
            color: theme.palette.text.secondary,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: theme.palette.success.main,
            }}
          />
          Online
        </Box>
      </Box>

      {/* Mensagens */}
      <Box
        ref={scrollRef}
        sx={{ flex: 1, overflow: "auto", p: { xs: theme.spacing(2), md: theme.spacing(4) } }}
      >
        <Box
          sx={{
            maxWidth: 768,
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(3),
            minHeight: "100%",
          }}
        >
          {messages.length === 0 ? (
            <EmptyState onPick={setInput} />
          ) : (
            messages.map((message) => (
              <Turn
                key={message.id}
                message={message}
                userInitials={userInitials}
                userAvatar={user.avatar ?? undefined}
              />
            ))
          )}
        </Box>
      </Box>

      {/* Composer */}
      <Box sx={{ p: { xs: theme.spacing(2), md: theme.spacing(3) }, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ maxWidth: 768, mx: "auto" }}>
          <Box
            sx={{
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${(theme.shape.borderRadius as number) * 4}px`,
              transition: theme.transitions.create("border-color"),
              "&:focus-within": {
                borderColor: alpha(theme.palette.primary.main, 0.5),
              },
            }}
          >
            <InputBase
              multiline
              minRows={2}
              maxRows={8}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre tarefas, projetos ou peça para a IA analisar algo..."
              sx={{
                width: "100%",
                px: theme.spacing(2),
                py: theme.spacing(1.5),
                fontSize: "0.875rem",
                color: theme.palette.text.primary,
              }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: theme.spacing(1.5),
                py: theme.spacing(1),
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <IconButton
                size="small"
                disabled
                sx={{ color: theme.palette.text.secondary }}
              >
                <AttachFileOutlined sx={{ fontSize: 18 }} />
              </IconButton>

              <IconButton
                onClick={handleSend}
                disabled={!input.trim() || isAwaiting}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  transition: theme.transitions.create([
                    "box-shadow",
                    "background-color",
                  ]),
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                    boxShadow: theme.shadows[3],
                  },
                  "&.Mui-disabled": {
                    bgcolor: alpha(theme.palette.primary.main, 0.3),
                    color: alpha(theme.palette.primary.contrastText, 0.5),
                  },
                }}
              >
                {isAwaiting ? (
                  <CircularProgress size={16} sx={{ color: "inherit" }} />
                ) : (
                  <ArrowUpwardOutlined sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              mt: theme.spacing(1.5),
              color: theme.palette.text.secondary,
            }}
          >
            A Solut AI pode cometer erros. Verifique informações importantes.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Helpers & subcomponentes ────────────────────────────────────────────────

function isPending(message: ChatMessage) {
  return message.status === "QUEUED" || message.status === "PROCESSING";
}

function Turn({
  message,
  userInitials,
  userAvatar,
}: {
  message: ChatMessage;
  userInitials: string;
  userAvatar?: string;
}) {
  const responseText = message.response as unknown as string | null;
  const pending = isPending(message);
  const failed = message.status === "FAILED";

  return (
    <>
      <Bubble role="user" userInitials={userInitials} userAvatar={userAvatar}>
        {message.content}
      </Bubble>

      <Bubble role="ai" pending={pending} failed={failed}>
        {failed
          ? "Não foi possível gerar uma resposta para esta mensagem."
          : responseText ?? ""}
      </Bubble>
    </>
  );
}

function Bubble({
  role,
  children,
  pending = false,
  failed = false,
  userInitials,
  userAvatar,
}: {
  role: "user" | "ai";
  children: React.ReactNode;
  pending?: boolean;
  failed?: boolean;
  userInitials?: string;
  userAvatar?: string;
}) {
  const theme = useTheme();
  const isAI = role === "ai";
  const bubbleRadius = (theme.shape.borderRadius as number) * 4;

  return (
    <Box
      sx={{
        display: "flex",
        gap: theme.spacing(2),
        flexDirection: isAI ? "row" : "row-reverse",
      }}
    >
      <Avatar
        src={isAI ? undefined : userAvatar}
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: theme.palette.common.white,
          background: isAI
            ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            : `linear-gradient(135deg, ${theme.palette.warning.light}, ${theme.palette.warning.dark})`,
        }}
      >
        {isAI ? "AI" : userInitials}
      </Avatar>

      <Box
        sx={{
          maxWidth: "80%",
          p: theme.spacing(2),
          fontSize: "0.875rem",
          lineHeight: 1.7,
          whiteSpace: "pre-line",
          borderRadius: `${bubbleRadius}px`,
          ...(isAI
            ? {
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderTopLeftRadius: `${theme.shape.borderRadius}px`,
                color: failed ? theme.palette.error.main : theme.palette.text.primary,
              }
            : {
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                borderTopRightRadius: `${theme.shape.borderRadius}px`,
              }),
        }}
      >
        {pending ? <TypingDots /> : children}
      </Box>
    </Box>
  );
}

function TypingDots() {
  const theme = useTheme();
  const dot = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    bgcolor: theme.palette.text.secondary,
    animation: "chat-typing 1.2s infinite ease-in-out",
    "@keyframes chat-typing": {
      "0%, 60%, 100%": { opacity: 0.25, transform: "translateY(0)" },
      "30%": { opacity: 1, transform: "translateY(-3px)" },
    },
  } as const;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, height: 20 }}>
      <Box sx={{ ...dot, animationDelay: "0s" }} />
      <Box sx={{ ...dot, animationDelay: "0.2s" }} />
      <Box sx={{ ...dot, animationDelay: "0.4s" }} />
    </Box>
  );
}

function EmptyState({ onPick }: { onPick: (value: string) => void }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: theme.spacing(2),
        py: theme.spacing(6),
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: `${(theme.shape.borderRadius as number) * 3}px`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: theme.shadows[3],
        }}
      >
        <AutoAwesomeOutlined sx={{ fontSize: 26, color: theme.palette.common.white }} />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Como posso ajudar?
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          Pergunte sobre suas tarefas, projetos e prioridades.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: theme.spacing(1.5),
          maxWidth: 560,
          mt: theme.spacing(1),
        }}
      >
        {SUGGESTIONS.map((suggestion) => (
          <Box
            key={suggestion}
            component="button"
            type="button"
            onClick={() => onPick(suggestion)}
            sx={{
              cursor: "pointer",
              textAlign: "left",
              px: theme.spacing(2),
              py: theme.spacing(1.25),
              fontSize: "0.8125rem",
              color: theme.palette.text.secondary,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${(theme.shape.borderRadius as number) * 2}px`,
              transition: theme.transitions.create(["border-color", "color"]),
              "&:hover": {
                color: theme.palette.text.primary,
                borderColor: alpha(theme.palette.primary.main, 0.5),
              },
            }}
          >
            {suggestion}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
