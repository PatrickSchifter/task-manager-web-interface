"use client";

import { useState } from "react";
import { Box, Stack, TextField, IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { TagChip } from "@/src/components/tasks/TagChip";
import {
  TAG_COLORS,
  SUGGESTED_TAGS,
  previewTagColor,
  tagColorValue,
} from "@/src/theme/tagColors";
import type { Theme } from "@mui/material/styles";
import type { TagDTO } from "@/src/services/api/tags.service";

type TagSelectorProps = {
  /** Nomes das tags selecionadas. */
  value: string[];
  onChange: (names: string[]) => void;
  /** Catálogo de tags do usuário (para cores e como sugestões). */
  availableTags?: TagDTO[];
  /** Persiste uma tag nova com a cor escolhida; retorna o registro ou null. */
  onCreate: (name: string, color: string) => Promise<TagDTO | null>;
  disabled?: boolean;
};

/**
 * Seletor de tags em chips soltos (sem dropdown): as selecionadas aparecem
 * preenchidas (com X para remover); as sugestões aparecem vazadas (clicar para
 * adicionar); e um chip "+" abre um criador inline (nome + escolha de cor).
 */
export function TagSelector({
  value,
  onChange,
  availableTags = [],
  onCreate,
  disabled,
}: TagSelectorProps) {
  const theme = useTheme();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);
  // Cores de tags criadas nesta sessão, para o chip renderizar na hora.
  const [localColors, setLocalColors] = useState<Record<string, string>>({});

  const colorOf = (name: string) =>
    localColors[name.toLowerCase()] ??
    availableTags.find((t) => t.name.toLowerCase() === name.toLowerCase())
      ?.color ??
    previewTagColor(name);

  const selectedKeys = new Set(value.map((v) => v.toLowerCase()));

  // Sugestões = catálogo do usuário + padrão, sem duplicar e sem as já escolhidas.
  const suggestions = (() => {
    const byKey = new Map<string, string>();
    for (const t of availableTags) byKey.set(t.name.toLowerCase(), t.name);
    for (const s of SUGGESTED_TAGS)
      if (!byKey.has(s.toLowerCase())) byKey.set(s.toLowerCase(), s);
    return [...byKey.values()].filter((n) => !selectedKeys.has(n.toLowerCase()));
  })();

  const add = (name: string) => {
    const n = name.trim();
    if (!n || selectedKeys.has(n.toLowerCase())) return;
    onChange([...value, n]);
  };

  const remove = (name: string) => onChange(value.filter((v) => v !== name));

  const cancelCreate = () => {
    setCreating(false);
    setNewName("");
    setNewColor(TAG_COLORS[0]);
  };

  const confirmCreate = async () => {
    const n = newName.trim();
    if (!n || saving) return;
    setSaving(true);
    const tag = await onCreate(n, newColor);
    setSaving(false);
    const finalName = tag?.name ?? n;
    const finalColor = tag?.color ?? newColor;
    setLocalColors((prev) => ({ ...prev, [finalName.toLowerCase()]: finalColor }));
    add(finalName);
    cancelCreate();
  };

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ flexWrap: "wrap", gap: theme.spacing(1), alignItems: "center" }}
      >
        {/* Selecionadas — preenchidas, com X para remover */}
        {value.map((name) => (
          <TagChip
            key={`sel-${name}`}
            label={name}
            color={colorOf(name)}
            onDelete={disabled ? undefined : () => remove(name)}
          />
        ))}

        {/* Sugestões — vazadas, clicar para adicionar */}
        {suggestions.map((name) => (
          <TagChip
            key={`sug-${name}`}
            label={name}
            color={colorOf(name)}
            outlined
            onClick={disabled ? undefined : () => add(name)}
            sx={{ cursor: disabled ? "default" : "pointer" }}
          />
        ))}

        {/* Botão "+" no mesmo estilo de chip */}
        {!creating && (
          <Tooltip title="Criar tag">
            <Box
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => setCreating(true)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                height: 20,
                px: theme.spacing(0.75),
                borderRadius: theme.shape.borderRadius,
                border: `1px dashed ${theme.palette.divider}`,
                bgcolor: "transparent",
                color: theme.palette.text.secondary,
                cursor: "pointer",
                fontSize: "0.625rem",
                fontWeight: 700,
                textTransform: "uppercase",
                "&:hover": {
                  borderColor: theme.palette.text.secondary,
                  color: theme.palette.text.primary,
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <AddIcon sx={{ fontSize: 14 }} />
              Tag
            </Box>
          </Tooltip>
        )}
      </Stack>

      {/* Criador inline — nome + escolha de cor */}
      {creating && (
        <Box
          sx={{
            mt: theme.spacing(1.5),
            p: theme.spacing(1.5),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
            bgcolor: theme.palette.action.hover,
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: "center", gap: theme.spacing(1), flexWrap: "wrap" }}
          >
            <TextField
              size="small"
              autoFocus
              placeholder="Nome da tag"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void confirmCreate();
                } else if (e.key === "Escape") {
                  cancelCreate();
                }
              }}
              sx={{ ...fieldSx(theme), minWidth: 160, flex: 1 }}
            />

            {/* Paleta de cores */}
            <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
              {TAG_COLORS.map((c) => {
                const { fg } = tagColorValue(theme, c);
                const selected = c === newColor;
                return (
                  <Tooltip key={c} title={c}>
                    <Box
                      component="button"
                      type="button"
                      aria-label={`Cor ${c}`}
                      onClick={() => setNewColor(c)}
                      sx={{
                        width: 22,
                        height: 22,
                        p: 0,
                        borderRadius: "50%",
                        bgcolor: fg,
                        cursor: "pointer",
                        border: `2px solid ${
                          selected ? theme.palette.text.primary : "transparent"
                        }`,
                        boxShadow: selected
                          ? `0 0 0 1px ${theme.palette.background.paper}`
                          : "none",
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Stack>

            <IconButton
              size="small"
              onClick={() => void confirmCreate()}
              disabled={!newName.trim() || saving}
              sx={{ color: theme.palette.primary.main }}
            >
              <CheckIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={cancelCreate}
              sx={{ color: theme.palette.text.secondary }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>

          {/* Preview do chip */}
          {newName.trim() && (
            <Box sx={{ mt: theme.spacing(1.5) }}>
              <TagChip label={newName.trim()} color={newColor} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// Mesmo estilo de campo dos demais inputs do TaskDialog.
function fieldSx(theme: Theme) {
  return {
    "& .MuiOutlinedInput-root": {
      color: theme.palette.text.primary,
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.text.secondary },
      "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    },
    "& .MuiInputBase-input::placeholder": {
      color: theme.palette.text.disabled,
      opacity: 1,
    },
  };
}
