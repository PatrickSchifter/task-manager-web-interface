// app/(workspace)/app/tasks/[id]/TaskDetail.tsx
"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Paper,
  IconButton,
  TextField,
  Tooltip,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import {
  CalendarToday,
  Flag,
  AttachFile,
  AutoAwesome,
  People,
  Description,
  Download,
} from "@mui/icons-material";
import type { components } from "@/src/types/api";
import { TaskDialog } from "@/src/components/tasks/TaskDialog";
import { TagChip } from "@/src/components/tasks/TagChip";
import { Edit, DeleteOutlined, Check, Close } from "@mui/icons-material";
import { TaskItemListDTO } from "@/src/services/api/tasks.service";
import { ProjectFullDTO } from "../../ProjectBoard";
import { SubtasksSection } from "./SubtasksSection";
import { useWorkspace } from "@/src/providers/workspace-provider";
import {
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
} from "@/src/actions/comments";

type TaskFullDTO = components["schemas"]["TaskFullDTO"];
type TaskCommentDTO = components["schemas"]["TaskCommentDTO"];

type AttachmentMeta = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
};

// TaskCommentDTO from api.ts doesn't include attachments yet; extend locally
type CommentWithAttachments = TaskCommentDTO & {
  attachments?: AttachmentMeta[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min atrás`;

  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Status/Priority helpers ──────────────────────────────────────────────────

function usePriorityColor() {
  const theme = useTheme();
  return (priority?: string) => {
    switch (priority) {
      case "LOW":
        return theme.palette.success.main;
      case "MEDIUM":
        return theme.palette.warning.main;
      case "HIGH":
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };
}

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ sx?: object }>;
  label: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", mb: theme.spacing(1.5) }}
      >
        <Icon sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

// ─── CommentAvatar ────────────────────────────────────────────────────────────

function CommentAvatar({
  initials,
  isAI,
  src,
}: {
  initials: string;
  isAI?: boolean;
  src?: string | null;
}) {
  const theme = useTheme();
  return (
    <Avatar
      src={src ?? undefined}
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        fontSize: "0.6875rem",
        fontWeight: 700,
        bgcolor: isAI ? theme.palette.primary.main : theme.palette.success.main,
        color: isAI
          ? theme.palette.primary.contrastText
          : theme.palette.common.white,
      }}
    >
      {initials}
    </Avatar>
  );
}

// ─── AttachmentRow / AttachmentList ──────────────────────────────────────────

function AttachmentRow({
  attachment,
  compact = false,
}: {
  attachment: AttachmentMeta;
  compact?: boolean;
}) {
  const theme = useTheme();

  return (
    <Stack
      component="a"
      href={`/api/attachments/${attachment.id}/download`}
      target="_blank"
      rel="noopener noreferrer"
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        px: compact ? 1 : 1.5,
        py: compact ? 0.75 : 1,
        borderRadius: `${theme.shape.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.default,
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        transition: "background-color 0.15s",
        "&:hover": { bgcolor: theme.palette.action.hover },
      }}
    >
      <Description
        sx={{ fontSize: compact ? 14 : 16, color: "text.secondary", flexShrink: 0 }}
      />
      <Typography
        variant="caption"
        noWrap
        sx={{ flex: 1, fontWeight: 500, minWidth: 0 }}
      >
        {attachment.fileName}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
      >
        {formatBytes(attachment.size)}
      </Typography>
      <Download sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
    </Stack>
  );
}

