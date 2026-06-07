import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(store),
}));

import {
  setSessionToken,
  getSessionToken,
  clearSessionToken,
} from "./session";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("session cookie helpers", () => {
  it("setSessionToken grava o cookie HttpOnly com as opções esperadas", async () => {
    await setSessionToken("jwt-abc");
    expect(store.set).toHaveBeenCalledTimes(1);
    const [name, value, options] = store.set.mock.calls[0];
    expect(name).toBe("auth_token");
    expect(value).toBe("jwt-abc");
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  });

  it("getSessionToken retorna o valor do cookie", async () => {
    store.get.mockReturnValue({ value: "jwt-xyz" });
    expect(await getSessionToken()).toBe("jwt-xyz");
    expect(store.get).toHaveBeenCalledWith("auth_token");
  });

  it("getSessionToken retorna undefined quando o cookie não existe", async () => {
    store.get.mockReturnValue(undefined);
    expect(await getSessionToken()).toBeUndefined();
  });

  it("clearSessionToken remove o cookie", async () => {
    await clearSessionToken();
    expect(store.delete).toHaveBeenCalledWith("auth_token");
  });
});
