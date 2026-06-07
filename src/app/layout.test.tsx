import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidElement } from "react";

// Fontes do Next são funções que retornam a classe utilitária — stub simples.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

const getSessionToken = vi.fn(async (..._args: unknown[]) => "tok" as string | null);
vi.mock("@/src/lib/auth/session", () => ({
  getSessionToken: (...args: unknown[]) => getSessionToken(...args),
}));

import RootLayout, { metadata } from "./layout";

beforeEach(() => {
  getSessionToken.mockReset();
});

describe("RootLayout (server component)", () => {
  it("expõe o metadata com o título 'Solut Tasks'", () => {
    expect(metadata.title).toBe("Solut Tasks");
  });

  // RootLayout renderiza <html>/<body>, que não podem ser montados pelo RTL
  // dentro do document existente do jsdom — então apenas inspecionamos o elemento.
  it("retorna um elemento <html> quando há sessão", async () => {
    getSessionToken.mockResolvedValueOnce("tok");
    const element = await RootLayout({ children: <div>app</div> });

    expect(element).toBeTruthy();
    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe("html");
    expect(getSessionToken).toHaveBeenCalledTimes(1);
  });

  it("retorna um elemento <html> quando não há sessão", async () => {
    getSessionToken.mockResolvedValueOnce(null);
    const element = await RootLayout({ children: <div>app</div> });

    expect(element).toBeTruthy();
    expect(element.type).toBe("html");
    expect(getSessionToken).toHaveBeenCalledTimes(1);
  });
});
