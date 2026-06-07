import { getServerApi } from "@/src/services/api/api-server";
import type { components } from "@/src/types/api";

type UsersDTO = components["schemas"]["UsersDTO"];
type UpdateUsersDTO = components["schemas"]["UpdateUsersDTO"];
type UserItemListDTO = components["schemas"]["UserItemListDTO"];
type UserFullDTO = components["schemas"]["UserFullDTO"];

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

class UsersService {
  async findAll(): Promise<PaginatedResponse<UserItemListDTO>> {
    const api = await getServerApi();
    return api.get<PaginatedResponse<UserItemListDTO>>("/v1/users");
  }

  async findById(userId: string): Promise<UserFullDTO> {
    const api = await getServerApi();
    return api.get<UserFullDTO>(`/v1/users/${userId}`);
  }

  async create(data: UsersDTO): Promise<UserItemListDTO> {
    const api = await getServerApi();
    return api.post<UserItemListDTO>("/v1/users", data);
  }

  async update(userId: string, data: UpdateUsersDTO): Promise<UserItemListDTO> {
    const api = await getServerApi();
    return api.put<UserItemListDTO>(`/v1/users/${userId}`, data);
  }

  async delete(userId: string): Promise<void> {
    const api = await getServerApi();
    return api.delete<void>(`/v1/users/${userId}`);
  }

  async uploadAvatar(file: File): Promise<UserItemListDTO> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/v1/users/avatar`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(error?.message ?? `HTTP ${response.status}`);
    }

    return response.json() as Promise<UserItemListDTO>;
  }
}

export const usersService = new UsersService();
