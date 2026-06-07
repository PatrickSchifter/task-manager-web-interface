import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

type ChatMessageDTO = components["schemas"]["ChatMessageDTO"];
type ChatMessageResponseDTO = components["schemas"]["ChatMessageResponseDTO"];

export interface WsTicket {
  ticket: string;
  expiresIn: number;
}

class ChatService {
  async findAll(limit?: number): Promise<ChatMessageResponseDTO[]> {
    const query = limit !== undefined ? `?limit=${limit}` : "";
    const api = await getServerApi();
    return api.get<ChatMessageResponseDTO[]>(`/v1/chat${query}`);
  }

  async findById(messageId: string): Promise<ChatMessageResponseDTO> {
    const api = await getServerApi();
    return api.get<ChatMessageResponseDTO>(`/v1/chat/${messageId}`);
  }

  async enqueue(data: ChatMessageDTO): Promise<ChatMessageResponseDTO> {
    const api = await getServerApi();
    return api.post<ChatMessageResponseDTO>("/v1/chat", data);
  }

  /**
   * Emite um ticket de curta duração para o handshake do WebSocket. O JWT de
   * sessão (cookie HttpOnly) é lido server-side e nunca é exposto ao browser.
   */
  async getSocketTicket(): Promise<WsTicket> {
    const api = await getServerApi();
    return api.post<WsTicket>("/v1/chat/ws-ticket", {});
  }
}

export const chatService = new ChatService();
