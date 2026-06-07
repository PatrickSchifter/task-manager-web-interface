import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/src/test/test-utils";

const findById = vi.fn();
const findAll = vi.fn();

vi.mock("@/src/services/api", () => ({
  projectsService: { findById: (...a: any[]) => findById(...a) },
  tagsService: { findAll: (...a: any[]) => findAll(...a) },
}));

vi.mock("@/src/components/layouts/WorkspaceLayout", () => ({
  default: ({ children }: any) => <div data-testid="ws">{children}</div>,
}));

vi.mock("./ProjectBoard", () => ({
  ProjectBoard: (props: any) => (
    <div data-testid="board">{props.project?.name}</div>
  ),
}));

import ProjectPage, { generateMetadata } from "./page";

describe("ProjectPage — generateMetadata", () => {
  beforeEach(() => {
    findById.mockReset();
    findAll.mockReset();
  });

  it("usa o nome e a descrição do projeto quando encontrado", async () => {
    findById.mockResolvedValue({
      id: "p1",
      name: "Meu Projeto",
      description: "Descrição custom",
    });
    const meta = await generateMetadata({
      params: Promise.resolve({ id: "p1" }),
    });
    expect(meta.title).toBe("Meu Projeto — Solut Tasks");
    expect(meta.description).toBe("Descrição custom");
  });

  it("gera descrição padrão quando o projeto não tem descrição", async () => {
    findById.mockResolvedValue({
      id: "p1",
      name: "Sem Desc",
      description: "",
    });
    const meta = await generateMetadata({
      params: Promise.resolve({ id: "p1" }),
    });
    expect(meta.description).toBe(
      "Gerencie as tarefas do projeto Sem Desc no Solut Tasks.",
    );
  });

  it("usa título de fallback quando findById rejeita", async () => {
    findById.mockRejectedValue(new Error("404"));
    const meta = await generateMetadata({
      params: Promise.resolve({ id: "p1" }),
    });
    expect(meta.title).toBe("Projeto — Solut Tasks");
  });
});

describe("ProjectPage (server component)", () => {
  beforeEach(() => {
    findById.mockReset();
    findAll.mockReset();
  });

  it("renderiza o board com o nome do projeto e as tags carregadas", async () => {
    findById.mockResolvedValue({ id: "p1", name: "Projeto X" });
    findAll.mockResolvedValue([{ id: "t1", name: "bug" }]);
    const ui = await ProjectPage({ params: Promise.resolve({ id: "p1" }) });
    render(ui);
    expect(screen.getByTestId("board")).toHaveTextContent("Projeto X");
  });

  it("usa lista de tags vazia quando tagsService.findAll rejeita", async () => {
    findById.mockResolvedValue({ id: "p1", name: "Projeto Y" });
    findAll.mockRejectedValue(new Error("falha tags"));
    const ui = await ProjectPage({ params: Promise.resolve({ id: "p1" }) });
    render(ui);
    expect(screen.getByTestId("board")).toHaveTextContent("Projeto Y");
  });
});
