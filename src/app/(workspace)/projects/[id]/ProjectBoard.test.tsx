import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, within, waitFor } from "@/src/test/test-utils";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";
import { updateTaskAction } from "@/src/actions/tasks";
import { ProjectBoard, type ProjectFullDTO } from "./ProjectBoard";

// ─── Mocks de navegação e server actions ──────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Todas as server actions usadas direta ou indiretamente (pelos diálogos filhos)
// são mockadas com o shape esperado ({ success } | { error } | TagDTO | null).
vi.mock("@/src/actions/tasks", () => ({
  createTaskAction: vi.fn(async () => ({ success: true })),
  updateTaskAction: vi.fn(async () => ({ success: true })),
  deleteTaskAction: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/src/actions/projects", () => ({
  createProjectAction: vi.fn(async () => ({ success: true })),
  updateProjectAction: vi.fn(async () => ({ success: true })),
  deleteProjectAction: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/src/actions/collaborators", () => ({
  inviteCollaboratorAction: vi.fn(async () => ({ success: true })),
  updateCollaboratorAction: vi.fn(async () => ({ success: true })),
  removeCollaboratorAction: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/src/actions/tags", () => ({
  createTagAction: vi.fn(async () => ({
    id: "t-new",
    name: "nova",
    color: "brand",
  })),
}));

// O @dnd-kit é parcialmente mockado: o DndContext real depende de eventos de
// ponteiro (instáveis no jsdom). Substituímos apenas o DndContext por um shim
// que captura os handlers (onDragStart/Over/End) num ref compartilhado, para
// dispará-los de forma determinística e cobrir a lógica de reordenação.
const dndHandlers: {
  onDragStart?: (e: unknown) => void;
  onDragOver?: (e: unknown) => void;
  onDragEnd?: (e: unknown) => void;
} = {};

vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...actual,
    DndContext: ({
      children,
      onDragStart,
      onDragOver,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragStart?: (e: unknown) => void;
      onDragOver?: (e: unknown) => void;
      onDragEnd?: (e: unknown) => void;
    }) => {
      dndHandlers.onDragStart = onDragStart;
      dndHandlers.onDragOver = onDragOver;
      dndHandlers.onDragEnd = onDragEnd;
      return <>{children}</>;
    },
    // DragOverlay real depende do contexto interno do DndContext; como ele foi
    // substituído, renderizamos o conteúdo do overlay diretamente.
    DragOverlay: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
  id: "u1",
  name: "Patrick Schifter",
  email: "p@s.com",
} as never;
const mockProjects = [] as never;

const tag = (id: string, name: string, color = "brand") => ({
  id,
  name,
  color,
});

const assignee = (id: string, name: string) => ({
  id,
  name,
  email: `${name}@x.com`,
  avatar: null,
});

const makeTask = (
  id: string,
  title: string,
  status: "TODO" | "IN_PROGRESS" | "DONE",
  order: string,
  extra: Partial<ProjectFullDTO["tasks"][number]> = {},
): ProjectFullDTO["tasks"][number] =>
  ({
    id,
    title,
    description: null,
    status,
    priority: "MEDIUM",
    order,
    dueDate: "2026-06-10T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    comments: [],
    tags: [],
    assignee: null,
    ...extra,
  }) as ProjectFullDTO["tasks"][number];

const collaborator = (
  userId: string,
  name: string,
  role: "OWNER" | "EDITOR" | "VIEWER",
) => ({
  id: `c-${userId}`,
  role,
  projectId: "proj-1",
  userId,
  createAt: "2026-06-01T00:00:00.000Z",
  user: { id: userId, name, email: `${name}@x.com`, avatar: null },
});

const availableTags = [
  tag("t1", "frontend", "emerald"),
  tag("t2", "bug", "rose"),
];

