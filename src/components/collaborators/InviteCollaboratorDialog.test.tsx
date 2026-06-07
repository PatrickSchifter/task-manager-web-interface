import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  render,
  screen,
  within,
  waitForElementToBeRemoved,
} from "@/src/test/test-utils";

import {
  inviteCollaboratorAction,
  updateCollaboratorAction,
  removeCollaboratorAction,
} from "@/src/actions/collaborators";

vi.mock("@/src/actions/collaborators", () => ({
  inviteCollaboratorAction: vi.fn(async () => null),
  updateCollaboratorAction: vi.fn(async () => null),
  removeCollaboratorAction: vi.fn(async () => null),
}));

const inviteMock = vi.mocked(inviteCollaboratorAction);
const updateMock = vi.mocked(updateCollaboratorAction);
const removeMock = vi.mocked(removeCollaboratorAction);

beforeEach(() => {
  inviteMock.mockReset().mockResolvedValue(null as never);
  updateMock.mockReset().mockResolvedValue(null as never);
  removeMock.mockReset().mockResolvedValue(null as never);
});

import { InviteCollaboratorDialog } from "./InviteCollaboratorDialog";

const collaborators = [
  { userId: "u1", role: "OWNER", user: { id: "u1", name: "Dona Ana", email: "ana@b.com" } },
  { userId: "u2", role: "EDITOR", user: { id: "u2", name: "Editor Bob", email: "bob@b.com" } },
] as never[];

