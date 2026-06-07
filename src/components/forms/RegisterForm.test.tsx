import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/src/test/test-utils";
import { ApiError } from "@/src/lib/api/api-error";

const push = vi.fn();
const signUp = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/src/services/api/auth.service", () => ({
  authService: { signUp: (...a: unknown[]) => signUp(...a) },
}));

import RegisterForm from "./RegisterForm";

beforeEach(() => {
  push.mockReset();
  signUp.mockReset();
});

function fill() {
  return {
    name: screen.getByPlaceholderText("Alex Rivers"),
    email: screen.getByPlaceholderText("voce@empresa.com"),
    password: screen.getByPlaceholderText("Mínimo 8 caracteres"),
  };
}

describe("<RegisterForm />", () => {
  it("valida nome curto, e-mail inválido e senha curta", async () => {
    render(<RegisterForm />);
    const f = fill();
    await userEvent.type(f.name, "Al");
    await userEvent.type(f.email, "x");
    await userEvent.type(f.password, "123");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByText("Informe seu nome")).toBeInTheDocument();
    expect(screen.getByText("E-mail inválido")).toBeInTheDocument();
    expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("cadastra e redireciona para o login no sucesso", async () => {
    signUp.mockResolvedValue({ id: "1" });
    render(<RegisterForm />);
    const f = fill();
    await userEvent.type(f.name, "Ana Maria");
    await userEvent.type(f.email, "ana@b.com");
    await userEvent.type(f.password, "12345678");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        name: "Ana Maria",
        email: "ana@b.com",
        password: "12345678",
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/login"));
  });

  it("exibe feedback de erro quando o cadastro falha", async () => {
    signUp.mockRejectedValue(new ApiError("conflito", 409));
    render(<RegisterForm />);
    const f = fill();
    await userEvent.type(f.name, "Ana Maria");
    await userEvent.type(f.email, "ana@b.com");
    await userEvent.type(f.password, "12345678");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(
      await screen.findByText(
        "Este registro já existe ou está em conflito com outro",
      ),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
