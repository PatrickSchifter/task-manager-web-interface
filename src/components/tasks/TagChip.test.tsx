import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/src/test/test-utils";
import { TagChip } from "./TagChip";

describe("<TagChip />", () => {
  it("renderiza o label", () => {
    render(<TagChip label="frontend" />);
    expect(screen.getByText("frontend")).toBeInTheDocument();
  });

  it("dispara onClick ao clicar no chip", async () => {
    const onClick = vi.fn();
    render(<TagChip label="design" onClick={onClick} />);
    await userEvent.click(screen.getByText("design"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renderiza o ícone de remover e dispara onDelete", async () => {
    const onDelete = vi.fn();
    render(<TagChip label="backend" onDelete={onDelete} />);
    // O MUI renderiza um ícone de deletar com role/svg; clicar nele chama onDelete.
    const deleteIcon = document.querySelector(".MuiChip-deleteIcon");
    expect(deleteIcon).not.toBeNull();
    await userEvent.click(deleteIcon as Element);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("aceita a variante outlined sem quebrar", () => {
    render(<TagChip label="urgente" outlined />);
    expect(screen.getByText("urgente")).toBeInTheDocument();
  });
});
