import {
  AccessTimeOutlined,
  CheckCircleOutlineOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import WorkspaceLayout from "@/src/components/layouts/WorkspaceLayout";
import type { Metadata } from "next";
import { dashboardService } from "@/src/services/api/dashboard.service";
import { theme } from "@/src/theme";

// ─── Data ─────────────────────────────────────────────────────────────────────

import { SvgIconComponent } from "@mui/icons-material";
import DashboardClient from "./DashboardClient";
import {
  priorityConfig,
  type RecentProject,
  type StatItem,
  type TaskItem,
  type TaskPriorityLevel,
} from "./types";

const PRIORITY_MAP: Record<string, TaskPriorityLevel> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

const GRADIENT_POOL = [
  "linear-gradient(135deg, #6366f1, #a855f7)",
  "linear-gradient(135deg, #10b981, #14b8a6)",
  "linear-gradient(135deg, #f59e0b, #f97316)",
  "linear-gradient(135deg, #a855f7, #ec4899)",
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #ef4444, #f97316)",
];

const STAT_ICONS: SvgIconComponent[] = [
  AccessTimeOutlined,
  CheckCircleOutlineOutlined,
  TrendingUpOutlined,
];

export const metadata: Metadata = {
  title: "Dashboard — Solut Tasks",
  description: "Dashboard.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { stats, recentProjects, upcomingTasks, routines } =
    await dashboardService.getSummary();

  const statItems: StatItem[] = [
    {
      label: "Tarefas ativas",
      value: String(stats.activeTasks),
      trend: "",
      icon: STAT_ICONS[0],
      accent: theme.palette.indigo.main,
    },
    {
      label: "Em progresso",
      value: String(stats.inProgress),
      trend: "",
      icon: STAT_ICONS[2],
      accent: theme.palette.warning.main,
    },
    {
      label: "Concluídas (7d)",
      value: String(stats.completedLast7Days),
      trend: "",
      icon: STAT_ICONS[1],
      accent: theme.palette.success.main,
    },
  ];

  const mappedProjects: RecentProject[] = recentProjects.map(
    (project, index) => ({
      id: project.id,
      name: project.name,
      tasks: project.totalTasks,
      done: project.doneTasks,
      gradientCss: GRADIENT_POOL[index % GRADIENT_POOL.length],
    }),
  );

  const upcoming: TaskItem[] = upcomingTasks.map((task) => ({
    id: task.id,
    title: task.title,
    project: task.project,
    due: task.dueDate
      ? new Date(task.dueDate as unknown as string).toLocaleDateString("pt-BR")
      : "—",
    priority: PRIORITY_MAP[task.priority] ?? "Média",
  }));

  return (
    <WorkspaceLayout>
      <DashboardClient
        priorityConfig={priorityConfig}
        recentProjects={mappedProjects}
        stats={statItems}
        upcoming={upcoming}
        routines={routines}
      />
    </WorkspaceLayout>
  );
}
