import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  projectsService,
  tasksService,
  commentsService,
  collaboratorsService,
  tagsService,
  redirect,
  revalidatePath,
} = vi.hoisted(() => ({
  projectsService: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  tasksService: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  commentsService: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  collaboratorsService: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  tagsService: { create: vi.fn() },
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/src/services/api", () => ({
  projectsService,
  tasksService,
  commentsService,
  collaboratorsService,
  tagsService,
}));

import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "./projects";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "./tasks";
import {
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "./comments";
import {
  inviteCollaboratorAction,
  updateCollaboratorAction,
  removeCollaboratorAction,
} from "./collaborators";
import { createTagAction } from "./tags";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const s of [
    projectsService,
    tasksService,
    commentsService,
    collaboratorsService,
    tagsService,
  ]) {
    for (const fn of Object.values(s)) (fn as ReturnType<typeof vi.fn>).mockResolvedValue({});
  }
});

// ─── projects ─────────────────────────────────────────────────────────────────

describe("createProjectAction", () => {
  it("exige o nome", async () => {
    expect(await createProjectAction(null, fd({ name: "  " }))).toEqual({
      error: "O nome do projeto é obrigatório.",
    });
    expect(projectsService.create).not.toHaveBeenCalled();
  });

  it("cria com nome (trim) e descrição opcional", async () => {
    const res = await createProjectAction(
      null,
      fd({ name: "  Proj  ", description: " desc " }),
    );
    expect(projectsService.create).toHaveBeenCalledWith({
      name: "Proj",
      description: "desc",
    });
    expect(revalidatePath).toHaveBeenCalled();
    expect(res).toEqual({ success: true });
  });

  it("omite descrição vazia", async () => {
    await createProjectAction(null, fd({ name: "Proj", description: "   " }));
    expect(projectsService.create).toHaveBeenCalledWith({ name: "Proj" });
  });

  it("retorna erro quando o service falha", async () => {
    projectsService.create.mockRejectedValue(new Error("x"));
    const res = await createProjectAction(null, fd({ name: "Proj" }));
    expect(res).toEqual({
      error: "Não foi possível criar o projeto. Tente novamente.",
    });
  });
});

describe("updateProjectAction", () => {
  it("exige o nome", async () => {
    expect(
      await updateProjectAction(null, fd({ id: "p1", name: "" })),
    ).toEqual({ error: "O nome do projeto é obrigatório." });
  });

  it("atualiza e revalida", async () => {
    const res = await updateProjectAction(
      null,
      fd({ id: "p1", name: "Novo" }),
    );
    expect(projectsService.update).toHaveBeenCalledWith("p1", { name: "Novo" });
    expect(res).toEqual({ success: true });
  });

  it("retorna erro no catch", async () => {
    projectsService.update.mockRejectedValue(new Error("x"));
    expect(
      await updateProjectAction(null, fd({ id: "p1", name: "Novo" })),
    ).toEqual({ error: "Não foi possível salvar as alterações. Tente novamente." });
  });
});

