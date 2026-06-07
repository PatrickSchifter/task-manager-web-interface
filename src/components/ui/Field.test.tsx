import { describe, it, expect } from "vitest";
import { createRef } from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/src/test/test-utils";
import { Field } from "./Field";

describe("<Field />", () => {
  it("renderiza o label associado ao input via htmlFor/id derivado do label", () => {
    render(<Field label="E-mail" placeholder="voce@empresa.com" />);
    const input = screen.getByPlaceholderText("voce@empresa.com");
    // o id é derivado do label em kebab-case
    expect(input).toHaveAttribute("id", "e-mail");
    expect(screen.getByText("E-mail")).toHaveAttribute("for", "e-mail");
  });

  it("prefere o atributo name ao gerar o id", () => {
    render(<Field label="Nome completo" name="name" />);
    expect(screen.getByText("Nome completo")).toHaveAttribute("for", "name");
  });

  it("prioriza um id explícito", () => {
    render(<Field label="Senha" id="custom-id" />);
    expect(screen.getByText("Senha")).toHaveAttribute("for", "custom-id");
  });

  it("encaminha o ref para o input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Field label="Campo" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("aceita digitação do usuário", async () => {
    render(<Field label="E-mail" placeholder="digite" />);
    const input = screen.getByPlaceholderText("digite");
    await userEvent.type(input, "ola");
    expect(input).toHaveValue("ola");
  });

  it("renderiza um nó trailing quando fornecido", () => {
    render(<Field label="Senha" trailing={<span>mostrar</span>} />);
    expect(screen.getByText("mostrar")).toBeInTheDocument();
  });

  it("repassa o type ao input", () => {
    render(<Field label="Senha" type="password" placeholder="pwd" />);
    expect(screen.getByPlaceholderText("pwd")).toHaveAttribute(
      "type",
      "password",
    );
  });
});
