import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/src/lib/api/api-error";

const enqueue = vi.fn();
const findById = vi.fn();
const getSocketTicket = vi.fn();

vi.mock("@/src/services/api/chat.service", () => ({
  chatService: {
    enqueue: (...a: unknown[]) => enqueue(...a),
    findById: (...a: unknown[]) => findById(...a),
    getSocketTicket: (...a: unknown[]) => getSocketTicket(...a),
  },
}));

import {
  sendChatMessage,
  pollChatMessage,
  getSocketTicket as getSocketTicketAction,
} from "./actions";

beforeEach(() => {
  enqueue.mockReset();
  findById.mockReset();
  getSocketTicket.mockReset();
});

describe("sendChatMessage", () => {
  it("rejeita mensagem vazia", async () => {
    expect(await sendChatMessage("   ")).toEqual({
      success: false,
      message: "Digite uma mensagem.",
    });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("enfileira a mensagem (trim) e retorna os dados", async () => {
    enqueue.mockResolvedValue({ id: "m1", status: "QUEUED" });
    const res = await sendChatMessage("  olá  ");
    expect(enqueue).toHaveBeenCalledWith({ message: "olá" });
    expect(res).toEqual({ success: true, data: { id: "m1", status: "QUEUED" } });
  });

  it("mapeia ApiError", async () => {
    enqueue.mockRejectedValue(new ApiError("x", 429));
    expect(await sendChatMessage("oi")).toEqual({
      success: false,
      message: "Muitas tentativas. Aguarde alguns instantes e tente novamente",
    });
  });

  it("mensagem genérica para erro não-ApiError", async () => {
    enqueue.mockRejectedValue(new Error("boom"));
    expect(await sendChatMessage("oi")).toEqual({
      success: false,
      message: "Não foi possível enviar a mensagem.",
    });
  });
});

describe("pollChatMessage", () => {
  it("retorna os dados da mensagem", async () => {
    findById.mockResolvedValue({ id: "m1", status: "DELIVERED" });
    const res = await pollChatMessage("m1");
    expect(findById).toHaveBeenCalledWith("m1");
    expect(res).toEqual({
      success: true,
      data: { id: "m1", status: "DELIVERED" },
    });
  });

  it("mapeia ApiError", async () => {
    findById.mockRejectedValue(new ApiError("x", 404));
    expect(await pollChatMessage("m1")).toEqual({
      success: false,
      message: "Recurso não encontrado",
    });
  });

  it("mensagem genérica para erro não-ApiError", async () => {
    findById.mockRejectedValue(new Error("boom"));
    expect(await pollChatMessage("m1")).toEqual({
      success: false,
      message: "Não foi possível atualizar a conversa.",
    });
  });
});

describe("getSocketTicket", () => {
  it("retorna o ticket do serviço", async () => {
    getSocketTicket.mockResolvedValue({ ticket: "tkt", expiresIn: 60 });
    const res = await getSocketTicketAction();
    expect(getSocketTicket).toHaveBeenCalled();
    expect(res).toEqual({ success: true, data: { ticket: "tkt", expiresIn: 60 } });
  });

  it("mapeia ApiError", async () => {
    getSocketTicket.mockRejectedValue(new ApiError("x", 401));
    expect(await getSocketTicketAction()).toEqual({
      success: false,
      message: "Sessão expirada. Faça login novamente",
    });
  });

  it("mensagem genérica para erro não-ApiError", async () => {
    getSocketTicket.mockRejectedValue(new Error("boom"));
    expect(await getSocketTicketAction()).toEqual({
      success: false,
      message: "Não foi possível conectar ao chat.",
    });
  });
});
