import { describe, it, expect, vi, beforeEach } from "vitest";

const post = vi.fn();

vi.mock("@/src/services/api/api-client", () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}));

import { authService } from "./auth.service";

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue(undefined);
});

describe("authService", () => {
  it("signUp chama POST /v1/auth/signup com os dados", async () => {
    const payload = { name: "Ana", email: "a@b.com", password: "12345678" };
    await authService.signUp(payload);
    expect(post).toHaveBeenCalledWith("/v1/auth/signup", payload);
  });

  it("signIn chama POST /v1/auth/signin e retorna o token", async () => {
    post.mockResolvedValue({ token: "abc" });
    const result = await authService.signIn({
      email: "a@b.com",
      password: "x",
    });
    expect(post).toHaveBeenCalledWith("/v1/auth/signin", {
      email: "a@b.com",
      password: "x",
    });
    expect(result).toEqual({ token: "abc" });
  });

  it("forgotPassword chama POST /v1/auth/forgot-password", async () => {
    await authService.forgotPassword({ email: "a@b.com" });
    expect(post).toHaveBeenCalledWith("/v1/auth/forgot-password", {
      email: "a@b.com",
    });
  });

  it("resetPassword chama POST /v1/auth/reset-password", async () => {
    await authService.resetPassword({ token: "t", newPassword: "novasenha" });
    expect(post).toHaveBeenCalledWith("/v1/auth/reset-password", {
      token: "t",
      newPassword: "novasenha",
    });
  });
});
