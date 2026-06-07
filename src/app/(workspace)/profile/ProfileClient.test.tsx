import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/src/test/test-utils";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";

const updateProfile = vi.fn(async () => ({ success: true }) as const);
const uploadAvatar = vi.fn(async (_formData: FormData) => ({ success: true }) as const);
const signOut = vi.fn(async () => undefined);
const refresh = vi.fn();
const push = vi.fn();

vi.mock("@/src/app/(workspace)/profile/actions", () => ({
  updateProfile: (...a: unknown[]) => updateProfile(...(a as [])),
  uploadAvatar: (...a: unknown[]) => uploadAvatar(...(a as [FormData])),
}));

vi.mock("@/src/lib/auth/actions", () => ({
  signOut: (...a: unknown[]) => signOut(...(a as [])),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

import ProfileClient from "./ProfileClient";

const mockUser = {
  id: "u1",
  name: "Maria Silva",
  email: "maria@empresa.com",
  role: "USER",
  avatar: undefined,
} as never;

const mockProjects = [
  { id: "p1", name: "Alpha", membersCount: 1, role: "OWNER" },
  { id: "p2", name: "Beta", membersCount: 3, role: "VIEWER" },
  { id: "p3", name: "Gamma", membersCount: 2, role: "CUSTOM" },
] as never;

function renderProfile(
  { user = mockUser, projects = [] as never } = {} as {
    user?: never;
    projects?: never;
  },
) {
  return render(
    <WorkspaceProvider user={user} projects={projects}>
      <ProfileClient />
    </WorkspaceProvider>,
  );
}

beforeEach(() => {
  updateProfile.mockClear();
  updateProfile.mockResolvedValue({ success: true } as const);
  uploadAvatar.mockClear();
  uploadAvatar.mockResolvedValue({ success: true } as const);
  signOut.mockClear();
  refresh.mockClear();
  push.mockClear();
});

describe("<ProfileClient />", () => {
  it("renderiza o cabeçalho e a aba Perfil por padrão", () => {
    renderProfile();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
    expect(screen.getByText("Informações pessoais")).toBeInTheDocument();
    // Nome aparece no header e no campo
    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    expect(screen.getByText("maria@empresa.com")).toBeInTheDocument();
  });

  it("exibe o rótulo Pro Account para usuário comum e Admin para ADMIN", () => {
    const { unmount } = renderProfile();
    expect(screen.getByText("Pro Account")).toBeInTheDocument();
    unmount();

    renderProfile({
      user: { ...(mockUser as object), role: "ADMIN" } as never,
    });
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("mostra 'Em breve' ao trocar para a aba Segurança", async () => {
    renderProfile();
    await userEvent.click(screen.getByRole("button", { name: "Segurança" }));
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    expect(screen.queryByText("Informações pessoais")).not.toBeInTheDocument();
  });

  it("mostra 'Em breve' nas abas Notificações e Cobrança", async () => {
    renderProfile();
    await userEvent.click(screen.getByRole("button", { name: "Notificações" }));
    expect(screen.getByText("Em breve")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cobrança" }));
    expect(screen.getByText("Em breve")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Perfil" }));
    expect(screen.getByText("Informações pessoais")).toBeInTheDocument();
  });

  it("valida nome vazio e não chama updateProfile", async () => {
    renderProfile();
    const nameInput = screen.getByLabelText("Nome");
    await userEvent.clear(nameInput);
    await userEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    expect(await screen.findByText("Informe seu nome")).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("chama updateProfile com os dados e mostra sucesso", async () => {
    renderProfile();
    const nameInput = screen.getByLabelText("Nome");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Novo Nome");
    await userEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({ name: "Novo Nome" }),
    );
    expect(await screen.findByText("Perfil atualizado com sucesso.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("exibe mensagem de erro quando updateProfile falha", async () => {
    updateProfile.mockResolvedValue({
      success: false,
      message: "Falha ao salvar.",
    } as never);
    renderProfile();
    const nameInput = screen.getByLabelText("Nome");
    await userEvent.type(nameInput, " editado");
    await userEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    expect(await screen.findByText("Falha ao salvar.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("o botão Cancelar restaura o nome original e fica desabilitado quando limpo", async () => {
    renderProfile();
    const submit = screen.getByRole("button", { name: "Salvar alterações" });
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    // Sem alterações, ambos desabilitados
    expect(submit).toBeDisabled();
    expect(cancel).toBeDisabled();

    const nameInput = screen.getByLabelText("Nome");
    await userEvent.type(nameInput, "X");
    expect(submit).toBeEnabled();
    expect(cancel).toBeEnabled();

    await userEvent.click(cancel);
    await waitFor(() => expect(submit).toBeDisabled());
    expect((nameInput as HTMLInputElement).value).toBe("Maria Silva");
  });

  it("faz upload do avatar via input de arquivo", async () => {
    renderProfile();
    const file = new File(["abc"], "a.png", { type: "image/png" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => expect(uploadAvatar).toHaveBeenCalled());
    const fd = uploadAvatar.mock.calls[0][0] as FormData;
    expect(fd.get("file")).toBeInstanceOf(File);
    expect(await screen.findByText("Foto atualizada.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("exibe erro quando uploadAvatar falha", async () => {
    uploadAvatar.mockResolvedValue({
      success: false,
      message: "Imagem inválida.",
    } as never);
    renderProfile();
    const file = new File(["abc"], "a.png", { type: "image/png" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(await screen.findByText("Imagem inválida.")).toBeInTheDocument();
  });

  it("o botão 'Trocar foto' aciona o clique no input de arquivo", async () => {
    renderProfile();
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");
    await userEvent.click(screen.getByRole("button", { name: "Trocar foto" }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("chama signOut ao clicar em Sair", async () => {
    renderProfile();
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(signOut).toHaveBeenCalled();
  });

  it("mostra mensagem quando não há workspaces", () => {
    renderProfile();
    expect(
      screen.getByText("Você ainda não participa de nenhum workspace."),
    ).toBeInTheDocument();
  });

  it("renderiza a lista de workspaces com contagem e papéis", () => {
    renderProfile({ projects: mockProjects });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();

    // singular para 1 membro / plural para >1
    expect(screen.getByText(/1 membro · Owner/)).toBeInTheDocument();
    expect(screen.getByText(/3 membros · Visualizador/)).toBeInTheDocument();
    // role desconhecido cai no fallback (CUSTOM)
    expect(screen.getByText(/2 membros · CUSTOM/)).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: "Gerenciar" });
    expect(links[0]).toHaveAttribute("href", "/projects/p1");
  });

  it("gera as iniciais a partir do nome do usuário", () => {
    renderProfile();
    // Avatar com iniciais MS
    const avatars = screen.getAllByText("MS");
    expect(avatars.length).toBeGreaterThan(0);
  });

  it("lida com usuário sem nome (iniciais vazias)", () => {
    renderProfile({
      user: { ...(mockUser as object), name: "" } as never,
    });
    // Não deve quebrar; campo de nome vazio
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("lida com user.name nulo sem quebrar (fallback de iniciais)", () => {
    renderProfile({
      user: { ...(mockUser as object), name: null } as never,
    });
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("não chama uploadAvatar quando nenhum arquivo é selecionado", () => {
    renderProfile();
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    // dispara onChange sem arquivos → early return
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(uploadAvatar).not.toHaveBeenCalled();
  });
});
