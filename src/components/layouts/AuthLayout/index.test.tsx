import { describe, it, expect } from "vitest";
import { render, screen } from "@/src/test/test-utils";
import { AuthLayout } from "./index";

describe("<AuthLayout />", () => {
  it("renderiza título, subtítulo e filhos", () => {
    render(
      <AuthLayout title="Entrar" subtitle="Acesse sua conta">
        <button type="button">Formulário</button>
      </AuthLayout>,
    );
    expect(
      screen.getByRole("heading", { name: "Entrar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Acesse sua conta")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Formulário" }),
    ).toBeInTheDocument();
  });

  it("renderiza o footer quando fornecido", () => {
    render(
      <AuthLayout title="T" subtitle="S" footer={<span>rodapé</span>}>
        <div />
      </AuthLayout>,
    );
    expect(screen.getByText("rodapé")).toBeInTheDocument();
  });

  it("não quebra sem footer", () => {
    const { container } = render(
      <AuthLayout title="T" subtitle="S">
        <div />
      </AuthLayout>,
    );
    expect(container.firstChild).not.toBeNull();
  });
});
