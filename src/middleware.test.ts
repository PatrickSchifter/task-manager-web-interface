import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";
import { middleware, config } from "./middleware";

/** Cria um objeto mínimo compatível com o que o middleware lê de NextRequest. */
function makeRequest(pathname: string, token?: string): NextRequest {
  const url = `http://localhost${pathname}`;
  return {
    nextUrl: new URL(url),
    url,
    cookies: {
      get: (name: string) =>
        name === "auth_token" && token ? { value: token } : undefined,
    },
  } as unknown as NextRequest;
}

describe("middleware", () => {
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/privacy",
    "/terms",
    "/security",
    "/contact",
  ];

  it.each(publicRoutes)("deixa passar a rota pública %s sem token", (route) => {
    const res = middleware(makeRequest(route));
    // NextResponse.next() não redireciona.
    expect(res.headers.get("location")).toBeNull();
  });

  it.each(["/_next/static/chunk.js", "/favicon.ico", "/api/public/health"])(
    "deixa passar o prefixo público %s",
    (route) => {
      const res = middleware(makeRequest(route));
      expect(res.headers.get("location")).toBeNull();
    },
  );

  it("redireciona rota protegida sem token para o login com callbackUrl", () => {
    const res = middleware(makeRequest("/dashboard"));
    const location = res.headers.get("location");
    expect(location).not.toBeNull();
    const target = new URL(location!);
    expect(target.pathname).toBe("/auth/login");
    expect(target.searchParams.get("callbackUrl")).toBe("/dashboard");
  });

  it("deixa passar rota protegida quando há token", () => {
    const res = middleware(makeRequest("/dashboard", "jwt-token"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("expõe um matcher de configuração", () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
  });
});
