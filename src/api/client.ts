import { apiClient as api } from "@/config/api";
import type { components } from "@/types/api";

// Types from OpenAPI
export type Task = components["schemas"]["TaskFullDto"];
export type TaskListItem = components["schemas"]["TaskListItemDto"];
export type TaskRequest = components["schemas"]["TaskRequestDto"];
export type TaskPriority = components["schemas"]["TaskFullDto"]["priority"];
export type TaskStatus = components["schemas"]["TaskFullDto"]["status"];

export type ProjectListItem = components["schemas"]["ProjectListItemDto"];
export type ProjectRequest = components["schemas"]["ProjectRequestDto"];
export type ProjectFull = components["schemas"]["ProjectFullDto"];

export type LoginDto = components["schemas"]["LoginDto"];
export type SignUpDto = components["schemas"]["SignUpDto"];
export type ResetPasswordDto = components["schemas"]["ResetPasswordDto"];
export type ForgotPasswordDto = components["schemas"]["ForgotPasswordDto"];
export type Me = components["schemas"]["UserFullDto"];
export type ChangePasswordDto = components["schemas"]["ChangePasswordDto"];

export type CommentListItem = components["schemas"]["CommentListItemDto"];
export type CommentRequest = components["schemas"]["CommentRequestDto"];

export type MemberListItem = components["schemas"]["MemberListItemDto"];
export type AddMemberDto = components["schemas"]["AddMemberDto"];
export type UpdateMemberRoleDto = components["schemas"]["UpdateMemberRoleDto"];

export type ChatMessageResponseDTO = components["schemas"]["ChatMessageResponseDTO"];

// Shared API response helpers (based on OpenAPI shapes)
export type PaginatedResponse<T> = {
  data?: T[];
  meta?: {
    total?: number;
    lastPage?: number;
    currentPage?: number;
    totalPerPage?: number;
    prevPage?: number | null;
    nextPage?: number | null;
  };
};

// Auth
export const login = (body: LoginDto) =>
  api.post("/v1/auth/signin", body).then((r) => r.data as unknown);

export const signup = (body: SignUpDto) =>
  api.post("/v1/auth/signup", body).then((r) => r.data as unknown);

export const resetPassword = (body: ResetPasswordDto) =>
  api.post("/v1/auth/reset-password", body).then((r) => r.data as unknown);

export const forgotPassword = (body: ForgotPasswordDto) =>
  api.post("/v1/auth/forgot-password", body).then((r) => r.data as unknown);

export const getMe = () => api.get<Me>("/v1/auth/me").then((r) => r.data as unknown as Me);

export const changePassword = (body: ChangePasswordDto) =>
  api.put("/v1/auth/change-password", body).then((r) => r.data as unknown);

export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post<Me>("/v1/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// Projects
export const listProjects = () =>
  api.get<PaginatedResponse<ProjectListItem>>("/v1/projects").then((r) => r.data);

export const createProject = (body: ProjectRequest) =>
  api.post("/v1/projects", body).then((r) => r.data as unknown);

export const getProject = (id: string) =>
  api.get<ProjectFull>(`/v1/projects/${id}`).then((r) => r.data);

export const updateProject = (id: string, body: ProjectRequest) =>
  api.put<ProjectFull>(`/v1/projects/${id}`, body).then((r) => r.data);

export const deleteProject = (id: string) => api.delete(`/v1/projects/${id}`).then((r) => r.data);

// Tasks (scoped by project)
export const listTasksByProject = (
  projectId: string,
  params?: {
    limit?: number;
    page?: number;
  },
) =>
  api
    .get<PaginatedResponse<TaskListItem>>(`/v1/projects/${projectId}/tasks`, {
      params,
    })
    .then((r) => r.data);

export const createTask = (projectId: string, body: TaskRequest) =>
  api.post<TaskListItem>(`/v1/projects/${projectId}/tasks`, body).then((r) => r.data);

export const getTask = (projectId: string, taskId: string) =>
  api.get<Task>(`/v1/projects/${projectId}/tasks/${taskId}`).then((r) => r.data);

export const updateTask = (projectId: string, taskId: string, body: TaskRequest) =>
  api.put<TaskListItem>(`/v1/projects/${projectId}/tasks/${taskId}`, body).then((r) => r.data);

export const deleteTask = (projectId: string, taskId: string) =>
  api.delete<TaskListItem>(`/v1/projects/${projectId}/tasks/${taskId}`).then((r) => r.data);

// Comments (scoped by task)
export const listCommentsByTask = (projectId: string, taskId: string) =>
  api
    .get<PaginatedResponse<CommentListItem>>(`/v1/projects/${projectId}/tasks/${taskId}/comments`)
    .then((r) => r.data);

export const createComment = (projectId: string, taskId: string, body: CommentRequest) =>
  api
    .post<CommentListItem>(`/v1/projects/${projectId}/tasks/${taskId}/comments`, body)
    .then((r) => r.data);

export const updateComment = (
  projectId: string,
  taskId: string,
  commentId: string,
  body: CommentRequest,
) =>
  api
    .put<CommentListItem>(`/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, body)
    .then((r) => r.data);

export const deleteComment = (projectId: string, taskId: string, commentId: string) =>
  api.delete(`/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`).then((r) => r.data);

// Users (for assignee selection)
export const listUsers = () =>
  api
    .get<PaginatedResponse<{ id: string; name: string; email: string; avatar?: string | null }>>(
      "/v1/users?size=200",
    )
    .then((r) => r.data);

// Members (for project member management)
export const listMembers = (projectId: string) =>
  api
    .get<PaginatedResponse<MemberListItem>>(`/v1/projects/${projectId}/collaborators`)
    .then((r) => r.data);

export const addMember = (projectId: string, body: AddMemberDto) =>
  api.post<MemberListItem>(`/v1/projects/${projectId}/collaborators`, body).then((r) => r.data);

export const updateMemberRole = (projectId: string, userId: string, body: UpdateMemberRoleDto) =>
  api
    .put<MemberListItem>(`/v1/projects/${projectId}/collaborators/${userId}`, body)
    .then((r) => r.data);

export const removeMember = (projectId: string, userId: string) =>
  api.delete(`/v1/projects/${projectId}/collaborators/${userId}`).then((r) => r.data);

export const sendChatMessage = (body: { message: string }) =>
  api.post("/v1/chat", body).then((r) => r.data as unknown);

export const getChatMessages = (params?: {
  limit?: number;
  page?: number;
}) =>
  api
    .get<ChatMessageResponseDTO[]>("/v1/chat", {
      params,
    })
    .then((r) => r.data);

export const getChatMessage = (id: string) =>
  api.get<ChatMessageResponseDTO>(`/v1/chat/${id}`).then((r) => r.data);

export { api };
