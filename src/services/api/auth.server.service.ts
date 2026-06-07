/**
 * auth.server.service.ts — SERVER ONLY
 *
 * Rotas autenticadas de auth. Use exclusivamente em:
 * Server Components, Server Actions, Route Handlers.
 *
 * NUNCA importe em Client Components ("use client").
 */

import "server-only";
import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

type UserItemListDTO = components["schemas"]["UserItemListDTO"];
export type UserItemListDTOWithAvatar = UserItemListDTO & {
  avatar?: string;
};

class AuthServerService {
  async getMe(): Promise<UserItemListDTOWithAvatar> {
    const api = await getServerApi();
    return api.get<UserItemListDTOWithAvatar>("/v1/auth/me");
  }
}

export const authServerService = new AuthServerService();
