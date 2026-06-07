import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

type AddCollaboratorDTO = components["schemas"]["AddCollaboratorDTO"];
type UpdateCollaboratorDTO = components["schemas"]["UpdateCollaboratorDTO"];
type CollaboratorItemListDTO = components["schemas"]["CollaboratorItemListDTO"];

interface PaginatedResponse<T> {
  data?: T[];
  meta?: {
    total?: number;
    lastPage?: number;
    currentPage?: number;
    totalPerPage?: number;
    prevPage?: number | null;
    nextPage?: number | null;
  };
}

class CollaboratorsService {
  async findAllByProject(
    projectId: string,
  ): Promise<PaginatedResponse<CollaboratorItemListDTO>> {
    const api = await getServerApi();
    return api.get<PaginatedResponse<CollaboratorItemListDTO>>(
      `/v1/projects/${projectId}/collaborators`,
    );
  }

  async create(
    projectId: string,
    data: AddCollaboratorDTO,
  ): Promise<CollaboratorItemListDTO> {
    const api = await getServerApi();
    return api.post<CollaboratorItemListDTO>(
      `/v1/projects/${projectId}/collaborators`,
      data,
    );
  }

  async update(
    projectId: string,
    userId: string,
    data: UpdateCollaboratorDTO,
  ): Promise<CollaboratorItemListDTO> {
    const api = await getServerApi();
    return api.put<CollaboratorItemListDTO>(
      `/v1/projects/${projectId}/collaborators/${userId}`,
      data,
    );
  }

  async delete(projectId: string, userId: string): Promise<void> {
    const api = await getServerApi();
    return api.delete<void>(
      `/v1/projects/${projectId}/collaborators/${userId}`,
    );
  }
}

export const collaboratorsService = new CollaboratorsService();
