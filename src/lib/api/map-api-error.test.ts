import { describe, it, expect } from "vitest";
import { ApiError } from "./api-error";
import { mapApiError } from "./map-api-error";

describe("mapApiError", () => {
  const cases: Array<[number, string]> = [
    [400, "Requisição inválida. Verifique os dados enviados"],
    [401, "Sessão expirada. Faça login novamente"],
    [403, "Você não tem permissão para realizar esta ação"],
    [404, "Recurso não encontrado"],
    [409, "Este registro já existe ou está em conflito com outro"],
    [422, "Dados inválidos. Verifique as informações e tente novamente"],
    [429, "Muitas tentativas. Aguarde alguns instantes e tente novamente"],
    [500, "Erro interno. Tente novamente em instantes"],
    [502, "Serviço temporariamente indisponível. Tente novamente em instantes"],
    [503, "Serviço em manutenção. Tente novamente em breve"],
    [504, "O servidor demorou muito para responder. Tente novamente"],
  ];

  it.each(cases)("mapeia o status %i para a mensagem correta", (status, message) => {
    expect(mapApiError(new ApiError("ignorada", status))).toBe(message);
  });

  it("usa a mensagem do erro para status desconhecido", () => {
    expect(mapApiError(new ApiError("erro específico", 418))).toBe(
      "erro específico",
    );
  });

  it("usa o fallback genérico quando o status é desconhecido e não há message", () => {
    expect(mapApiError(new ApiError("", 418))).toBe("Erro inesperado");
  });
});
