import { describe, it, expect } from "vitest";
import { render, screen } from "@/src/test/test-utils";

import PublicLayout from "./layout";

describe("PublicLayout", () => {
  it("renderiza os children e o rodapé público", () => {
    render(
      <PublicLayout>
        <p>conteúdo público</p>
      </PublicLayout>,
    );

    expect(screen.getByText("conteúdo público")).toBeInTheDocument();
    // AppFooter expõe o copyright e os links institucionais.
    expect(screen.getByText(/Solut Labs Inc\./)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Privacidade" }),
    ).toBeInTheDocument();
  });
});
