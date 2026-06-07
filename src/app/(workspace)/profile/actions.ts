"use server";

import { revalidatePath } from "next/cache";
import { getServerApi } from "@/src/services/api/api-server";
import { authServerService } from "@/src/services/api/auth.server.service";
import { getSessionToken } from "@/src/lib/auth/session";
import { ApiError } from "@/src/lib/api/api-error";
import { mapApiError } from "@/src/lib/api/map-api-error";

type ActionResult = { success: true } | { success: false; message: string };

const PROFILE_PATH = "/profile";

/**
 * Atualiza os dados públicos do usuário autenticado.
 * O e-mail não é alterável pelo backend (UpdateUsersDTO aceita apenas name/role/avatar).
 */
export async function updateProfile(payload: {
  name: string;
}): Promise<ActionResult> {
  try {
    const me = await authServerService.getMe();
    const api = await getServerApi();
    await api.put(`/v1/users/${me.id}`, { name: payload.name });
    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: mapApiError(err) };
    }
    return { success: false, message: "Erro ao atualizar perfil." };
  }
}

/**
 * Envia uma nova foto de perfil. O endpoint de avatar espera multipart/form-data,
 * por isso usamos fetch direto (o ApiClient serializa o corpo como JSON).
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Selecione uma imagem válida." };
  }

  try {
    const token = await getSessionToken();
    const body = new FormData();
    body.append("file", file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/users/avatar`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(
        data?.message || "Erro inesperado",
        response.status,
        data,
      );
    }

    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: mapApiError(err) };
    }
    return { success: false, message: "Erro ao enviar foto." };
  }
}
