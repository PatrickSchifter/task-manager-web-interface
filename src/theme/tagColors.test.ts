import { describe, it, expect } from "vitest";
import { createTheme, type Theme } from "@mui/material/styles";
import {
  TAG_COLORS,
  SUGGESTED_TAGS,
  tagColorValue,
  previewTagColor,
} from "./tagColors";

const theme: Theme = createTheme();

describe("constantes de tags", () => {
  it("expõe a paleta de tokens de cor", () => {
    expect(TAG_COLORS).toEqual([
      "brand",
      "emerald",
      "amber",
      "rose",
      "violet",
      "cyan",
      "muted",
    ]);
  });

  it("expõe sugestões padrão não vazias", () => {
    expect(SUGGESTED_TAGS.length).toBeGreaterThan(0);
    expect(SUGGESTED_TAGS).toContain("frontend");
  });
});

describe("tagColorValue", () => {
  it("retorna tons neutros quando a cor é omitida", () => {
    const { fg, bg } = tagColorValue(theme);
    expect(fg).toBe(theme.palette.text.secondary);
    expect(bg).toBe(theme.palette.action.hover);
  });

  it("retorna tons neutros para o token 'muted'", () => {
    expect(tagColorValue(theme, "muted")).toEqual({
      fg: theme.palette.text.secondary,
      bg: theme.palette.action.hover,
    });
  });

  it("resolve um token conhecido para o hex sólido + fundo translúcido", () => {
    const { fg, bg } = tagColorValue(theme, "brand");
    expect(fg).toBe("#3882F6");
    // alpha gera um rgba do mesmo matiz.
    expect(bg).toMatch(/^rgba\(/);
  });

  it("usa a cor primária do tema para tokens desconhecidos", () => {
    const { fg } = tagColorValue(theme, "inexistente");
    expect(fg).toBe(theme.palette.primary.main);
  });
});

describe("previewTagColor", () => {
  it("usa o mapa-semente para nomes conhecidos (case/space-insensitive)", () => {
    expect(previewTagColor("design")).toBe("amber");
    expect(previewTagColor("  Frontend ")).toBe("brand");
    expect(previewTagColor("BACKEND")).toBe("emerald");
    expect(previewTagColor("concluído")).toBe("muted");
  });

  it("é determinístico para o mesmo nome (hash estável)", () => {
    const a = previewTagColor("qualquer-coisa");
    const b = previewTagColor("qualquer-coisa");
    expect(a).toBe(b);
  });

  it("retorna sempre um token válido da paleta de hash", () => {
    const palette = ["brand", "emerald", "amber", "rose", "violet", "cyan"];
    for (const name of ["a", "tarefa", "x9", "longo-nome-de-tag", ""]) {
      expect(palette).toContain(previewTagColor(name));
    }
  });
});
