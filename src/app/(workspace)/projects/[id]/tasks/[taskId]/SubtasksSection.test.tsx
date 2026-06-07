import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/src/test/test-utils";

// Mock da action usada para toggle/reorder. Tipado com args para permitir
// inspecionar o FormData enviado (mock.calls[i][1]).
const updateTaskAction = vi.fn(async (..._args: unknown[]) => ({
  success: true,
}));
vi.mock("@/src/actions/tasks", () => ({
  updateTaskAction: (...args: unknown[]) =>
    (updateTaskAction as (...a: unknown[]) => unknown)(...args),
}));

// TaskDialog mockado (só o trigger) — evita arrastar o Dialog/Pickers no teste.
vi.mock("@/src/components/tasks/TaskDialog", () => ({
  TaskStatus: {},
  TaskDialog: ({ trigger }: { trigger?: React.ReactNode }) => (
    <div data-testid="task-dialog-mock">{trigger}</div>
  ),
}));

import { SubtasksSection } from "./SubtasksSection";

const project = { id: "p1", collaborators: [] } as never;

function subtask(over: Record<string, unknown> = {}) {
  return {
    id: "s1",
    title: "Subtarefa A",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    order: "a0",
    parentId: "t1",
    dueDate: null,
    assignee: null,
    tags: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...over,
  } as never;
}

function renderSection(subtasks: never[]) {
  return render(
    <SubtasksSection
      taskId="t1"
      project={project}
      subtasks={subtasks}
      availableTags={[]}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  updateTaskAction.mockResolvedValue({ success: true });
});

describe("<SubtasksSection />", () => {
  it("mostra o estado vazio quando não há subtarefas", () => {
    renderSection([]);
    expect(
      screen.getByText(/Nenhuma subtarefa ainda/i),
    ).toBeInTheDocument();
  });

  it("renderiza as subtarefas e o contador de progresso", () => {
    renderSection([
      subtask({ id: "s1", title: "Mapear endpoints", status: "DONE", order: "a0" }),
      subtask({ id: "s2", title: "Migrar rotas", status: "TODO", order: "a1" }),
      subtask({ id: "s3", title: "Cobertura de testes", status: "TODO", order: "a2" }),
    ]);
    expect(screen.getByText("Mapear endpoints")).toBeInTheDocument();
    expect(screen.getByText("Migrar rotas")).toBeInTheDocument();
    // 1 de 3 concluídas.
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("marca uma subtarefa como DONE via checkbox chamando updateTaskAction", async () => {
    const user = userEvent.setup();
    renderSection([
      subtask({ id: "s1", title: "Migrar rotas", status: "TODO" }),
    ]);

    await user.click(
      screen.getByRole("checkbox", { name: /Concluir Migrar rotas/i }),
    );

    await vi.waitFor(() => expect(updateTaskAction).toHaveBeenCalled());
    const fd = updateTaskAction.mock.calls[0][1] as FormData;
    expect(fd.get("id")).toBe("s1");
    expect(fd.get("status")).toBe("DONE");
    expect(fd.get("projectId")).toBe("p1");
  });

  it("desmarcar uma subtarefa DONE envia status TODO", async () => {
    const user = userEvent.setup();
    renderSection([subtask({ id: "s1", title: "Pronta", status: "DONE" })]);

    await user.click(screen.getByRole("checkbox", { name: /Concluir Pronta/i }));

    await vi.waitFor(() => expect(updateTaskAction).toHaveBeenCalled());
    const fd = updateTaskAction.mock.calls[0][1] as FormData;
    expect(fd.get("status")).toBe("TODO");
  });
});
