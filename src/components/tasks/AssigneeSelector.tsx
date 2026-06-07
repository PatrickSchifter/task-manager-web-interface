"use client";

import { Box, Stack, Avatar, Typography, Tooltip } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import type { ProjectCollaboratorDTO } from "@/src/services/api/projects.service";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Dono",
  EDITOR: "Editor",
  VIEWER: "Leitor",
};

// Abrevia nomes longos: "Maria Aparecida Souza" → "Maria S.".
function abbreviate(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (name.length <= 16 || parts.length === 1) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? "");
  return (a + b).toUpperCase();
}

type AssigneeSelectorProps = {
  collaborators: ProjectCollaboratorDTO[];
  /** Id do responsável selecionado ("" = sem responsável). */
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

/**
 * Seleção do responsável em chips clicáveis (avatar redondo + nome abreviado +
 * role) em vez de um select. Seleção única: clicar de novo no selecionado
 * limpa o responsável.
 */
export function AssigneeSelector({
  collaborators,
  value,
  onChange,
  disabled,
}: AssigneeSelectorProps) {
  const theme = useTheme();

  if (!collaborators.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhum colaborador no projeto.
      </Typography>
    );
  }

  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: theme.spacing(1) }}>
      {collaborators.map((c) => {
        const id = c.userId ?? c.user.id;
        const name = c.user?.name ?? c.user?.email?.split("@")[0] ?? "—";
        const role = ROLE_LABEL[c.role] ?? c.role;
        const selected = value === id;

        return (
          <Tooltip key={id} title={name}>
            <Box
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onChange(selected ? "" : id)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: theme.spacing(1),
                pl: 0.5,
                pr: theme.spacing(1.25),
                py: 0.5,
                borderRadius: 999,
                cursor: disabled ? "default" : "pointer",
                bgcolor: selected
                  ? alpha(theme.palette.primary.main, 0.12)
                  : "transparent",
                border: `1px solid ${
                  selected ? theme.palette.primary.main : theme.palette.divider
                }`,
                transition: "border-color .15s, background-color .15s",
                "&:hover": {
                  borderColor: selected
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                  bgcolor: selected
                    ? alpha(theme.palette.primary.main, 0.16)
                    : theme.palette.action.hover,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
              >
                {initials(name)}
              </Avatar>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  minWidth: 0,
                }}
              >
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    lineHeight: 1.1,
                    color: theme.palette.text.primary,
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {abbreviate(name)}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.5625rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    lineHeight: 1.1,
                    color: selected
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                  }}
                >
                  {role}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
