import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@/src/test/test-utils";

// Isola este arquivo das fontes de dados e do shell real.
vi.mock("@/src/services/api/auth.server.service", () => ({
  authServerService: {
    getMe: vi.fn(async () => ({ id: "u1", name: "Maria", email: "m@x.com" })),
  },
}));
vi.mock("@/src/services/api", () => ({
  projectsService: {
    findAll: vi.fn(async () => ({ data: [{ id: "p1", name: "Projeto X" }] })),
  },
}));
vi.mock("./AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}));

import WorkspaceLayout, { metadata } from "./index";
import { authServerService } from "@/src/services/api/auth.server.service";
import { projectsService } from "@/src/services/api";

describe("WorkspaceLayout (server component)", () => {
  it("busca usuário e projetos e renderiza children dentro do shell", async () => {
    const ui = await WorkspaceLayout({ children: <div>conteúdo</div> });
    render(ui);

    expect(authServerService.getMe).toHaveBeenCalledTimes(1);
    expect(projectsService.findAll).toHaveBeenCalledTimes(1);

    const shell = screen.getByTestId("shell");
    expect(within(shell).getByText("conteúdo")).toBeInTheDocument();
  });

  it("expõe o metadata de título do workspace", () => {
    expect(metadata.title).toBe("Workspace — Tasks");
  });
});
