import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  render,
  screen,
  within,
  waitForElementToBeRemoved,
} from "@/src/test/test-utils";

import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "@/src/actions/projects";

vi.mock("@/src/actions/projects", () => ({
  createProjectAction: vi.fn(async () => null),
  updateProjectAction: vi.fn(async () => null),
  deleteProjectAction: vi.fn(async () => null),
}));

const createMock = vi.mocked(createProjectAction);
const updateMock = vi.mocked(updateProjectAction);
const deleteMock = vi.mocked(deleteProjectAction);

beforeEach(() => {
  createMock.mockReset().mockResolvedValue(null as never);
  updateMock.mockReset().mockResolvedValue(null as never);
  deleteMock.mockReset().mockResolvedValue(null as never);
});

import { ProjectDialog } from "./ProjectDialog";

describe("<ProjectDialog /> (criação)", () => {
  it("começa fechado e abre pelo botão de gatilho padrão", async () => {
    render(<ProjectDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Novo projeto")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do projeto/)).toBeInTheDocument();
  });

  it("abre por um trigger customizado", async () => {
    render(<ProjectDialog trigger={<button type="button">Abrir</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("não mostra a zona de perigo no modo criação", async () => {
    render(<ProjectDialog />);
    await userEvent.click(screen.getByRole("button"));
    await screen.findByRole("dialog");
    expect(screen.queryByText("Zona de perigo")).not.toBeInTheDocument();
  });

  it("submete o formulário e chama createProjectAction com o nome", async () => {
    render(<ProjectDialog />);
    await userEvent.click(screen.getByRole("button"));
    const dialog = await screen.findByRole("dialog");

    await userEvent.type(
      within(dialog).getByLabelText(/Nome do projeto/),
      "Projeto Novo",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Criar projeto" }),
    );

    expect(createMock).toHaveBeenCalledTimes(1);
    const fd = createMock.mock.calls[0][1] as FormData;
    expect(fd.get("name")).toBe("Projeto Novo");
  });

  it("fecha o dialog quando a criação é bem-sucedida", async () => {
    createMock.mockResolvedValue({ success: true } as never);
    render(<ProjectDialog />);
    await userEvent.click(screen.getByRole("button"));
    const dialog = await screen.findByRole("dialog");

    await userEvent.type(
      within(dialog).getByLabelText(/Nome do projeto/),
      "Projeto Ok",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Criar projeto" }),
    );

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mostra o alerta de erro quando a criação falha", async () => {
    createMock.mockResolvedValue({ error: "Nome já existe" } as never);
    render(<ProjectDialog />);
    await userEvent.click(screen.getByRole("button"));
    const dialog = await screen.findByRole("dialog");

    await userEvent.type(
      within(dialog).getByLabelText(/Nome do projeto/),
      "Duplicado",
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Criar projeto" }),
    );

    expect(await screen.findByText("Nome já existe")).toBeInTheDocument();
    // dialog continua aberto após erro
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("fecha ao clicar em Cancelar", async () => {
    render(<ProjectDialog />);
    await userEvent.click(screen.getByRole("button"));
    const dialog = await screen.findByRole("dialog");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    );
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("<ProjectDialog /> (edição)", () => {
  const project = { id: "p1", name: "Meu Projeto", description: "desc" };

  it("pré-preenche os campos e mostra a zona de perigo", async () => {
    render(
      <ProjectDialog
        project={project}
        trigger={<button type="button">Editar</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    await screen.findByRole("dialog");

    expect(screen.getByText("Configurações do projeto")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Meu Projeto")).toBeInTheDocument();
    expect(screen.getByText("Zona de perigo")).toBeInTheDocument();
  });

  it("alterna para a confirmação de exclusão e volta", async () => {
    render(
      <ProjectDialog
        project={project}
        trigger={<button type="button">Editar</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    await screen.findByRole("dialog");

    await userEvent.click(
      screen.getByRole("button", { name: "Deletar projeto" }),
    );
    expect(
      screen.getByRole("button", { name: "Sim, deletar projeto" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByText("Configurações do projeto")).toBeInTheDocument();
  });

  it("submete edição chamando updateProjectAction com id e nome", async () => {
    render(
      <ProjectDialog
        project={project}
        trigger={<button type="button">Editar</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    const dialog = await screen.findByRole("dialog");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Salvar alterações" }),
    );

    expect(updateMock).toHaveBeenCalledTimes(1);
    const fd = updateMock.mock.calls[0][1] as FormData;
    expect(fd.get("id")).toBe("p1");
    expect(fd.get("name")).toBe("Meu Projeto");
  });

  it("confirma a exclusão chamando deleteProjectAction com o id", async () => {
    render(
      <ProjectDialog
        project={project}
        trigger={<button type="button">Editar</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    await screen.findByRole("dialog");

    await userEvent.click(
      screen.getByRole("button", { name: "Deletar projeto" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Sim, deletar projeto" }),
    );

    expect(deleteMock).toHaveBeenCalledTimes(1);
    const fd = deleteMock.mock.calls[0][1] as FormData;
    expect(fd.get("id")).toBe("p1");
  });

  it("fecha o dialog quando a exclusão é bem-sucedida", async () => {
    deleteMock.mockResolvedValue({ success: true } as never);
    render(
      <ProjectDialog
        project={project}
        trigger={<button type="button">Editar</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    await screen.findByRole("dialog");

    await userEvent.click(
      screen.getByRole("button", { name: "Deletar projeto" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Sim, deletar projeto" }),
    );

    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mostra o alerta de erro quando a exclusão falha", async () => {
    deleteMock.mockResolvedValue({ error: "Falha ao deletar" } as never);
    render(
      <ProjectDialog
        project={project}
        trigger={<button type="button">Editar</button>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    await screen.findByRole("dialog");

    await userEvent.click(
      screen.getByRole("button", { name: "Deletar projeto" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Sim, deletar projeto" }),
    );

    expect(await screen.findByText("Falha ao deletar")).toBeInTheDocument();
  });
});
