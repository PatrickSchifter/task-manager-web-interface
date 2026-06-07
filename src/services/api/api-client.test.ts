import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, createApiClient } from "./api-client";
import { ApiError } from "@/src/lib/api/api-error";

const API_URL = "http://api.test";

function mockFetch(response: {
  status: number;
  body?: unknown;
  ok?: boolean;
}) {
  const fetchMock = vi.fn().mockResolvedValue({
    status: response.status,
    ok: response.ok ?? (response.status >= 200 && response.status < 300),
    json: async () => response.body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiClient", () => {
  it("monta a URL com a base e envia Content-Type json", async () => {
    const fetchMock = mockFetch({ status: 200, body: { ok: true } });
    const client = new ApiClient();
    const data = await client.get<{ ok: boolean }>("/v1/ping");

    expect(data).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/v1/ping`);
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("include");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("inclui o header Authorization quando há token", async () => {
    const fetchMock = mockFetch({ status: 200, body: {} });
    const client = createApiClient({ token: "jwt-123" });
    await client.get("/v1/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer jwt-123");
  });

  it("serializa o body em POST", async () => {
    const fetchMock = mockFetch({ status: 201, body: { id: "1" } });
    const client = new ApiClient();
    await client.post("/v1/tasks", { title: "Nova" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ title: "Nova" }));
  });

  it("serializa o body em PUT", async () => {
    const fetchMock = mockFetch({ status: 200, body: {} });
    const client = new ApiClient();
    await client.put("/v1/tasks/1", { title: "Edit" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/v1/tasks/1`);
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(JSON.stringify({ title: "Edit" }));
  });

  it("envia DELETE sem body", async () => {
    const fetchMock = mockFetch({ status: 200, body: {} });
    const client = new ApiClient();
    await client.delete("/v1/tasks/1");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
  });

  it("retorna undefined em 204 sem tocar no corpo", async () => {
    mockFetch({ status: 204 });
    const client = new ApiClient();
    const result = await client.delete("/v1/tasks/1");
    expect(result).toBeUndefined();
  });

  it("lança ApiError com a message do corpo quando !ok", async () => {
    mockFetch({ status: 422, body: { message: "Campo inválido" } });
    const client = new ApiClient();

    await expect(client.get("/v1/x")).rejects.toMatchObject({
      message: "Campo inválido",
      statusCode: 422,
    });
    await expect(client.get("/v1/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("usa mensagem padrão quando o erro não traz message", async () => {
    mockFetch({ status: 500, body: null });
    const client = new ApiClient();
    await expect(client.get("/v1/x")).rejects.toMatchObject({
      message: "Erro inesperado",
      statusCode: 500,
    });
  });

  it("anexa o payload bruto ao ApiError", async () => {
    const body = { message: "Conflito", code: "DUP" };
    mockFetch({ status: 409, body });
    const client = new ApiClient();
    await expect(client.get("/v1/x")).rejects.toMatchObject({ payload: body });
  });

  it("tolera corpo não-JSON (json() lançando) tratando data como null", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => {
        throw new Error("not json");
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new ApiClient();
    const result = await client.get("/v1/x");
    expect(result).toBeNull();
  });

  it("mescla headers customizados passados no init", async () => {
    const fetchMock = mockFetch({ status: 200, body: {} });
    const client = new ApiClient();
    await client.get("/v1/x", { headers: { "X-Custom": "1" } });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["X-Custom"]).toBe("1");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });
});
