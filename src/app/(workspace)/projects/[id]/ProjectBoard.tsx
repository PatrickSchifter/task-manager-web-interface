"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Avatar,
  AvatarGroup,
  IconButton,
  Stack,
  Tooltip,
  Paper,
  Button,
  useMediaQuery,
} from "@mui/material";
import {
  Settings,
  Add,
  Tag,
  PersonAddAlt1,
  CheckBoxOutlined,
  DragIndicator,
  CalendarToday,
} from "@mui/icons-material";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { components } from "@/src/types/api";
import {
  ProjectCollaboratorDTO,
  ProjectTaskDTO,
} from "@/src/services/api/projects.service";
import { ProjectDialog } from "@/src/components/projects/ProjectDialog";
import { InviteCollaboratorDialog } from "@/src/components/collaborators/InviteCollaboratorDialog";
import { TaskStatus } from "@/src/components/tasks/TaskDialog";
import { TaskDialog } from "@/src/components/tasks/TaskDialog";
import { TagChip } from "@/src/components/tasks/TagChip";
import { updateTaskAction } from "@/src/actions/tasks";
import { HEADER_HEIGHT } from "@/src/components/ui/Sidebar";
import { useId } from "react";

export type ProjectFullDTO = components["schemas"]["ProjectFullDTO"];
type TagDTO = components["schemas"]["TagDTO"];

// ─── AssigneeAvatar ───────────────────────────────────────────────────────────