describe("deleteProjectAction", () => {
  it("deleta e redireciona para o dashboard", async () => {
    await deleteProjectAction(null, fd({ id: "p1" }));
    expect(projectsService.delete).toHaveBeenCalledWith("p1");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("retorna erro e não redireciona quando falha", async () => {
    projectsService.delete.mockRejectedValue(new Error("x"));
    const res = await deleteProjectAction(null, fd({ id: "p1" }));
    expect(res).toEqual({
      error: "Não foi possível deletar o projeto. Tente novamente.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

// ─── tasks ────────────────────────────────────────────────────────────────────

describe("createTaskAction", () => {
  it("exige o título", async () => {
    expect(
      await createTaskAction(null, fd({ projectId: "p1", title: " " })),
    ).toEqual({ error: "O título é obrigatório." });
  });

  it("cria a tarefa com os campos básicos", async () => {
    const res = await createTaskAction(
      null,
      fd({
        projectId: "p1",
        title: " Tarefa ",
        status: "TODO",
        priority: "HIGH",
        dueDate: "",
      }),
    );
    expect(tasksService.create).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ title: "Tarefa", status: "TODO", priority: "HIGH" }),
    );
    expect(res).toEqual({ success: true });
  });

  it("parseia e desduplica tags do JSON", async () => {
    await createTaskAction(
      null,
      fd({
        projectId: "p1",
        title: "T",
        tags: JSON.stringify(["a", "a", " b ", ""]),
      }),
    );
    const [, payload] = tasksService.create.mock.calls[0];
    expect(payload.tags).toEqual(["a", "b"]);
  });

  it("ignora tags inválidas (não-JSON)", async () => {
    await createTaskAction(
      null,
      fd({ projectId: "p1", title: "T", tags: "{not json" }),
    );
    const [, payload] = tasksService.create.mock.calls[0];
    expect(payload).not.toHaveProperty("tags");
  });

  it("ignora tags que não são array", async () => {
    await createTaskAction(
      null,
      fd({ projectId: "p1", title: "T", tags: JSON.stringify({ a: 1 }) }),
    );
    const [, payload] = tasksService.create.mock.calls[0];
    expect(payload).not.toHaveProperty("tags");
  });

  it("inclui assigneeId quando presente", async () => {
    await createTaskAction(
      null,
      fd({ projectId: "p1", title: "T", assigneeId: "u1" }),
    );
    const [, payload] = tasksService.create.mock.calls[0];
    expect(payload.assigneeId).toBe("u1");
  });

  it("inclui parentId quando criada como subtarefa", async () => {
    await createTaskAction(
      null,
      fd({ projectId: "p1", title: "Sub", parentId: "parent-1" }),
    );
    const [, payload] = tasksService.create.mock.calls[0];
    expect(payload.parentId).toBe("parent-1");
  });

  it("omite parentId para tarefa top-level", async () => {
    await createTaskAction(null, fd({ projectId: "p1", title: "T" }));
    const [, payload] = tasksService.create.mock.calls[0];
    expect(payload).not.toHaveProperty("parentId");
  });

  it("retorna erro no catch", async () => {
    tasksService.create.mockRejectedValue(new Error("x"));
    expect(
      await createTaskAction(null, fd({ projectId: "p1", title: "T" })),
    ).toEqual({ error: "Não foi possível criar a tarefa. Tente novamente." });
  });
});

describe("updateTaskAction", () => {
  it("exige o título", async () => {
    expect(
      await updateTaskAction(null, fd({ projectId: "p1", id: "t1", title: "" })),
    ).toEqual({ error: "O título é obrigatório." });
  });

  it("inclui position numérico quando informado", async () => {
    await updateTaskAction(
      null,
      fd({ projectId: "p1", id: "t1", title: "T", position: "3" }),
    );
    const [, , payload] = tasksService.update.mock.calls[0];
    expect(payload.position).toBe(3);
  });

  it("omite position quando vazio", async () => {
    await updateTaskAction(
      null,
      fd({ projectId: "p1", id: "t1", title: "T", position: "" }),
    );
    const [, , payload] = tasksService.update.mock.calls[0];
    expect(payload).not.toHaveProperty("position");
  });

  it("retorna erro no catch", async () => {
    tasksService.update.mockRejectedValue(new Error("x"));
    expect(
      await updateTaskAction(null, fd({ projectId: "p1", id: "t1", title: "T" })),
    ).toEqual({ error: "Não foi possível salvar as alterações. Tente novamente." });
  });
});

describe("deleteTaskAction", () => {
  it("deleta com sucesso", async () => {
    const res = await deleteTaskAction(null, fd({ projectId: "p1", id: "t1" }));
    expect(tasksService.delete).toHaveBeenCalledWith("p1", "t1");
    expect(res).toEqual({ success: true });
  });

  it("retorna erro no catch", async () => {
    tasksService.delete.mockRejectedValue(new Error("x"));
    expect(
      await deleteTaskAction(null, fd({ projectId: "p1", id: "t1" })),
    ).toEqual({ error: "Não foi possível deletar a tarefa. Tente novamente." });
  });
});

// ─── comments ─────────────────────────────────────────────────────────────────

describe("createCommentAction", () => {
  it("valida tarefa inválida", async () => {
    expect(await createCommentAction(null, fd({ content: "oi" }))).toEqual({
      error: "Tarefa inválida.",
    });
  });

  it("valida comentário vazio", async () => {
    expect(
      await createCommentAction(
        null,
        fd({ projectId: "p1", taskId: "t1", content: "  " }),
      ),
    ).toEqual({ error: "O comentário não pode ficar vazio." });
  });

  it("cria o comentário (trim)", async () => {
    const res = await createCommentAction(
      null,
      fd({ projectId: "p1", taskId: "t1", content: " olá " }),
    );
    expect(commentsService.create).toHaveBeenCalledWith("p1", "t1", {
      content: "olá",
    });
    expect(res).toEqual({ success: true });
  });

  it("retorna erro no catch", async () => {
    commentsService.create.mockRejectedValue(new Error("x"));
    expect(
      await createCommentAction(
        null,
        fd({ projectId: "p1", taskId: "t1", content: "oi" }),
      ),
    ).toEqual({ error: "Não foi possível enviar o comentário. Tente novamente." });
  });
});

describe("updateCommentAction", () => {
  it("valida comentário inválido (faltam ids)", async () => {
    expect(
      await updateCommentAction(null, fd({ projectId: "p1", content: "oi" })),
    ).toEqual({ error: "Comentário inválido." });
  });

  it("valida conteúdo vazio", async () => {
    expect(
      await updateCommentAction(
        null,
        fd({ projectId: "p1", taskId: "t1", commentId: "c1", content: " " }),
      ),
    ).toEqual({ error: "O comentário não pode ficar vazio." });
  });

  it("atualiza com sucesso", async () => {
    const res = await updateCommentAction(
      null,
      fd({ projectId: "p1", taskId: "t1", commentId: "c1", content: "novo" }),
    );
    expect(commentsService.update).toHaveBeenCalledWith("p1", "t1", "c1", {
      content: "novo",
    });
    expect(res).toEqual({ success: true });
  });
});

describe("deleteCommentAction", () => {
  it("valida ids ausentes", async () => {
    expect(await deleteCommentAction(null, fd({ projectId: "p1" }))).toEqual({
      error: "Comentário inválido.",
    });
  });

  it("deleta com sucesso", async () => {
    const res = await deleteCommentAction(
      null,
      fd({ projectId: "p1", taskId: "t1", commentId: "c1" }),
    );
    expect(commentsService.delete).toHaveBeenCalledWith("p1", "t1", "c1");
    expect(res).toEqual({ success: true });
  });

  it("retorna erro no catch", async () => {
    commentsService.delete.mockRejectedValue(new Error("x"));
    expect(
      await deleteCommentAction(
        null,
        fd({ projectId: "p1", taskId: "t1", commentId: "c1" }),
      ),
    ).toEqual({ error: "Não foi possível excluir o comentário. Tente novamente." });
  });
});

// ─── collaborators ────────────────────────────────────────────────────────────

describe("inviteCollaboratorAction", () => {
  it("exige e-mail", async () => {
    expect(
      await inviteCollaboratorAction(null, fd({ projectId: "p1", email: " " })),
    ).toEqual({ error: "O e-mail é obrigatório." });
  });

  it("convida com sucesso (trim do e-mail)", async () => {
    const res = await inviteCollaboratorAction(
      null,
      fd({ projectId: "p1", email: " a@b.com ", role: "EDITOR" }),
    );
    expect(collaboratorsService.create).toHaveBeenCalledWith("p1", {
      email: "a@b.com",
      role: "EDITOR",
    });
    expect(res).toEqual({ success: true });
  });

  it("retorna erro no catch", async () => {
    collaboratorsService.create.mockRejectedValue(new Error("x"));
    expect(
      await inviteCollaboratorAction(
        null,
        fd({ projectId: "p1", email: "a@b.com", role: "VIEWER" }),
      ),
    ).toEqual({ error: "Não foi possível convidar o colaborador. Tente novamente." });
  });
});

describe("updateCollaboratorAction", () => {
  it("atualiza o papel", async () => {
    const res = await updateCollaboratorAction(
      null,
      fd({ projectId: "p1", userId: "u1", role: "EDITOR" }),
    );
    expect(collaboratorsService.update).toHaveBeenCalledWith("p1", "u1", {
      role: "EDITOR",
    });
    expect(res).toEqual({ success: true });
  });

  it("retorna erro no catch", async () => {
    collaboratorsService.update.mockRejectedValue(new Error("x"));
    expect(
      await updateCollaboratorAction(
        null,
        fd({ projectId: "p1", userId: "u1", role: "EDITOR" }),
      ),
    ).toEqual({ error: "Não foi possível atualizar o acesso. Tente novamente." });
  });
});

describe("removeCollaboratorAction", () => {
  it("remove com sucesso", async () => {
    const res = await removeCollaboratorAction(
      null,
      fd({ projectId: "p1", userId: "u1" }),
    );
    expect(collaboratorsService.delete).toHaveBeenCalledWith("p1", "u1");
    expect(res).toEqual({ success: true });
  });

  it("retorna erro no catch", async () => {
    collaboratorsService.delete.mockRejectedValue(new Error("x"));
    expect(
      await removeCollaboratorAction(
        null,
        fd({ projectId: "p1", userId: "u1" }),
      ),
    ).toEqual({ error: "Não foi possível remover o colaborador. Tente novamente." });
  });
});

// ─── tags ─────────────────────────────────────────────────────────────────────

describe("createTagAction", () => {
  it("retorna null para nome vazio", async () => {
    expect(await createTagAction("   ")).toBeNull();
    expect(tagsService.create).not.toHaveBeenCalled();
  });

  it("cria com cor quando fornecida", async () => {
    tagsService.create.mockResolvedValue({ id: "1", name: "nova", color: "amber" });
    const tag = await createTagAction(" nova ", "amber");
    expect(tagsService.create).toHaveBeenCalledWith({
      name: "nova",
      color: "amber",
    });
    expect(tag).toEqual({ id: "1", name: "nova", color: "amber" });
  });

  it("cria sem cor quando omitida", async () => {
    tagsService.create.mockResolvedValue({ id: "1", name: "nova" });
    await createTagAction("nova");
    expect(tagsService.create).toHaveBeenCalledWith({ name: "nova" });
  });

  it("retorna null quando o service falha", async () => {
    tagsService.create.mockRejectedValue(new Error("x"));
    expect(await createTagAction("nova")).toBeNull();
  });
});
