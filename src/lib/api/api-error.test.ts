import { describe, it, expect } from "vitest";
import { ApiError } from "./api-error";

describe("ApiError", () => {
  it("é uma instância de Error", () => {
    const err = new ApiError("falhou", 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });

  it("guarda message e statusCode", () => {
    const err = new ApiError("não autorizado", 401);
    expect(err.message).toBe("não autorizado");
    expect(err.statusCode).toBe(401);
  });

  it("payload é opcional e fica undefined quando omitido", () => {
    const err = new ApiError("erro", 400);
    expect(err.payload).toBeUndefined();
  });

  it("preserva o payload quando fornecido", () => {
    const payload = { message: "campo inválido", fields: ["email"] };
    const err = new ApiError("erro", 422, payload);
    expect(err.payload).toEqual(payload);
  });

  it("pode ser lançado e capturado mantendo o tipo", () => {
    try {
      throw new ApiError("boom", 503);
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).statusCode).toBe(503);
    }
  });
});