function AssigneeAvatar({
  initials,
  src,
}: {
  initials: string;
  src?: string | null;
}) {
  const theme = useTheme();
  const colors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.secondary?.main ?? theme.palette.info.main,
  ];
  return (
    <Avatar
      src={src ?? undefined}
      sx={{
        width: 20,
        height: 20,
        fontSize: "0.5rem",
        fontWeight: 700,
        bgcolor: colors[0 % colors.length],
        border: `2px solid ${theme.palette.background.paper}`,
        ml: 0 === 0 ? 0 : "-4px",
      }}
    >
      {initials}
    </Avatar>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

type SubtaskProgress = { done: number; total: number };

type TaskCardProps = {
  id: string;
  title: string;
  assignee: string;
  assigneeAvatar?: string | null;
  comments?: number;
  done?: boolean;
  projectId: string;
  tags?: TagDTO[];
  subtaskProgress?: SubtaskProgress;
  dueDate?: string | null;
  priority?: string | null;
  overlay?: boolean;
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#22C55E",
  MEDIUM: "#F59E0B",
  HIGH: "#EF4444",
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

/** Conteúdo visual do card, sem lógica de sortable/link. */
function TaskCardContent({
  title,
  assignee = "",
  assigneeAvatar,
  comments = 0,
  done,
  tags = [],
  subtaskProgress,
  dueDate,
  priority,
}: Omit<TaskCardProps, "id" | "overlay">) {
  const formattedDate = dueDate
    ? (() => {
        const [y, m, d] = dueDate.slice(0, 10).split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      })()
    : null;
  const priorityColor = priority ? PRIORITY_COLOR[priority] : null;
  const priorityLabel = priority ? PRIORITY_LABEL[priority] : null;
  const hasSubtasks = (subtaskProgress?.total ?? 0) > 0;
  return (
    <>
      {(tags.length > 0 || priorityColor) && (
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
        >
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, flex: 1, minWidth: 0 }}>
            {tags.map((t) => (
              <TagChip key={t.id} label={t.name} color={t.color} />
            ))}
          </Stack>
          {priorityColor && (
            <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", flexShrink: 0, ml: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: priorityColor, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontSize: "0.7rem", color: priorityColor, fontWeight: 500 }}>
                {priorityLabel}
              </Typography>
            </Stack>
          )}
        </Stack>
      )}

      <Typography
        variant="body2"
        color="text.primary"
        sx={
          done
            ? { textDecoration: "line-through", mb: 2, fontWeight: 500 }
            : undefined
        }
      >
        {title}
      </Typography>

      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mt: 1 }}
      >
        {formattedDate ? (
          <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
            <CalendarToday sx={{ fontSize: 11, color: "text.disabled" }} />
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
              {formattedDate}
            </Typography>
          </Stack>
        ) : <span />}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {hasSubtasks && (
            <Tooltip
              title={`${subtaskProgress!.done} de ${subtaskProgress!.total} subtarefas concluídas`}
            >
              <Stack
                direction="row"
                spacing={0.25}
                sx={{ alignItems: "center" }}
              >
                <CheckBoxOutlined
                  sx={{ fontSize: 13, color: "text.secondary" }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {subtaskProgress!.done}/{subtaskProgress!.total}
                </Typography>
              </Stack>
            </Tooltip>
          )}
          {comments > 0 && (
            <Typography variant="caption" color="text.secondary">
              💬 {comments}
            </Typography>
          )}
          {assignee && (
            <Stack direction="row">
              <AssigneeAvatar
                initials={assignee.slice(0, 1).toUpperCase()}
                src={assigneeAvatar}
              />
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  );
}

function TaskCard({
  id,
  title,
  assignee,
  assigneeAvatar,
  comments,
  done,
  overlay,
  projectId,
  tags,
  subtaskProgress,
  dueDate,
  priority,
}: TaskCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "task" } });

  const baseSx = {
    display: "block",
    textDecoration: "none",
    p: theme.spacing(2),
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    opacity: done ? 0.5 : 1,
    transition: "border-color 0.15s",
    "&:hover": { borderColor: theme.palette.primary.main },
  } as const;

  // Card "fantasma" mostrado no DragOverlay (segue o cursor).
  if (overlay) {
    return (
      <Paper
        elevation={6}
        sx={{
          ...baseSx,
          opacity: done ? 0.5 : 1,
          cursor: "grabbing",
          boxShadow: theme.shadows[8],
          position: "relative",
        }}
      >
        <TaskCardContent
          title={title}
          assignee={assignee}
          assigneeAvatar={assigneeAvatar}
          comments={comments}
          done={done}
          projectId={projectId}
          tags={tags}
          subtaskProgress={subtaskProgress}
          dueDate={dueDate}
          priority={priority}
        />
      </Paper>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Esconde o original enquanto arrasta (o overlay assume).
    opacity: isDragging ? 0 : done ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      style={style}
      {...attributes}
      // No desktop o card inteiro é a área de drag; no mobile apenas o handle.
      {...(isMobile ? {} : listeners)}
      sx={{
        ...baseSx,
        position: "relative",
        cursor: isMobile ? "default" : "grab",
        // No desktop bloqueia scroll do browser para o drag funcionar;
        // no mobile deixa o browser gerenciar o toque (scroll livre).
        touchAction: isMobile ? "auto" : "none",
      }}
    >
      {/* Handle de drag exclusivo para mobile — barra vertical direita */}
      {isMobile && (
        <Box
          {...listeners}
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            touchAction: "none",
            color: theme.palette.text.disabled,
            borderTopRightRadius: theme.shape.borderRadius,
            borderBottomRightRadius: theme.shape.borderRadius,
            zIndex: 1,
            "&:active": { color: theme.palette.text.secondary },
          }}
        >
          <DragIndicator sx={{ fontSize: 18 }} />
        </Box>
      )}
      <Box
        component={Link}
        href={`/projects/${projectId}/tasks/${id}`}
        sx={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
          // Reserva espaço para o handle no mobile
          pr: isMobile ? "36px" : 0,
        }}
      >
        <TaskCardContent
          title={title}
          assignee={assignee}
          assigneeAvatar={assigneeAvatar}
          comments={comments}
          done={done}
          projectId={projectId}
          tags={tags}
          subtaskProgress={subtaskProgress}
          dueDate={dueDate}
          priority={priority}
        />
      </Box>
    </Paper>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

