/**
 * api-server.ts — SERVER ONLY
 *
 * Lê o token do cookie HttpOnly via next/headers e cria um ApiClient
 * autenticado. Use EXCLUSIVAMENTE em:
 *   - Server Components
 *   - Server Actions (exceto as de auth público)
 *   - Route Handlers (app/api/...)
 *
 * NUNCA importe este arquivo em Client Components ("use client").
 * A diretiva `server-only` garante erro de build se isso acontecer.
 */

import "server-only";
import { cookies } from "next/headers";
import { createApiClient, ApiClient } from "@/src/services/api/api-client";

const COOKIE_NAME = "auth_token";

/**
 * Retorna um ApiClient já configurado com o token da sessão atual.
 * Lança erro se chamado fora do contexto de Server Component/Action.
 *
 * @example
 * // Server Component
 * const projects = await getServerApi().get("/v1/projects");
 *
 * // Server Action
 * export async function myAction() {
 *   const api = await getServerApi();
 *   await api.post("/v1/projects", { name: "Novo" });
 * }
 */
export async function getServerApi(): Promise<ApiClient> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return createApiClient({ token });
}
