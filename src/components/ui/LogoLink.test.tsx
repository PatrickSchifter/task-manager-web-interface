import { describe, it, expect } from "vitest";
import { render, screen } from "@/src/test/test-utils";
import { LogoLink } from "./LogoLink";

describe("<LogoLink />", () => {
  it("aponta para '/' quando deslogado", () => {
    render(<LogoLink />, { authenticated: false });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });

  it("aponta para '/dashboard' quando autenticado", () => {
    render(<LogoLink />, { authenticated: true });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard");
  });
});