describe("<InviteCollaboratorDialog />", () => {
  it("abre pelo botão padrão 'Convidar'", async () => {
    render(<InviteCollaboratorDialog projectId="p1" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Convidar colaboradores")).toBeInTheDocument();
  });

  it("lista os membros com a contagem", async () => {
    render(
      <InviteCollaboratorDialog projectId="p1" collaborators={collaborators} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Membros · 2")).toBeInTheDocument();
    expect(within(dialog).getByText("Dona Ana")).toBeInTheDocument();
    expect(within(dialog).getByText("Editor Bob")).toBeInTheDocument();
  });

  it("mostra a descrição do papel selecionado (EDITOR por padrão)", async () => {
    render(<InviteCollaboratorDialog projectId="p1" />);
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    await screen.findByRole("dialog");
    expect(
      screen.getByText("Pode criar e editar tarefas"),
    ).toBeInTheDocument();
  });

  it("o owner aparece como apresentação, sem botão de remover", async () => {
    render(
      <InviteCollaboratorDialog
        projectId="p1"
        collaborators={[collaborators[0]]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    await screen.findByRole("dialog");
    // O label "Owner" é renderizado como texto e o seletor de role não aparece para ele.
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("abre por um trigger customizado", async () => {
    render(
      <InviteCollaboratorDialog
        projectId="p1"
        trigger={<button type="button">Gerir acesso</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Gerir acesso" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("pede confirmação antes de remover um colaborador", async () => {
    render(
      <InviteCollaboratorDialog projectId="p1" collaborators={collaborators} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    await screen.findByRole("dialog");

    // O botão de remover (ícone) abre a confirmação.
    const deleteButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector('svg[data-testid="DeleteOutlinedIcon"]'));
    await userEvent.click(deleteButtons[0]);

    expect(
      await screen.findByText("Remover colaborador"),
    ).toBeInTheDocument();
  });

  it("submete o formulário de convite e chama a action com email e role", async () => {
    render(<InviteCollaboratorDialog projectId="p1" />);
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    const dialog = await screen.findByRole("dialog");

    await userEvent.type(
      within(dialog).getByLabelText(/E-mail/),
      "novo@empresa.com",
    );
    // O botão "Convidar" dentro do dialog é o submit do formulário.
    const submitButton = within(dialog)
      .getAllByRole("button", { name: "Convidar" })
      .at(-1)!;
    await userEvent.click(submitButton);

    expect(inviteMock).toHaveBeenCalledTimes(1);
    const fd = inviteMock.mock.calls[0][1] as FormData;
    expect(fd.get("email")).toBe("novo@empresa.com");
    expect(fd.get("projectId")).toBe("p1");
    expect(fd.get("role")).toBe("EDITOR");
  });

  it("exibe o alerta de erro quando o convite falha", async () => {
    inviteMock.mockResolvedValue({ error: "Convite inválido" } as never);
    render(<InviteCollaboratorDialog projectId="p1" />);
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    const dialog = await screen.findByRole("dialog");

    await userEvent.type(
      within(dialog).getByLabelText(/E-mail/),
      "ruim@empresa.com",
    );
    const submitButton = within(dialog)
      .getAllByRole("button", { name: "Convidar" })
      .at(-1)!;
    await userEvent.click(submitButton);

    expect(await within(dialog).findByText("Convite inválido")).toBeInTheDocument();
  });

  it("altera o papel selecionado no formulário de convite e atualiza a descrição", async () => {
    render(<InviteCollaboratorDialog projectId="p1" />);
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    const dialog = await screen.findByRole("dialog");

    // Combobox "Acesso" do formulário de convite.
    const accessSelect = within(dialog).getByRole("combobox", { name: /Acesso/ });
    await userEvent.click(accessSelect);
    const listbox = await screen.findByRole("listbox");
    await userEvent.click(within(listbox).getByText("Viewer"));

    expect(
      await within(dialog).findByText("Pode visualizar projetos e tarefas"),
    ).toBeInTheDocument();
  });

  it("troca o papel de um colaborador e chama updateCollaboratorAction", async () => {
    render(
      <InviteCollaboratorDialog projectId="p1" collaborators={collaborators} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    await screen.findByRole("dialog");

    // Localiza a linha do colaborador "Editor Bob" e abre seu seletor de role.
    const bobRow = screen.getByText("Editor Bob").closest("div")!.parentElement!
      .parentElement!;
    const select = within(bobRow).getByRole("combobox");
    await userEvent.click(select);
    const listbox = await screen.findByRole("listbox");
    await userEvent.click(within(listbox).getByText("Viewer"));

    expect(updateMock).toHaveBeenCalledTimes(1);
    const fd = updateMock.mock.calls[0][1] as FormData;
    expect(fd.get("projectId")).toBe("p1");
    expect(fd.get("userId")).toBe("u2");
    expect(fd.get("role")).toBe("VIEWER");
  });

  it("confirma a remoção e dispara removeCollaboratorAction", async () => {
    render(
      <InviteCollaboratorDialog projectId="p1" collaborators={collaborators} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    await screen.findByRole("dialog");

    const deleteButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector('svg[data-testid="DeleteOutlinedIcon"]'));
    await userEvent.click(deleteButtons[0]);

    await screen.findByText("Remover colaborador");
    await userEvent.click(screen.getByRole("button", { name: /^Remover$/ }));

    expect(removeMock).toHaveBeenCalledTimes(1);
    const fd = removeMock.mock.calls[0][1] as FormData;
    expect(fd.get("projectId")).toBe("p1");
    expect(fd.get("userId")).toBe("u2");
  });

  it("cancela a remoção sem chamar a action", async () => {
    render(
      <InviteCollaboratorDialog projectId="p1" collaborators={collaborators} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    await screen.findByRole("dialog");

    const deleteButtons = screen
      .getAllByRole("button")
      .filter((b) => b.querySelector('svg[data-testid="DeleteOutlinedIcon"]'));
    await userEvent.click(deleteButtons[0]);

    await screen.findByText("Remover colaborador");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(removeMock).not.toHaveBeenCalled();
  });

  it("reseta o papel para EDITOR após um convite bem-sucedido", async () => {
    inviteMock.mockResolvedValue({ success: true } as never);
    render(<InviteCollaboratorDialog projectId="p1" />);
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    const dialog = await screen.findByRole("dialog");

    // Troca para VIEWER antes de enviar.
    const accessSelect = within(dialog).getByRole("combobox", { name: /Acesso/ });
    await userEvent.click(accessSelect);
    const listbox = await screen.findByRole("listbox");
    await userEvent.click(within(listbox).getByText("Viewer"));

    await userEvent.type(
      within(dialog).getByLabelText(/E-mail/),
      "ok@empresa.com",
    );
    const submitButton = within(dialog)
      .getAllByRole("button", { name: "Convidar" })
      .at(-1)!;
    await userEvent.click(submitButton);

    // Após sucesso, a descrição volta a ser a do EDITOR (papel resetado).
    expect(
      await within(dialog).findByText("Pode criar e editar tarefas"),
    ).toBeInTheDocument();
  });

  it("fecha o dialog ao clicar em 'Fechar'", async () => {
    render(<InviteCollaboratorDialog projectId="p1" />);
    await userEvent.click(screen.getByRole("button", { name: "Convidar" }));
    const dialog = await screen.findByRole("dialog");

    await userEvent.click(within(dialog).getByRole("button", { name: "Fechar" }));
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
