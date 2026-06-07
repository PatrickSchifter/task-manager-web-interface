import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

type TasksRequestDTO = components["schemas"]["TasksRequestDTO"];
export type TaskItemListDTO = components["schemas"]["TaskItemListDTO"];
type TaskFullDTO = components["schemas"]["TaskFullDTO"];

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

class TasksService {
  async findAllByProjectId(
    projectId: string,
  ): Promise<PaginatedResponse<TaskItemListDTO>> {
    const api = await getServerApi();
    return api.get<PaginatedResponse<TaskItemListDTO>>(
      `/v1/projects/${projectId}/tasks`,
    );
  }

  async findById(projectId: string, taskId: string): Promise<TaskFullDTO> {
    const api = await getServerApi();
    return api.get<TaskFullDTO>(`/v1/projects/${projectId}/tasks/${taskId}`);
  }

  async findSubtasks(
    projectId: string,
    taskId: string,
  ): Promise<TaskItemListDTO[]> {
    const api = await getServerApi();
    return api.get<TaskItemListDTO[]>(
      `/v1/projects/${projectId}/tasks/${taskId}/subtasks`,
    );
  }

  async create(
    projectId: string,
    data: TasksRequestDTO,
  ): Promise<TaskItemListDTO> {
    const api = await getServerApi();
    return api.post<TaskItemListDTO>(`/v1/projects/${projectId}/tasks`, data);
  }

  async update(
    projectId: string,
    taskId: string,
    data: TasksRequestDTO,
  ): Promise<TaskItemListDTO> {
    const api = await getServerApi();

    // remove dueDate vazio/inválido antes de enviar, evitando "Invalid Date" no backend
    const payload: TasksRequestDTO = { ...data };
    if (!payload.dueDate || isNaN(new Date(payload.dueDate).getTime())) {
      delete (payload as Partial<TasksRequestDTO>).dueDate;
    }

    return api.put<TaskItemListDTO>(
      `/v1/projects/${projectId}/tasks/${taskId}`,
      payload,
    );
  }

  async delete(projectId: string, taskId: string): Promise<void> {
    const api = await getServerApi();
    return api.delete<void>(`/v1/projects/${projectId}/tasks/${taskId}`);
  }
}

export const tasksService = new TasksService();
