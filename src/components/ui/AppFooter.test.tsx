import { describe, it, expect } from "vitest";
import { render, screen } from "@/src/test/test-utils";
import { AppFooter } from "./AppFooter";

describe("<AppFooter />", () => {
  it("renderiza os links institucionais", () => {
    render(<AppFooter />);
    expect(screen.getByRole("link", { name: "Privacidade" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Termos" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(screen.getByRole("link", { name: "Segurança" })).toHaveAttribute(
      "href",
      "/security",
    );
    expect(screen.getByRole("link", { name: "Contato" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("exibe o aviso de copyright", () => {
    render(<AppFooter />);
    expect(screen.getByText(/Solut Labs Inc\./)).toBeInTheDocument();
  });
});
