"use server";

import { revalidatePath } from "next/cache";
import { tagsService, type TagDTO } from "@/src/services/api";
import type { components } from "@/src/types/api";

type TagColor = NonNullable<components["schemas"]["CreateTagDTO"]["color"]>;

/**
 * Cria (ou reutiliza) uma tag do usuário com a cor escolhida e devolve o
 * registro persistido. Retorna null em caso de erro para o componente seguir
 * sem quebrar.
 */
export async function createTagAction(
  name: string,
  color?: string,
): Promise<TagDTO | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  try {
    const tag = await tagsService.create({
      name: trimmed,
      ...(color ? { color: color as TagColor } : {}),
    });
    revalidatePath("/", "layout");
    return tag;
  } catch (err) {
    console.error("[createTagAction]", err);
    return null;
  }
}
