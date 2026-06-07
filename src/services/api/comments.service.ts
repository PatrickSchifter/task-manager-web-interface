import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

type AddCommentDTO = components["schemas"]["AddCommentDTO"];
type UpdateCommentDTO = components["schemas"]["UpdateCommentDTO"];
type CommentItemListDTO = components["schemas"]["CommentItemListDTO"];
type CommentFullDTO = components["schemas"]["CommentFullDTO"];

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

class CommentsService {
  async findAllByTaskId(
    projectId: string,
    taskId: string,
  ): Promise<PaginatedResponse<CommentItemListDTO>> {
    const api = await getServerApi();
    return api.get<PaginatedResponse<CommentItemListDTO>>(
      `/v1/projects/${projectId}/tasks/${taskId}/comments`,
    );
  }

  async findById(
    projectId: string,
    taskId: string,
    commentId: string,
  ): Promise<CommentFullDTO> {
    const api = await getServerApi();
    return api.get<CommentFullDTO>(
      `/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    );
  }

  async create(
    projectId: string,
    taskId: string,
    data: AddCommentDTO,
  ): Promise<CommentItemListDTO> {
    const api = await getServerApi();
    return api.post<CommentItemListDTO>(
      `/v1/projects/${projectId}/tasks/${taskId}/comments`,
      data,
    );
  }

  async update(
    projectId: string,
    taskId: string,
    commentId: string,
    data: UpdateCommentDTO,
  ): Promise<CommentItemListDTO> {
    const api = await getServerApi();
    return api.put<CommentItemListDTO>(
      `/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
      data,
    );
  }

  async delete(
    projectId: string,
    taskId: string,
    commentId: string,
  ): Promise<void> {
    const api = await getServerApi();
    return api.delete<void>(
      `/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    );
  }
}

export const commentsService = new CommentsService();
