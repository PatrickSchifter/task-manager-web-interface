import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/src/test/test-utils";

const getSummary = vi.fn();

vi.mock("@/src/services/api/dashboard.service", () => ({
  dashboardService: { getSummary: () => getSummary() },
}));

vi.mock("@/src/components/layouts/WorkspaceLayout", () => ({
  default: ({ children }: any) => <div data-testid="ws">{children}</div>,
}));

vi.mock("./DashboardClient", () => ({
  default: (props: any) => (
    <pre data-testid="props">
      {JSON.stringify({
        stats: props.stats.map((s: any) => s.label + ":" + s.value),
        recent: props.recentProjects,
        upcoming: props.upcoming,
      })}
    </pre>
  ),
}));

import DashboardPage from "./page";

const summary = {
  stats: { activeTasks: 12, inProgress: 5, completedLast7Days: 7 },
  recentProjects: [
    { id: "proj-1", name: "Projeto A", totalTasks: 10, doneTasks: 4 },
  ],
  upcomingTasks: [
    {
      id: "task-1",
      title: "Tarefa urgente",
      project: { id: "proj-1", name: "Projeto A" },
      dueDate: "2026-06-10T00:00:00.000Z",
      priority: "HIGH",
    },
    {
      id: "task-2",
      title: "Tarefa sem prazo",
      project: { id: "proj-1", name: "Projeto A" },
      dueDate: null,
      priority: "DESCONHECIDA",
    },
  ],
};

describe("DashboardPage (server component)", () => {
  beforeEach(() => {
    getSummary.mockReset();
    getSummary.mockResolvedValue(summary);
  });

  it("mapeia os valores das estatísticas para strings", async () => {
    const ui = await DashboardPage();
    render(ui);
    const data = JSON.parse(screen.getByTestId("props").textContent!);
    expect(data.stats).toEqual([
      "Tarefas ativas:12",
      "Em progresso:5",
      "Concluídas (7d):7",
    ]);
  });

  it("mapeia tasks/done dos projetos recentes", async () => {
    const ui = await DashboardPage();
    render(ui);
    const data = JSON.parse(screen.getByTestId("props").textContent!);
    expect(data.recent[0]).toMatchObject({
      id: "proj-1",
      name: "Projeto A",
      tasks: 10,
      done: 4,
    });
  });

  it("mapeia prioridade HIGH para 'Alta'", async () => {
    const ui = await DashboardPage();
    render(ui);
    const data = JSON.parse(screen.getByTestId("props").textContent!);
    expect(data.upcoming[0].priority).toBe("Alta");
  });

  it("usa 'Média' para prioridade desconhecida", async () => {
    const ui = await DashboardPage();
    render(ui);
    const data = JSON.parse(screen.getByTestId("props").textContent!);
    expect(data.upcoming[1].priority).toBe("Média");
  });

  it("formata a data de vencimento em pt-BR", async () => {
    const ui = await DashboardPage();
    render(ui);
    const data = JSON.parse(screen.getByTestId("props").textContent!);
    const expected = new Date(
      "2026-06-10T00:00:00.000Z",
    ).toLocaleDateString("pt-BR");
    expect(data.upcoming[0].due).toBe(expected);
  });

  it("usa '—' quando a tarefa não tem prazo", async () => {
    const ui = await DashboardPage();
    render(ui);
    const data = JSON.parse(screen.getByTestId("props").textContent!);
    expect(data.upcoming[1].due).toBe("—");
  });
});
