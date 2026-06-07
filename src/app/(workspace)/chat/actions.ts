"use server";

import { chatService, type WsTicket } from "@/src/services/api/chat.service";
import { ApiError } from "@/src/lib/api/api-error";
import { mapApiError } from "@/src/lib/api/map-api-error";
import type { components } from "@/src/types/api";

type ChatMessageResponseDTO = components["schemas"]["ChatMessageResponseDTO"];

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

/**
 * Emite um ticket de curta duração para autenticar a conexão WebSocket. Lê o
 * cookie HttpOnly server-side e devolve apenas o ticket efêmero ao cliente.
 */
export async function getSocketTicket(): Promise<ActionResult<WsTicket>> {
  try {
    const data = await chatService.getSocketTicket();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: mapApiError(err) };
    }
    return { success: false, message: "Não foi possível conectar ao chat." };
  }
}

/**
 * Enfileira uma nova mensagem do usuário. O backend processa de forma
 * assíncrona (RabbitMQ + RAG); as atualizações de status chegam em tempo real
 * via WebSocket, com {@link pollChatMessage} como fallback.
 */
export async function sendChatMessage(
  message: string,
): Promise<ActionResult<ChatMessageResponseDTO>> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { success: false, message: "Digite uma mensagem." };
  }

  try {
    const data = await chatService.enqueue({ message: trimmed });
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: mapApiError(err) };
    }
    return { success: false, message: "Não foi possível enviar a mensagem." };
  }
}

/**
 * Busca o estado atual de uma mensagem. Usado em polling até o status virar
 * DELIVERED (resposta pronta) ou FAILED.
 */
export async function pollChatMessage(
  messageId: string,
): Promise<ActionResult<ChatMessageResponseDTO>> {
  try {
    const data = await chatService.findById(messageId);
    return { success: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, message: mapApiError(err) };
    }
    return { success: false, message: "Não foi possível atualizar a conversa." };
  }
}
