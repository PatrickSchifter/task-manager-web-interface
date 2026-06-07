import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen, within } from "@testing-library/react";
import { theme } from "@/src/theme";
import { WorkspaceProvider } from "@/src/providers/workspace-provider";

const signOut = vi.fn();
let pathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));
vi.mock("@/src/lib/auth/actions", () => ({
  signOut: (...a: unknown[]) => signOut(...a),
}));
vi.mock("@/src/actions/projects", () => ({
  createProjectAction: vi.fn(async () => null),
  updateProjectAction: vi.fn(async () => null),
  deleteProjectAction: vi.fn(async () => null),
}));

import { Sidebar, SIDEBAR_WIDTH } from "./Sidebar";

const user = { id: "u1", name: "Alex Rivers", role: "ADMIN", avatar: null };
const projects = [
  { id: "p1", name: "Projeto Alpha" },
  { id: "p2", name: "Projeto Beta" },
] as never;

function renderSidebar(
  props: Parameters<typeof Sidebar>[0] = {},
  overrides: { user?: unknown; projects?: unknown } = {},
) {
  return render(
    <ThemeProvider theme={theme}>
      <WorkspaceProvider
        user={(overrides.user ?? user) as never}
        projects={(overrides.projects ?? projects) as never}
      >
        <Sidebar {...props} />
      </WorkspaceProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  signOut.mockReset();
  pathname = "/dashboard";
});

describe("<Sidebar />", () => {
  it("expõe a largura como constante", () => {
    expect(SIDEBAR_WIDTH).toBe(256);
  });

  it("renderiza os itens de navegação principais", () => {
    renderSidebar();
    // Renderizado nos dois drawers (mobile + desktop), por isso getAllByText.
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Solut AI").length).toBeGreaterThan(0);
  });

  it("lista os projetos do workspace", () => {
    renderSidebar();
    expect(screen.getAllByText("Projeto Alpha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Projeto Beta").length).toBeGreaterThan(0);
  });

  it("exibe o nome do usuário e o rótulo de admin", () => {
    renderSidebar();
    expect(screen.getAllByText("Alex Rivers").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("chama signOut ao clicar em Sair", async () => {
    renderSidebar();
    await userEvent.click(screen.getAllByText("Sair")[0]);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("o link do dashboard aponta para /dashboard", () => {
    renderSidebar();
    const dashLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/dashboard");
    expect(dashLinks.length).toBeGreaterThan(0);
  });

  it("marca o Dashboard como ativo quando o pathname é /dashboard", () => {
    pathname = "/dashboard";
    renderSidebar();
    const dashLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/dashboard");
    // O item de nav (não o logo) recebe a classe Mui-selected.
    const activeNav = dashLinks.filter((a) =>
      a.classList.contains("Mui-selected"),
    );
    expect(activeNav.length).toBeGreaterThan(0);
  });

  it("marca o Solut AI como ativo via startsWith do pathname", () => {
    pathname = "/chat/123";
    renderSidebar();
    const chatLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/chat");
    const activeNav = chatLinks.filter((a) =>
      a.classList.contains("Mui-selected"),
    );
    expect(activeNav.length).toBeGreaterThan(0);
    // E o dashboard não deve estar ativo nesse pathname.
    const dashActive = screen
      .getAllByRole("link")
      .filter(
        (a) =>
          a.getAttribute("href") === "/dashboard" &&
          a.classList.contains("Mui-selected"),
      );
    expect(dashActive.length).toBe(0);
  });

  it("marca o projeto correspondente ao pathname como ativo", () => {
    pathname = "/projects/p2";
    renderSidebar();
    const projectLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/projects/p2");
    const activeProject = projectLinks.filter((a) =>
      a.classList.contains("Mui-selected"),
    );
    expect(activeProject.length).toBeGreaterThan(0);
  });

  it("renderiza o conteúdo no drawer móvel quando mobileOpen é true", () => {
    renderSidebar({ mobileOpen: true });
    // Com o drawer temporário aberto, há duas instâncias do nome do usuário.
    expect(screen.getAllByText("Alex Rivers").length).toBeGreaterThan(1);
  });

  it("chama onClose ao navegar pelo drawer móvel", async () => {
    const onClose = vi.fn();
    renderSidebar({ mobileOpen: true, onClose });
    // O drawer temporário (móvel) é o que carrega o Modal (portal no body).
    const mobileDrawer = document.body.querySelector(
      ".MuiDrawer-modal",
    ) as HTMLElement;
    expect(mobileDrawer).toBeTruthy();
    // O item de nav "Dashboard" do drawer móvel dispara onNavigate (= onClose).
    await userEvent.click(within(mobileDrawer).getByText("Dashboard"));
    expect(onClose).toHaveBeenCalled();
  });

  it("mostra 'Pro Account' para usuários não admin", () => {
    renderSidebar(
      {},
      { user: { id: "u2", name: "Bob Doe", role: "USER", avatar: null } },
    );
    expect(screen.getAllByText("Pro Account").length).toBeGreaterThan(0);
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("lida com usuário sem nome (iniciais vazias)", () => {
    renderSidebar(
      {},
      { user: { id: "u3", name: null, role: "USER", avatar: null } },
    );
    // Não deve quebrar; rótulo de conta continua presente.
    expect(screen.getAllByText("Pro Account").length).toBeGreaterThan(0);
  });
});
