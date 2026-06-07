"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme, type Theme } from "@mui/material/styles";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Avatar,
  Checkbox,
  Button,
} from "@mui/material";
import {
  CheckBox as CheckBoxIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CalendarToday,
} from "@mui/icons-material";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskItemListDTO } from "@/src/services/api/tasks.service";
import type { ProjectFullDTO } from "../../ProjectBoard";
import type { components } from "@/src/types/api";
import { TaskDialog, type TaskStatus } from "@/src/components/tasks/TaskDialog";
import { updateTaskAction } from "@/src/actions/tasks";

type TagDTO = components["schemas"]["TagDTO"];

// ─── Ordenação (espelha o board: status, depois a chave fracionária) ─────────

const STATUS_RANK: Record<string, number> = {
  TODO: 0,
  IN_PROGRESS: 1,
  DONE: 2,
};

// Compara por bytes (mesma ordem do COLLATE "C" no banco) — não usar localeCompare.
const compareOrderKeys = (a = "", b = "") => (a < b ? -1 : a > b ? 1 : 0);

const orderSubtasks = (list: TaskItemListDTO[]): TaskItemListDTO[] =>
  [...list].sort(
    (a, b) =>
      (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0) ||
      compareOrderKeys(a.order, b.order),
  );

const PRIORITY_COLOR: Record<string, (t: Theme) => string> = {
  LOW: (t) => t.palette.success.main,
  MEDIUM: (t) => t.palette.warning.main,
  HIGH: (t) => t.palette.error.main,
};

// Monta o FormData de update reaproveitando os campos atuais da subtarefa.
// A action exige título e os demais campos obrigatórios.
function buildUpdateFormData(
  projectId: string,
  subtask: TaskItemListDTO,
  overrides: { status?: TaskStatus; position?: number },
): FormData {
  const fd = new FormData();
  fd.set("projectId", projectId);
  fd.set("id", subtask.id);
  fd.set("title", subtask.title ?? "");
  fd.set(
    "description",
    typeof subtask.description === "string" ? subtask.description : "",
  );
  fd.set("status", overrides.status ?? subtask.status);
  fd.set("priority", subtask.priority ?? "MEDIUM");
  if (typeof subtask.dueDate === "string" && subtask.dueDate) {
    const d = new Date(subtask.dueDate);
    if (!Number.isNaN(d.getTime())) fd.set("dueDate", d.toISOString());
  }
  if (subtask.assignee?.id) fd.set("assigneeId", subtask.assignee.id);
  if (overrides.position !== undefined) {
    fd.set("position", String(overrides.position));
  }
  return fd;
}

// ─── Linha de subtarefa (sortable) ───────────────────────────────────────────

