"use server";

import { redirect } from "next/navigation";
import { authService } from "@/src/services/api/auth.service";
import { setSessionToken, clearSessionToken } from "@/src/lib/auth/session";
import { ApiError } from "@/src/lib/api/api-error";
import { mapApiError } from "@/src/lib/api/map-api-error";

type SignInResult = { success: true } | { success: false; message: string };
type SignUpResult = { success: true } | { success: false; message: string };
type ForgotPasswordResult =
  | { success: true }
  | { success: false; message: string };
type ResetPasswordResult =
  | { success: true }
  | { success: false; message: string };

export async function signIn(payload: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  try {
    const { token } = await authService.signIn(payload);
    await setSessionToken(token);
  } catch (err) {
    if (err instanceof ApiError) {
      // No login, 400/401/422 significam credenciais inválidas — não
      // "sessão expirada" como no mapeamento genérico do mapApiError.
      if ([400, 401, 422].includes(err.statusCode)) {
        return { success: false, message: "E-mail ou senha inválidos." };
      }
      return { success: false, message: mapApiError(err) };
    }
    return { success: false, message: "Erro ao realizar login." };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  await clearSessionToken();
  redirect("/");
}

export async function signUp(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<SignUpResult> {
  try {
    await authService.signUp(payload);
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: mapApiError(err) };
    }
    return { success: false, message: "Erro ao criar conta." };
  }

  redirect("/auth/login");
}

export async function forgotPassword(payload: {
  email: string;
}): Promise<ForgotPasswordResult> {
  try {
    await authService.forgotPassword(payload);
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: mapApiError(err) };
    }
    return {
      success: false,
      message: "Erro ao solicitar redefinição de senha.",
    };
  }
}

export async function resetPassword(payload: {
  token: string;
  newPassword: string;
}): Promise<ResetPasswordResult> {
  try {
    await authService.resetPassword(payload);
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: mapApiError(err) };
    }
    return { success: false, message: "Erro ao redefinir senha." };
  }
}