type KanbanColumnProps = {
  title: string;
  status: TaskStatus;
  project: ProjectFullDTO;
  items: ProjectTaskDTO[];
  availableTags: TagDTO[];
  projectStatuses: { name: string; value: string }[];
  /** Ocupa a largura total — usado no layout em tabs do mobile. */
  fullWidth?: boolean;
};

function KanbanColumn({
  title,
  status,
  project,
  items,
  availableTags,
  projectStatuses,
  fullWidth,
}: KanbanColumnProps) {
  const theme = useTheme();
  // Torna a coluna inteira uma drop zone (inclusive quando vazia).
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  return (
    <Box
      sx={{
        width: fullWidth ? "100%" : { xs: 280, sm: 320 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: `color-mix(in srgb, ${theme.palette.text.primary} 3%, transparent)`,
        overflow: "hidden",
      }}
    >
      {/* ── Cabeçalho da coluna ── */}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1.25,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography
            variant="caption"
            color="text.primary"
            sx={{ textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              px: 0.75,
              borderRadius: 999,
              bgcolor: `color-mix(in srgb, ${theme.palette.text.primary} 8%, transparent)`,
              lineHeight: "18px",
              fontSize: "0.625rem",
              fontWeight: 700,
              color: theme.palette.text.secondary,
            }}
          >
            {items.length}
          </Box>
        </Stack>
        <TaskDialog
          projectId={project.id}
          defaultStatus={status}
          collaborators={project.collaborators ?? []}
          availableTags={availableTags}
          projectStatuses={projectStatuses}
          trigger={
            <Tooltip title="Adicionar tarefa">
              <IconButton size="small" sx={{ color: "text.secondary" }}>
                <Add sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          }
        />
      </Stack>

      {/* ── Área de cards ── */}
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack
          ref={setNodeRef}
          spacing={1.5}
          sx={{
            flex: 1,
            minHeight: 80,
            p: 1.5,
            transition: "background-color 0.15s",
            bgcolor: isOver
              ? `color-mix(in srgb, ${theme.palette.primary.main} 8%, transparent)`
              : "transparent",
          }}
        >
          {items.map((item) => (
            <TaskCard
              key={item.id}
              id={item.id}
              title={item.title || ""}
              assignee={item.assignee?.name || ""}
              assigneeAvatar={
                typeof item.assignee?.avatar === "string"
                  ? item.assignee.avatar
                  : undefined
              }
              comments={item.comments.length}
              done={item.status === "DONE"}
              projectId={project.id}
              tags={item.tags}
              subtaskProgress={item.subtaskProgress}
              dueDate={item.dueDate}
              priority={item.priority}
            />
          ))}
        </Stack>
      </SortableContext>
    </Box>
  );
}

// ─── ProjectBoard (export principal) ─────────────────────────────────────────

const statusRank = (status: string, columns: { status: string }[]) =>
  columns.findIndex((c) => c.status === status);

// Compara as chaves fracionárias por bytes (mesma ordem do COLLATE "C" no banco).
// NÃO usar localeCompare aqui — a collation de locale ordenaria diferente.
const compareOrderKeys = (a = "", b = "") => (a < b ? -1 : a > b ? 1 : 0);

const orderTasks = (
  list: ProjectTaskDTO[],
  columns: { status: string }[],
): ProjectTaskDTO[] =>
  [...list].sort(
    (a, b) =>
      statusRank(a.status, columns) - statusRank(b.status, columns) ||
      compareOrderKeys(a.order, b.order),
  );

export function ProjectBoard({
  project,
  availableTags = [],
}: {
  project: ProjectFullDTO;
  availableTags?: TagDTO[];
}) {
  const theme = useTheme();
  const dndId = useId();
  // No mobile mostramos uma coluna por vez (tabs); no desktop, o board completo.
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const COLUMNS = (project.statuses ?? []).map((s) => ({
    id: s.id,
    title: s.name,
    status: s.value as TaskStatus,
  }));

  const [activeStatus, setActiveStatus] = useState<TaskStatus>(
    (COLUMNS[0]?.status as TaskStatus) ?? "TODO",
  );

  const [tasks, setTasks] = useState<ProjectTaskDTO[]>(() =>
    orderTasks(project.tasks, COLUMNS),
  );
  const [prevTasks, setPrevTasks] = useState(project.tasks);

  if (project.tasks !== prevTasks) {
    setPrevTasks(project.tasks);
    setTasks(orderTasks(project.tasks, COLUMNS));
  }
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const findTask = (id: string) => tasks.find((t) => t.id === id);

  // Resolve a qual coluna (status) um id pertence — pode ser o valor de status
  // da coluna (usado como id pelo useDroppable) ou o id de uma tarefa.
  const findContainer = (id: string): TaskStatus | null => {
    if (COLUMNS.some((c) => c.status === id)) return id as TaskStatus;
    const task = tasks.find((t) => t.id === id);
    return task ? (task.status as TaskStatus) : null;
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  // Move entre colunas em tempo real. A reordenação dentro da mesma coluna é
  // finalizada no onDragEnd (o dnd-kit já anima o espaço durante o arraste).
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setTasks((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;

      const moved: ProjectTaskDTO = {
        ...prev[activeIndex],
        status: overContainer,
      };
      const next = prev.filter((t) => t.id !== activeId);

      const overIsColumn = COLUMNS.some((c) => c.status === overId);
      if (overIsColumn) {
        // soltando sobre a área da coluna → posiciona no fim dela
        const lastIdx = next.reduce(
          (acc, t, i) => (t.status === overContainer ? i : acc),
          -1,
        );
        next.splice(lastIdx + 1, 0, moved);
      } else {
        const overIndex = next.findIndex((t) => t.id === overId);
        next.splice(overIndex < 0 ? next.length : overIndex, 0, moved);
      }
      return next;
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Reordenação dentro da mesma coluna (soltou sobre outra tarefa).
    let nextTasks = tasks;
    const overIsColumn = COLUMNS.some((c) => c.status === overId);
    if (!overIsColumn && activeId !== overId) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);
      if (activeIndex !== -1 && overIndex !== -1) {
        nextTasks = arrayMove(tasks, activeIndex, overIndex);
        setTasks(nextTasks);
      }
    }

    const moved = nextTasks.find((t) => t.id === activeId);
    if (!moved) return;

    // A nova posição é o índice da tarefa dentro da sua coluna; o backend
    // calcula a chave fracionária (`order`) a partir disso.
    const columnItems = nextTasks.filter((t) => t.status === moved.status);
    const position = columnItems.findIndex((t) => t.id === activeId);
    if (position === -1) return;

    void persistOrder(activeId, moved.status as TaskStatus, position);
  };

  async function persistOrder(
    taskId: string,
    status: TaskStatus,
    position: number,
  ) {
    // dados originais (antes do drag) para preencher os campos obrigatórios
    const task =
      prevTasks.find((t) => t.id === taskId) ??
      tasks.find((t) => t.id === taskId);
    if (!task) return;

    const fd = new FormData();
    fd.set("projectId", project.id);
    fd.set("id", taskId);
    fd.set("title", task.title ?? "");
    fd.set("description", task.description ?? "");
    fd.set("status", status);
    fd.set("priority", task.priority ?? "");
    fd.set("position", String(position));
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      if (!isNaN(d.getTime())) {
        fd.set("dueDate", d.toISOString());
      }
    }
    if (task.assignee?.id) fd.set("assigneeId", task.assignee.id);

    const result = await updateTaskAction(null, fd);

    if (result?.error) {
      console.error("Falha ao reordenar a tarefa:", result.error);
      setTasks(orderTasks(prevTasks, COLUMNS)); // reverte a UI
    }
  }

  const columns = COLUMNS.map((col) => ({
    ...col,
    items: tasks.filter((task) => task.status === col.status),
  }));

  const activeTask = activeId ? findTask(activeId) : null;

  const projectName = project.name;
  const members = Array.isArray(project.collaborators)
    ? project.collaborators
        .map((m: ProjectCollaboratorDTO) => ({
          name: m.user?.name ?? "",
          initials: m.user?.name?.slice(0, 2).toUpperCase() ?? "",
          avatar:
            typeof m.user?.avatar === "string" ? m.user.avatar : undefined,
        }))
        .filter((m) => m.initials)
    : [];

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          px: { xs: theme.spacing(2), md: theme.spacing(4) },
          py: { xs: theme.spacing(2.5), md: 0 },
          minHeight: { md: HEADER_HEIGHT },
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: { xs: theme.spacing(2), md: 0 },
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", minWidth: 0 }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: theme.shape.borderRadius,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main ?? theme.palette.info.main})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Tag sx={{ fontSize: 16, color: "#fff" }} />
            </Box>
            <Typography
              variant="subtitle1"
              color="text.primary"
              sx={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {projectName}
            </Typography>
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
            gap: theme.spacing(1),
            rowGap: theme.spacing(1),
            width: { xs: "100%", md: "auto" },
          }}
        >
          <AvatarGroup
            max={4}
            sx={{
              mr: theme.spacing(1.5),
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                fontSize: "0.625rem",
                fontWeight: 700,
                border: `2px solid ${theme.palette.background.default}`,
              },
            }}
          >
            {members.map((m, i) => (
              <Avatar
                key={`${m.name}-${i}`}
                src={m.avatar}
                sx={{
                  mr: theme.spacing(1),
                  bgcolor:
                    i === 0
                      ? theme.palette.info.main
                      : i === 1
                        ? theme.palette.success.main
                        : (theme.palette.secondary?.main ??
                          theme.palette.primary.main),
                }}
              >
                {m.initials}
              </Avatar>
            ))}
          </AvatarGroup>

          {/* ── Convidar colaboradores ── */}
          <InviteCollaboratorDialog
            projectId={project.id}
            collaborators={project.collaborators ?? []}
            trigger={
              <Box
                component="button"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing(0.75),
                  px: theme.spacing(1.5),
                  py: theme.spacing(1),
                  bgcolor: "transparent",
                  color: theme.palette.text.primary,
                  borderRadius: theme.shape.borderRadius,
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  "&:hover": { bgcolor: theme.palette.action.hover },
                }}
              >
                <PersonAddAlt1 sx={{ fontSize: 16 }} />
                Convidar
              </Box>
            }
          />

          <Tooltip title="Configurações">
            <span>
              <ProjectDialog
                project={project}
                trigger={
                  <IconButton
                    size="small"
                    sx={{
                      mr: theme.spacing(1),
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius,
                      color: "text.secondary",
                    }}
                  >
                    <Settings fontSize="small" />
                  </IconButton>
                }
              />
            </span>
          </Tooltip>

          <TaskDialog
            projectId={project.id}
            collaborators={project.collaborators}
            availableTags={availableTags}
            projectStatuses={COLUMNS.map((c) => ({ name: c.title, value: c.status }))}
            trigger={
              <Box
                component="button"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing(0.75),
                  px: theme.spacing(2),
                  py: theme.spacing(1),
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  borderRadius: theme.shape.borderRadius,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  "&:hover": { opacity: 0.9 },
                }}
              >
                <Add sx={{ fontSize: 16 }} />
                Nova tarefa
              </Box>
            }
          />
        </Stack>
      </Box>

      {/* ── AI hint ───────────────────────────────────────────────────────── */}
      {/* <Box
        sx={{
          mx: { xs: theme.spacing(2), md: theme.spacing(4) },
          mt: theme.spacing(3),
          p: theme.spacing(2),
          bgcolor: `color-mix(in srgb, ${theme.palette.primary.main} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${theme.palette.primary.main} 25%, transparent)`,
          borderRadius: theme.shape.borderRadius,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: theme.spacing(1), sm: theme.spacing(2) },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <AutoAwesome sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="body2" color="text.primary">
            A Solut AI detectou{" "}
            <Box component="strong">2 tarefas bloqueadas</Box>. Quer ver um
            plano de desbloqueio?
          </Typography>
        </Stack>
        <Typography
          component={Link}
          href="/chat"
          color="primary.main"
          sx={{
            textDecoration: "none",
            fontWeight: 700,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Abrir chat →
        </Typography>
      </Box> */}

      {/* ── Kanban ────────────────────────────────────────────────────────── */}
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {isMobile ? (
          /* ── Mobile: uma coluna por vez, selecionada por tabs ── */
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Tabs das colunas */}
            <Box
              sx={{
                display: "flex",
                gap: theme.spacing(1),
                px: theme.spacing(2),
                pt: theme.spacing(2),
              }}
            >
              {columns.map((col) => {
                const active = col.status === activeStatus;
                return (
                  <Button
                    key={col.id}
                    onClick={() => setActiveStatus(col.status)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      gap: theme.spacing(0.75),
                      px: theme.spacing(1),
                      py: theme.spacing(0.75),
                      borderRadius: theme.shape.borderRadius,
                      fontSize: "0.75rem",
                      fontWeight: active ? 700 : 600,
                      textTransform: "none",
                      lineHeight: 1.2,
                      color: active
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                      bgcolor: active
                        ? `color-mix(in srgb, ${theme.palette.primary.main} 12%, transparent)`
                        : "transparent",
                      border: `1px solid ${
                        active
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                      "&:hover": {
                        bgcolor: active
                          ? `color-mix(in srgb, ${theme.palette.primary.main} 18%, transparent)`
                          : theme.palette.action.hover,
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                      }}
                    >
                      {col.title}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        flexShrink: 0,
                        px: theme.spacing(0.75),
                        borderRadius: 999,
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        bgcolor: active
                          ? theme.palette.primary.main
                          : theme.palette.action.hover,
                        color: active
                          ? theme.palette.primary.contrastText
                          : theme.palette.text.secondary,
                      }}
                    >
                      {(col.items ?? []).length}
                    </Box>
                  </Button>
                );
              })}
            </Box>

            {/* Coluna ativa */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                p: theme.spacing(2),
              }}
            >
              {(() => {
                const col =
                  columns.find((c) => c.status === activeStatus) ?? columns[0];
                return (
                  <KanbanColumn
                    key={col.id}
                    fullWidth
                    title={col.title}
                    status={col.status}
                    project={project}
                    items={col.items ?? []}
                    availableTags={availableTags}
                    projectStatuses={COLUMNS.map((c) => ({ name: c.title, value: c.status }))}
                  />
                );
              })()}
            </Box>
          </Box>
        ) : (
          /* ── Desktop: board horizontal com todas as colunas ── */
          <Box
            sx={{
              flex: 1,
              overflowX: "auto",
              p: theme.spacing(3),
              display: "flex",
              alignItems: "flex-start",
              gap: theme.spacing(2),
            }}
          >
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                title={col.title}
                status={col.status}
                project={project}
                items={col.items ?? []}
                availableTags={availableTags}
                projectStatuses={COLUMNS.map((c) => ({ name: c.title, value: c.status }))}
              />
            ))}
          </Box>
        )}

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              overlay
              id={activeTask.id}
              title={activeTask.title || ""}
              assignee={activeTask.assignee?.name || ""}
              assigneeAvatar={
                typeof activeTask.assignee?.avatar === "string"
                  ? activeTask.assignee.avatar
                  : undefined
              }
              comments={activeTask.comments.length}
              done={activeTask.status === "DONE"}
              projectId={project.id}
              tags={activeTask.tags}
              subtaskProgress={activeTask.subtaskProgress}
              dueDate={activeTask.dueDate}
              priority={activeTask.priority}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}
