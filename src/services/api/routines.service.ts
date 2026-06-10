import { getServerApi } from "@/src/services/api/api-server";

// ─── Local DTO types ───────────────────────────────────────────────────────────

export interface RoutineTimeDTO {
  id: string;
  startTime: string;
  endTime: string;
}

export interface RoutineTimeWithCompletionsDTO extends RoutineTimeDTO {
  completedDates: string[];
}

export interface RoutineItemListDTO {
  id: string;
  title: string;
  description?: string | null;
  active: boolean;
  /** 0=Dom, 1=Seg … 6=Sáb. [] = todos os dias. */
  days: number[];
  times: RoutineTimeDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineFullDTO {
  id: string;
  title: string;
  description?: string | null;
  active: boolean;
  days: number[];
  times: RoutineTimeWithCompletionsDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineTimeInputDTO {
  startTime: string;
  endTime: string;
}

export interface RoutinesRequestDTO {
  title: string;
  description?: string;
  times: RoutineTimeInputDTO[];
  active?: boolean;
  /** 0=Dom, 1=Seg … 6=Sáb. [] = todos os dias. */
  days?: number[];
}

export interface ToggleCompletionDTO {
  date: string;
}

export interface ToggleCompletionResponse {
  completed: boolean;
  date: string;
}

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

class RoutinesService {
  async findAll(): Promise<PaginatedResponse<RoutineItemListDTO>> {
    const api = await getServerApi();
    return api.get<PaginatedResponse<RoutineItemListDTO>>("/v1/routines");
  }

  async findById(routineId: string): Promise<RoutineFullDTO> {
    const api = await getServerApi();
    return api.get<RoutineFullDTO>(`/v1/routines/${routineId}`);
  }

  async create(data: RoutinesRequestDTO): Promise<RoutineItemListDTO> {
    const api = await getServerApi();
    return api.post<RoutineItemListDTO>("/v1/routines", data);
  }

  async update(
    routineId: string,
    data: RoutinesRequestDTO,
  ): Promise<RoutineItemListDTO> {
    const api = await getServerApi();
    return api.put<RoutineItemListDTO>(`/v1/routines/${routineId}`, data);
  }

  async delete(routineId: string): Promise<void> {
    const api = await getServerApi();
    return api.delete<void>(`/v1/routines/${routineId}`);
  }

  async toggleCompletion(
    routineId: string,
    timeId: string,
    data: ToggleCompletionDTO,
  ): Promise<ToggleCompletionResponse> {
    const api = await getServerApi();
    return api.post<ToggleCompletionResponse>(
      `/v1/routines/${routineId}/times/${timeId}/toggle-completion`,
      data,
    );
  }
}

export const routinesService = new RoutinesService();
