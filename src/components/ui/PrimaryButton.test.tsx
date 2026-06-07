import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@/src/test/test-utils";
import { PrimaryButton } from "./PrimaryButton";

describe("<PrimaryButton />", () => {
  it("renderiza o conteúdo filho", () => {
    render(<PrimaryButton>Entrar</PrimaryButton>);
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("dispara onClick", async () => {
    const onClick = vi.fn();
    render(
      <PrimaryButton type="button" onClick={onClick}>
        Salvar
      </PrimaryButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("fica desabilitado quando disabled", () => {
    render(<PrimaryButton disabled>X</PrimaryButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("fica desabilitado quando loading", () => {
    render(<PrimaryButton loading>X</PrimaryButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("não dispara onClick quando desabilitado", async () => {
    const onClick = vi.fn();
    render(
      <PrimaryButton type="button" disabled onClick={onClick}>
        X
      </PrimaryButton>,
    );
    // fireEvent ignora a checagem de pointer-events; um botão desabilitado
    // não deve disparar o handler.
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("usa type=submit por padrão", () => {
    render(<PrimaryButton>Enviar</PrimaryButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
