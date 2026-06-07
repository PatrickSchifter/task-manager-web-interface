import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/src/test/test-utils";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";

// Localiza, para um dado texto de comentário, o IconButton que contém o ícone
// indicado (Edit/DeleteOutlined) dentro da árvore daquele comentário. Evita
// colidir com o botão "Editar" do TaskDialog (que também usa EditIcon).
function findCommentIconButton(commentText: string, testid: string): HTMLElement {
  const contentEl = screen.getByText(commentText);
  // Sobe nível a nível e retorna o primeiro botão com o ícone alvo encontrado
  // dentro daquela subárvore. Para no menor container que já contém o botão,
  // evitando alcançar o botão "Editar" do TaskDialog (mais acima na árvore).
  let node: HTMLElement | null = contentEl.parentElement;
  for (let i = 0; i < 6 && node; i += 1) {
    const btn = Array.from(node.querySelectorAll("button")).find((b) =>
      b.querySelector(`svg[data-testid="${testid}"]`),
    );
    if (btn) return btn as HTMLElement;
    node = node.parentElement;
  }
  throw new Error(`Botão ${testid} não encontrado para "${commentText}"`);
}

// ─── Mocks de navegação ────────────────────────────────────────────────────────
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useParams: () => ({ id: "p1", taskId: "t1" }),
  usePathname: () => "/projects/p1/tasks/t1",
}));

// ─── Mocks das server actions de comentários (useActionState) ──────────────────
// Cada action recebe (prevState, formData) e devolve { success } | { error }.
const createCommentAction = vi.fn(async () => ({ success: true }));
const updateCommentAction = vi.fn(async () => ({ success: true }));
const deleteCommentAction = vi.fn(async () => ({ success: true }));

vi.mock("@/src/actions/comments", () => ({
  createCommentAction: (...args: unknown[]) =>
    (createCommentAction as (...a: unknown[]) => unknown)(...args),
  updateCommentAction: (...args: unknown[]) =>
    (updateCommentAction as (...a: unknown[]) => unknown)(...args),
  deleteCommentAction: (...args: unknown[]) =>
    (deleteCommentAction as (...a: unknown[]) => unknown)(...args),
}));

// ─── Mock leve do TaskDialog (renderiza apenas o trigger e um marcador) ────────
vi.mock("@/src/components/tasks/TaskDialog", () => ({
  TaskStatus: {},
  TaskDialog: ({ trigger }: { trigger?: React.ReactNode }) => (
    <div data-testid="task-dialog-mock">{trigger}</div>
  ),
}));

// A seção de subtarefas usa updateTaskAction (toggle/reorder). Mock leve.
vi.mock("@/src/actions/tasks", () => ({
  updateTaskAction: vi.fn(async () => ({ success: true })),
}));

import { TaskDetail } from "./TaskDetail";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: "u1",
  name: "Fulano Tester",
  email: "fulano@test.com",
  avatar: undefined,
} as never;

const project = {
  id: "p1",
  name: "Projeto Alfa",
  collaborators: [],
} as never;

function makeComment(over: Record<string, unknown> = {}) {
  return {
    id: "c1",
    content: "Primeiro comentário",
    createdAt: new Date().toISOString(),
    author: { id: "u1", name: "Fulano Tester", avatar: null },
    ...over,
  };
}

function makeTask(over: Record<string, unknown> = {}) {
  return {
    id: "t1",
    projectId: "p1",
    title: "Implementar middleware",
    description: "Descrição detalhada da tarefa",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: "2026-07-10",
    assignee: { id: "u1", name: "Fulano Tester" },
    tags: [
      { id: "tag1", name: "backend", color: "brand" },
      { id: "tag2", name: "urgente", color: "rose" },
    ],
    comments: [],
    ...over,
  } as never;
}

function renderDetail(taskOver: Record<string, unknown> = {}, availableTags: never[] = []) {
  return render(
    <WorkspaceProvider user={mockUser} projects={[]}>
      <TaskDetail task={makeTask(taskOver)} project={project} availableTags={availableTags} />
    </WorkspaceProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  createCommentAction.mockResolvedValue({ success: true });
  updateCommentAction.mockResolvedValue({ success: true });
  deleteCommentAction.mockResolvedValue({ success: true });
});

