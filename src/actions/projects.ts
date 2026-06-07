"use server";

import { revalidatePath } from "next/cache";
import { projectsService } from "@/src/services/api";
import type { components } from "@/src/types/api";
import { redirect } from "next/navigation";

type ProjectDTO = components["schemas"]["ProjectDTO"];

export interface CreateProjectState {
  error?: string;
  success?: boolean;
}

export async function createProjectAction(
  _prev: CreateProjectState | null,
  formData: FormData,
): Promise<CreateProjectState> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const statusesRaw = formData.get("statuses") as string | null;

  if (!name?.trim()) {
    return { error: "O nome do projeto é obrigatório." };
  }

  let statuses: { name: string; value: string }[] | undefined;
  if (statusesRaw) {
    try {
      statuses = JSON.parse(statusesRaw);
    } catch {
      // usa defaults do backend se JSON inválido
    }
  }

  const payload: ProjectDTO = {
    name: name.trim(),
    ...(description?.trim() && { description: description.trim() }),
    ...(statuses?.length && { statuses }),
  };

  try {
    await projectsService.create(payload);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[createProjectAction]", err);
    return { error: "Não foi possível criar o projeto. Tente novamente." };
  }
}

export interface ProjectState {
  error?: string;
  success?: boolean;
}

export async function updateProjectAction(
  _prev: ProjectState | null,
  formData: FormData,
): Promise<ProjectState> {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const statusesRaw = formData.get("statuses") as string | null;

  if (!name?.trim()) return { error: "O nome do projeto é obrigatório." };

  let statuses: { id?: string; name: string; value: string }[] | undefined;
  if (statusesRaw) {
    try {
      statuses = JSON.parse(statusesRaw);
    } catch {
      // usa dados atuais do backend se JSON inválido
    }
  }

  try {
    await projectsService.update(id, {
      name: name.trim(),
      ...(description?.trim() && { description: description.trim() }),
      ...(statuses !== undefined && { statuses }),
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[updateProjectAction]", err);
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }
}

export async function deleteProjectAction(
  _prev: ProjectState | null,
  formData: FormData,
): Promise<ProjectState> {
  const id = formData.get("id") as string;

  try {
    await projectsService.delete(id);
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("[deleteProjectAction]", err);
    return { error: "Não foi possível deletar o projeto. Tente novamente." };
  }
  redirect("/dashboard");
}
