"use server";

import { revalidatePath } from "next/cache";
import { routinesService } from "@/src/services/api/routines.service";
import type { RoutineTimeInputDTO } from "@/src/services/api/routines.service";

export interface RoutineState {
  error?: string;
  success?: boolean;
}

// O RoutineDialog envia os horários como JSON ({startTime, endTime}[]) num input hidden.
function parseTimes(formData: FormData): RoutineTimeInputDTO[] {
  const raw = formData.get("times");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const HH_MM = /^\d{2}:\d{2}$/;
    const valid = parsed.filter(
      (t) =>
        t &&
        typeof t.startTime === "string" &&
        typeof t.endTime === "string" &&
        HH_MM.test(t.startTime) &&
        HH_MM.test(t.endTime),
    );
    // deduplica por startTime (mantém primeira ocorrência)
    const seen = new Set<string>();
    return valid.filter((t: RoutineTimeInputDTO) => {
      if (seen.has(t.startTime)) return false;
      seen.add(t.startTime);
      return true;
    });
  } catch {
    return [];
  }
}

// Dias da semana como JSON (number[]) num input hidden. [] = todos os dias.
function parseDays(formData: FormData): number[] {
  const raw = formData.get("days");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(Number)
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  } catch {
    return [];
  }
}

export async function createRoutineAction(
  _prev: RoutineState | null,
  formData: FormData,
): Promise<RoutineState> {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const times = parseTimes(formData);
  const days = parseDays(formData);

  if (!title?.trim()) return { error: "O título é obrigatório." };
  if (times.length === 0)
    return { error: "Adicione pelo menos um horário." };

  try {
    await routinesService.create({
      title: title.trim(),
      description,
      times,
      days,
      active: true,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[createRoutineAction]", err);
    return { error: "Não foi possível criar a rotina. Tente novamente." };
  }
}

export async function updateRoutineAction(
  _prev: RoutineState | null,
  formData: FormData,
): Promise<RoutineState> {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const times = parseTimes(formData);
  const days = parseDays(formData);
  const active = formData.get("active") !== "false";

  if (!title?.trim()) return { error: "O título é obrigatório." };
  if (times.length === 0)
    return { error: "Adicione pelo menos um horário." };

  try {
    await routinesService.update(id, {
      title: title.trim(),
      description,
      times,
      days,
      active,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[updateRoutineAction]", err);
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }
}

export async function deleteRoutineAction(
  _prev: RoutineState | null,
  formData: FormData,
): Promise<RoutineState> {
  const id = formData.get("id") as string;

  try {
    await routinesService.delete(id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[deleteRoutineAction]", err);
    return { error: "Não foi possível remover a rotina. Tente novamente." };
  }
}

export async function toggleCompletionAction(
  routineId: string,
  timeId: string,
  date: string,
): Promise<{ completed?: boolean; error?: string }> {
  try {
    const result = await routinesService.toggleCompletion(routineId, timeId, {
      date,
    });
    revalidatePath("/routines", "page");
    return { completed: result.completed };
  } catch (err) {
    console.error("[toggleCompletionAction]", err);
    return { error: "Não foi possível registrar a conclusão." };
  }
}