describe("<TaskDetail />", () => {
  it("renderiza título, descrição, prioridade, prazo, assignee e tags", () => {
    renderDetail();
    expect(screen.getByText("Implementar middleware")).toBeInTheDocument();
    expect(screen.getByText("Descrição detalhada da tarefa")).toBeInTheDocument();
    // Prioridade ALTA mapeada para "Alta"
    expect(screen.getByText("Alta")).toBeInTheDocument();
    // Prazo formatado em pt-BR (dia + mês por extenso)
    expect(screen.getByText(/de julho|julho/i)).toBeInTheDocument();
    // Assignee no sidebar
    expect(screen.getAllByText("Fulano Tester").length).toBeGreaterThan(0);
    // Tags
    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.getByText("urgente")).toBeInTheDocument();
    // Breadcrumb com o nome do projeto
    expect(screen.getByText("# Projeto Alfa")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
  });

  it("usa fallbacks quando título/descrição/prioridade/prazo estão ausentes", () => {
    renderDetail({
      title: undefined,
      description: undefined,
      priority: undefined,
      dueDate: undefined,
      tags: [],
    });
    expect(screen.getByText("Tarefa sem título")).toBeInTheDocument();
    expect(screen.getByText("Sem prazo")).toBeInTheDocument();
    // Prioridade ausente exibe "—"
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("mapeia prioridade desconhecida para o próprio valor", () => {
    renderDetail({ priority: "CRITICAL" });
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
  });

  it("exibe estado vazio quando não há comentários", () => {
    renderDetail({ comments: [] });
    expect(
      screen.getByText("Ainda não há comentários. Seja o primeiro a comentar."),
    ).toBeInTheDocument();
  });

  it("renderiza a lista de comentários com a contagem", () => {
    renderDetail({
      comments: [
        makeComment({ id: "c1", content: "Olá mundo" }),
        makeComment({
          id: "c2",
          content: "Comentário de outro",
          author: { id: "u9", name: "Outra Pessoa", avatar: null },
        }),
      ],
    });
    expect(screen.getByText("Olá mundo")).toBeInTheDocument();
    expect(screen.getByText("Comentário de outro")).toBeInTheDocument();
    expect(screen.getByText("Outra Pessoa")).toBeInTheDocument();
    // Contagem ao lado do título "Comentários"
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renderiza o trigger do TaskDialog (botão Editar)", () => {
    renderDetail();
    // Há mais de um TaskDialog na página (editar tarefa + adicionar subtarefa).
    expect(screen.getAllByTestId("task-dialog-mock").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("exibe a seção de subtarefas em uma tarefa top-level", () => {
    renderDetail();
    expect(screen.getByText("Subtarefas")).toBeInTheDocument();
  });

  it("oculta a seção de subtarefas quando a tarefa é, ela mesma, uma subtarefa", () => {
    renderDetail({ parentId: "parent-1" });
    expect(screen.queryByText("Subtarefas")).not.toBeInTheDocument();
  });

  it("o botão Comentar fica desabilitado enquanto vazio e habilita ao digitar", async () => {
    const user = userEvent.setup();
    renderDetail();
    const submit = screen.getByRole("button", { name: "Comentar" });
    expect(submit).toBeDisabled();

    const textbox = screen.getByPlaceholderText("Escreva um comentário");
    await user.type(textbox, "Novo comentário aqui");
    expect(submit).toBeEnabled();
  });

  it("envia um novo comentário chamando createCommentAction e limpa o campo", async () => {
    const user = userEvent.setup();
    renderDetail();

    const textbox = screen.getByPlaceholderText("Escreva um comentário");
    await user.type(textbox, "Comentário enviado");
    await user.click(screen.getByRole("button", { name: "Comentar" }));

    await vi.waitFor(() => expect(createCommentAction).toHaveBeenCalled());
    // Após sucesso o campo é limpo pelo efeito.
    await vi.waitFor(() =>
      expect(screen.getByPlaceholderText("Escreva um comentário")).toHaveValue(""),
    );
  });

  it("exibe erro quando createCommentAction retorna error", async () => {
    createCommentAction.mockResolvedValue({ error: "Falhou ao enviar" } as never);
    const user = userEvent.setup();
    renderDetail();

    const textbox = screen.getByPlaceholderText("Escreva um comentário");
    await user.type(textbox, "Vai falhar");
    await user.click(screen.getByRole("button", { name: "Comentar" }));

    expect(await screen.findByText("Falhou ao enviar")).toBeInTheDocument();
  });

  it("mostra ações de editar/excluir apenas nos comentários do próprio usuário", () => {
    renderDetail({
      comments: [
        makeComment({ id: "c1", content: "Meu comentário", author: { id: "u1", name: "Fulano Tester", avatar: null } }),
        makeComment({ id: "c2", content: "Alheio", author: { id: "u9", name: "Outro", avatar: null } }),
      ],
    });
    // Conta os IconButtons de edição de comentário (ícone EditIcon sem rótulo
    // "Editar", que pertence ao botão do TaskDialog). Deve haver exatamente 1,
    // referente ao comentário do próprio usuário.
    const commentEditButtons = Array.from(document.querySelectorAll("button")).filter(
      (b) =>
        b.querySelector('svg[data-testid="EditIcon"]') &&
        b.textContent?.trim() !== "Editar",
    );
    expect(commentEditButtons).toHaveLength(1);
  });

  it("edita um comentário próprio chamando updateCommentAction", async () => {
    const user = userEvent.setup();
    renderDetail({
      comments: [makeComment({ id: "c1", content: "Conteúdo original" })],
    });

    // Entra em modo de edição.
    await user.click(findCommentIconButton("Conteúdo original", "EditIcon"));

    const editField = screen.getByDisplayValue("Conteúdo original");
    await user.clear(editField);
    await user.type(editField, "Conteúdo editado");
    await user.click(screen.getByRole("button", { name: /Salvar/ }));

    await vi.waitFor(() => expect(updateCommentAction).toHaveBeenCalled());
  });

  it("cancela a edição de um comentário sem chamar a action", async () => {
    const user = userEvent.setup();
    renderDetail({
      comments: [makeComment({ id: "c1", content: "Conteúdo original" })],
    });

    await user.click(findCommentIconButton("Conteúdo original", "EditIcon"));
    expect(screen.getByDisplayValue("Conteúdo original")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cancelar/ }));
    expect(screen.queryByDisplayValue("Conteúdo original")).not.toBeInTheDocument();
    expect(updateCommentAction).not.toHaveBeenCalled();
  });

  it("mostra erro de edição quando updateCommentAction retorna error", async () => {
    updateCommentAction.mockResolvedValue({ error: "Erro ao editar" } as never);
    const user = userEvent.setup();
    renderDetail({
      comments: [makeComment({ id: "c1", content: "Original" })],
    });

    await user.click(findCommentIconButton("Original", "EditIcon"));
    await user.click(screen.getByRole("button", { name: /Salvar/ }));

    expect(await screen.findByText("Erro ao editar")).toBeInTheDocument();
  });

  it("pede confirmação e exclui o comentário chamando deleteCommentAction", async () => {
    const user = userEvent.setup();
    renderDetail({
      comments: [makeComment({ id: "c1", content: "Para excluir" })],
    });

    await user.click(findCommentIconButton("Para excluir", "DeleteOutlinedIcon"));

    // Confirmação aparece.
    expect(await screen.findByText("Excluir?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sim" }));

    await vi.waitFor(() => expect(deleteCommentAction).toHaveBeenCalled());
  });

  it("cancela a confirmação de exclusão com 'Não'", async () => {
    const user = userEvent.setup();
    renderDetail({
      comments: [makeComment({ id: "c1", content: "Não excluir" })],
    });

    await user.click(findCommentIconButton("Não excluir", "DeleteOutlinedIcon"));
    expect(await screen.findByText("Excluir?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Não" }));
    expect(screen.queryByText("Excluir?")).not.toBeInTheDocument();
    expect(deleteCommentAction).not.toHaveBeenCalled();
  });

  it("não exibe o '#' de tags quando não há tags", () => {
    renderDetail({ tags: [] });
    expect(screen.queryByText("backend")).not.toBeInTheDocument();
    expect(screen.getByText("Implementar middleware")).toBeInTheDocument();
  });

  it("usa as iniciais do assignee no avatar do composer", () => {
    renderDetail({ assignee: { id: "u5", name: "Maria Silva" } });
    // O composer usa as 2 primeiras letras em maiúsculas do nome do assignee.
    expect(screen.getAllByText("MA").length).toBeGreaterThan(0);
  });

  it("usa 'EU' como iniciais do composer quando não há assignee", () => {
    renderDetail({ assignee: undefined });
    expect(screen.getByText("EU")).toBeInTheDocument();
  });

  it("mapeia prioridade LOW para 'Baixa' e MEDIUM para 'Média'", () => {
    const { unmount } = renderDetail({ priority: "LOW" });
    expect(screen.getByText("Baixa")).toBeInTheDocument();
    unmount();
    renderDetail({ priority: "MEDIUM" });
    expect(screen.getByText("Média")).toBeInTheDocument();
  });

  it("formata datas relativas dos comentários (agora, min, h, d, data)", () => {
    const now = Date.now();
    renderDetail({
      comments: [
        makeComment({ id: "c1", content: "Agora mesmo", createdAt: new Date(now).toISOString() }),
        makeComment({ id: "c2", content: "Minutos", createdAt: new Date(now - 5 * 60000).toISOString() }),
        makeComment({ id: "c3", content: "Horas", createdAt: new Date(now - 3 * 3600000).toISOString() }),
        makeComment({ id: "c4", content: "Dias", createdAt: new Date(now - 2 * 86400000).toISOString() }),
        makeComment({ id: "c5", content: "Antigo", createdAt: new Date(now - 30 * 86400000).toISOString() }),
        makeComment({ id: "c6", content: "Inválido", createdAt: "data-invalida" }),
      ],
    });
    expect(screen.getByText("· agora")).toBeInTheDocument();
    expect(screen.getByText("· 5min atrás")).toBeInTheDocument();
    expect(screen.getByText("· 3h atrás")).toBeInTheDocument();
    expect(screen.getByText("· 2d atrás")).toBeInTheDocument();
    // Data antiga (>= 7 dias) cai no toLocaleDateString → string não vazia.
    expect(screen.getByText("Antigo")).toBeInTheDocument();
    // Data inválida produz string vazia (apenas o "·").
    expect(screen.getByText("Inválido")).toBeInTheDocument();
  });

  it("envia comentário via atalho Ctrl/Cmd+Enter", async () => {
    const user = userEvent.setup();
    renderDetail();
    const textbox = screen.getByPlaceholderText("Escreva um comentário");
    await user.type(textbox, "Via atalho");
    await user.keyboard("{Control>}{Enter}{/Control}");
    await vi.waitFor(() => expect(createCommentAction).toHaveBeenCalled());
  });
});
