import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const del = vi.fn();

vi.mock("@/src/services/api/api-server", () => ({
  getServerApi: () => Promise.resolve({ get, post, put, delete: del }),
}));

import { collaboratorsService } from "./collaborators.service";
import { commentsService } from "./comments.service";
import { projectsService } from "./projects.service";
import { tasksService } from "./tasks.service";
import { usersService } from "./users.service";
import { dashboardService } from "./dashboard.service";
import { chatService } from "./chat.service";
import { authServerService } from "./auth.server.service";

beforeEach(() => {
  for (const m of [get, post, put, del]) m.mockReset().mockResolvedValue({});
});

describe("collaboratorsService", () => {
  it("findAllByProject → GET", async () => {
    await collaboratorsService.findAllByProject("p1");
    expect(get).toHaveBeenCalledWith("/v1/projects/p1/collaborators");
  });
  it("create → POST", async () => {
    await collaboratorsService.create("p1", { userId: "u1", role: "MEMBER" } as never);
    expect(post).toHaveBeenCalledWith("/v1/projects/p1/collaborators", {
      userId: "u1",
      role: "MEMBER",
    });
  });
  it("update → PUT", async () => {
    await collaboratorsService.update("p1", "u1", { role: "ADMIN" } as never);
    expect(put).toHaveBeenCalledWith("/v1/projects/p1/collaborators/u1", {
      role: "ADMIN",
    });
  });
  it("delete → DELETE", async () => {
    await collaboratorsService.delete("p1", "u1");
    expect(del).toHaveBeenCalledWith("/v1/projects/p1/collaborators/u1");
  });
});

describe("commentsService", () => {
  it("findAllByTaskId → GET", async () => {
    await commentsService.findAllByTaskId("p1", "t1");
    expect(get).toHaveBeenCalledWith("/v1/projects/p1/tasks/t1/comments");
  });
  it("findById → GET", async () => {
    await commentsService.findById("p1", "t1", "c1");
    expect(get).toHaveBeenCalledWith("/v1/projects/p1/tasks/t1/comments/c1");
  });
  it("create → POST", async () => {
    await commentsService.create("p1", "t1", { content: "oi" } as never);
    expect(post).toHaveBeenCalledWith("/v1/projects/p1/tasks/t1/comments", {
      content: "oi",
    });
  });
  it("update → PUT", async () => {
    await commentsService.update("p1", "t1", "c1", { content: "edit" } as never);
    expect(put).toHaveBeenCalledWith(
      "/v1/projects/p1/tasks/t1/comments/c1",
      { content: "edit" },
    );
  });
  it("delete → DELETE", async () => {
    await commentsService.delete("p1", "t1", "c1");
    expect(del).toHaveBeenCalledWith("/v1/projects/p1/tasks/t1/comments/c1");
  });
});

describe("projectsService", () => {
  it("findAll → GET", async () => {
    await projectsService.findAll();
    expect(get).toHaveBeenCalledWith("/v1/projects");
  });
  it("findById → GET", async () => {
    await projectsService.findById("p1");
    expect(get).toHaveBeenCalledWith("/v1/projects/p1");
  });
  it("create → POST", async () => {
    await projectsService.create({ name: "Novo" } as never);
    expect(post).toHaveBeenCalledWith("/v1/projects", { name: "Novo" });
  });
  it("update → PUT", async () => {
    await projectsService.update("p1", { name: "Edit" } as never);
    expect(put).toHaveBeenCalledWith("/v1/projects/p1", { name: "Edit" });
  });
  it("delete → DELETE", async () => {
    await projectsService.delete("p1");
    expect(del).toHaveBeenCalledWith("/v1/projects/p1");
  });
});

