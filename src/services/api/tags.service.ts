import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

export type TagDTO = components["schemas"]["TagDTO"];
type CreateTagDTO = components["schemas"]["CreateTagDTO"];

class TagsService {
  /** Catálogo de tags do usuário atual (global, reutilizado entre projetos). */
  async findAll(): Promise<TagDTO[]> {
    const api = await getServerApi();
    return api.get<TagDTO[]>("/v1/tags");
  }

  async create(data: CreateTagDTO): Promise<TagDTO> {
    const api = await getServerApi();
    return api.post<TagDTO>("/v1/tags", data);
  }

  async delete(tagId: string): Promise<void> {
    const api = await getServerApi();
    return api.delete<void>(`/v1/tags/${tagId}`);
  }
}

export const tagsService = new TagsService();
