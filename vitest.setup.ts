import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Base URL usada pelo ApiClient isomórfico.
process.env.NEXT_PUBLIC_API_URL = "http://api.test";

// Limpa o DOM entre cada teste para evitar vazamento de elementos.
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// jsdom não implementa matchMedia — exigido por componentes responsivos do MUI.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
