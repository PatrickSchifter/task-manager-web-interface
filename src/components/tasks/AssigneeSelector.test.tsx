import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@/src/test/test-utils";
import { AssigneeSelector } from "./AssigneeSelector";

const onChange = vi.fn();

beforeEach(() => onChange.mockReset());

const collaborators = [
  { userId: "u1", role: "OWNER", user: { id: "u1", name: "Maria Aparecida Souza" } },
  { userId: "u2", role: "EDITOR", user: { id: "u2", name: "João" } },
  { role: "VIEWER", user: { id: "u3", email: "ana@empresa.com" } },
] as never[];

describe("<AssigneeSelector />", () => {
  it("mostra mensagem quando não há colaboradores", () => {
    render(<AssigneeSelector collaborators={[]} value="" onChange={onChange} />);
    expect(
      screen.getByText("Nenhum colaborador no projeto."),
    ).toBeInTheDocument();
  });

  it("abrevia nomes longos e exibe o papel traduzido", () => {
    render(
      <AssigneeSelector collaborators={collaborators} value="" onChange={onChange} />,
    );
    // "Maria Aparecida Souza" → "Maria S."
    expect(screen.getByText("Maria S.")).toBeInTheDocument();
    expect(screen.getByText("Dono")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Leitor")).toBeInTheDocument();
  });

  it("mantém nomes curtos sem abreviar", () => {
    render(
      <AssigneeSelector collaborators={collaborators} value="" onChange={onChange} />,
    );
    expect(screen.getByText("João")).toBeInTheDocument();
  });

  it("usa o início do e-mail quando não há nome", () => {
    render(
      <AssigneeSelector collaborators={collaborators} value="" onChange={onChange} />,
    );
    expect(screen.getByText("ana")).toBeInTheDocument();
  });

  it("seleciona um colaborador ao clicar", async () => {
    render(
      <AssigneeSelector collaborators={collaborators} value="" onChange={onChange} />,
    );
    await userEvent.click(screen.getByText("João"));
    expect(onChange).toHaveBeenCalledWith("u2");
  });

  it("clicar no já selecionado limpa o responsável", async () => {
    render(
      <AssigneeSelector collaborators={collaborators} value="u2" onChange={onChange} />,
    );
    await userEvent.click(screen.getByText("João"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("não chama onChange quando disabled", () => {
    render(
      <AssigneeSelector
        collaborators={collaborators}
        value=""
        onChange={onChange}
        disabled
      />,
    );
    fireEvent.click(screen.getByText("João"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
