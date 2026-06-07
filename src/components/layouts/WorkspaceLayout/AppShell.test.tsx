import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen, within, waitFor } from "@testing-library/react";
import { theme } from "@/src/theme";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";

// A Sidebar real é renderizada por dentro do AppShell e depende destes módulos.
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));
vi.mock("@/src/lib/auth/actions", () => ({
  signOut: vi.fn(),
}));
vi.mock("@/src/actions/projects", () => ({
  createProjectAction: vi.fn(async () => null),
  updateProjectAction: vi.fn(async () => null),
  deleteProjectAction: vi.fn(async () => null),
}));

import { AppShell } from "./AppShell";

const user = { id: "u1", name: "Alex Rivers", role: "ADMIN", avatar: null };
const projects = [{ id: "p1", name: "Projeto Alpha" }] as never;

function renderShell(children: React.ReactNode = <p>conteúdo principal</p>) {
  return render(
    <ThemeProvider theme={theme}>
      <WorkspaceProvider user={user as never} projects={projects}>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<AppShell />", () => {
  it("renderiza o conteúdo (children)", () => {
    renderShell(<p>conteúdo principal</p>);
    expect(screen.getByText("conteúdo principal")).toBeInTheDocument();
  });

  it("exibe o botão de menu mobile com o rótulo acessível", () => {
    renderShell();
    expect(
      screen.getByRole("button", { name: "Abrir menu" }),
    ).toBeInTheDocument();
  });

  it("o drawer temporário começa fechado e abre ao clicar no botão de menu", async () => {
    renderShell();

    // ModalProps={{ keepMounted: true }} mantém o drawer no DOM mesmo fechado,
    // então diferenciamos pelo estado aria-hidden do Modal temporário.
    const presentations = screen.getAllByRole("presentation", {
      hidden: true,
    });
    // Drawer temporário (Modal) fechado fica com aria-hidden / visibility hidden.
    const temporaryDrawer = presentations.find((el) =>
      el.className.includes("MuiModal-root"),
    );
    expect(temporaryDrawer).toBeTruthy();
    expect(temporaryDrawer).toHaveStyle({ visibility: "hidden" });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menu" }));

    // Após abrir, o Modal temporário fica visível.
    expect(temporaryDrawer).not.toHaveStyle({ visibility: "hidden" });
  });

  it("fecha o drawer ao acionar onClose (clique no backdrop)", async () => {
    renderShell();
    const openButton = screen.getByRole("button", { name: "Abrir menu" });

    await userEvent.click(openButton);

    const backdrop = document.querySelector(".MuiBackdrop-root");
    expect(backdrop).toBeTruthy();
    await userEvent.click(backdrop as Element);

    // O fechamento passa por uma transição; aguardamos o Modal voltar a ficar oculto.
    await waitFor(() => {
      const temporaryDrawer = screen
        .getAllByRole("presentation", { hidden: true })
        .find((el) => el.className.includes("MuiModal-root"));
      expect(temporaryDrawer).toHaveStyle({ visibility: "hidden" });
    });
  });

  it("a logo da barra superior aponta para /dashboard", () => {
    renderShell();
    // 'main' contém a barra superior mobile com o link da logo.
    const main = screen.getByRole("main");
    const dashLink = within(main)
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === "/dashboard");
    expect(dashLink).toBeTruthy();
  });
});
