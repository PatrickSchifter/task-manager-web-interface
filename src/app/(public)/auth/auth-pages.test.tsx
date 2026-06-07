import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@/src/test/test-utils";

// Mock os formulários reais para que os wrappers de página renderizem sem
// invocar server actions de autenticação.
vi.mock("@/src/components/forms/LoginForm", () => ({
  default: () => <div data-testid="login-form" />,
}));
vi.mock("@/src/components/forms/RegisterForm", () => ({
  default: () => <div data-testid="register-form" />,
}));
vi.mock("@/src/components/forms/ForgotPasswordForm", () => ({
  default: () => <div data-testid="forgot-password-form" />,
}));
vi.mock("@/src/components/forms/ResetPasswordForm", () => ({
  default: () => <div data-testid="reset-password-form" />,
}));

import LoginPage from "./login/page";
import RegisterPage from "./register/page";
import ForgotPasswordPage from "./forgot-password/page";
import ResetPasswordPage from "./reset-password/page";

describe("páginas de autenticação (page.tsx)", () => {
  it("Login renderiza título, formulário e link para criar conta", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "Bem-vindo de volta", level: 4 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Entre na sua conta para continuar."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();

    const criarConta = screen.getByRole("link", { name: "Criar conta" });
    expect(criarConta).toBeInTheDocument();
    expect(criarConta).toHaveAttribute("href", "/auth/register");
  });

  it("Registro renderiza título, formulário e link para entrar", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: "Crie sua conta", level: 4 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Comece grátis. 14 dias de Pro inclusos."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("register-form")).toBeInTheDocument();

    const entrar = screen.getByRole("link", { name: "Entrar" });
    expect(entrar).toBeInTheDocument();
    expect(entrar).toHaveAttribute("href", "/auth/login");
  });

  it("Esqueci a senha renderiza título e formulário, sem rodapé", () => {
    const { container } = render(<ForgotPasswordPage />);

    expect(
      screen.getByRole("heading", { name: "Esqueceu sua senha?", level: 4 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Informe seu e-mail e enviaremos um link para criar uma nova senha.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-form")).toBeInTheDocument();
    // Sem rodapé: não deve haver links de navegação de auth.
    expect(within(container).queryAllByRole("link")).toHaveLength(0);
  });

  it("Redefinir senha renderiza título e formulário dentro do Suspense", () => {
    const { container } = render(<ResetPasswordPage />);

    expect(
      screen.getByRole("heading", { name: "Redefinir senha", level: 4 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Escolha uma nova senha para acessar a sua conta."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
    expect(within(container).queryAllByRole("link")).toHaveLength(0);
  });
});