function makeProject(overrides: Partial<ProjectFullDTO> = {}): ProjectFullDTO {
  return {
    id: "proj-1",
    name: "Projeto Alpha",
    description: "Descrição do projeto",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    role: "OWNER",
    membersCount: 2,
    tasks: [
      makeTask("task-1", "Configurar CI", "TODO", "a0", {
        tags: [tag("t1", "frontend", "emerald")],
        assignee: assignee("u2", "Maria"),
        comments: [{ id: "cm1" }, { id: "cm2" }] as never,
      }),
      makeTask("task-2", "Revisar PR", "IN_PROGRESS", "a0", {
        assignee: assignee("u3", "Joao"),
      }),
      makeTask("task-3", "Deploy producao", "DONE", "a0"),
      makeTask("task-4", "Escrever testes", "TODO", "a1"),
    ],
    collaborators: [
      collaborator("u1", "Patrick", "OWNER"),
      collaborator("u2", "Maria", "EDITOR"),
    ],
    ...overrides,
  } as ProjectFullDTO;
}

function renderBoard(project: ProjectFullDTO, tags = availableTags) {
  return render(
    <WorkspaceProvider user={mockUser} projects={mockProjects}>
      <ProjectBoard project={project} availableTags={tags} />
    </WorkspaceProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("<ProjectBoard />", () => {
  it("renderiza o cabeçalho com o nome e breadcrumb do projeto", () => {
    renderBoard(makeProject());
    expect(
      screen.getByRole("heading", { name: "Projeto Alpha" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Projetos")).toBeInTheDocument();
    // O id do projeto aparece no breadcrumb.
    expect(screen.getByText("proj-1")).toBeInTheDocument();
  });

  it("renderiza as tres colunas do kanban com seus titulos", () => {
    renderBoard(makeProject());
    expect(screen.getByText("A Fazer")).toBeInTheDocument();
    expect(screen.getByText("Em Progresso")).toBeInTheDocument();
    expect(screen.getByText("Concluido")).toBeInTheDocument();
  });

  it("renderiza os cards de tarefa distribuidos por status", () => {
    renderBoard(makeProject());
    expect(screen.getByText("Configurar CI")).toBeInTheDocument();
    expect(screen.getByText("Revisar PR")).toBeInTheDocument();
    expect(screen.getByText("Deploy producao")).toBeInTheDocument();
    expect(screen.getByText("Escrever testes")).toBeInTheDocument();
  });

  it("exibe a tag, o contador de comentarios e o link do card", () => {
    renderBoard(makeProject());
    // Tag renderizada (uppercase no estilo, texto continua "frontend").
    expect(screen.getByText("frontend")).toBeInTheDocument();
    // Contador de comentarios (2 comentarios na task-1).
    expect(screen.getByText(/💬 2/)).toBeInTheDocument();
    // O card vira um link para a pagina da tarefa.
    const link = screen
      .getByText("Configurar CI")
      .closest("a") as HTMLAnchorElement;
    expect(link).toHaveAttribute("href", "/projects/proj-1/tasks/task-1");
  });

  it("exibe o indicador de progresso de subtarefas no card", () => {
    const project = makeProject({
      tasks: [
        makeTask("task-1", "Tarefa com subtarefas", "TODO", "a0", {
          subtaskProgress: { done: 3, total: 5 },
        } as never),
        // Sem subtarefas → sem indicador.
        makeTask("task-2", "Tarefa simples", "TODO", "a1"),
      ],
    });
    renderBoard(project);
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.queryByText("0/0")).not.toBeInTheDocument();
  });

  // it("mostra o hint da Solut AI com o link para o chat", () => {
  //   renderBoard(makeProject());
  //   expect(screen.getByText(/A Solut AI detectou/)).toBeInTheDocument();
  //   const chatLink = screen.getByText(/Abrir chat/);
  //   expect(chatLink.closest("a")).toHaveAttribute("href", "/chat");
  // });

  it("renderiza os avatares dos membros (iniciais) no cabecalho", () => {
    renderBoard(makeProject());
    // "Patrick" -> "PA", "Maria" -> "MA"
    expect(screen.getByText("PA")).toBeInTheDocument();
    expect(screen.getByText("MA")).toBeInTheDocument();
  });

  it("abre o dialog de Nova tarefa ao clicar no botao principal", async () => {
    const user = userEvent.setup();
    renderBoard(makeProject());
    await user.click(screen.getByRole("button", { name: /Nova tarefa/i }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nova tarefa" }),
    ).toBeInTheDocument();
  });

  it("abre o dialog de Configuracoes (ProjectDialog) em modo edicao", async () => {
    const user = userEvent.setup();
    renderBoard(makeProject());
    // O botao de configuracoes e um IconButton com o SettingsIcon (sem label
    // acessivel proprio — o aria-label fica no <span> do Tooltip).
    const settingsBtn = screen
      .getByTestId("SettingsIcon")
      .closest("button") as HTMLButtonElement;
    await user.click(settingsBtn);
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", {
        name: "Configurações do projeto",
      }),
    ).toBeInTheDocument();
    // Em modo edit o nome ja vem preenchido.
    expect(
      within(dialog).getByDisplayValue("Projeto Alpha"),
    ).toBeInTheDocument();
  });

  it("abre o dialog de Convidar colaboradores listando os membros", async () => {
    const user = userEvent.setup();
    renderBoard(makeProject());
    await user.click(screen.getByRole("button", { name: /Convidar/i }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Convidar colaboradores" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Membros · 2")).toBeInTheDocument();
  });

  it("abre o TaskDialog com status pre-selecionado pelo botao '+' da coluna", async () => {
    const user = userEvent.setup();
    renderBoard(makeProject());
    // Cada coluna possui um IconButton "Adicionar tarefa".
    const addButtons = screen.getAllByRole("button", {
      name: /Adicionar tarefa/i,
    });
    expect(addButtons.length).toBe(3);
    await user.click(addButtons[1]); // coluna "Em Progresso"
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nova tarefa" }),
    ).toBeInTheDocument();
    // O TagSelector dentro do dialog mostra as tags disponiveis.
    expect(within(dialog).getByText("frontend")).toBeInTheDocument();
  });

  it("renderiza colunas vazias quando o projeto nao tem tarefas", () => {
    renderBoard(makeProject({ tasks: [] }));
    // Colunas continuam presentes, mas sem cards.
    expect(screen.getByText("A Fazer")).toBeInTheDocument();
    expect(screen.queryByText("Configurar CI")).not.toBeInTheDocument();
    // Os botoes de adicionar continuam disponiveis.
    expect(
      screen.getAllByRole("button", { name: /Adicionar tarefa/i }).length,
    ).toBe(3);
  });

  it("trata projeto sem colaboradores sem quebrar (sem avatares)", () => {
    renderBoard(makeProject({ collaborators: [] }));
    expect(
      screen.getByRole("heading", { name: "Projeto Alpha" }),
    ).toBeInTheDocument();
    // Ainda assim os controles do cabecalho existem.
    expect(
      screen.getByRole("button", { name: /Nova tarefa/i }),
    ).toBeInTheDocument();
  });

  it("trata tarefa sem titulo e sem responsavel (fallbacks vazios)", () => {
    renderBoard(
      makeProject({
        tasks: [makeTask("t-empty", "", "TODO", "a0")],
      }),
    );
    // Coluna "A Fazer" deve ter contagem 1 mesmo com titulo vazio.
    expect(screen.getByText("A Fazer")).toBeInTheDocument();
  });

  it("renderiza com diferentes papeis do usuario (VIEWER) sem alterar layout principal", () => {
    renderBoard(makeProject({ role: "VIEWER" }));
    // O board nao condiciona controles por role; tudo continua visivel.
    expect(
      screen.getByRole("button", { name: /Nova tarefa/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Convidar/i }),
    ).toBeInTheDocument();
  });

  it("ordena as tarefas por status e por order dentro da coluna", () => {
    // task-4 (order a1) deve aparecer depois de task-1 (order a0) na coluna TODO.
    renderBoard(makeProject());
    const ci = screen.getByText("Configurar CI");
    const testes = screen.getByText("Escrever testes");
    // Comparacao de posicao no DOM (a0 vem antes de a1).
    expect(
      ci.compareDocumentPosition(testes) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

// ─── Layout mobile (tabs) ──────────────────────────────────────────────────────

describe("<ProjectBoard /> layout mobile", () => {
  beforeEach(() => {
    // Força useMediaQuery(down("md")) === true para o ramo mobile (tabs).
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it("mostra as tabs das colunas e troca a coluna ativa ao clicar", async () => {
    const user = userEvent.setup();
    renderBoard(makeProject());

    // No mobile so a coluna ativa (TODO) renderiza seus cards.
    expect(screen.getByText("Configurar CI")).toBeInTheDocument();
    expect(screen.queryByText("Revisar PR")).not.toBeInTheDocument();

    // Clica na tab "Em Progresso".
    await user.click(screen.getByRole("button", { name: /Em Progresso/i }));
    expect(screen.getByText("Revisar PR")).toBeInTheDocument();
    expect(screen.queryByText("Configurar CI")).not.toBeInTheDocument();

    // Clica na tab "Concluido".
    await user.click(screen.getByRole("button", { name: /Concluido/i }));
    expect(screen.getByText("Deploy producao")).toBeInTheDocument();
  });
});

// ─── Reconciliação de tasks + lógica de drag-and-drop ─────────────────────────
// O DndContext é mockado (ver topo) e os handlers são disparados manualmente,
// já que DnD por ponteiro é instável no jsdom.

const evt = (activeId: string, overId: string | null) => ({
  active: { id: activeId },
  over: overId === null ? null : { id: overId },
});

const setDesktop = () =>
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });

describe("<ProjectBoard /> reconciliação e drag-and-drop", () => {
  // Garante layout desktop (todas as colunas visíveis) — o bloco mobile acima
  // muta window.matchMedia globalmente.
  beforeEach(setDesktop);

  it("re-ordena as tasks quando o prop project.tasks muda (reconciliação)", () => {
    const { rerender } = renderBoard(makeProject());
    expect(screen.getByText("Configurar CI")).toBeInTheDocument();

    // Nova referência de array de tasks → dispara o ramo de reconciliação.
    const next = makeProject({
      tasks: [makeTask("task-9", "Tarefa nova", "TODO", "a0")],
    });
    rerender(
      <WorkspaceProvider user={mockUser} projects={mockProjects}>
        <ProjectBoard project={next} availableTags={availableTags} />
      </WorkspaceProvider>,
    );
    expect(screen.getByText("Tarefa nova")).toBeInTheDocument();
    expect(screen.queryByText("Configurar CI")).not.toBeInTheDocument();
  });

  it("handleDragStart define a task ativa e renderiza o card no overlay", () => {
    renderBoard(makeProject());
    act(() => dndHandlers.onDragStart?.(evt("task-1", "task-1")));
    // O overlay duplica o título da task arrastada (card fantasma).
    expect(screen.getAllByText("Configurar CI").length).toBeGreaterThan(1);
  });

  it("handleDragOver ignora quando nao ha 'over'", () => {
    renderBoard(makeProject());
    act(() => dndHandlers.onDragOver?.(evt("task-1", null)));
    // Sem alteracao: card continua na coluna original.
    expect(screen.getByText("Configurar CI")).toBeInTheDocument();
  });

  it("handleDragOver move a task entre colunas (soltando sobre outra task)", () => {
    renderBoard(makeProject());
    // task-1 (TODO) sobre task-2 (IN_PROGRESS) → muda de container.
    act(() => dndHandlers.onDragOver?.(evt("task-1", "task-2")));
    expect(screen.getByText("Configurar CI")).toBeInTheDocument();
  });

  it("handleDragOver move a task soltando sobre a area da coluna (status id)", () => {
    renderBoard(makeProject());
    // task-1 (TODO) sobre o id da coluna "DONE" → posiciona no fim dela.
    act(() => dndHandlers.onDragOver?.(evt("task-1", "DONE")));
    expect(screen.getByText("Configurar CI")).toBeInTheDocument();
  });

  it("handleDragOver nao faz nada quando o container é o mesmo", () => {
    renderBoard(makeProject());
    // task-1 e task-4 estao ambas em TODO.
    act(() => dndHandlers.onDragOver?.(evt("task-1", "task-4")));
    expect(screen.getByText("Configurar CI")).toBeInTheDocument();
  });

  it("handleDragEnd reordena na mesma coluna e persiste via updateTaskAction", async () => {
    renderBoard(makeProject());
    act(() => dndHandlers.onDragStart?.(evt("task-1", "task-1")));
    // task-1 solta sobre task-4 (ambas TODO) → arrayMove + persistOrder.
    act(() => dndHandlers.onDragEnd?.(evt("task-1", "task-4")));
    await waitFor(() => expect(updateTaskAction).toHaveBeenCalled());
    const fd = (updateTaskAction as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as FormData;
    expect(fd.get("id")).toBe("task-1");
    expect(fd.get("projectId")).toBe("proj-1");
    expect(fd.get("status")).toBe("TODO");
  });

  it("handleDragEnd ignora quando nao ha 'over'", () => {
    renderBoard(makeProject());
    act(() => dndHandlers.onDragEnd?.(evt("task-1", null)));
    expect(updateTaskAction).not.toHaveBeenCalled();
  });

  it("handleDragEnd persiste apos mover de coluna (over = id de coluna)", async () => {
    renderBoard(makeProject());
    // Move para outra coluna no over, depois finaliza soltando sobre a coluna.
    act(() => dndHandlers.onDragOver?.(evt("task-1", "DONE")));
    act(() => dndHandlers.onDragEnd?.(evt("task-1", "DONE")));
    await waitFor(() => expect(updateTaskAction).toHaveBeenCalled());
    const fd = (updateTaskAction as ReturnType<typeof vi.fn>).mock.calls.at(
      -1,
    )![1] as FormData;
    expect(fd.get("id")).toBe("task-1");
    expect(fd.get("status")).toBe("DONE");
  });

  it("persistOrder reverte a UI quando a action retorna erro", async () => {
    (updateTaskAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      error: "falhou",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderBoard(makeProject());
    act(() => dndHandlers.onDragStart?.(evt("task-1", "task-1")));
    act(() => dndHandlers.onDragEnd?.(evt("task-1", "task-4")));
    await waitFor(() =>
      expect(errSpy).toHaveBeenCalledWith(
        "Falha ao reordenar a tarefa:",
        "falhou",
      ),
    );
    // Apos reverter, o card continua na tela.
    expect(screen.getByText("Configurar CI")).toBeInTheDocument();
    errSpy.mockRestore();
  });

  it("handleDragEnd nao persiste quando o id arrastado nao existe (guard !moved)", () => {
    renderBoard(makeProject());
    // over = id de coluna (nao reordena) e active inexistente → moved indefinido.
    act(() => dndHandlers.onDragEnd?.(evt("inexistente", "TODO")));
    expect(updateTaskAction).not.toHaveBeenCalled();
  });

  it("handleDragOver com active inexistente nao altera o estado (guard index -1)", () => {
    renderBoard(makeProject());
    // active inexistente em TODO, over = task-2 (IN_PROGRESS) → containers diferem,
    // mas activeIndex === -1 dentro do setTasks.
    act(() => dndHandlers.onDragOver?.(evt("fantasma", "task-2")));
    expect(screen.getByText("Revisar PR")).toBeInTheDocument();
  });

  it("persiste com dueDate e assigneeId quando presentes na task", async () => {
    renderBoard(makeProject());
    // task-1 possui assignee (Maria) e dueDate válido.
    act(() => dndHandlers.onDragStart?.(evt("task-1", "task-1")));
    act(() => dndHandlers.onDragEnd?.(evt("task-1", "task-4")));
    await waitFor(() => expect(updateTaskAction).toHaveBeenCalled());
    const fd = (updateTaskAction as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as FormData;
    expect(fd.get("assigneeId")).toBe("u2");
    expect(fd.get("dueDate")).toBeTruthy();
  });
});
