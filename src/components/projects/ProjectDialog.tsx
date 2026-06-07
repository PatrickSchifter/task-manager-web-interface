"use client";

import {
  useEffect,
  useActionState,
  useState,
  useRef,
  startTransition,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Alert,
  IconButton,
  Divider,
  useMediaQuery,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import TagIcon from "@mui/icons-material/Tag";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ViewWeekOutlinedIcon from "@mui/icons-material/ViewWeekOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "@/src/actions/projects";
import type { Theme } from "@mui/material/styles";
import type { ProjectItemListDTO } from "@/src/services/api/projects.service";

// ─── Color options ────────────────────────────────────────────────────────────

// const COLOR_OPTIONS = [
//   { label: "Azul", value: "blue", hex: "#3B82F6" },
//   { label: "Esmeralda", value: "emerald", hex: "#10B981" },
//   { label: "Âmbar", value: "amber", hex: "#F59E0B" },
//   { label: "Roxo", value: "purple", hex: "#8B5CF6" },
//   { label: "Rosa", value: "pink", hex: "#EC4899" },
//   { label: "Vermelho", value: "red", hex: "#EF4444" },
// ] as const;

// ─── Default statuses ─────────────────────────────────────────────────────────

const DEFAULT_STATUSES = [
  { name: "A Fazer", value: "TODO" },
  { name: "Em Progresso", value: "IN_PROGRESS" },
  { name: "Concluído", value: "DONE" },
];

type StatusDraft = { id?: string; name: string; value: string };

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectDialogProps {
  trigger?: React.ReactNode;
  // ausente = modo create, presente = modo edit.
  // Aceita tanto ProjectItemListDTO (lista) quanto ProjectFullDTO (detalhe),
  // que divergem em role/membersCount mas compartilham estes campos.
  project?: Pick<ProjectItemListDTO, "id" | "name" | "description"> & {
    statuses?: { id: string; name: string; value: string; order?: number }[];
  };
}

// ─── SortableStatusRow ────────────────────────────────────────────────────────

function SortableStatusRow({
  id,
  name,
  disabled,
  canDelete,
  onNameChange,
  onDelete,
  theme,
}: {
  id: string;
  name: string;
  disabled: boolean;
  canDelete: boolean;
  onNameChange: (v: string) => void;
  onDelete: () => void;
  theme: Theme;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : "auto",
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: disabled ? "default" : "grab",
          color: theme.palette.text.disabled,
          flexShrink: 0,
          "&:active": { cursor: "grabbing" },
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 18 }} />
      </Box>
      <TextField
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        size="small"
        fullWidth
        disabled={disabled}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={fieldSx(theme)}
      />
      <IconButton
        size="small"
        disabled={disabled || !canDelete}
        onClick={onDelete}
        sx={{ color: theme.palette.text.secondary, flexShrink: 0 }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Stack>
  );
}

// ─── View types ───────────────────────────────────────────────────────────────

