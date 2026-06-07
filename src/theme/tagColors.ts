import { alpha, type Theme } from "@mui/material/styles";

/**
 * Tokens de cor das tags — espelham o conjunto do backend
 * (task-manager/src/utils/tag-color.ts). O backend grava o token em
 * `Tag.color`; aqui ele vira um par {fg, bg} para estilizar os chips.
 */
export const TAG_COLORS = [
  "brand",
  "emerald",
  "amber",
  "rose",
  "violet",
  "cyan",
  "muted",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

/**
 * Sugestões padrão exibidas no Autocomplete de tags, mesmo quando o usuário
 * ainda não criou nenhuma. As cores vêm de `previewTagColor` / do mapa-semente.
 */
export const SUGGESTED_TAGS = [
  "design",
  "backend",
  "frontend",
  "mobile",
  "pesquisa",
  "urgente",
] as const;

const HEX: Record<Exclude<TagColor, "muted">, string> = {
  brand: "#3882F6",
  emerald: "#22C55E",
  amber: "#F59E0B",
  rose: "#EF4444",
  violet: "#8B5CF6",
  cyan: "#06B6D4",
};

/**
 * Resolve um token de cor para as cores de texto/fundo do chip, seguindo o
 * estilo já usado no projeto: cor sólida no texto + a mesma cor com baixa
 * opacidade no fundo. `muted` usa os tons neutros do tema.
 */
export function tagColorValue(
  theme: Theme,
  color?: string,
): { fg: string; bg: string } {
  if (!color || color === "muted") {
    return { fg: theme.palette.text.secondary, bg: theme.palette.action.hover };
  }
  const main =
    HEX[color as Exclude<TagColor, "muted">] ?? theme.palette.primary.main;
  return { fg: main, bg: alpha(main, 0.12) };
}

// ─── Preview client-side ──────────────────────────────────────────────────────
// Replica a auto-atribuição de cor do backend para exibir tags ainda não criadas
// (digitadas no Autocomplete) já com a cor correta. Mantém paridade com
// task-manager/src/utils/tag-color.ts.

const SEED_COLORS: Record<string, TagColor> = {
  design: "amber",
  backend: "emerald",
  frontend: "brand",
  mobile: "brand",
  pesquisa: "brand",
  urgente: "rose",
};

const HASH_PALETTE: TagColor[] = [
  "brand",
  "emerald",
  "amber",
  "rose",
  "violet",
  "cyan",
];

export function previewTagColor(name: string): TagColor {
  const key = name.trim().toLowerCase();
  if (SEED_COLORS[key]) return SEED_COLORS[key];

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return HASH_PALETTE[hash % HASH_PALETTE.length];
}