function AttachmentList({
  attachments,
  compact = false,
}: {
  attachments: AttachmentMeta[];
  compact?: boolean;
}) {
  if (!attachments.length) return null;
  return (
    <Stack spacing={0.75}>
      {attachments.map((a) => (
        <AttachmentRow key={a.id} attachment={a} compact={compact} />
      ))}
    </Stack>
  );
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  projectId,
  taskId,
  isOwn,
}: {
  comment: CommentWithAttachments;
  projectId: string;
  taskId: string;
  isOwn: boolean;
}) {
  const theme = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [updateState, updateAction, isUpdating] = useActionState(
    updateCommentAction,
    null,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteCommentAction,
    null,
  );
  const prevUpdateSuccessRef = useRef(false);

  useEffect(() => {
    if (updateState?.success && !prevUpdateSuccessRef.current) {
      prevUpdateSuccessRef.current = true;
      setIsEditing(false);
    }
    if (!updateState?.success) prevUpdateSuccessRef.current = false;
  }, [updateState?.success]);

  const startEditing = () => {
    setEditContent(comment.content);
    setConfirmingDelete(false);
    setIsEditing(true);
  };

  return (
    <Stack direction="row" spacing={1.5}>
      <CommentAvatar
        initials={comment.author?.name?.slice(0, 2).toUpperCase() ?? "??"}
        isAI={false}
        src={
          typeof comment.author?.avatar === "string"
            ? comment.author.avatar
            : undefined
        }
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", mb: 0.5 }}
        >
          <Typography
            variant="body2"
            color="text.primary"
            sx={{ fontWeight: 600 }}
          >
            {comment.author?.name ?? "Usuário sem nome"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            · {formatRelativeDate(comment.createdAt)}
          </Typography>

          {isOwn && !isEditing && (
            <Stack
              direction="row"
              spacing={0.25}
              sx={{ ml: "auto", alignItems: "center" }}
            >
              {confirmingDelete ? (
                <Stack
                  component="form"
                  action={deleteAction}
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: "center" }}
                >
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="taskId" value={taskId} />
                  <input type="hidden" name="commentId" value={comment.id} />
                  <Typography variant="caption" color="text.secondary">
                    Excluir?
                  </Typography>
                  <Button
                    type="submit"
                    size="small"
                    color="error"
                    disabled={isDeleting}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      fontSize: "0.6875rem",
                      textTransform: "none",
                    }}
                  >
                    {isDeleting ? "Excluindo…" : "Sim"}
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    color="inherit"
                    disabled={isDeleting}
                    onClick={() => setConfirmingDelete(false)}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      fontSize: "0.6875rem",
                      textTransform: "none",
                      color: "text.secondary",
                    }}
                  >
                    Não
                  </Button>
                </Stack>
              ) : (
                <>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={startEditing}
                      sx={{ color: "text.secondary" }}
                    >
                      <Edit sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      onClick={() => setConfirmingDelete(true)}
                      sx={{ color: "text.secondary" }}
                    >
                      <DeleteOutlined sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          )}
        </Stack>

        {isEditing ? (
          <Stack component="form" action={updateAction} spacing={1}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="taskId" value={taskId} />
            <input type="hidden" name="commentId" value={comment.id} />
            <Paper
              elevation={0}
              sx={{
                borderRadius: theme.shape.borderRadius,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.primary.main}`,
              }}
            >
              <TextField
                name="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                multiline
                minRows={2}
                fullWidth
                autoFocus
                variant="standard"
                disabled={isUpdating}
                slotProps={{ input: { disableUnderline: true } }}
                sx={{ p: theme.spacing(1.5) }}
              />
            </Paper>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Button
                type="submit"
                size="small"
                variant="contained"
                startIcon={<Check sx={{ fontSize: 14 }} />}
                disabled={isUpdating || !editContent.trim()}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                {isUpdating ? "Salvando…" : "Salvar"}
              </Button>
              <Button
                type="button"
                size="small"
                startIcon={<Close sx={{ fontSize: 14 }} />}
                disabled={isUpdating}
                onClick={() => setIsEditing(false)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  color: "text.secondary",
                }}
              >
                Cancelar
              </Button>
              {updateState?.error && (
                <Typography variant="caption" color="error">
                  {updateState.error}
                </Typography>
              )}
            </Stack>
          </Stack>
        ) : (
          <>
            <Paper
              elevation={0}
              sx={{
                p: theme.spacing(1.5),
                borderRadius: theme.shape.borderRadius,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {comment.content}
              </Typography>
              {comment.attachments && comment.attachments.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <AttachmentList attachments={comment.attachments} compact />
                </>
              )}
            </Paper>
            {deleteState?.error && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mt: 0.5 }}
              >
                {deleteState.error}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
}

// ─── TaskDetail (export principal) ───────────────────────────────────────────

type TagDTO = components["schemas"]["TagDTO"];

export function TaskDetail({
  task,
  project,
  availableTags = [],
}: {
  task: TaskFullDTO;
  project: ProjectFullDTO;
  availableTags?: TagDTO[];
}) {
  const theme = useTheme();
  const priorityColor = usePriorityColor();
  const { user } = useWorkspace();

  // ── Composer de comentários ─────────────────────────────────────────────────
  const [commentContent, setCommentContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [commentState, commentAction, isCommentPending] = useActionState(
    createCommentAction,
    null,
  );
  const prevCommentSuccessRef = useRef(false);

  useEffect(() => {
    if (commentState?.success && !prevCommentSuccessRef.current) {
      prevCommentSuccessRef.current = true;
      setCommentContent("");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (!commentState?.success) prevCommentSuccessRef.current = false;
  }, [commentState?.success]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setSelectedFiles(files);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        for (const f of next) dt.items.add(f);
        fileInputRef.current.files = dt.files;
      }
      return next;
    });
  };

  const safeString = (value: unknown, fallback = ""): string =>
    typeof value === "string" ? value : fallback;

  const title = safeString(task.title, "Tarefa sem título");
  const description = safeString(task.description, "");
  const priority =
    typeof task.priority === "string" ? task.priority : undefined;

  const dueDate = (() => {
    const value = task.dueDate as string | null | undefined;
    if (value && typeof value === "string") {
      const [y, m, d] = value.slice(0, 10).split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
      });
    }
    return "Sem prazo";
  })();

  const tags = task.tags ?? [];
  const comments = (task.comments ?? []) as CommentWithAttachments[];
  const allAttachments = comments.flatMap((c) => c.attachments ?? []);

  return (
    <Box sx={{ flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden" }}>
      {/* ── Grid principal ──────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: { xs: theme.spacing(3), md: theme.spacing(4) },
          p: { xs: theme.spacing(2), md: theme.spacing(4) },
          maxWidth: 1280,
          minWidth: 0,
        }}
      >
        {/* ── Coluna principal ──────────────────────────────────────────── */}
        <Stack spacing={theme.spacing(4)} sx={{ minWidth: 0 }}>
          <Box>
            <Stack
              direction="row"
              sx={{
                flexWrap: "wrap",
                mb: theme.spacing(1.5),
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {tags.length > 0 && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ flexWrap: "wrap", gap: 1, mb: theme.spacing(1) }}
                  >
                    {tags.map((t) => (
                      <TagChip key={t.id} label={t.name} color={t.color} />
                    ))}
                  </Stack>
                )}
                <Typography
                  variant="h4"
                  color="text.primary"
                  sx={{ fontWeight: 700, wordBreak: "break-word" }}
                >
                  {title}
                </Typography>
              </Box>

              <TaskDialog
                projectId={project.id}
                task={
                  {
                    id: String(task.id),
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    tags: task.tags,
                    assignee: task.assignee
                      ? { id: task.assignee.id, name: task.assignee.name }
                      : undefined,
                  } as unknown as TaskItemListDTO
                }
                collaborators={project.collaborators}
                availableTags={availableTags}
                trigger={
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit sx={{ fontSize: 16 }} />}
                    sx={{
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary,
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: theme.shape.borderRadius,
                      "&:hover": { borderColor: theme.palette.text.secondary },
                    }}
                  >
                    Editar
                  </Button>
                }
              />
            </Stack>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mt: theme.spacing(2),
                lineHeight: 1.7,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {description}
            </Typography>
          </Box>

          {/* ── Subtarefas ──────────────────────────────────────────────── */}
          {!task.parentId && (
            <SubtasksSection
              taskId={String(task.id)}
              project={project}
              subtasks={task.subtasks ?? []}
              availableTags={availableTags}
            />
          )}

          {/* ── Comentários ─────────────────────────────────────────────── */}
          <Box>
            <Typography
              variant="subtitle1"
              color="text.primary"
              sx={{ fontWeight: 700, mb: theme.spacing(2) }}
            >
              Comentários
              {comments.length > 0 && (
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1, fontFamily: "monospace", fontWeight: 400 }}
                >
                  {comments.length}
                </Typography>
              )}
            </Typography>

            <Stack spacing={2}>
              {comments.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: theme.spacing(1) }}
                >
                  Ainda não há comentários. Seja o primeiro a comentar.
                </Typography>
              )}

              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  projectId={project.id}
                  taskId={String(task.id)}
                  isOwn={c.author?.id === user.id}
                />
              ))}

              {/* ── Composer ──────────────────────────────────────────── */}
              <Stack
                component="form"
                action={commentAction}
                direction="row"
                spacing={1.5}
              >
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="taskId" value={String(task.id)} />
                {/* Hidden file input — name="files" puts files in FormData */}
                <input
                  ref={fileInputRef}
                  type="file"
                  name="files"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv,.md"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <CommentAvatar
                  initials={user.name?.slice(0, 2).toUpperCase() ?? "EU"}
                  src={user.avatar}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius,
                      transition: "border-color 0.15s",
                      "&:focus-within": {
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <TextField
                      name="content"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          (e.metaKey || e.ctrlKey) &&
                          e.key === "Enter" &&
                          commentContent.trim() &&
                          !isCommentPending
                        ) {
                          e.preventDefault();
                          e.currentTarget.closest("form")?.requestSubmit();
                        }
                      }}
                      multiline
                      minRows={2}
                      fullWidth
                      variant="standard"
                      placeholder="Escreva um comentário"
                      disabled={isCommentPending}
                      slotProps={{ input: { disableUnderline: true } }}
                      sx={{ p: theme.spacing(1.5) }}
                    />

                    {/* ── Pré-visualização dos arquivos selecionados ── */}
                    {selectedFiles.length > 0 && (
                      <Stack
                        direction="row"
                        sx={{
                          flexWrap: "wrap",
                          gap: 1,
                          px: theme.spacing(1.5),
                          pb: theme.spacing(1),
                        }}
                      >
                        {selectedFiles.map((file, i) => (
                          <Chip
                            key={`${file.name}-${i}`}
                            icon={<Description sx={{ fontSize: 14 }} />}
                            label={
                              <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{ alignItems: "center" }}
                              >
                                <Typography
                                  variant="caption"
                                  noWrap
                                  sx={{ maxWidth: 120, display: "block" }}
                                >
                                  {file.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ whiteSpace: "nowrap" }}
                                >
                                  · {formatBytes(file.size)}
                                </Typography>
                              </Stack>
                            }
                            onDelete={() => removeSelectedFile(i)}
                            size="small"
                            disabled={isCommentPending}
                            sx={{
                              height: "auto",
                              py: 0.5,
                              borderRadius: theme.shape.borderRadius,
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                        ))}
                      </Stack>
                    )}

                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: theme.spacing(1.5),
                        py: theme.spacing(1),
                        borderTop: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Stack direction="row" spacing={1.5}>
                        <Tooltip title="Anexar arquivo (PDF, DOC, DOCX, TXT, CSV, MD — máx 20 MB)">
                          <span>
                            <IconButton
                              size="small"
                              disabled={isCommentPending}
                              onClick={() => fileInputRef.current?.click()}
                              sx={{
                                color:
                                  selectedFiles.length > 0
                                    ? "primary.main"
                                    : "text.secondary",
                              }}
                            >
                              <AttachFile sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={isCommentPending || !commentContent.trim()}
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          borderRadius: theme.shape.borderRadius,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "none",
                          "&:hover": { opacity: 0.9 },
                        }}
                      >
                        {isCommentPending ? "Enviando…" : "Comentar"}
                      </Button>
                    </Stack>
                  </Paper>
                  {commentState?.error && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ display: "block", mt: 0.5, ml: 0.5 }}
                    >
                      {commentState.error}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Stack>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <Stack component="aside" spacing={3} sx={{ minWidth: 0 }}>
          <MetaRow icon={Flag} label="Prioridade">
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: priorityColor(priority),
                }}
              />
              <Typography variant="body2" color="text.primary">
                {priority ? (PRIORITY_LABEL[priority] ?? priority) : "—"}
              </Typography>
            </Stack>
          </MetaRow>

          <MetaRow icon={CalendarToday} label="Prazo">
            <Typography variant="body2" color="text.primary">
              {dueDate}
            </Typography>
          </MetaRow>

          <MetaRow icon={People} label="Colaboradores">
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Avatar
                  src={
                    typeof task.assignee?.avatar === "string"
                      ? task.assignee.avatar
                      : undefined
                  }
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  {task.assignee?.name?.slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" color="text.primary" noWrap>
                    {task.assignee?.name}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </MetaRow>

          {allAttachments.length > 0 && (
            <MetaRow icon={AttachFile} label={`Anexos · ${allAttachments.length}`}>
              <AttachmentList attachments={allAttachments} />
            </MetaRow>
          )}

          <Paper
            component={Link}
            href="/chat"
            elevation={0}
            sx={{
              display: "block",
              textDecoration: "none",
              p: theme.spacing(2),
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: theme.shape.borderRadius,
              transition: "background-color 0.15s",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mb: 1 }}
            >
              <AutoAwesome sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography
                variant="body2"
                color="text.primary"
                sx={{ fontWeight: 700 }}
              >
                Discutir com a IA
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.6 }}
            >
              Peça resumos, plano de execução ou casos de teste sobre esta
              tarefa.
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
