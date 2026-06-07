import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: cookieGet }),
}));

import { getServerApi } from "./api-server";
import { ApiClient } from "./api-client";

beforeEach(() => {
  cookieGet.mockReset();
  vi.unstubAllGlobals();
});

describe("getServerApi", () => {
  it("retorna um ApiClient", async () => {
    cookieGet.mockReturnValue(undefined);
    const api = await getServerApi();
    expect(api).toBeInstanceOf(ApiClient);
  });

  it("injeta o token do cookie no header Authorization", async () => {
    cookieGet.mockReturnValue({ value: "jwt-server" });
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const api = await getServerApi();
    await api.get("/v1/me");

    expect(cookieGet).toHaveBeenCalledWith("auth_token");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer jwt-server");
  });

  it("não envia Authorization quando não há cookie", async () => {
    cookieGet.mockReturnValue(undefined);
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const api = await getServerApi();
    await api.get("/v1/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });
});
