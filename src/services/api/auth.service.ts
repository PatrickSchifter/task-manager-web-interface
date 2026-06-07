/**
 * auth.service.ts — ISOMÓRFICO
 *
 * Apenas rotas públicas. Seguro para importar em qualquer contexto:
 * Client Components, Server Components, Server Actions.
 *
 * NÃO importa next/headers nem api-server.
 */

import { apiClient } from "@/src/services/api/api-client";
import type { components } from "@/src/types/api";

type SignUpDTO = components["schemas"]["SignUpDTO"];
type SignInDTO = components["schemas"]["SignInDTO"];
type ForgotPasswordDTO = components["schemas"]["ForgotPasswordDTO"];
type ResetPasswordDTO = components["schemas"]["ResetPasswordDTO"];
type UserItemListDTO = components["schemas"]["UserItemListDTO"];

class AuthService {
  signUp(data: SignUpDTO): Promise<UserItemListDTO> {
    return apiClient.post<UserItemListDTO>("/v1/auth/signup", data);
  }

  signIn(data: SignInDTO): Promise<{ token: string }> {
    return apiClient.post<{ token: string }>("/v1/auth/signin", data);
  }

  forgotPassword(data: ForgotPasswordDTO): Promise<void> {
    return apiClient.post<void>("/v1/auth/forgot-password", data);
  }

  resetPassword(data: ResetPasswordDTO): Promise<void> {
    return apiClient.post<void>("/v1/auth/reset-password", data);
  }
}

export const authService = new AuthService();
