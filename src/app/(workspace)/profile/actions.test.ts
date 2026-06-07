import { describe, it, expect, vi, beforeEach } from "vitest";

const put = vi.fn();
const getMe = vi.fn();
const getSessionToken = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => revalidatePath(...a),
}));
vi.mock("@/src/services/api/api-server", () => ({
  getServerApi: () => Promise.resolve({ put: (...a: unknown[]) => put(...a) }),
}));
vi.mock("@/src/services/api/auth.server.service", () => ({
  authServerService: { getMe: (...a: unknown[]) => getMe(...a) },
}));
vi.mock("@/src/lib/auth/session", () => ({
  getSessionToken: (...a: unknown[]) => getSessionToken(...a),
}));

import { updateProfile, uploadAvatar } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("updateProfile", () => {
  it("atualiza o nome do usuário autenticado", async () => {
    getMe.mockResolvedValue({ id: "u1" });
    put.mockResolvedValue({});
    const res = await updateProfile({ name: "Novo Nome" });
    expect(put).toHaveBeenCalledWith("/v1/users/u1", { name: "Novo Nome" });
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
    expect(res).toEqual({ success: true });
  });

  it("mapeia ApiError", async () => {
    const { ApiError } = await import("@/src/lib/api/api-error");
    getMe.mockRejectedValue(new ApiError("x", 403));
    expect(await updateProfile({ name: "X" })).toEqual({
      success: false,
      message: "Você não tem permissão para realizar esta ação",
    });
  });

  it("mensagem genérica para erro não-ApiError", async () => {
    getMe.mockRejectedValue(new Error("boom"));
    expect(await updateProfile({ name: "X" })).toEqual({
      success: false,
      message: "Erro ao atualizar perfil.",
    });
  });
});

describe("uploadAvatar", () => {
  function fdWith(file: unknown): FormData {
    const f = new FormData();
    if (file !== undefined) f.append("file", file as Blob);
    return f;
  }

  it("rejeita quando não há arquivo válido", async () => {
    expect(await uploadAvatar(fdWith(undefined))).toEqual({
      success: false,
      message: "Selecione uma imagem válida.",
    });
  });

  it("rejeita arquivo vazio (size 0)", async () => {
    const empty = new File([], "vazio.png", { type: "image/png" });
    expect(await uploadAvatar(fdWith(empty))).toEqual({
      success: false,
      message: "Selecione uma imagem válida.",
    });
  });

  it("envia o avatar com o token e revalida no sucesso", async () => {
    getSessionToken.mockResolvedValue("jwt-1");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["abc"], "foto.png", { type: "image/png" });
    const res = await uploadAvatar(fdWith(file));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/v1/users/avatar");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer jwt-1");
    expect(init.body).toBeInstanceOf(FormData);
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
    expect(res).toEqual({ success: true });
  });

  it("não envia Authorization quando não há token", async () => {
    getSessionToken.mockResolvedValue(undefined);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["abc"], "foto.png", { type: "image/png" });
    await uploadAvatar(fdWith(file));
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toBeUndefined();
  });

  it("mapeia erro de resposta !ok via ApiError/mapApiError", async () => {
    getSessionToken.mockResolvedValue("jwt-1");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      json: async () => ({ message: "grande demais" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["abc"], "foto.png", { type: "image/png" });
    const res = await uploadAvatar(fdWith(file));
    // status 413 não está no mapApiError → cai no default usando a message.
    expect(res).toEqual({ success: false, message: "grande demais" });
  });

  it("retorna mensagem genérica quando o fetch lança", async () => {
    getSessionToken.mockResolvedValue("jwt-1");
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["abc"], "foto.png", { type: "image/png" });
    expect(await uploadAvatar(fdWith(file))).toEqual({
      success: false,
      message: "Erro ao enviar foto.",
    });
  });
});
