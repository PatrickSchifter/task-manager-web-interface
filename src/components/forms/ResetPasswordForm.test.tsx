import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/src/test/test-utils";
import { ApiError } from "@/src/lib/api/api-error";

const push = vi.fn();
const resetPassword = vi.fn();
let tokenValue = "reset-token";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({ get: () => tokenValue }),
}));

vi.mock("@/src/services/api/auth.service", () => ({
  authService: { resetPassword: (...a: unknown[]) => resetPassword(...a) },
}));

import ResetPasswordForm from "./ResetPasswordForm";

beforeEach(() => {
  push.mockReset();
  resetPassword.mockReset();
  tokenValue = "reset-token";
});

describe("<ResetPasswordForm />", () => {
  it("valida senha curta", async () => {
    render(<ResetPasswordForm />);
    await userEvent.type(screen.getAllByPlaceholderText("••••••••")[0], "123");
    await userEvent.click(
      screen.getByRole("button", { name: "Redefinir senha" }),
    );
    expect(
      await screen.findByText("A senha deve ter no mínimo 8 caracteres"),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("valida senhas que não coincidem", async () => {
    render(<ResetPasswordForm />);
    const inputs = screen.getAllByPlaceholderText("••••••••");
    await userEvent.type(inputs[0], "12345678");
    await userEvent.type(inputs[1], "87654321");
    await userEvent.click(
      screen.getByRole("button", { name: "Redefinir senha" }),
    );
    expect(
      await screen.findByText("As senhas não coincidem"),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("desabilita o botão quando não há token", () => {
    tokenValue = "";
    render(<ResetPasswordForm />);
    expect(
      screen.getByRole("button", { name: "Redefinir senha" }),
    ).toBeDisabled();
  });

  it("redefine a senha e mostra a tela de sucesso, redirecionando", async () => {
    resetPassword.mockResolvedValue(undefined);
    render(<ResetPasswordForm />);
    const inputs = screen.getAllByPlaceholderText("••••••••");
    await userEvent.type(inputs[0], "12345678");
    await userEvent.type(inputs[1], "12345678");
    await userEvent.click(
      screen.getByRole("button", { name: "Redefinir senha" }),
    );

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith({
        token: "reset-token",
        newPassword: "12345678",
      }),
    );
    expect(
      await screen.findByText(/Senha redefinida! Redirecionando/),
    ).toBeInTheDocument();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/login"), {
      timeout: 4000,
    });
  });

  it("mostra feedback de erro quando a redefinição falha", async () => {
    resetPassword.mockRejectedValue(new ApiError("x", 400));
    render(<ResetPasswordForm />);
    const inputs = screen.getAllByPlaceholderText("••••••••");
    await userEvent.type(inputs[0], "12345678");
    await userEvent.type(inputs[1], "12345678");
    await userEvent.click(
      screen.getByRole("button", { name: "Redefinir senha" }),
    );

    expect(
      await screen.findByText(
        "Requisição inválida. Verifique os dados enviados",
      ),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
