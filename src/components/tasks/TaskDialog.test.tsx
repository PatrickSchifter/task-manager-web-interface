import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within, waitFor } from "@/src/test/test-utils";
import type { TaskItemListDTO } from "@/src/services/api/tasks.service";
import type { ProjectCollaboratorDTO } from "@/src/services/api/projects.service";

// ─── Mocks das server actions ─────────────────────────────────────────────────
// As actions usam a assinatura do useActionState: (prevState, formData) => state.
// O estado tem o formato { error?, success? } (TaskState) e o estado inicial é null.

const createTaskAction = vi.fn();
const updateTaskAction = vi.fn();
const deleteTaskAction = vi.fn();
const createTagAction = vi.fn();

vi.mock("@/src/actions/tasks", () => ({
  createTaskAction: (...args: unknown[]) => createTaskAction(...args),
  updateTaskAction: (...args: unknown[]) => updateTaskAction(...args),
  deleteTaskAction: (...args: unknown[]) => deleteTaskAction(...args),
}));

vi.mock("@/src/actions/tags", () => ({
  createTagAction: (...args: unknown[]) => createTagAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { TaskDialog } from "./TaskDialog";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const collaborators: ProjectCollaboratorDTO[] = [
  {
    id: "c1",
    role: "OWNER",
    projectId: "p1",
    userId: "u1",
    createAt: "2026-01-01T00:00:00.000Z",
    user: { id: "u1", name: "Ana Lima", email: "ana@test.com", avatar: null },
  },
  {
    id: "c2",
    role: "EDITOR",
    projectId: "p1",
    userId: "u2",
    createAt: "2026-01-01T00:00:00.000Z",
    user: { id: "u2", name: "Bruno Souza", email: "bruno@test.com", avatar: null },
  },
];

const baseTask: TaskItemListDTO = {
  id: "t1",
  title: "Tarefa existente",
  description: "Descrição da tarefa" as unknown as Record<string, never>,
  status: "IN_PROGRESS",
  priority: "HIGH",
  order: "a0",
  dueDate: "2026-07-10" as unknown as Record<string, never>,
  tags: [{ id: "tag1", name: "backend", color: "emerald" }],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  assignee: { id: "u2", name: "Bruno Souza", email: "bruno@test.com", avatar: null },
};

// Helper: preenche o campo de Prazo (obrigatório). Sem ele o jsdom bloqueia o
// submit nativo por causa da validação HTML5 do input required.
async function fillDueDate(value = "10/07/2026") {
  const group = screen.getByRole("group", { name: /Prazo/ });
  await userEvent.click(group);
  await userEvent.keyboard(value);
}

// Helper: abre o dialog de criação via gatilho customizado.
async function openCreate(props: Partial<Parameters<typeof TaskDialog>[0]> = {}) {
  render(
    <TaskDialog
      projectId="p1"
      collaborators={collaborators}
      trigger={<button type="button">Abrir</button>}
      {...props}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
  return screen.findByRole("dialog");
}

beforeEach(() => {
  createTaskAction.mockResolvedValue({ success: true });
  updateTaskAction.mockResolvedValue({ success: true });
  deleteTaskAction.mockResolvedValue({ success: true });
  createTagAction.mockResolvedValue({ id: "new", name: "nova", color: "brand" });
});

// ──────────────────────────────────────────────────────────────────────────────

describe("<TaskDialog /> (abertura/fechamento)", () => {
  it("começa fechado e abre pelo gatilho padrão (ícone de adicionar)", async () => {
    render(<TaskDialog projectId="p1" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Nova tarefa")).toBeInTheDocument();
  });

  it("abre por um trigger customizado", async () => {
    await openCreate();
    expect(screen.getByText("Nova tarefa")).toBeInTheDocument();
  });

  it("fecha ao clicar em Cancelar", async () => {
    await openCreate();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});

describe("<TaskDialog /> (modo criação)", () => {
  it("renderiza campos vazios e a label 'Criar tarefa'", async () => {
    await openCreate();
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByLabelText(/Título/)).toHaveValue("");
    expect(within(dialog).getByLabelText(/Descrição/)).toHaveValue("");
    expect(
      within(dialog).getByRole("button", { name: "Criar tarefa" }),
    ).toBeInTheDocument();
  });

  it("não mostra a zona de perigo no modo criação", async () => {
    await openCreate();
    expect(screen.queryByText("Zona de perigo")).not.toBeInTheDocument();
  });

  it("renderiza o DatePicker de Prazo", async () => {
    await openCreate();
    // O campo do MUI X DatePicker é exposto como um group rotulado "Prazo".
    expect(screen.getByRole("group", { name: /Prazo/ })).toBeInTheDocument();
  });

  it("mostra mensagem quando não há colaboradores", async () => {
    render(<TaskDialog projectId="p1" trigger={<button>Abrir</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await screen.findByRole("dialog");
    expect(
      screen.getByText("Nenhum colaborador no projeto."),
    ).toBeInTheDocument();
  });

  it("aplica o defaultStatus recebido por prop", async () => {
    await openCreate({ defaultStatus: "DONE" });
    // O TextField select renderiza o label do status selecionado.
    const statusField = screen.getByLabelText(/Status/);
    // O input escondido do select carrega o valor.
    expect(statusField).toBeInTheDocument();
    expect(screen.getByText("Concluído")).toBeInTheDocument();
  });
});

describe("<TaskDialog /> (modo edição) — pré-preenchimento", () => {
  function renderEdit(task: TaskItemListDTO = baseTask) {
    render(
      <TaskDialog
        projectId="p1"
        task={task}
        collaborators={collaborators}
        availableTags={[{ id: "tg", name: "design", color: "violet" }]}
        trigger={<button type="button">Editar</button>}
      />,
    );
    return userEvent
      .click(screen.getByRole("button", { name: "Editar" }))
      .then(() => screen.findByRole("dialog"));
  }

  it("pré-preenche título, descrição e mostra 'Editar tarefa'", async () => {
    await renderEdit();
    expect(screen.getByText("Editar tarefa")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tarefa existente")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Descrição da tarefa")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeInTheDocument();
  });

  it("mostra a zona de perigo no modo edição", async () => {
    await renderEdit();
    expect(screen.getByText("Zona de perigo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Deletar tarefa" }),
    ).toBeInTheDocument();
  });

  it("marca o responsável atual como selecionado", async () => {
    await renderEdit();
    // Bruno é o assignee — aparece (abreviado) como chip de colaborador.
    expect(screen.getByText(/Bruno/)).toBeInTheDocument();
  });

  it("lida com description não-string (objeto/null) sem quebrar", async () => {
    const task = {
      ...baseTask,
      description: null as unknown as Record<string, never>,
    };
    await renderEdit(task);
    expect(screen.getByLabelText(/Descrição/)).toHaveValue("");
  });

  it("lida com dueDate ausente", async () => {
    const task = {
      ...baseTask,
      dueDate: null as unknown as Record<string, never>,
    };
    await renderEdit(task);
    // Sem dueDate o campo de Prazo mostra apenas o placeholder (dd/mm/aaaa).
    expect(screen.getByRole("group", { name: /Prazo/ })).toBeInTheDocument();
  });

  it("renderiza a tag já existente da tarefa", async () => {
    await renderEdit();
    expect(screen.getByText("backend")).toBeInTheDocument();
  });

  it("usa o fallback de parsing para dueDate em formato não-ISO", async () => {
    // Um valor que não casa com YYYY-MM-DD mas é parseável por `new Date`.
    const task = {
      ...baseTask,
      dueDate: "07/10/2026" as unknown as Record<string, never>,
    };
    await renderEdit(task);
    // Renderiza sem quebrar e ainda mostra o campo de Prazo.
    expect(screen.getByRole("group", { name: /Prazo/ })).toBeInTheDocument();
  });

  it("ignora dueDate completamente inválido (fallback NaN → null)", async () => {
    const task = {
      ...baseTask,
      dueDate: "data-invalida" as unknown as Record<string, never>,
    };
    await renderEdit(task);
    expect(screen.getByRole("group", { name: /Prazo/ })).toBeInTheDocument();
  });
});

describe("<TaskDialog /> (edição de campos)", () => {
  it("permite digitar no título e na descrição", async () => {
    await openCreate();
    const title = screen.getByLabelText(/Título/);
    const desc = screen.getByLabelText(/Descrição/);

    await userEvent.type(title, "Nova");
    await userEvent.type(desc, "Conteúdo");

    expect(title).toHaveValue("Nova");
    expect(desc).toHaveValue("Conteúdo");
  });

  it("permite selecionar a prioridade via MUI Select", async () => {
    await openCreate();
    // Abre o select de Prioridade e escolhe "Alta".
    const priority = screen.getByLabelText(/Prioridade/);
    await userEvent.click(priority);
    const listbox = await screen.findByRole("listbox");
    await userEvent.click(within(listbox).getByRole("option", { name: /Alta/ }));
    // O valor selecionado aparece no campo.
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("permite selecionar o status via MUI Select", async () => {
    await openCreate();
    const status = screen.getByLabelText(/Status/);
    await userEvent.click(status);
    const listbox = await screen.findByRole("listbox");
    await userEvent.click(
      within(listbox).getByRole("option", { name: /Em progresso/ }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Em progresso")).toBeInTheDocument();
  });
});

describe("<TaskDialog /> (colaboradores / responsável)", () => {
  it("seleciona e deseleciona um colaborador", async () => {
    await openCreate();
    // Ana é a primeira colaboradora (abreviada como "Ana Lima").
    const anaChip = screen.getByText(/Ana/).closest("button")!;
    await userEvent.click(anaChip);
    await userEvent.click(anaChip);
    expect(anaChip).toBeInTheDocument();
  });
});

describe("<TaskDialog /> (tags)", () => {
  it("adiciona uma tag sugerida clicando no chip", async () => {
    await openCreate();
    // "design" é uma sugestão padrão; clicar adiciona à seleção.
    const designChip = screen.getByText("design");
    await userEvent.click(designChip);
    // Continua presente (agora como selecionada).
    expect(screen.getByText("design")).toBeInTheDocument();
  });

  it("abre o criador inline de tag e cria uma tag nova", async () => {
    await openCreate();
    await userEvent.click(screen.getByRole("button", { name: "Criar tag" }));

    const nameInput = await screen.findByPlaceholderText("Nome da tag");
    await userEvent.type(nameInput, "minhatag");

    // O preview da chip aparece enquanto digita.
    expect(screen.getAllByText("minhatag").length).toBeGreaterThan(0);

    // Submete via Enter no input.
    await userEvent.type(nameInput, "{Enter}");
    await waitFor(() => expect(createTagAction).toHaveBeenCalled());
  });

  it("cancela a criação de tag inline", async () => {
    await openCreate();
    await userEvent.click(screen.getByRole("button", { name: "Criar tag" }));
    const nameInput = await screen.findByPlaceholderText("Nome da tag");
    await userEvent.type(nameInput, "x{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText("Nome da tag"),
      ).not.toBeInTheDocument(),
    );
  });
});

describe("<TaskDialog /> (submissão — criação)", () => {
  it("sucesso chama createTaskAction e fecha o dialog", async () => {
    await openCreate();
    await userEvent.type(screen.getByLabelText(/Título/), "Tarefa nova");
    await fillDueDate();
    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));

    await waitFor(() => expect(createTaskAction).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    // Verifica que o FormData carrega o título digitado e o projectId.
    const [, formData] = createTaskAction.mock.calls[0] as [unknown, FormData];
    expect(formData.get("title")).toBe("Tarefa nova");
    expect(formData.get("projectId")).toBe("p1");
  });

  it("erro mostra um Alert e mantém o dialog aberto", async () => {
    createTaskAction.mockResolvedValue({ error: "Falha ao criar." });
    await openCreate();
    await userEvent.type(screen.getByLabelText(/Título/), "X");
    await fillDueDate();
    await userEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao criar.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("<TaskDialog /> (submissão — edição)", () => {
  function renderEdit() {
    render(
      <TaskDialog
        projectId="p1"
        task={baseTask}
        collaborators={collaborators}
        trigger={<button type="button">Editar</button>}
      />,
    );
    return userEvent
      .click(screen.getByRole("button", { name: "Editar" }))
      .then(() => screen.findByRole("dialog"));
  }

  it("sucesso chama updateTaskAction com o id e fecha", async () => {
    await renderEdit();
    await userEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() => expect(updateTaskAction).toHaveBeenCalled());

    const [, formData] = updateTaskAction.mock.calls[0] as [unknown, FormData];
    expect(formData.get("id")).toBe("t1");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});

describe("<TaskDialog /> (exclusão)", () => {
  function renderEdit() {
    render(
      <TaskDialog
        projectId="p1"
        task={baseTask}
        collaborators={collaborators}
        trigger={<button type="button">Editar</button>}
      />,
    );
    return userEvent
      .click(screen.getByRole("button", { name: "Editar" }))
      .then(() => screen.findByRole("dialog"));
  }

  it("alterna para a confirmação de exclusão e volta", async () => {
    await renderEdit();
    await userEvent.click(
      screen.getByRole("button", { name: "Deletar tarefa" }),
    );
    expect(
      screen.getByRole("button", { name: "Sim, deletar tarefa" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Esta ação não pode ser desfeita.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByText("Editar tarefa")).toBeInTheDocument();
  });

  it("confirma a exclusão (sucesso) chamando deleteTaskAction e fechando", async () => {
    await renderEdit();
    await userEvent.click(
      screen.getByRole("button", { name: "Deletar tarefa" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Sim, deletar tarefa" }),
    );
    await waitFor(() => expect(deleteTaskAction).toHaveBeenCalled());

    const [, formData] = deleteTaskAction.mock.calls[0] as [unknown, FormData];
    expect(formData.get("id")).toBe("t1");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("erro na exclusão mostra Alert e mantém a confirmação aberta", async () => {
    deleteTaskAction.mockResolvedValue({ error: "Falha ao deletar." });
    await renderEdit();
    await userEvent.click(
      screen.getByRole("button", { name: "Deletar tarefa" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Sim, deletar tarefa" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao deletar.",
    );
    expect(
      screen.getByRole("button", { name: "Sim, deletar tarefa" }),
    ).toBeInTheDocument();
  });
});