function SubtaskRow({
  subtask,
  project,
  availableTags,
  onToggleDone,
  busy,
}: {
  subtask: TaskItemListDTO;
  project: ProjectFullDTO;
  availableTags: TagDTO[];
  onToggleDone: (subtask: TaskItemListDTO, done: boolean) => void;
  busy: boolean;
}) {
  const theme = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id, data: { type: "subtask" } });

  const done = subtask.status === "DONE";
  const priorityColor = (PRIORITY_COLOR[subtask.priority] ?? (() => theme.palette.text.secondary))(
    theme,
  );

  const dueLabel =
    typeof subtask.dueDate === "string" && subtask.dueDate
      ? new Date(subtask.dueDate).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        })
      : null;

  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      spacing={1}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      sx={{
        alignItems: "center",
        p: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        "&:hover": { bgcolor: theme.palette.action.hover },
      }}
    >
      {/* Handle de arraste + status (checkbox marca/desmarca DONE) */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: "grab",
          touchAction: "none",
          display: "flex",
          color: "text.disabled",
          px: 0.25,
        }}
        aria-label="Reordenar subtarefa"
      >
        ⠿
      </Box>
      <Checkbox
        size="small"
        checked={done}
        disabled={busy}
        onChange={(e) => onToggleDone(subtask, e.target.checked)}
        icon={<CheckBoxIcon sx={{ opacity: 0.25 }} />}
        sx={{ p: 0.5 }}
        slotProps={{ input: { "aria-label": `Concluir ${subtask.title}` } }}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component={Link}
          href={`/projects/${project.id}/tasks/${subtask.id}`}
          variant="body2"
          color={done ? "text.secondary" : "text.primary"}
          sx={{
            textDecoration: done ? "line-through" : "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            "&:hover": { color: theme.palette.primary.main },
          }}
        >
          {subtask.title}
        </Typography>
      </Box>

      {dueLabel && (
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ alignItems: "center", color: "text.secondary" }}
        >
          <CalendarToday sx={{ fontSize: 12 }} />
          <Typography variant="caption">{dueLabel}</Typography>
        </Stack>
      )}

      <Tooltip title={`Prioridade ${subtask.priority}`}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: priorityColor,
            flexShrink: 0,
          }}
        />
      </Tooltip>

      {subtask.assignee && (
        <Tooltip title={subtask.assignee.name}>
          <Avatar
            sx={{
              width: 22,
              height: 22,
              fontSize: "0.6rem",
              fontWeight: 700,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          >
            {subtask.assignee.name.slice(0, 1).toUpperCase()}
          </Avatar>
        </Tooltip>
      )}

      {/* Editar (status/assignee/etc.) e remover — via TaskDialog em modo edição */}
      <TaskDialog
        projectId={project.id}
        task={subtask}
        collaborators={project.collaborators}
        availableTags={availableTags}
        trigger={
          <Tooltip title="Editar subtarefa">
            <IconButton size="small" sx={{ color: "text.secondary" }}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        }
      />
    </Stack>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────

export function SubtasksSection({
  taskId,
  project,
  subtasks,
  availableTags = [],
}: {
  taskId: string;
  project: ProjectFullDTO;
  subtasks: TaskItemListDTO[];
  availableTags?: TagDTO[];
}) {
  const theme = useTheme();

  const [items, setItems] = useState<TaskItemListDTO[]>(() =>
    orderSubtasks(subtasks),
  );
  // Ressincroniza quando a prop muda (após revalidação do server).
  const [prev, setPrev] = useState(subtasks);
  if (subtasks !== prev) {
    setPrev(subtasks);
    setItems(orderSubtasks(subtasks));
  }

  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const done = items.filter((s) => s.status === "DONE").length;
  const total = items.length;

  async function persist(
    subtask: TaskItemListDTO,
    overrides: { status?: TaskStatus; position?: number },
    revertTo: TaskItemListDTO[],
  ) {
    setBusy(true);
    const fd = buildUpdateFormData(project.id, subtask, overrides);
    const result = await updateTaskAction(null, fd);
    setBusy(false);
    if (result?.error) {
      console.error("Falha ao atualizar subtarefa:", result.error);
      setItems(orderSubtasks(revertTo)); // reverte
    }
  }

  function handleToggleDone(subtask: TaskItemListDTO, checked: boolean) {
    const before = items;
    const nextStatus: TaskStatus = checked ? "DONE" : "TODO";
    // Atualização otimista do status local.
    setItems((cur) =>
      orderSubtasks(
        cur.map((s) => (s.id === subtask.id ? { ...s, status: nextStatus } : s)),
      ),
    );
    void persist(subtask, { status: nextStatus }, before);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const before = items;
    const activeIndex = items.findIndex((s) => s.id === active.id);
    const overIndex = items.findIndex((s) => s.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;

    const moved = items[activeIndex];
    const next = arrayMove(items, activeIndex, overIndex);
    setItems(next);

    // Posição entre os irmãos de MESMO status (o espaço de `order` é por status).
    // O arraste não muda o status — só reordena dentro do grupo.
    const sameStatus = next.filter((s) => s.status === moved.status);
    const position = sameStatus.findIndex((s) => s.id === moved.id);
    if (position === -1) return;

    void persist(moved, { status: moved.status as TaskStatus, position }, before);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        p: theme.spacing(3),
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: theme.spacing(2),
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <CheckBoxIcon sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography
            variant="subtitle1"
            color="text.primary"
            sx={{ fontWeight: 700 }}
          >
            Subtarefas
          </Typography>
          {total > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: "monospace" }}
            >
              {done}/{total}
            </Typography>
          )}
        </Stack>

        <TaskDialog
          projectId={project.id}
          parentId={taskId}
          collaborators={project.collaborators}
          availableTags={availableTags}
          trigger={
            <Button
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "text.secondary",
                "&:hover": { color: "text.primary" },
              }}
            >
              Adicionar
            </Button>
          }
        />
      </Stack>

      {total === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          Nenhuma subtarefa ainda. Divida esta tarefa em passos menores.
        </Typography>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={0.25}>
              {items.map((s) => (
                <SubtaskRow
                  key={s.id}
                  subtask={s}
                  project={project}
                  availableTags={availableTags}
                  onToggleDone={handleToggleDone}
                  busy={busy}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}
    </Paper>
  );
}
