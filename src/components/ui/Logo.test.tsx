import { describe, it, expect } from "vitest";
import { render, screen } from "@/src/test/test-utils";
import { Logo } from "./Logo";

describe("<Logo />", () => {
  it("renderiza o nome da marca", () => {
    render(<Logo />);
    expect(screen.getByText(/Solut Tasks/)).toBeInTheDocument();
  });
});
