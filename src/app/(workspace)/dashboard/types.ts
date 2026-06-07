import type { SvgIconComponent } from "@mui/icons-material";

export interface StatItem {
  label: string;
  value: string;
  trend: string;
  icon: SvgIconComponent;
  accent: string;
}

export interface RecentProject {
  id: string;
  name: string;
  tasks: number;
  done: number;
  gradientFrom?: string;
  gradientTo?: string;
  gradientCss: string;
}

export interface TaskItem {
  id: string;
  title: string;
  project: { id: string; name: string };
  due: string;
  priority: TaskPriorityLevel;
}

export type PriorityColor = "error" | "warning" | "success";

export type TaskPriorityLevel = "Alta" | "Média" | "Baixa";

export interface PriorityConfigItem {
  color: PriorityColor;
}

export const priorityConfig: Record<TaskPriorityLevel, PriorityConfigItem> = {
  Alta: { color: "error" },
  Média: { color: "warning" },
  Baixa: { color: "success" },
};
