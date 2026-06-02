import { getChatMessage, getChatMessages, sendChatMessage } from "@/api/client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

type MessageStatus = "QUEUED" | "PROCESSING" | "DELIVERED" | "FAILED";

interface ApiMessage {
  id: string;
  userId: string;
  content: string;
  response: string;
  status: MessageStatus;
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  status?: MessageStatus;
}

function isApiMessage(v: unknown): v is ApiMessage {
  return (
    typeof v === "object" &&
    v !== null &&
    "id" in v &&
    "content" in v &&
    "status" in v
  );
}

function isApiMessageArray(v: unknown): v is ApiMessage[] {
  return Array.isArray(v) && (v.length === 0 || isApiMessage(v[0]));
}

// Animated dots: cycles 1 → 2 → 3 → 1
function AnimatedDots() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => (c % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-0.5 h-4">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            i <= count ? "bg-default-400 scale-100" : "bg-default-200 scale-75"
          }`}
        />
      ))}
    </span>
  );
}

// WhatsApp-style status icon
function StatusIcon({
  status,
  onRetry,
}: {
  status?: MessageStatus;
  onRetry?: () => void;
}) {
  if (!status) return null;

  if (status === "FAILED") {
    return (
      <button
        type="button"
        onClick={onRetry}
        title="Reenviar mensagem"
        className="ml-1 flex items-center shrink-0"
      >
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: icon button */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-red-400 hover:text-red-300 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    );
  }

  if (status === "QUEUED") {
    return (
      <span className="ml-1 flex items-center shrink-0">
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: status icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-white/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
    );
  }

  if (status === "PROCESSING") {
    return (
      <span className="ml-1 flex items-center shrink-0 -space-x-1.5">
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: status icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-white/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: status icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-white/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
    );
  }

  if (status === "DELIVERED") {
    return (
      <span className="ml-1 flex items-center shrink-0 -space-x-1.5">
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: status icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-blue-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: status icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-blue-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
    );
  }

  return null;
}

const LIMIT_STEP = 20;

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [limit, setLimit] = useState(LIMIT_STEP);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  // ── Initial & refresh load ──────────────────────────────────────────────────
  // getChatMessages retorna ChatMessageResponseDTO (objeto singular) mas a API
  // devolve ApiMessage[] — fazemos o cast via unknown para não conflitar com o
  // tipo gerado do cliente axios.
  const { data: rawApiMessages } = useQuery({
    queryKey: ["chat-messages", limit],
    queryFn: () =>
      getChatMessages({ limit }) as unknown as Promise<ApiMessage[]>,
    enabled: isOpen,
    staleTime: 0,
  });

  const apiMessages = isApiMessageArray(rawApiMessages)
    ? rawApiMessages
    : undefined;

  useEffect(() => {
    if (!apiMessages) return;

    const converted: Message[] = [];
    for (const m of [...apiMessages].reverse()) {
      converted.push({
        id: m.id,
        role: "user",
        content: m.content,
        status: m.status,
      });
      if (m.response) {
        converted.push({ role: "assistant", content: m.response });
      }
    }

    setMessages(converted);

    if (!initialLoaded) {
      setInitialLoaded(true);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    }

    setHasMore(apiMessages.length >= limit);
    setIsLoadingMore(false);
  }, [apiMessages, limit, initialLoaded]);

  // ── Polling for pending message ─────────────────────────────────────────────
  // getChatMessage tem o mesmo problema de tipagem — cast via unknown.
  const { data: rawPolledMessage } = useQuery({
    queryKey: ["chat-message", pollingId],
    queryFn: () => {
      if (!pollingId) return Promise.resolve(null);
      return getChatMessage(pollingId) as unknown as Promise<ApiMessage>;
    },
    enabled: !!pollingId,
    refetchInterval: 2000,
  });

  const polledMessage = isApiMessage(rawPolledMessage)
    ? rawPolledMessage
    : undefined;

  useEffect(() => {
    if (!polledMessage || !pollingId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === polledMessage.id ? { ...m, status: polledMessage.status } : m,
      ),
    );

    if (
      polledMessage.status === "DELIVERED" ||
      polledMessage.status === "FAILED"
    ) {
      setPollingId(null);

      if (polledMessage.status === "DELIVERED" && polledMessage.response) {
        setMessages((prev) => {
          const alreadyHas = prev.some(
            (m) =>
              m.role === "assistant" && m.content === polledMessage.response,
          );
          if (alreadyHas) return prev;
          return [
            ...prev,
            { role: "assistant", content: polledMessage.response },
          ];
        });
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      }
    }
  }, [polledMessage, pollingId]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessageMutation = useMutation({
    mutationKey: ["chat", "send"],
    mutationFn: (message: string) =>
      sendChatMessage({ message }) as unknown as Promise<ApiMessage>,
    onSuccess: (apiMsg: ApiMessage) => {
      if (!apiMsg?.id) return;

      setMessages((prev) => {
        const reversedIdx = [...prev]
          .reverse()
          .findIndex((m) => m.role === "user" && !m.id);
        if (reversedIdx === -1) return prev;
        const realIdx = prev.length - 1 - reversedIdx;
        const updated = [...prev];
        updated[realIdx] = {
          ...updated[realIdx],
          id: apiMsg.id,
          status: apiMsg.status ?? "QUEUED",
        };
        return updated;
      });

      setPollingId(apiMsg.id);
    },
    onError: () => {
      setMessages((prev) => {
        const reversedIdx = [...prev]
          .reverse()
          .findIndex((m) => m.role === "user" && !m.id);
        if (reversedIdx === -1) return prev;
        const realIdx = prev.length - 1 - reversedIdx;
        const updated = [...prev];
        updated[realIdx] = { ...updated[realIdx], status: "FAILED" };
        return updated;
      });
    },
  });

  const sendMessage = useCallback(
    (overrideContent?: string) => {
      const text = (overrideContent ?? input).trim();
      if (!text || sendMessageMutation.isPending || pollingId !== null) return;

      const userMsg: Message = {
        role: "user",
        content: text,
        status: "QUEUED",
      };
      setMessages((prev) => [...prev, userMsg]);
      if (!overrideContent) setInput("");
      sendMessageMutation.mutate(text);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    },
    [input, sendMessageMutation, pollingId],
  );

  // ── Infinite scroll (load older messages) ───────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || isLoadingMore || !hasMore) return;
    if (el.scrollTop < 60) {
      prevScrollHeightRef.current = el.scrollHeight;
      setIsLoadingMore(true);
      setLimit((l) => l + LIMIT_STEP);
    }
  }, [isLoadingMore, hasMore]);

  // Preserve scroll position after loading more (dep: isLoadingMore only —
  // messages não é necessário aqui pois o efeito já roda quando isLoadingMore
  // muda para false, que coincide com a chegada das novas mensagens)
  useEffect(() => {
    if (!isLoadingMore) return;
    const el = scrollContainerRef.current;
    if (!el || !prevScrollHeightRef.current) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
    });
  }, [isLoadingMore]);

  const isBusy = sendMessageMutation.isPending || pollingId !== null;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Abrir chat do projeto"
      >
        {isOpen ? (
          // biome-ignore lint/a11y/noSvgWithoutTitle: toggle button
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          // biome-ignore lint/a11y/noSvgWithoutTitle: toggle button
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[480px] bg-background border border-divider rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-divider bg-content1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .3 2.7-1.1 2.7H3.9c-1.4 0-2.1-1.7-1.1-2.7L4 15.3"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Assistente</p>
              {isBusy && (
                <p className="text-xs text-default-400 leading-tight">
                  digitando...
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <span className="text-xs text-default-400">
                  Carregando mensagens...
                </span>
              </div>
            )}

            {messages.length === 0 && !isLoadingMore && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-default-400">
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p className="text-sm">Pergunte algo sobre o projeto!</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                key={msg.id ?? i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />
                    </svg>
                  </div>
                )}

                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-content2 text-foreground rounded-bl-sm"
                  }`}
                >
                  <span>{msg.content}</span>
                  {msg.role === "user" && (
                    <span className="flex justify-end items-center mt-0.5">
                      <StatusIcon
                        status={msg.status}
                        onRetry={
                          msg.status === "FAILED"
                            ? () => sendMessage(msg.content)
                            : undefined
                        }
                      />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isBusy && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />
                  </svg>
                </div>
                <div className="bg-content2 px-3 py-2 rounded-2xl rounded-bl-sm flex items-center">
                  <AnimatedDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-divider flex gap-2 items-end">
            <Input
              size="sm"
              placeholder="Digite sua mensagem..."
              value={input}
              onValueChange={setInput}
              isDisabled={isBusy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              classNames={{ inputWrapper: "bg-content2" }}
            />
            <Button
              isIconOnly
              size="sm"
              color="primary"
              onPress={() => sendMessage()}
              isLoading={sendMessageMutation.isPending}
              isDisabled={!input.trim() || isBusy}
              className="shrink-0 h-8 w-8 min-w-8"
            >
              {!sendMessageMutation.isPending && (
                // biome-ignore lint/a11y/noSvgWithoutTitle: send button
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
