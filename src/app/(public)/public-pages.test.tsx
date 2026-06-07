import { describe, it, expect } from "vitest";
import { render, screen } from "@/src/test/test-utils";

import { PrivacyContent } from "./privacy/PrivacyContent";
import { TermsContent } from "./terms/TermsContent";
import { SecurityContent } from "./security/SecurityContent";
import { ContactContent } from "./contact/ContactContent";

import PrivacyPage from "./privacy/page";
import TermsPage from "./terms/page";
import SecurityPage from "./security/page";
import ContactPage from "./contact/page";

describe("páginas públicas estáticas", () => {
  it("Privacidade renderiza o título e o link de logo", () => {
    render(<PrivacyContent />);
    expect(
      screen.getByRole("heading", { name: "Política de Privacidade" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("Termos renderiza o título", () => {
    render(<TermsContent />);
    expect(
      screen.getByRole("heading", { name: "Termos de Uso" }),
    ).toBeInTheDocument();
  });

  it("Segurança renderiza o título", () => {
    render(<SecurityContent />);
    expect(
      screen.getByRole("heading", { name: "Segurança" }),
    ).toBeInTheDocument();
  });

  it("Contato renderiza o título e o e-mail de contato", () => {
    render(<ContactContent />);
    expect(
      screen.getByRole("heading", { name: "Contato" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/solutlabs\.com\.br/)).toBeInTheDocument();
  });
});

describe("wrappers de página (page.tsx) renderizam sem erro", () => {
  it.each([
    ["Privacidade", PrivacyPage],
    ["Termos", TermsPage],
    ["Segurança", SecurityPage],
    ["Contato", ContactPage],
  ])("%s", (_name, Page) => {
    const { container } = render(<Page />);
    expect(container.firstChild).not.toBeNull();
  });
});
