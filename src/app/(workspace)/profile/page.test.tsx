import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/src/test/test-utils";

vi.mock("@/src/components/layouts/WorkspaceLayout", () => ({
  default: ({ children }: any) => <div data-testid="ws">{children}</div>,
}));

vi.mock("./ProfileClient", () => ({
  default: () => <div data-testid="profile-client">perfil</div>,
}));

import ProfilePage, { metadata } from "./page";

describe("ProfilePage (server component)", () => {
  it("renderiza o ProfileClient dentro do WorkspaceLayout", () => {
    render(ProfilePage());
    const ws = screen.getByTestId("ws");
    expect(ws).toContainElement(screen.getByTestId("profile-client"));
  });

  it("expõe metadata.title contendo 'Perfil'", () => {
    expect(metadata.title).toContain("Perfil");
  });
});
