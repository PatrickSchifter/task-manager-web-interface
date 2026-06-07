"use server";

import { revalidatePath } from "next/cache";
import { commentsService } from "@/src/services/api";
import { getSessionToken } from "@/src/lib/auth/session";

export interface CommentState {
  error?: string;
  success?: boolean;
}

export async function createCommentAction(
  _prev: CommentState | null,
  formData: FormData,
): Promise<CommentState> {
  const projectId = formData.get("projectId") as string;
  const taskId = formData.get("taskId") as string;
  const content = formData.get("content") as string;
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!projectId || !taskId) {
    return { error: "Tarefa inválida." };
  }

  if (!content?.trim()) {
    return { error: "O comentário não pode ficar vazio." };
  }

  try {
    if (files.length > 0) {
      const token = await getSessionToken();
      const body = new FormData();
      body.append("content", content.trim());
      for (const file of files) {
        body.append("files", file);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body,
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        return {
          error:
            data?.message ||
            "Não foi possível enviar o comentário. Tente novamente.",
        };
      }
    } else {
      await commentsService.create(projectId, taskId, {
        content: content.trim(),
      });
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[createCommentAction]", err);
    return { error: "Não foi possível enviar o comentário. Tente novamente." };
  }
}

export async function updateCommentAction(
  _prev: CommentState | null,
  formData: FormData,
): Promise<CommentState> {
  const projectId = formData.get("projectId") as string;
  const taskId = formData.get("taskId") as string;
  const commentId = formData.get("commentId") as string;
  const content = formData.get("content") as string;

  if (!projectId || !taskId || !commentId) {
    return { error: "Comentário inválido." };
  }

  if (!content?.trim()) {
    return { error: "O comentário não pode ficar vazio." };
  }

  try {
    await commentsService.update(projectId, taskId, commentId, {
      content: content.trim(),
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[updateCommentAction]", err);
    return { error: "Não foi possível editar o comentário. Tente novamente." };
  }
}

export async function deleteCommentAction(
  _prev: CommentState | null,
  formData: FormData,
): Promise<CommentState> {
  const projectId = formData.get("projectId") as string;
  const taskId = formData.get("taskId") as string;
  const commentId = formData.get("commentId") as string;

  if (!projectId || !taskId || !commentId) {
    return { error: "Comentário inválido." };
  }

  try {
    await commentsService.delete(projectId, taskId, commentId);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[deleteCommentAction]", err);
    return { error: "Não foi possível excluir o comentário. Tente novamente." };
  }
}

export async function getAttachmentUrlAction(
  attachmentId: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const token = await getSessionToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/attachments/${attachmentId}/url`,
      {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );

    if (!response.ok) {
      return { error: "Não foi possível obter o URL do arquivo." };
    }

    const data = await response.json();
    return { url: data.url };
  } catch {
    return { error: "Erro ao carregar arquivo." };
  }
}
