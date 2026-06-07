import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@/src/test/test-utils";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";
import type { UserItemListDTOWithAvatar } from "@/src/services/api/auth.server.service";
import type { components } from "@/src/types/api";
import type { ComponentType } from "react";

// WS_URL é lido no topo do módulo ChatClient — precisa existir ANTES do import.
vi.stubEnv("NEXT_PUBLIC_WS_URL", "http://ws.test");

// Estado compartilhado do socket falso (hoisted para uso dentro do vi.mock).
const ioState = vi.hoisted(() => {
  const state = {
    handlers: {} as Record<string, (...args: unknown[]) => void>,
    connected: true,
  };
  const socket = {
    get connected() {
      return state.connected;
    },
    on(event: string, cb: (...args: unknown[]) => void) {
      state.handlers[event] = cb;
      return socket;
    },
    disconnect: vi.fn(),
  };
  return { state, socket, io: vi.fn(() => socket) };
});

vi.mock("socket.io-client", () => ({ io: ioState.io }));

vi.mock("@/src/app/(workspace)/chat/actions", () => ({
  sendChatMessage: vi.fn(),
  pollChatMessage: vi.fn(),
  getSocketTicket: vi.fn(),
}));

import { sendChatMessage, pollChatMessage, getSocketTicket } from "./actions";

type ChatMessage = components["schemas"]["ChatMessageResponseDTO"];

const sendMock = vi.mocked(sendChatMessage);
const pollMock = vi.mocked(pollChatMessage);
const ticketMock = vi.mocked(getSocketTicket);

let ChatClient: ComponentType<{ initialMessages: ChatMessage[] }>;

const mockUser: UserItemListDTOWithAvatar = {
  id: "u1",
  name: "Maria Silva",
  email: "maria@test.dev",
  role: "USER",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function baseMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    userId: "u1",
    content: "pergunta",
    response: null,
    status: "QUEUED",
    filters: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z",
    ...overrides,
  };
}

function renderChat(initialMessages: ChatMessage[] = []) {
  return render(
    <WorkspaceProvider user={mockUser} projects={[]}>
      <ChatClient initialMessages={initialMessages} />
    </WorkspaceProvider>,
  );
}

beforeAll(async () => {
  // Import dinâmico para que WS_URL capture o env stubado acima.
  ({ default: ChatClient } = await import("./ChatClient"));
});

beforeEach(() => {
  sendMock.mockReset();
  pollMock.mockReset();
  ticketMock.mockReset();
  ioState.io.mockClear();
  ioState.socket.disconnect.mockClear();
  ioState.state.handlers = {};
  ioState.state.connected = true;
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("<ChatClient /> — caminho WebSocket", () => {
  it("conecta com o ticket e atualiza a mensagem via evento, sem polling", async () => {
    ticketMock.mockResolvedValue({
      success: true,
      data: { ticket: "tkt-123", expiresIn: 60 },
    });
    sendMock.mockResolvedValue({
      success: true,
      data: baseMessage({ id: "srv-1", content: "Minha pergunta", status: "PROCESSING" }),
    });

    renderChat();

    // Deixa o connect() (await getSocketTicket → io()) assentar.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(ioState.io).toHaveBeenCalledWith("http://ws.test", {
      auth: { ticket: "tkt-123" },
      transports: ["websocket"],
    });

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    fireEvent.change(textbox, { target: { value: "Minha pergunta" } });

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button").at(-1)!);
      await Promise.resolve();
    });

    expect(sendMock).toHaveBeenCalledWith("Minha pergunta");
    // Socket conectado → NÃO faz polling.
    expect(pollMock).not.toHaveBeenCalled();

    // Backend emite a atualização em tempo real.
    await act(async () => {
      ioState.state.handlers["chat:status"](
        baseMessage({
          id: "srv-1",
          content: "Minha pergunta",
          status: "DELIVERED",
          response: "Resposta via socket." as unknown as ChatMessage["response"],
        }),
      );
    });

    expect(screen.getByText("Resposta via socket.")).toBeInTheDocument();
    expect(pollMock).not.toHaveBeenCalled();
  });

  it("cai para polling quando o socket desconecta com mensagem pendente", async () => {
    vi.useFakeTimers();

    ticketMock.mockResolvedValue({
      success: true,
      data: { ticket: "tkt-123", expiresIn: 60 },
    });
    sendMock.mockResolvedValue({
      success: true,
      data: baseMessage({ id: "srv-2", content: "Pergunta", status: "PROCESSING" }),
    });
    pollMock.mockResolvedValue({
      success: true,
      data: baseMessage({
        id: "srv-2",
        content: "Pergunta",
        status: "DELIVERED",
        response: "Resposta via polling." as unknown as ChatMessage["response"],
      }),
    });

    renderChat();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    fireEvent.change(textbox, { target: { value: "Pergunta" } });

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button").at(-1)!);
      await vi.advanceTimersByTimeAsync(0);
    });

    // Conectado → ainda não fez polling.
    expect(pollMock).not.toHaveBeenCalled();

    // Socket cai: o fallback deve acionar o polling da mensagem pendente.
    act(() => {
      ioState.state.connected = false;
      ioState.state.handlers["disconnect"]();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(pollMock).toHaveBeenCalledWith("srv-2");
    expect(screen.getByText("Resposta via polling.")).toBeInTheDocument();
  });
});
