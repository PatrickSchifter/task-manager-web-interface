import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/src/test/test-utils";
import { ApiError } from "@/src/lib/api/api-error";

const forgotPassword = vi.fn();
vi.mock("@/src/services/api/auth.service", () => ({
  authService: { forgotPassword: (...a: unknown[]) => forgotPassword(...a) },
}));

import ForgotPasswordForm from "./ForgotPasswordForm";

beforeEach(() => {
  forgotPassword.mockReset();
});

describe("<ForgotPasswordForm />", () => {
  it("valida e-mail inválido", async () => {
    render(<ForgotPasswordForm />);
    await userEvent.type(
      screen.getByPlaceholderText("voce@empresa.com"),
      "nope",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );
    expect(await screen.findByText("E-mail inválido")).toBeInTheDocument();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("envia o link com e-mail válido e mostra feedback de sucesso", async () => {
    forgotPassword.mockResolvedValue(undefined);
    render(<ForgotPasswordForm />);
    await userEvent.type(
      screen.getByPlaceholderText("voce@empresa.com"),
      "a@b.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );

    await waitFor(() =>
      expect(forgotPassword).toHaveBeenCalledWith({ email: "a@b.com" }),
    );
    expect(
      await screen.findByText(
        "Link de recuperação enviado para o seu e-mail",
      ),
    ).toBeInTheDocument();
  });

  it("mostra feedback de erro quando a requisição falha", async () => {
    forgotPassword.mockRejectedValue(new ApiError("x", 429));
    render(<ForgotPasswordForm />);
    await userEvent.type(
      screen.getByPlaceholderText("voce@empresa.com"),
      "a@b.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );

    expect(
      await screen.findByText(
        "Muitas tentativas. Aguarde alguns instantes e tente novamente",
      ),
    ).toBeInTheDocument();
  });

  it("tem link de volta para o login", () => {
    render(<ForgotPasswordForm />);
    expect(
      screen.getByRole("link", { name: /Voltar para entrar/ }),
    ).toHaveAttribute("href", "/auth/login");
  });
});
