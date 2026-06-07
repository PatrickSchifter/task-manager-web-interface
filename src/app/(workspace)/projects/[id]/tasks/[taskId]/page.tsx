import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectsService, tasksService, tagsService } from "@/src/services/api";
import { TaskDetail } from "./TaskDetail";
import WorkspaceLayout from "@/src/components/layouts/WorkspaceLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}): Promise<Metadata> {
  const { id: projectId, taskId } = await params;

  try {
    const task = await tasksService.findById(projectId, taskId);

    return {
      title: `${task.title} — Solut Tasks`,
      description: `Detalhes e acompanhamento da tarefa "${task.title}" no Solut Tasks.`,
    };
  } catch {
    return {
      title: "Tarefa — Solut Tasks",
      description: "Detalhes e acompanhamento da tarefa no Solut Tasks.",
    };
  }
}

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: projectId, taskId } = await params;

  let task;
  let project;
  let availableTags;
  try {
    task = await tasksService.findById(projectId, taskId);
    project = await projectsService.findById(projectId);
    availableTags = await tagsService.findAll().catch(() => []);
  } catch {
    notFound();
  }

  if (!task) notFound();

  return (
    <WorkspaceLayout>
      <TaskDetail
        task={task}
        project={project}
        availableTags={availableTags}
      />
    </WorkspaceLayout>
  );
}
