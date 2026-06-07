"use client";

import { Chip, type ChipProps } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { tagColorValue } from "@/src/theme/tagColors";

type TagChipProps = {
  label: string;
  /** Token de cor da tag (brand | emerald | amber | rose | violet | cyan | muted). */
  color?: string;
  /** Estilo "vazado" (borda + fundo transparente) — usado em sugestões ainda não selecionadas. */
  outlined?: boolean;
} & Omit<ChipProps, "label" | "color">;

/**
 * Chip de tag no estilo do projeto: uppercase, cor sólida no texto e a mesma
 * cor com baixa opacidade no fundo. Aceita props de Chip (ex.: onDelete /
 * onClick) via spread. Com `outlined`, vira um chip vazado (sugestão).
 */
export function TagChip({ label, color, outlined, sx, ...rest }: TagChipProps) {
  const theme = useTheme();
  const { fg, bg } = tagColorValue(theme, color);

  return (
    <Chip
      label={label}
      size="small"
      {...rest}
      sx={{
        height: 20,
        fontSize: "0.625rem",
        fontWeight: 700,
        textTransform: "uppercase",
        borderRadius: theme.shape.borderRadius,
        color: fg,
        bgcolor: outlined ? "transparent" : bg,
        border: outlined ? `1px solid ${alpha(fg, 0.45)}` : "none",
        ...(outlined && {
          "&:hover": { bgcolor: bg },
        }),
        "& .MuiChip-deleteIcon": {
          color: fg,
          "&:hover": { color: alpha(fg, 0.7) },
        },
        ...sx,
      }}
    />
  );
}
