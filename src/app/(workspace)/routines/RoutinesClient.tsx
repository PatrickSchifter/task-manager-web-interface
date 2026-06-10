"use client";

import { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Typography,
  Tooltip,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AddIcon from "@mui/icons-material/Add";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RoutineDialog } from "@/src/components/routines/RoutineDialog";
import { toggleCompletionAction } from "@/src/actions/routines";
import type { RoutineItemListDTO } from "@/src/services/api/routines.service";
import { HEADER_HEIGHT } from "@/src/components/ui/Sidebar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoutinesClientProps {
  routines: RoutineItemListDTO[];
}

// ─── Completion toggle key: `${timeId}::${date}` ─────────────────────────────

type CompletionKey = string;

function completionKey(timeId: string, date: string): CompletionKey {
  return `${timeId}::${date}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoutinesClient({ routines }: RoutinesClientProps) {
  const theme = useTheme();
  const today = todayIso();

  // Seeded once from server data on mount. Never synced again automatically —
  // RSC re-renders (triggered by revalidatePath) would overwrite optimistic
  // state with stale data if we synced on every routines prop change.
  const [completedSet, setCompletedSet] = useState<Set<CompletionKey>>(() =>
    new Set(
      routines.flatMap((r) =>
        r.times
          .filter((t) => t.completedToday)
          .map((t) => completionKey(t.id, today)),
      ),
    ),
  );

  // Per-slot pending tracking — only the clicked slot shows a spinner.
  const [pendingSet, setPendingSet] = useState<Set<string>>(new Set());

  const handleToggle = (routineId: string, timeId: string) => {
    const key = completionKey(timeId, today);
    if (pendingSet.has(key)) return;

    // Immediate optimistic update.
    setCompletedSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

    setPendingSet((prev) => new Set(prev).add(key));

    toggleCompletionAction(routineId, timeId, today).then((result) => {
      setPendingSet((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      if (result.error) {
        // Revert on server error.
        setCompletedSet((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
      }
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: theme.spacing(2), md: theme.spacing(4) },
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ color: theme.palette.text.primary, fontWeight: 700 }}
          >
            Rotinas
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary }}
          >
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </Typography>
        </Box>

        <RoutineDialog
          trigger={
            <Tooltip title="Nova rotina">
              <IconButton
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          }
        />
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: theme.spacing(1.5), sm: theme.spacing(3), md: theme.spacing(4) },
          py: { xs: theme.spacing(2), sm: theme.spacing(3) },
        }}
      >
        {routines.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 300,
              gap: theme.spacing(2),
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: theme.palette.text.secondary }}
            >
              Nenhuma rotina criada ainda
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.disabled, maxWidth: 400 }}
            >
              Crie sua primeira rotina para acompanhar atividades recorrentes
              como &ldquo;Tomar água&rdquo;, &ldquo;Exercício&rdquo; ou qualquer hábito que deseje
              repetir ao longo do dia.
            </Typography>
            <RoutineDialog
              trigger={
                <Box
                  role="button"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: theme.spacing(1),
                    px: theme.spacing(2),
                    py: theme.spacing(1),
                    borderRadius: theme.shape.borderRadius,
                    border: `1px dashed ${alpha(theme.palette.primary.main, 0.5)}`,
                    color: theme.palette.primary.main,
                    cursor: "pointer",
                    transition: "background 0.15s",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: 18 }} />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "inherit" }}
                  >
                    Nova rotina
                  </Typography>
                </Box>
              }
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: theme.spacing(2),
            }}
          >
            {routines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                today={today}
                completedSet={completedSet}
                pendingSet={pendingSet}
                onToggle={handleToggle}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── RoutineCard ──────────────────────────────────────────────────────────────

interface RoutineCardProps {
  routine: RoutineItemListDTO;
  today: string;
  completedSet: Set<CompletionKey>;
  pendingSet: Set<string>;
  onToggle: (routineId: string, timeId: string) => void;
}

function RoutineCard({
  routine,
  today,
  completedSet,
  pendingSet,
  onToggle,
}: RoutineCardProps) {
  const theme = useTheme();

  const doneCount = routine.times.filter((t) =>
    completedSet.has(completionKey(t.id, today)),
  ).length;
  const total = routine.times.length;
  const allDone = doneCount === total && total > 0;

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${allDone ? alpha(theme.palette.success.main, 0.4) : theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        p: { xs: theme.spacing(2), sm: theme.spacing(2.5) },
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(1.5),
        transition: "border-color 0.2s",
      }}
    >
      {/* Card header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: theme.spacing(1),
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {routine.title}
          </Typography>
          {routine.description && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {routine.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          <Chip
            label={`${doneCount}/${total}`}
            size="small"
            sx={{
              bgcolor: allDone
                ? alpha(theme.palette.success.main, 0.15)
                : alpha(theme.palette.text.primary, 0.06),
              color: allDone
                ? theme.palette.success.main
                : theme.palette.text.secondary,
              fontWeight: 700,
              fontSize: 11,
              height: 22,
            }}
          />
          <RoutineDialog routine={routine} />
        </Box>
      </Box>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      {/* Time slots */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(0.75) }}>
        {routine.times
          .slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((t) => {
            const key = completionKey(t.id, today);
            const done = completedSet.has(key);
            const isSlotPending = pendingSet.has(key);
            return (
              <Box
                key={t.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing(1),
                  px: theme.spacing(1),
                  py: theme.spacing(0.5),
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: done
                    ? alpha(theme.palette.success.main, 0.08)
                    : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <IconButton
                  size="small"
                  disabled={isSlotPending}
                  onClick={() => onToggle(routine.id, t.id)}
                  sx={{
                    p: { xs: 0.5, sm: 0 },
                    color: done
                      ? theme.palette.success.main
                      : theme.palette.text.disabled,
                    "&:hover": {
                      color: done
                        ? theme.palette.success.dark
                        : theme.palette.text.secondary,
                    },
                  }}
                >
                  {isSlotPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : done ? (
                    <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: done ? 600 : 400,
                    color: done
                      ? theme.palette.success.main
                      : theme.palette.text.primary,
                    textDecoration: done ? "line-through" : "none",
                    opacity: done ? 0.8 : 1,
                  }}
                >
                  {t.startTime} – {t.endTime}
                </Typography>
              </Box>
            );
          })}
      </Box>
    </Box>
  );
}
