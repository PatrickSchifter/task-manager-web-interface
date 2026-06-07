import { describe, it, expect, vi } from "vitest";
import {
  AccessTimeOutlined,
  CheckCircleOutlineOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import { render, screen, within } from "@/src/test/test-utils";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";
import DashboardClient from "./DashboardClient";
import {
  priorityConfig,
  type RecentProject,
  type StatItem,
  type TaskItem,
} from "./types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockUser = { id: "u1", name: "Patrick Schifter", email: "p@s.com" } as never;
const mockProjects = [] as never;

const stats: StatItem[] = [
  {
    label: "Tarefas ativas",
    value: "12",
    trend: "+3",
    icon: AccessTimeOutlined,
    accent: "#6366f1",
  },
  {
    label: "Em progresso",
    value: "4",
    trend: "+1",
    icon: TrendingUpOutlined,
    accent: "#f59e0b",
  },
  {
    label: "Concluídas (7d)",
    value: "8",
    trend: "+5",
    icon: CheckCircleOutlineOutlined,
    accent: "#10b981",
  },
];

const recentProjects: RecentProject[] = [
  {
    id: "proj-1",
    name: "Projeto Alpha",
    tasks: 10,
    done: 5,
    gradientCss: "linear-gradient(135deg, #6366f1, #a855f7)",
  },
  {
    id: "proj-2",
    name: "Projeto Beta",
    tasks: 4,
    done: 4,
    gradientCss: "linear-gradient(135deg, #10b981, #14b8a6)",
  },
];

const upcoming: TaskItem[] = [
  {
    id: "TASK-1",
    title: "Implementar login",
    project: { id: "proj-1", name: "Projeto Alpha" },
    due: "10/06/2026",
    priority: "Alta",
  },
  {
    id: "TASK-2",
    title: "Revisar PR",
    project: { id: "proj-2", name: "Projeto Beta" },
    due: "12/06/2026",
    priority: "Média",
  },
  {
    id: "TASK-3",
    title: "Atualizar docs",
    project: { id: "proj-1", name: "Projeto Alpha" },
    due: "15/06/2026",
    priority: "Baixa",
  },
];

function renderDashboard(
  props: Partial<React.ComponentProps<typeof DashboardClient>> = {},
  user = mockUser,
) {
  return render(
    <WorkspaceProvider user={user} projects={mockProjects}>
      <DashboardClient
        stats={props.stats ?? stats}
        recentProjects={props.recentProjects ?? recentProjects}
        upcoming={props.upcoming ?? upcoming}
        priorityConfig={props.priorityConfig ?? priorityConfig}
      />
    </WorkspaceProvider>,
  );
}

describe("<DashboardClient />", () => {
  it("saúda o usuário com o primeiro nome", () => {
    renderDashboard();
    expect(screen.getByText(/Olá, Patrick/)).toBeInTheDocument();
    expect(
      screen.getByText("Aqui está o resumo do seu workspace."),
    ).toBeInTheDocument();
  });

  it("usa fallback 'você' quando o usuário não possui nome", () => {
    renderDashboard({}, { id: "u2", email: "x@y.com" } as never);
    expect(screen.getByText(/Olá, você/)).toBeInTheDocument();
  });

  it("exibe o botão 'Perguntar à IA' com link para /chat", () => {
    renderDashboard();
    const link = screen.getByRole("link", { name: /Perguntar à IA/ });
    expect(link).toHaveAttribute("href", "/chat");
  });

  it("renderiza todos os cards de estatísticas com valores, rótulos e tendências", () => {
    renderDashboard();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Tarefas ativas")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Em progresso")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Concluídas (7d)")).toBeInTheDocument();
  });

  it("renderiza os títulos das seções", () => {
    renderDashboard();
    expect(screen.getByText("Projetos ativos")).toBeInTheDocument();
    expect(screen.getByText("Próximas")).toBeInTheDocument();
  });

  it("renderiza projetos recentes com nome, progresso e link correto", () => {
    renderDashboard();
    const alpha = screen.getByText("Projeto Alpha");
    expect(alpha).toBeInTheDocument();
    expect(screen.getByText("Projeto Beta")).toBeInTheDocument();

    // proj-1: 5/10 -> 50%
    expect(screen.getByText("5/10 tarefas")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    // proj-2: 4/4 -> 100%
    expect(screen.getByText("4/4 tarefas")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    const projectLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/projects/"));
    expect(
      projectLinks.some((l) => l.getAttribute("href") === "/projects/proj-1"),
    ).toBe(true);
    expect(
      projectLinks.some((l) => l.getAttribute("href") === "/projects/proj-2"),
    ).toBe(true);
  });

  it("exibe 0% quando o projeto não possui tarefas (divisão por zero)", () => {
    renderDashboard({
      recentProjects: [
        {
          id: "proj-empty",
          name: "Projeto Vazio",
          tasks: 0,
          done: 0,
          gradientCss: "linear-gradient(135deg, #000, #fff)",
        },
      ],
    });
    expect(screen.getByText("Projeto Vazio")).toBeInTheDocument();
    expect(screen.getByText("0/0 tarefas")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renderiza as tarefas próximas com id, título, projeto e prazo", () => {
    renderDashboard();
    expect(screen.getByText("Implementar login")).toBeInTheDocument();
    expect(screen.getByText("Revisar PR")).toBeInTheDocument();
    expect(screen.getByText("Atualizar docs")).toBeInTheDocument();

    expect(screen.getByText("TASK-1")).toBeInTheDocument();
    expect(screen.getByText("10/06/2026")).toBeInTheDocument();
    expect(screen.getByText("12/06/2026")).toBeInTheDocument();
    expect(screen.getByText("15/06/2026")).toBeInTheDocument();
  });

  it("gera link correto para cada tarefa próxima", () => {
    renderDashboard();
    const taskLinks = screen
      .getAllByRole("link")
      .map((l) => l.getAttribute("href"));
    expect(taskLinks).toContain("/projects/proj-1/tasks/TASK-1");
    expect(taskLinks).toContain("/projects/proj-2/tasks/TASK-2");
    expect(taskLinks).toContain("/projects/proj-1/tasks/TASK-3");
  });

  it("renderiza um chip de prioridade para cada nível de prioridade", () => {
    renderDashboard();
    // Cada prioridade aparece como label do chip.
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("Média")).toBeInTheDocument();
    expect(screen.getByText("Baixa")).toBeInTheDocument();
  });

  it("aplica a cor configurada para cada prioridade no chip", () => {
    renderDashboard();
    const high = screen.getByText("Alta").closest(".MuiChip-root");
    const medium = screen.getByText("Média").closest(".MuiChip-root");
    const low = screen.getByText("Baixa").closest(".MuiChip-root");
    expect(high?.className).toContain("colorError");
    expect(medium?.className).toContain("colorWarning");
    expect(low?.className).toContain("colorSuccess");
  });

  it("mostra o nome do projeto de cada tarefa próxima", () => {
    renderDashboard();
    // O nome do projeto da tarefa é prefixado com "# ".
    // Projeto Alpha aparece em duas tarefas (TASK-1 e TASK-3).
    expect(screen.getAllByText("# Projeto Alpha")).toHaveLength(2);
    expect(screen.getByText("# Projeto Beta")).toBeInTheDocument();
  });

  it("renderiza sem erros com listas vazias (estados vazios)", () => {
    renderDashboard({ stats: [], recentProjects: [], upcoming: [] });
    // Cabeçalhos das seções continuam presentes.
    expect(screen.getByText("Projetos ativos")).toBeInTheDocument();
    expect(screen.getByText("Próximas")).toBeInTheDocument();
    // Nenhum card de projeto/tarefa.
    expect(screen.queryByText("Projeto Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Implementar login")).not.toBeInTheDocument();
    expect(screen.queryByText("Tarefas ativas")).not.toBeInTheDocument();
  });

  it("arredonda a porcentagem de conclusão", () => {
    renderDashboard({
      recentProjects: [
        {
          id: "proj-round",
          name: "Projeto Round",
          tasks: 3,
          done: 1,
          gradientCss: "linear-gradient(135deg, #000, #fff)",
        },
      ],
    });
    // 1/3 = 33.33 -> 33%
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("usa apenas o primeiro nome quando o usuário tem nome composto", () => {
    renderDashboard({}, { id: "u3", email: "a@b.com", name: "Ana Maria Silva" } as never);
    const heading = screen.getByRole("heading", { level: 5 });
    expect(within(heading).getByText(/Ana/)).toBeInTheDocument();
    expect(heading.textContent).toContain("Ana");
    expect(heading.textContent).not.toContain("Maria");
  });
});
