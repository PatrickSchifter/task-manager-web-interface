"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tasksService } from "@/src/services/api";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskState {
  error?: string;
  success?: boolean;
}

// O TaskDialog envia as tags como um JSON de nomes (string[]) num input hidden.
// Retorna undefined quando ausente/ inválido para não mexer nas tags no update.
function parseTags(formData: FormData): string[] | undefined {
  const raw = formData.get("tags");
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .map((t) => String(t).trim())
      .filter((t, i, arr) => t.length > 0 && arr.indexOf(t) === i);
  } catch {
    return undefined;
  }
}

export async function createTaskAction(
  _prev: TaskState | null,
  formData: FormData,
): Promise<TaskState> {
  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const status = formData.get("status") as TaskStatus;
  const priority = formData.get("priority") as TaskPriority;
  const dueDate = (formData.get("dueDate") as string) || undefined;
  const assigneeId = (formData.get("assigneeId") as string) || undefined;
  // Presente quando a tarefa é criada como subtarefa (a partir da seção de
  // subtarefas na página de detalhe). Ausente para uma tarefa top-level.
  const parentId = (formData.get("parentId") as string) || undefined;
  const tags = parseTags(formData);

  if (!title?.trim()) return { error: "O título é obrigatório." };

  try {
    await tasksService.create(projectId, {
      title: title.trim(),
      description: description || "",
      status,
      priority,
      ...(dueDate && { dueDate }),
      ...(assigneeId && { assigneeId }),
      ...(parentId && { parentId }),
      ...(tags && { tags }),
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[createTaskAction]", err);
    return { error: "Não foi possível criar a tarefa. Tente novamente." };
  }
}

export async function updateTaskAction(
  _prev: TaskState | null,
  formData: FormData,
): Promise<TaskState> {
  const projectId = formData.get("projectId") as string;
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const status = formData.get("status") as TaskStatus;
  const priority = formData.get("priority") as TaskPriority;
  const dueDate = (formData.get("dueDate") as string) || undefined;
  const assigneeId = (formData.get("assigneeId") as string) || undefined;
  const positionRaw = formData.get("position");
  const position =
    positionRaw !== null && positionRaw !== ""
      ? Number(positionRaw)
      : undefined;
  const tags = parseTags(formData);

  if (!title?.trim()) return { error: "O título é obrigatório." };

  try {
    await tasksService.update(projectId, id, {
      title: title.trim(),
      description: description || "",
      status,
      priority,
      ...(dueDate && { dueDate }),
      ...(assigneeId && { assigneeId }),
      ...(position !== undefined && !Number.isNaN(position) && { position }),
      ...(tags && { tags }),
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[updateTaskAction]", err);
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }
}

export async function deleteTaskAction(
  _prev: TaskState | null,
  formData: FormData,
): Promise<TaskState> {
  const projectId = formData.get("projectId") as string;
  const id = formData.get("id") as string;
  const parentId = (formData.get("parentId") as string) || null;

  try {
    await tasksService.delete(projectId, id);
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("[deleteTaskAction]", err);
    return { error: "Não foi possível deletar a tarefa. Tente novamente." };
  }

  if (parentId) {
    redirect(`/projects/${projectId}/tasks/${parentId}`);
  } else {
    redirect(`/projects/${projectId}`);
  }
}
