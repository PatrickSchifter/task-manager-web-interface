import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@/src/test/test-utils";
import LandingPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));

describe("<LandingPage />", () => {
  describe("Nav", () => {
    it("renderiza os links de navegação por âncora", () => {
      render(<LandingPage />);
      const produto = screen.getByRole("link", { name: "Produto" });
      const recursos = screen.getByRole("link", { name: "Recursos" });
      const precos = screen.getByRole("link", { name: "Preços" });
      expect(produto).toHaveAttribute("href", "#produto");
      expect(recursos).toHaveAttribute("href", "#recursos");
      expect(precos).toHaveAttribute("href", "#preços");
    });

    it("renderiza os CTAs de login e registro na navbar", () => {
      render(<LandingPage />);
      expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
        "href",
        "/auth/login",
      );
      expect(
        screen.getByRole("link", { name: "Começar grátis" }),
      ).toHaveAttribute("href", "/auth/register");
    });

    it("aponta o logo para a home quando deslogado", () => {
      render(<LandingPage />, { authenticated: false });
      const logoLinks = screen
        .getAllByRole("link")
        .filter((el) => el.getAttribute("href") === "/");
      expect(logoLinks.length).toBeGreaterThan(0);
    });

    it("aponta o logo para o dashboard quando logado", () => {
      render(<LandingPage />, { authenticated: true });
      const logoLinks = screen
        .getAllByRole("link")
        .filter((el) => el.getAttribute("href") === "/dashboard");
      // nav + footer logo
      expect(logoLinks.length).toBeGreaterThan(0);
    });
  });

  describe("Hero", () => {
    it("exibe o badge de IA", () => {
      render(<LandingPage />);
      expect(
        screen.getByText("AGORA COM ASSISTENTE DE IA"),
      ).toBeInTheDocument();
    });

    it("exibe a headline principal", () => {
      render(<LandingPage />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(/Gerencie tarefas com/);
      expect(heading).toHaveTextContent(/inteligência de máquina/);
    });

    it("exibe o subtítulo do hero", () => {
      render(<LandingPage />);
      expect(
        screen.getByText(/workspace all-in-one para times de alta velocidade/i),
      ).toBeInTheDocument();
    });

    it("renderiza os CTAs do hero", () => {
      render(<LandingPage />);
      expect(
        screen.getByRole("link", { name: /Comece grátis/ }),
      ).toHaveAttribute("href", "/auth/register");
      expect(screen.getByRole("link", { name: /Ver demo/ })).toHaveAttribute(
        "href",
        "/dashboard",
      );
    });
  });

  describe("DashboardPreview", () => {
    it("renderiza a lista de projetos da sidebar", () => {
      render(<LandingPage />);
      expect(screen.getByText("Projetos")).toBeInTheDocument();
      // "Q3 Roadmap" aparece na sidebar e como título da lista de tarefas
      expect(screen.getAllByText(/Q3 Roadmap/).length).toBeGreaterThanOrEqual(
        2,
      );
      expect(screen.getByText(/API Engine/)).toBeInTheDocument();
      expect(screen.getByText(/Design System/)).toBeInTheDocument();
    });

    it("renderiza tarefas concluídas e pendentes", () => {
      render(<LandingPage />);
      // pendentes (done: false)
      expect(
        screen.getByText("Finalizar responsividade do dashboard"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Refatorar middleware de auth"),
      ).toBeInTheDocument();
      // concluída (done: true)
      expect(
        screen.getByText("Sessão inicial de branding"),
      ).toBeInTheDocument();
    });

    it("renderiza o painel da IA", () => {
      render(<LandingPage />);
      expect(screen.getByText("Solut Tasks AI")).toBeInTheDocument();
      expect(
        screen.getByText(/Como posso ajudar com a tarefa de auth hoje/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Sugira casos de teste para o middleware/),
      ).toBeInTheDocument();
    });
  });

  describe("FeaturesSection", () => {
    it("exibe o título da seção de recursos", () => {
      render(<LandingPage />);
      expect(
        screen.getByRole("heading", {
          name: /Tudo que seu time precisa, num lugar só/,
        }),
      ).toBeInTheDocument();
    });

    it("renderiza todos os cards de recursos", () => {
      render(<LandingPage />);
      expect(
        screen.getByText("Chat com IA contextual"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Colaboradores em tempo real"),
      ).toBeInTheDocument();
      expect(screen.getByText("Comentários ricos")).toBeInTheDocument();
      expect(
        screen.getByText("Performance instantânea"),
      ).toBeInTheDocument();
    });

    it("renderiza as descrições dos recursos", () => {
      render(<LandingPage />);
      expect(
        screen.getByText(/Converse com a Solut Tasks AI/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Construído sobre infraestrutura edge/),
      ).toBeInTheDocument();
    });

    it("aplica o hover no card de recurso sem quebrar", async () => {
      const user = userEvent.setup();
      render(<LandingPage />);
      const card = screen
        .getByText("Chat com IA contextual")
        .closest("div") as HTMLElement;
      await user.hover(card);
      await user.unhover(card);
      expect(screen.getByText("Chat com IA contextual")).toBeInTheDocument();
    });
  });

  describe("PricingSection", () => {
    it("exibe o título da seção de preços", () => {
      render(<LandingPage />);
      expect(
        screen.getByRole("heading", { name: "Simples e justo." }),
      ).toBeInTheDocument();
    });

    it("renderiza o plano Free com seus benefícios", () => {
      render(<LandingPage />);
      expect(screen.getByText("Free")).toBeInTheDocument();
      expect(screen.getByText("R$0")).toBeInTheDocument();
      expect(
        screen.getByText("Para começar com seu time."),
      ).toBeInTheDocument();
      expect(screen.getByText("Até 5 colaboradores")).toBeInTheDocument();
      expect(screen.getByText("Projetos ilimitados")).toBeInTheDocument();
      expect(
        screen.getByText("100 mensagens de IA/mês"),
      ).toBeInTheDocument();
    });

    it("renderiza o botão Começar do plano", () => {
      render(<LandingPage />);
      expect(
        screen.getByRole("link", { name: "Começar" }),
      ).toHaveAttribute("href", "/auth/register");
    });
  });

  describe("CTASection", () => {
    it("exibe o título da chamada final", () => {
      render(<LandingPage />);
      expect(
        screen.getByRole("heading", {
          name: "Pronto para acelerar seu time?",
        }),
      ).toBeInTheDocument();
    });

    it("renderiza o botão de criar conta", () => {
      render(<LandingPage />);
      expect(
        screen.getByRole("link", { name: /Criar minha conta/ }),
      ).toHaveAttribute("href", "/auth/register");
    });
  });

  describe("Footer", () => {
    it("renderiza o rodapé institucional", () => {
      render(<LandingPage />);
      const footer = screen.getByRole("contentinfo");
      expect(
        within(footer).getByRole("link", { name: "Privacidade" }),
      ).toBeInTheDocument();
      expect(within(footer).getByText(/Solut Labs Inc\./)).toBeInTheDocument();
    });
  });

  it("renderiza a página completa sem erros", () => {
    const { container } = render(<LandingPage />);
    expect(container).toBeTruthy();
    // âncoras de seção presentes
    expect(container.querySelector("#produto")).toBeInTheDocument();
    expect(container.querySelector("#recursos")).toBeInTheDocument();
    expect(container.querySelector("#preços")).toBeInTheDocument();
  });
});
