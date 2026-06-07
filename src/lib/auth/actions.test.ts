import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/src/lib/api/api-error";

const redirect = vi.fn();
const setSessionToken = vi.fn();
const clearSessionToken = vi.fn();
const signInSvc = vi.fn();
const signUpSvc = vi.fn();
const forgotPasswordSvc = vi.fn();
const resetPasswordSvc = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...a: unknown[]) => redirect(...a),
}));

vi.mock("@/src/lib/auth/session", () => ({
  setSessionToken: (...a: unknown[]) => setSessionToken(...a),
  clearSessionToken: (...a: unknown[]) => clearSessionToken(...a),
}));

vi.mock("@/src/services/api/auth.service", () => ({
  authService: {
    signIn: (...a: unknown[]) => signInSvc(...a),
    signUp: (...a: unknown[]) => signUpSvc(...a),
    forgotPassword: (...a: unknown[]) => forgotPasswordSvc(...a),
    resetPassword: (...a: unknown[]) => resetPasswordSvc(...a),
  },
}));

import {
  signIn,
  signOut,
  signUp,
  forgotPassword,
  resetPassword,
} from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signIn", () => {
  const creds = { email: "a@b.com", password: "x" };

  it("salva o token e redireciona para /dashboard no sucesso", async () => {
    signInSvc.mockResolvedValue({ token: "jwt" });
    await signIn(creds);
    expect(setSessionToken).toHaveBeenCalledWith("jwt");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it.each([400, 401, 422])(
    "trata %i como credenciais inválidas",
    async (status) => {
      signInSvc.mockRejectedValue(new ApiError("ignorada", status));
      const result = await signIn(creds);
      expect(result).toEqual({
        success: false,
        message: "E-mail ou senha inválidos.",
      });
      expect(setSessionToken).not.toHaveBeenCalled();
    },
  );

  it("usa mapApiError para outros ApiError", async () => {
    signInSvc.mockRejectedValue(new ApiError("x", 500));
    const result = await signIn(creds);
    expect(result).toEqual({
      success: false,
      message: "Erro interno. Tente novamente em instantes",
    });
  });

  it("retorna mensagem genérica para erros não-ApiError", async () => {
    signInSvc.mockRejectedValue(new Error("network"));
    const result = await signIn(creds);
    expect(result).toEqual({
      success: false,
      message: "Erro ao realizar login.",
    });
  });
});

describe("signOut", () => {
  it("limpa o token e redireciona para a raiz", async () => {
    await signOut();
    expect(clearSessionToken).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/");
  });
});

describe("signUp", () => {
  const payload = { name: "Ana", email: "a@b.com", password: "12345678" };

  it("redireciona para /auth/login no sucesso", async () => {
    signUpSvc.mockResolvedValue({ id: "1" });
    await signUp(payload);
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("mapeia ApiError", async () => {
    signUpSvc.mockRejectedValue(new ApiError("x", 409));
    const result = await signUp(payload);
    expect(result).toEqual({
      success: false,
      message: "Este registro já existe ou está em conflito com outro",
    });
  });

  it("retorna mensagem genérica para erros não-ApiError", async () => {
    signUpSvc.mockRejectedValue(new Error("boom"));
    const result = await signUp(payload);
    expect(result).toEqual({ success: false, message: "Erro ao criar conta." });
  });
});

describe("forgotPassword", () => {
  it("retorna sucesso quando o service resolve", async () => {
    forgotPasswordSvc.mockResolvedValue(undefined);
    expect(await forgotPassword({ email: "a@b.com" })).toEqual({
      success: true,
    });
  });

  it("mapeia ApiError", async () => {
    forgotPasswordSvc.mockRejectedValue(new ApiError("x", 404));
    expect(await forgotPassword({ email: "a@b.com" })).toEqual({
      success: false,
      message: "Recurso não encontrado",
    });
  });

  it("retorna mensagem genérica para erros não-ApiError", async () => {
    forgotPasswordSvc.mockRejectedValue(new Error("boom"));
    expect(await forgotPassword({ email: "a@b.com" })).toEqual({
      success: false,
      message: "Erro ao solicitar redefinição de senha.",
    });
  });
});

describe("resetPassword", () => {
  const payload = { token: "t", newPassword: "novasenha" };

  it("retorna sucesso quando o service resolve", async () => {
    resetPasswordSvc.mockResolvedValue(undefined);
    expect(await resetPassword(payload)).toEqual({ success: true });
  });

  it("mapeia ApiError", async () => {
    resetPasswordSvc.mockRejectedValue(new ApiError("x", 400));
    expect(await resetPassword(payload)).toEqual({
      success: false,
      message: "Requisição inválida. Verifique os dados enviados",
    });
  });

  it("retorna mensagem genérica para erros não-ApiError", async () => {
    resetPasswordSvc.mockRejectedValue(new Error("boom"));
    expect(await resetPassword(payload)).toEqual({
      success: false,
      message: "Erro ao redefinir senha.",
    });
  });
});