type View = "form" | "delete-confirm";

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectDialog({ trigger, project }: ProjectDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = !!project;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("form");
  const [statuses, setStatuses] = useState<StatusDraft[]>(() =>
    project?.statuses?.length
      ? project.statuses.map((s) => ({ ...s }))
      : DEFAULT_STATUSES.map((s) => ({ ...s })),
  );
  // const [color, setColor] = useState<string>(
  //   project?.color ?? COLOR_OPTIONS[0].value,
  // );

  // Cada action tem seu próprio estado — sem colisão
  const action = isEdit ? updateProjectAction : createProjectAction;
  const [formState, formAction, isFormPending] = useActionState(action, null);
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteProjectAction,
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleStatusDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setStatuses((prev) => {
      const oldIdx = prev.findIndex((s) => s.value === active.id);
      const newIdx = prev.findIndex((s) => s.value === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const prevFormSuccessRef = useRef(false);
  const prevDeleteSuccessRef = useRef(false);

  // Reseta o guard toda vez que o dialog abre
  useEffect(() => {
    if (open) prevFormSuccessRef.current = false;
  }, [open]);

  // Fecha ao concluir com sucesso — usa `formState` (referência) como dependency
  // para re-executar mesmo quando o resultado for success→success consecutivo
  useEffect(() => {
    if (formState?.success && !prevFormSuccessRef.current) {
      prevFormSuccessRef.current = true;
      startTransition(() => {
        setOpen(false);
        setView("form");
      });
    }
    if (!formState?.success) prevFormSuccessRef.current = false;
  }, [formState, isEdit]);

  useEffect(() => {
    if (deleteState?.success && !prevDeleteSuccessRef.current) {
      prevDeleteSuccessRef.current = true;
      startTransition(() => {
        setOpen(false);
        setView("form");
      });
    }
    if (!deleteState?.success) prevDeleteSuccessRef.current = false;
  }, [deleteState?.success]);

  const handleClose = () => {
    if (isFormPending || isDeletePending) return;
    setOpen(false);
    setView("form");
    setStatuses(
      project?.statuses?.length
        ? project.statuses.map((s) => ({ ...s }))
        : DEFAULT_STATUSES.map((s) => ({ ...s })),
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger ── */}
      {trigger ? (
        <Box onClick={() => setOpen(true)} sx={{ display: "contents" }}>
          {trigger}
        </Box>
      ) : (
        <Tooltip title="Novo projeto" placement="right">
          <IconButton
            size="small"
            onClick={() => setOpen(true)}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": { color: theme.palette.text.primary },
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* ── Dialog ── */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          paper: {
            sx: {
              bgcolor: theme.palette.background.paper,
              border: isMobile ? "none" : `1px solid ${theme.palette.divider}`,
              borderRadius: isMobile ? 0 : theme.shape.borderRadius,
              boxShadow: isMobile ? "none" : theme.shadows[8],
            },
          },
        }}
      >
        {view === "form" ? (
          // ── VIEW: formulário ────────────────────────────────────────────────
          <form action={formAction}>
            {/* <input type="hidden" name="color" value={color} /> */}
            {isEdit && <input type="hidden" name="id" value={project.id} />}

            {/* Header */}
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1.5),
                pb: 2,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: theme.shape.borderRadius,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <TagIcon sx={{ fontSize: 16, color: "#fff" }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}
                >
                  {isEdit ? "Configurações do projeto" : "Novo projeto"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {isEdit
                    ? "Altere as informações ou remova o projeto."
                    : "Organize tarefas e colaboradores em um espaço."}
                </Typography>
              </Box>
            </DialogTitle>

            {/* Body */}
            <DialogContent sx={{ pt: `${theme.spacing(2)} !important` }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.spacing(3),
                }}
              >
                {formState?.error && (
                  <Alert
                    severity="error"
                    sx={{ borderRadius: theme.shape.borderRadius }}
                  >
                    {formState.error}
                  </Alert>
                )}

                <TextField
                  name="name"
                  label="Nome do projeto"
                  placeholder="Ex: Q4 Roadmap, API v2..."
                  defaultValue={project?.name}
                  required
                  fullWidth
                  autoFocus
                  disabled={isFormPending}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldSx(theme)}
                />

                <TextField
                  name="description"
                  label="Descrição"
                  placeholder="O que este projeto visa alcançar?"
                  defaultValue={project?.description ?? ""}
                  multiline
                  minRows={3}
                  fullWidth
                  disabled={isFormPending}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldSx(theme)}
                />

                {/* Colunas do kanban — create e edit */}
                <>
                  <input
                    type="hidden"
                    name="statuses"
                    value={JSON.stringify(statuses)}
                  />
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", mb: 1.5 }}
                    >
                      <ViewWeekOutlinedIcon
                        sx={{
                          fontSize: 16,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Colunas do kanban
                      </Typography>
                    </Stack>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleStatusDragEnd}
                    >
                      <SortableContext
                        items={statuses.map((s) => s.value)}
                        strategy={verticalListSortingStrategy}
                      >
                        <Stack spacing={1}>
                          {statuses.map((s, i) => (
                            <SortableStatusRow
                              key={s.value}
                              id={s.value}
                              name={s.name}
                              disabled={isFormPending}
                              canDelete={statuses.length > 1}
                              onNameChange={(v) =>
                                setStatuses((prev) =>
                                  prev.map((st, idx) =>
                                    idx === i ? { ...st, name: v } : st,
                                  ),
                                )
                              }
                              onDelete={() =>
                                setStatuses((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                )
                              }
                              theme={theme}
                            />
                          ))}
                        </Stack>
                      </SortableContext>
                    </DndContext>
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      disabled={isFormPending}
                      onClick={() =>
                        setStatuses((prev) => [
                          ...prev,
                          { name: "", value: Date.now().toString(36) },
                        ])
                      }
                      sx={{
                        mt: 1,
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.secondary,
                        "&:hover": { borderColor: theme.palette.text.secondary },
                      }}
                    >
                      Adicionar coluna
                    </Button>
                  </Box>
                </>

                {/* <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                    }}
                  >
                    Cor
                  </Typography>
                  <Box sx={{ display: "flex", gap: theme.spacing(1) }}>
                    {COLOR_OPTIONS.map((c) => {
                      const selected = color === c.value;
                      return (
                        <Tooltip key={c.value} title={c.label} placement="top">
                          <Box
                            component="button"
                            type="button"
                            onClick={() => setColor(c.value)}
                            disabled={isFormPending}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: theme.shape.borderRadius,
                              bgcolor: c.hex,
                              border: "none",
                              cursor: "pointer",
                              transition:
                                "transform 0.15s, opacity 0.15s, outline 0.15s",
                              transform: selected ? "scale(1.15)" : "scale(1)",
                              opacity: selected ? 1 : 0.5,
                              outline: selected
                                ? `2px solid ${theme.palette.text.primary}`
                                : "2px solid transparent",
                              outlineOffset: 2,
                              "&:hover:not(:disabled)": { opacity: 1 },
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box> */}

                {/* Zona de perigo — apenas no modo edit */}
                {isEdit && (
                  <>
                    <Divider sx={{ borderColor: theme.palette.divider }} />
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: theme.spacing(1.5),
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: theme.shape.borderRadius,
                          bgcolor: "rgba(239,68,68,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <WarningAmberIcon
                          sx={{ fontSize: 16, color: "#EF4444" }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                          }}
                        >
                          Zona de perigo
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            display: "block",
                            mt: 0.5,
                          }}
                        >
                          Ao deletar o projeto, todas as tarefas, comentários e
                          dados associados serão removidos permanentemente.
                        </Typography>
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          onClick={() => setView("delete-confirm")}
                          disabled={isFormPending}
                          sx={{
                            mt: 1.5,
                            borderColor: "rgba(239,68,68,0.3)",
                            color: "#EF4444",
                            "&:hover": {
                              borderColor: "#EF4444",
                              bgcolor: "rgba(239,68,68,0.08)",
                            },
                          }}
                        >
                          Deletar projeto
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </DialogContent>

            {/* Footer */}
            <DialogActions
              sx={{
                px: theme.spacing(3),
                pb: theme.spacing(3),
                gap: theme.spacing(1),
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={handleClose}
                disabled={isFormPending}
                sx={{
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  "&:hover": { borderColor: theme.palette.text.secondary },
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isFormPending}
                startIcon={
                  isFormPending ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : null
                }
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                  "&:disabled": { opacity: 0.6 },
                }}
              >
                {isFormPending
                  ? isEdit
                    ? "Salvando..."
                    : "Criando..."
                  : isEdit
                    ? "Salvar alterações"
                    : "Criar projeto"}
              </Button>
            </DialogActions>
          </form>
        ) : (
          // ── VIEW: confirmação de delete ─────────────────────────────────────
          <form action={deleteAction}>
            <input type="hidden" name="id" value={project!.id} />

            {/* Header */}
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1.5),
                pb: 2,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: theme.shape.borderRadius,
                  bgcolor: "rgba(239,68,68,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <WarningAmberIcon sx={{ fontSize: 16, color: "#EF4444" }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}
                >
                  Deletar projeto
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Esta ação não pode ser desfeita.
                </Typography>
              </Box>
            </DialogTitle>

            {/* Body */}
            <DialogContent sx={{ pt: `${theme.spacing(2)} !important` }}>
              {deleteState?.error && (
                <Alert
                  severity="error"
                  sx={{ borderRadius: theme.shape.borderRadius, mb: 2 }}
                >
                  {deleteState.error}
                </Alert>
              )}
              <Box
                sx={{
                  p: theme.spacing(2),
                  bgcolor: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <Typography variant="body2" sx={{ color: "#EF4444" }}>
                  <strong>Atenção:</strong> Todas as tarefas, comentários,
                  colaboradores e histórico de <strong>{project?.name}</strong>{" "}
                  serão permanentemente excluídos.
                </Typography>
              </Box>
            </DialogContent>

            {/* Footer */}
            <DialogActions
              sx={{
                px: theme.spacing(3),
                pb: theme.spacing(3),
                gap: theme.spacing(1),
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={() => setView("form")}
                disabled={isDeletePending}
                sx={{
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  "&:hover": { borderColor: theme.palette.text.secondary },
                }}
              >
                Voltar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isDeletePending}
                startIcon={
                  isDeletePending ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : null
                }
                sx={{
                  bgcolor: "#EF4444",
                  color: "#fff",
                  "&:hover": { bgcolor: "#DC2626" },
                  "&:disabled": { opacity: 0.6 },
                }}
              >
                {isDeletePending ? "Deletando..." : "Sim, deletar projeto"}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </>
  );
}

// ─── Shared field styles ──────────────────────────────────────────────────────

function fieldSx(theme: Theme) {
  return {
    "& .MuiOutlinedInput-root": {
      color: theme.palette.text.primary,
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.text.secondary },
      "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    },
    "& .MuiInputLabel-root": {
      color: theme.palette.text.secondary,
      "&.Mui-focused": { color: theme.palette.primary.main },
    },
    "& .MuiInputBase-input::placeholder": {
      color: theme.palette.text.disabled,
      opacity: 1,
    },
  };
}
