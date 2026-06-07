"use server";

import { revalidatePath } from "next/cache";
import { collaboratorsService } from "@/src/services/api";
import type { components } from "@/src/types/api";

type CollaboratorRole = components["schemas"]["AddCollaboratorDTO"]["role"];

export interface CollaboratorState {
  error?: string;
  success?: boolean;
}

export async function inviteCollaboratorAction(
  _prev: CollaboratorState | null,
  formData: FormData,
): Promise<CollaboratorState> {
  const projectId = formData.get("projectId") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as CollaboratorRole;

  if (!email?.trim()) return { error: "O e-mail é obrigatório." };

  try {
    await collaboratorsService.create(projectId, { email: email.trim(), role });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[inviteCollaboratorAction]", err);
    return {
      error: "Não foi possível convidar o colaborador. Tente novamente.",
    };
  }
}

export async function updateCollaboratorAction(
  _prev: CollaboratorState | null,
  formData: FormData,
): Promise<CollaboratorState> {
  const projectId = formData.get("projectId") as string;
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as CollaboratorRole;

  try {
    await collaboratorsService.update(projectId, userId, { role });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[updateCollaboratorAction]", err);
    return { error: "Não foi possível atualizar o acesso. Tente novamente." };
  }
}

export async function removeCollaboratorAction(
  _prev: CollaboratorState | null,
  formData: FormData,
): Promise<CollaboratorState> {
  const projectId = formData.get("projectId") as string;
  const userId = formData.get("userId") as string;

  try {
    await collaboratorsService.delete(projectId, userId);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[removeCollaboratorAction]", err);
    return {
      error: "Não foi possível remover o colaborador. Tente novamente.",
    };
  }
}
