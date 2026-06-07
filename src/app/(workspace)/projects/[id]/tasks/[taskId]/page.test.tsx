import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/src/test/test-utils";

const taskFindById = vi.fn();
const projectFindById = vi.fn();
const tagsFindAll = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/src/services/api", () => ({
  projectsService: { findById: (...a: any[]) => projectFindById(...a) },
  tasksService: { findById: (...a: any[]) => taskFindById(...a) },
  tagsService: { findAll: (...a: any[]) => tagsFindAll(...a) },
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

vi.mock("@/src/components/layouts/WorkspaceLayout", () => ({
  default: ({ children }: any) => <div data-testid="ws">{children}</div>,
}));

vi.mock("./TaskDetail", () => ({
  TaskDetail: (props: any) => (
    <div data-testid="detail">{props.task?.title}</div>
  ),
}));

import TaskPage, { generateMetadata } from "./page";

const params = Promise.resolve({ id: "p1", taskId: "t1" });

describe("TaskPage — generateMetadata", () => {
  beforeEach(() => {
    taskFindById.mockReset();
    projectFindById.mockReset();
    tagsFindAll.mockReset();
    notFound.mockClear();
  });

  it("usa o título da tarefa quando encontrada", async () => {
    taskFindById.mockResolvedValue({ id: "t1", title: "Implementar login" });
    const meta = await generateMetadata({
      params: Promise.resolve({ id: "p1", taskId: "t1" }),
    });
    expect(meta.title).toBe("Implementar login — Solut Tasks");
    expect(meta.description).toContain("Implementar login");
  });

  it("usa título de fallback quando findById rejeita", async () => {
    taskFindById.mockRejectedValue(new Error("404"));
    const meta = await generateMetadata({
      params: Promise.resolve({ id: "p1", taskId: "t1" }),
    });
    expect(meta.title).toBe("Tarefa — Solut Tasks");
  });
});

describe("TaskPage (server component)", () => {
  beforeEach(() => {
    taskFindById.mockReset();
    projectFindById.mockReset();
    tagsFindAll.mockReset();
    notFound.mockClear();
  });

  it("renderiza o detalhe com o título da tarefa (happy path)", async () => {
    taskFindById.mockResolvedValue({ id: "t1", title: "Tarefa Alpha" });
    projectFindById.mockResolvedValue({ id: "p1", name: "Projeto" });
    tagsFindAll.mockResolvedValue([]);
    const ui = await TaskPage({ params });
    render(ui);
    expect(screen.getByTestId("detail")).toHaveTextContent("Tarefa Alpha");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("usa lista de tags vazia quando tagsService.findAll rejeita", async () => {
    taskFindById.mockResolvedValue({ id: "t1", title: "Tarefa Beta" });
    projectFindById.mockResolvedValue({ id: "p1", name: "Projeto" });
    tagsFindAll.mockRejectedValue(new Error("falha tags"));
    const ui = await TaskPage({ params });
    render(ui);
    expect(screen.getByTestId("detail")).toHaveTextContent("Tarefa Beta");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("chama notFound quando tasksService.findById rejeita", async () => {
    taskFindById.mockRejectedValue(new Error("falha"));
    await expect(TaskPage({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("chama notFound quando a tarefa é nula", async () => {
    taskFindById.mockResolvedValue(null);
    projectFindById.mockResolvedValue({ id: "p1", name: "Projeto" });
    tagsFindAll.mockResolvedValue([]);
    await expect(TaskPage({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
