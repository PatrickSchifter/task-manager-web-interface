/**
 * api-client.ts — ISOMÓRFICO (roda no browser E no servidor)
 *
 * NÃO importa next/headers nem qualquer módulo server-only.
 * O token é sempre passado explicitamente via construtor.
 *
 * - Client Components  → usam `apiClient` (sem token; cookie vai no header automaticamente pelo browser)
 * - Server Components  → usam `apiServer` de `api-server.ts` (injeta token via next/headers)
 * - Server Actions auth → usam `createApiClient({})` (rotas públicas, sem token)
 */

import { ApiError } from "@/src/lib/api/api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type ApiClientOptions = {
  /** Token JWT. Se omitido, nenhum header Authorization é enviado. */
  token?: string;
};

export class ApiClient {
  private token?: string;

  constructor(options?: ApiClientOptions) {
    this.token = options?.token;
  }

  async request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...init,
      credentials: "include",
      headers,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        data?.message || "Erro inesperado",
        response.status,
        data,
      );
    }

    return data as T;
  }

  get<T>(url: string, init?: Omit<RequestInit, "method">) {
    return this.request<T>(url, { ...init, method: "GET" });
  }

  post<T>(
    url: string,
    body?: unknown,
    init?: Omit<RequestInit, "method" | "body">,
  ) {
    return this.request<T>(url, {
      ...init,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put<T>(
    url: string,
    body?: unknown,
    init?: Omit<RequestInit, "method" | "body">,
  ) {
    return this.request<T>(url, {
      ...init,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete<T>(url: string, init?: Omit<RequestInit, "method">) {
    return this.request<T>(url, { ...init, method: "DELETE" });
  }
}

/**
 * Instância sem token — use em Client Components e em Server Actions
 * de rotas públicas (login, signup, forgot-password).
 *
 * Em Client Components o browser envia o cookie automaticamente,
 * mas como auth_token é HttpOnly o JS não o lê — o backend valida
 * via cookie direto (se sua API suportar) ou você usa `apiServer`
 * nos Server Components para chamadas autenticadas.
 */
export const apiClient = new ApiClient();

/**
 * Factory para instâncias com token explícito.
 * Normalmente você não precisa chamar isso diretamente —
 * prefira `apiServer` (server-only) que resolve o token automaticamente.
 *
 * @example
 * const client = createApiClient({ token: myToken });
 */
export function createApiClient(options: ApiClientOptions) {
  return new ApiClient(options);
}
