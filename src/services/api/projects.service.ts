import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

type ProjectDTO = components["schemas"]["ProjectDTO"];
export type ProjectItemListDTO = components["schemas"]["ProjectItemListDTO"];
type ProjectFullDTO = components["schemas"]["ProjectFullDTO"];
export type ProjectTaskDTO = components["schemas"]["ProjectTaskDTO"];
export type ProjectCollaboratorDTO =
  components["schemas"]["CollaboratorItemListDTO"];

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

class ProjectsService {
  async findAll(): Promise<PaginatedResponse<ProjectItemListDTO>> {
    const api = await getServerApi();
    return api.get<PaginatedResponse<ProjectItemListDTO>>("/v1/projects");
  }

  async findById(projectId: string): Promise<ProjectFullDTO> {
    const api = await getServerApi();
    return api.get<ProjectFullDTO>(`/v1/projects/${projectId}`);
  }

  async create(data: ProjectDTO): Promise<ProjectItemListDTO> {
    const api = await getServerApi();
    return api.post<ProjectItemListDTO>("/v1/projects", data);
  }

  async update(
    projectId: string,
    data: ProjectDTO,
  ): Promise<ProjectItemListDTO> {
    const api = await getServerApi();
    return api.put<ProjectItemListDTO>(`/v1/projects/${projectId}`, data);
  }

  async delete(projectId: string): Promise<void> {
    const api = await getServerApi();
    return api.delete<void>(`/v1/projects/${projectId}`);
  }
}

export const projectsService = new ProjectsService();