describe("tasksService", () => {
  it("findAllByProjectId → GET", async () => {
    await tasksService.findAllByProjectId("p1");
    expect(get).toHaveBeenCalledWith("/v1/projects/p1/tasks");
  });
  it("findById → GET", async () => {
    await tasksService.findById("p1", "t1");
    expect(get).toHaveBeenCalledWith("/v1/projects/p1/tasks/t1");
  });
  it("create → POST", async () => {
    await tasksService.create("p1", { title: "Nova" } as never);
    expect(post).toHaveBeenCalledWith("/v1/projects/p1/tasks", {
      title: "Nova",
    });
  });
  it("update remove dueDate ausente antes de enviar", async () => {
    await tasksService.update("p1", "t1", { title: "X", dueDate: "" } as never);
    const [, payload] = put.mock.calls[0];
    expect(payload).not.toHaveProperty("dueDate");
  });
  it("update remove dueDate inválido", async () => {
    await tasksService.update("p1", "t1", {
      title: "X",
      dueDate: "not-a-date",
    } as never);
    const [, payload] = put.mock.calls[0];
    expect(payload).not.toHaveProperty("dueDate");
  });
  it("update mantém dueDate válido", async () => {
    await tasksService.update("p1", "t1", {
      title: "X",
      dueDate: "2026-01-01T00:00:00.000Z",
    } as never);
    const [url, payload] = put.mock.calls[0];
    expect(url).toBe("/v1/projects/p1/tasks/t1");
    expect(payload.dueDate).toBe("2026-01-01T00:00:00.000Z");
  });
  it("delete → DELETE", async () => {
    await tasksService.delete("p1", "t1");
    expect(del).toHaveBeenCalledWith("/v1/projects/p1/tasks/t1");
  });
});

describe("usersService", () => {
  it("findAll → GET", async () => {
    await usersService.findAll();
    expect(get).toHaveBeenCalledWith("/v1/users");
  });
  it("findById → GET", async () => {
    await usersService.findById("u1");
    expect(get).toHaveBeenCalledWith("/v1/users/u1");
  });
  it("create → POST", async () => {
    await usersService.create({ name: "Ana" } as never);
    expect(post).toHaveBeenCalledWith("/v1/users", { name: "Ana" });
  });
  it("update → PUT", async () => {
    await usersService.update("u1", { name: "Edit" } as never);
    expect(put).toHaveBeenCalledWith("/v1/users/u1", { name: "Edit" });
  });
  it("delete → DELETE", async () => {
    await usersService.delete("u1");
    expect(del).toHaveBeenCalledWith("/v1/users/u1");
  });
});

describe("usersService.uploadAvatar", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("envia multipart e retorna o usuário no sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "u1", avatar: "url" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["x"], "avatar.png", { type: "image/png" });
    const result = await usersService.uploadAvatar(file);

    expect(result).toEqual({ id: "u1", avatar: "url" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/v1/users/avatar");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("lança erro com a message do corpo quando !ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      statusText: "Payload Too Large",
      json: async () => ({ message: "Arquivo grande demais" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "a.png", { type: "image/png" });
    await expect(usersService.uploadAvatar(file)).rejects.toThrow(
      "Arquivo grande demais",
    );
  });

  it("usa fallback de status quando o corpo de erro não é JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => {
        throw new Error("not json");
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["x"], "a.png", { type: "image/png" });
    await expect(usersService.uploadAvatar(file)).rejects.toThrow(
      "Server Error",
    );
  });
});

describe("dashboardService", () => {
  it("getSummary → GET", async () => {
    await dashboardService.getSummary();
    expect(get).toHaveBeenCalledWith("/v1/dashboard/summary");
  });
});

describe("chatService", () => {
  it("findAll sem limite → GET /v1/chat", async () => {
    get.mockResolvedValue([]);
    await chatService.findAll();
    expect(get).toHaveBeenCalledWith("/v1/chat");
  });
  it("findAll com limite → query string", async () => {
    get.mockResolvedValue([]);
    await chatService.findAll(10);
    expect(get).toHaveBeenCalledWith("/v1/chat?limit=10");
  });
  it("findById → GET", async () => {
    await chatService.findById("m1");
    expect(get).toHaveBeenCalledWith("/v1/chat/m1");
  });
  it("enqueue → POST", async () => {
    await chatService.enqueue({ message: "oi" } as never);
    expect(post).toHaveBeenCalledWith("/v1/chat", { message: "oi" });
  });
});

describe("authServerService", () => {
  it("getMe → GET /v1/auth/me", async () => {
    await authServerService.getMe();
    expect(get).toHaveBeenCalledWith("/v1/auth/me");
  });
});
