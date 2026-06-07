import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppThemeProvider } from "./theme-provider";

describe("<AppThemeProvider />", () => {
  it("renderiza os filhos dentro do provedor de tema", () => {
    render(
      <AppThemeProvider>
        <span>conteúdo do app</span>
      </AppThemeProvider>,
    );
    expect(screen.getByText("conteúdo do app")).toBeInTheDocument();
  });
});
