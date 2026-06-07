import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/src/test/test-utils";
import { TagSelector } from "./TagSelector";

const onChange = vi.fn();
const onCreate = vi.fn();

beforeEach(() => {
  onChange.mockReset();
  onCreate.mockReset();
});

function setup(props: Partial<React.ComponentProps<typeof TagSelector>> = {}) {
  return render(
    <TagSelector
      value={props.value ?? []}
      onChange={onChange}
      onCreate={onCreate}
      availableTags={props.availableTags}
      disabled={props.disabled}
    />,
  );
}

describe("<TagSelector />", () => {
  it("renderiza as tags selecionadas", () => {
    setup({ value: ["frontend"] });
    expect(screen.getByText("frontend")).toBeInTheDocument();
  });

  it("renderiza sugestões padrão que não estão selecionadas", () => {
    setup({ value: [] });
    // 'design' é uma sugestão padrão
    expect(screen.getByText("design")).toBeInTheDocument();
  });

  it("não sugere uma tag que já está selecionada", () => {
    setup({ value: ["design"] });
    // só aparece uma vez (a selecionada), não duplicada como sugestão
    expect(screen.getAllByText("design")).toHaveLength(1);
  });

  it("adiciona uma sugestão ao clicar nela", async () => {
    setup({ value: [] });
    await userEvent.click(screen.getByText("frontend"));
    expect(onChange).toHaveBeenCalledWith(["frontend"]);
  });

  it("remove uma tag selecionada pelo ícone de deletar", async () => {
    setup({ value: ["frontend"] });
    const chip = screen.getByText("frontend").closest(".MuiChip-root");
    const deleteIcon = chip?.querySelector(".MuiChip-deleteIcon");
    await userEvent.click(deleteIcon as Element);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("inclui as tags do catálogo do usuário como sugestões", () => {
    setup({
      value: [],
      availableTags: [{ id: "1", name: "minhatag", color: "brand" }],
    });
    expect(screen.getByText("minhatag")).toBeInTheDocument();
  });

  it("cria uma nova tag pelo criador inline", async () => {
    onCreate.mockResolvedValue({ id: "9", name: "nova", color: "brand" });
    setup({ value: [] });

    await userEvent.click(screen.getByRole("button", { name: /criar tag/i }));
    const input = screen.getByPlaceholderText("Nome da tag");
    await userEvent.type(input, "nova");

    // confirma a criação (ícone de check)
    const confirm = document.querySelector(
      'svg[data-testid="CheckIcon"]',
    )?.closest("button");
    await userEvent.click(confirm as Element);

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith("nova", expect.any(String)),
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(["nova"]));
  });

  it("cancela a criação fechando o editor", async () => {
    setup({ value: [] });
    await userEvent.click(screen.getByRole("button", { name: /criar tag/i }));
    expect(screen.getByPlaceholderText("Nome da tag")).toBeInTheDocument();

    const close = document.querySelector(
      'svg[data-testid="CloseIcon"]',
    )?.closest("button");
    await userEvent.click(close as Element);
    expect(
      screen.queryByPlaceholderText("Nome da tag"),
    ).not.toBeInTheDocument();
  });

  it("permite escolher uma cor no criador inline", async () => {
    onCreate.mockResolvedValue(null);
    setup({ value: [] });
    await userEvent.click(screen.getByRole("button", { name: /criar tag/i }));
    await userEvent.type(screen.getByPlaceholderText("Nome da tag"), "minha");
    // escolhe a cor 'emerald'
    await userEvent.click(screen.getByLabelText("Cor emerald"));

    const confirm = document.querySelector(
      'svg[data-testid="CheckIcon"]',
    )?.closest("button");
    await userEvent.click(confirm as Element);

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith("minha", "emerald"),
    );
  });

  it("não adiciona sugestões quando disabled", async () => {
    setup({ value: [], disabled: true });
    await userEvent.click(screen.getByText("frontend"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
