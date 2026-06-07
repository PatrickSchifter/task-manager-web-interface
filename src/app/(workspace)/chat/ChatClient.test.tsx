import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent, act } from "@/src/test/test-utils";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";
import type { UserItemListDTOWithAvatar } from "@/src/services/api/auth.server.service";
import type { components } from "@/src/types/api";

vi.mock("@/src/app/(workspace)/chat/actions", () => ({
  sendChatMessage: vi.fn(),
  pollChatMessage: vi.fn(),
  getSocketTicket: vi.fn(),
}));

import ChatClient from "./ChatClient";
import { sendChatMessage, pollChatMessage } from "./actions";

type ChatMessage = components["schemas"]["ChatMessageResponseDTO"];

const sendMock = vi.mocked(sendChatMessage);
const pollMock = vi.mocked(pollChatMessage);

const mockUser: UserItemListDTOWithAvatar = {
  id: "u1",
  name: "Maria Silva",
  email: "maria@test.dev",
  role: "USER",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const SUGGESTIONS = [
  "Resuma minhas tarefas em andamento e o que priorizar essa semana.",
  "Quais tarefas estão atrasadas?",
  "O que está bloqueando o time agora?",
];

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

beforeEach(() => {
  sendMock.mockReset();
  pollMock.mockReset();
  // jsdom não implementa scrollTo no elemento de scroll.
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("<ChatClient /> — estado inicial", () => {
  it("renderiza o cabeçalho e o estado vazio com as sugestões", () => {
    renderChat();

    expect(screen.getByText("Solut AI")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("Como posso ajudar?")).toBeInTheDocument();

    for (const suggestion of SUGGESTIONS) {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    }
  });

  it("inicia com o botão de envio desabilitado quando o input está vazio", () => {
    renderChat();
    const sendButton = screen.getAllByRole("button").at(-1)!;
    expect(sendButton).toBeDisabled();
  });

  it("renderiza mensagens iniciais ao invés do estado vazio", () => {
    renderChat([
      baseMessage({
        id: "m1",
        content: "Olá IA",
        status: "DELIVERED",
        response: "Olá! Como posso ajudar?" as unknown as ChatMessage["response"],
      }),
    ]);

    expect(screen.queryByText("Como posso ajudar?")).not.toBeInTheDocument();
    expect(screen.getByText("Olá IA")).toBeInTheDocument();
    expect(screen.getByText("Olá! Como posso ajudar?")).toBeInTheDocument();
    // Iniciais do usuário no avatar.
    expect(screen.getByText("MS")).toBeInTheDocument();
  });

  it("mostra estado de falha para mensagens FAILED", () => {
    renderChat([baseMessage({ id: "m1", status: "FAILED" })]);
    expect(
      screen.getByText(
        "Não foi possível gerar uma resposta para esta mensagem.",
      ),
    ).toBeInTheDocument();
  });
});

describe("<ChatClient /> — sugestões", () => {
  it("clicar numa sugestão preenche o input", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(screen.getByText(SUGGESTIONS[1]));

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    expect(textbox).toHaveValue(SUGGESTIONS[1]);
    // Botão de envio agora habilitado.
    expect(screen.getAllByRole("button").at(-1)!).toBeEnabled();
  });
});

describe("<ChatClient /> — fluxo de envio + polling", () => {
  it("digitar e clicar enviar chama sendChatMessage e renderiza a resposta após o polling", async () => {
    vi.useFakeTimers();

    sendMock.mockResolvedValue({
      success: true,
      data: baseMessage({ id: "srv-1", content: "Minha pergunta", status: "PROCESSING" }),
    });
    pollMock.mockResolvedValue({
      success: true,
      data: baseMessage({
        id: "srv-1",
        content: "Minha pergunta",
        status: "DELIVERED",
        response: "Aqui está a resposta." as unknown as ChatMessage["response"],
      }),
    });

    renderChat();

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    fireEvent.change(textbox, { target: { value: "Minha pergunta" } });

    const sendButton = screen.getAllByRole("button").at(-1)!;
    await act(async () => {
      fireEvent.click(sendButton);
      // Deixa o sendChatMessage (microtask) resolver e o estado otimista assentar.
      await Promise.resolve();
    });

    // sendChatMessage chamado com o texto.
    expect(sendMock).toHaveBeenCalledWith("Minha pergunta");
    // Input é limpo após o envio.
    expect(textbox).toHaveValue("");

    // A mensagem do usuário aparece imediatamente (otimista).
    expect(screen.getByText("Minha pergunta")).toBeInTheDocument();

    // Avança o polling (POLL_INTERVAL_MS = 2000) e resolve a promise.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(pollMock).toHaveBeenCalledWith("srv-1");
    expect(screen.getByText("Aqui está a resposta.")).toBeInTheDocument();
  });

  it("envia ao pressionar Enter (sem shift)", async () => {
    vi.useFakeTimers();

    sendMock.mockResolvedValue({
      success: true,
      data: baseMessage({ id: "srv-2", content: "Via enter", status: "PROCESSING" }),
    });
    pollMock.mockResolvedValue({
      success: true,
      data: baseMessage({
        id: "srv-2",
        content: "Via enter",
        status: "DELIVERED",
        response: "Resposta enter." as unknown as ChatMessage["response"],
      }),
    });

    renderChat();

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    fireEvent.change(textbox, { target: { value: "Via enter" } });

    await act(async () => {
      fireEvent.keyDown(textbox, { key: "Enter", shiftKey: false });
      await Promise.resolve();
    });

    expect(sendMock).toHaveBeenCalledWith("Via enter");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Resposta enter.")).toBeInTheDocument();
  });

  it("Shift+Enter não envia (quebra de linha)", async () => {
    const user = userEvent.setup();
    renderChat();

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    await user.type(textbox, "linha1{Shift>}{Enter}{/Shift}linha2");

    expect(sendMock).not.toHaveBeenCalled();
    expect(textbox).toHaveValue("linha1\nlinha2");
  });

  it("não chama sendChatMessage quando o input é só espaços", async () => {
    const user = userEvent.setup();
    renderChat();

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    await user.type(textbox, "   {Enter}");

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("mostra feedback de info quando o polling falha continuamente (status pendente)", async () => {
    vi.useFakeTimers();

    sendMock.mockResolvedValue({
      success: true,
      data: baseMessage({ id: "srv-3", status: "PROCESSING" }),
    });
    // Poll falha sempre -> nunca DELIVERED -> continua agendando.
    pollMock.mockResolvedValue({
      success: false,
      message: "Não foi possível atualizar a conversa.",
    });

    renderChat();

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    fireEvent.change(textbox, { target: { value: "loop" } });

    await act(async () => {
      fireEvent.keyDown(textbox, { key: "Enter" });
      await Promise.resolve();
    });

    // 40 tentativas * 2000ms para atingir POLL_MAX_ATTEMPTS.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000 * 41);
    });

    expect(pollMock.mock.calls.length).toBeGreaterThanOrEqual(40);
    expect(
      screen.getByText("A resposta está demorando mais que o esperado."),
    ).toBeInTheDocument();
  });

  it("mostra feedback de erro quando o polling retorna status FAILED", async () => {
    vi.useFakeTimers();

    sendMock.mockResolvedValue({
      success: true,
      data: baseMessage({ id: "srv-4", status: "PROCESSING" }),
    });
    pollMock.mockResolvedValue({
      success: true,
      data: baseMessage({ id: "srv-4", status: "FAILED" }),
    });

    renderChat();

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    fireEvent.change(textbox, { target: { value: "vai falhar" } });

    await act(async () => {
      fireEvent.keyDown(textbox, { key: "Enter" });
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(
      screen.getByText("A IA não conseguiu responder. Tente novamente."),
    ).toBeInTheDocument();
  });
});

describe("<ChatClient /> — caminho de erro no envio", () => {
  it("restaura o texto e mostra feedback quando sendChatMessage falha", async () => {
    const user = userEvent.setup();

    sendMock.mockResolvedValue({
      success: false,
      message: "Não foi possível enviar a mensagem.",
    });

    renderChat();

    const textbox = screen.getByPlaceholderText(/Pergunte sobre tarefas/);
    await user.type(textbox, "vai dar erro{Enter}");

    expect(sendMock).toHaveBeenCalledWith("vai dar erro");
    // poll nunca é chamado pois o envio falhou.
    expect(pollMock).not.toHaveBeenCalled();

    // O texto é restaurado no input.
    expect(textbox).toHaveValue("vai dar erro");

    // Feedback de erro exibido (snackbar).
    expect(
      await screen.findByText("Não foi possível enviar a mensagem."),
    ).toBeInTheDocument();
  });
});

describe("<ChatClient /> — estado de loading/desabilitado", () => {
  it("mantém o botão de envio desabilitado enquanto há mensagem pendente", () => {
    renderChat([baseMessage({ id: "m1", status: "PROCESSING" })]);

    // Com mensagem pendente (isAwaiting), o botão fica desabilitado mesmo
    // que houvesse texto; sem texto também está desabilitado.
    const sendButton = screen.getAllByRole("button").at(-1)!;
    expect(sendButton).toBeDisabled();
    // Spinner de progresso visível.
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("usa as iniciais de fallback 'EU' quando o nome do usuário está vazio", () => {
    render(
      <WorkspaceProvider
        user={{ ...mockUser, name: "" }}
        projects={[]}
      >
        <ChatClient
          initialMessages={[
            baseMessage({ id: "m1", content: "oi", status: "DELIVERED" }),
          ]}
        />
      </WorkspaceProvider>,
    );

    expect(screen.getByText("EU")).toBeInTheDocument();
  });

  it("o botão de anexo está sempre desabilitado", () => {
    renderChat();
    const buttons = screen.getAllByRole("button");
    // Penúltimo botão (anexar) está desabilitado.
    expect(buttons.at(-2)).toBeDisabled();
  });
});
