import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/src/test/test-utils";

const signIn = vi.fn();
vi.mock("@/src/lib/auth/actions", () => ({
  signIn: (...a: unknown[]) => signIn(...a),
}));

import LoginForm from "./LoginForm";

beforeEach(() => {
  signIn.mockReset();
});

describe("<LoginForm />", () => {
  it("renderiza os campos e o botão", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("voce@empresa.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Sua senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("valida e-mail inválido sem chamar a action", async () => {
    render(<LoginForm />);
    await userEvent.type(
      screen.getByPlaceholderText("voce@empresa.com"),
      "invalido",
    );
    await userEvent.type(screen.getByPlaceholderText("Sua senha"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("E-mail inválido")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("exige a senha", async () => {
    render(<LoginForm />);
    await userEvent.type(
      screen.getByPlaceholderText("voce@empresa.com"),
      "a@b.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Informe sua senha")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("chama signIn com os dados válidos", async () => {
    signIn.mockResolvedValue({ success: false, message: "ignorada" });
    render(<LoginForm />);
    await userEvent.type(
      screen.getByPlaceholderText("voce@empresa.com"),
      "a@b.com",
    );
    await userEvent.type(screen.getByPlaceholderText("Sua senha"), "segredo");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "segredo",
      }),
    );
  });

  it("exibe a mensagem de erro retornada pela action", async () => {
    signIn.mockResolvedValue({
      success: false,
      message: "E-mail ou senha inválidos.",
    });
    render(<LoginForm />);
    await userEvent.type(
      screen.getByPlaceholderText("voce@empresa.com"),
      "a@b.com",
    );
    await userEvent.type(screen.getByPlaceholderText("Sua senha"), "segredo");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findAllByText("E-mail ou senha inválidos."),
    ).not.toHaveLength(0);
  });

  it("tem um link para recuperação de senha", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("link", { name: /Esqueceu sua senha/ }),
    ).toHaveAttribute("href", "/auth/forgot-password");
  });
});
