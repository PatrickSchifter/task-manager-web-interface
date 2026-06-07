import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/src/test/test-utils";

const findAll = vi.fn();

vi.mock("@/src/services/api/chat.service", () => ({
  chatService: { findAll: (...args: any[]) => findAll(...args) },
}));

vi.mock("@/src/components/layouts/WorkspaceLayout", () => ({
  default: ({ children }: any) => <div data-testid="ws">{children}</div>,
}));

vi.mock("./ChatClient", () => ({
  default: (props: any) => (
    <pre data-testid="ids">
      {JSON.stringify(props.initialMessages.map((m: any) => m.id))}
    </pre>
  ),
}));

import ChatPage from "./page";

describe("ChatPage (server component)", () => {
  beforeEach(() => {
    findAll.mockReset();
  });

  it("inverte a ordem do histórico (mais antigas primeiro)", async () => {
    findAll.mockResolvedValue([
      { id: "m3", content: "c" },
      { id: "m2", content: "b" },
      { id: "m1", content: "a" },
    ]);
    const ui = await ChatPage();
    render(ui);
    const ids = JSON.parse(screen.getByTestId("ids").textContent!);
    expect(ids).toEqual(["m1", "m2", "m3"]);
  });

  it("usa lista vazia quando findAll rejeita", async () => {
    findAll.mockRejectedValue(new Error("falha"));
    const ui = await ChatPage();
    render(ui);
    const ids = JSON.parse(screen.getByTestId("ids").textContent!);
    expect(ids).toEqual([]);
  });
});
