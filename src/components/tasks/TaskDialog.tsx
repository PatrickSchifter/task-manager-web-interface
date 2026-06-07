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
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Alert,
  IconButton,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/src/actions/tasks";
import { createTagAction } from "@/src/actions/tags";
import type { Theme } from "@mui/material/styles";
import type { TaskItemListDTO } from "@/src/services/api/tasks.service";
import type { ProjectCollaboratorDTO } from "@/src/services/api/projects.service";
import type { TagDTO } from "@/src/services/api/tags.service";
import { TagSelector } from "@/src/components/tasks/TagSelector";
import { AssigneeSelector } from "@/src/components/tasks/AssigneeSelector";

// ─── Status / Priority metadata ───────────────────────────────────────────────
// Cores derivadas do tema seguindo o Task Manager Status/Priority Mapping.

export type TaskStatus = string;
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const STATUS_META: Record<
  string,
  {
    label: string;
    icon: typeof RadioButtonUncheckedIcon;
    color: (t: Theme) => string;
  }
> = {
  TODO: {
    label: "Backlog",
    icon: RadioButtonUncheckedIcon,
    color: (t) => t.palette.text.secondary,
  },
  IN_PROGRESS: {
    label: "Em progresso",
    icon: AutorenewIcon,
    color: (t) => t.palette.warning.main,
  },
  DONE: {
    label: "Concluído",
    icon: CheckCircleOutlineIcon,
    color: (t) => t.palette.success.main,
  },
};

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: (t: Theme) => string }
> = {
  LOW: { label: "Baixa", color: (t) => t.palette.success.main },
  MEDIUM: { label: "Média", color: (t) => t.palette.warning.main },
  HIGH: { label: "Alta", color: (t) => t.palette.error.main },
};

const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITY_ORDER: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

// Converte o dueDate do DTO (ISO ou YYYY-MM-DD) num Date local à meia-noite,
// usando só a parte da data para evitar deslocamento de fuso horário.
function parseDateValue(value?: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

// A server action espera dueDate como YYYY-MM-DD. Formata em horário local
// para preservar exatamente o dia escolhido pelo usuário.
function formatDateValue(date: Date | null): string {
  return date ? format(date, "yyyy-MM-dd") : "";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskDialogProps {
  projectId: string;
  task?: TaskItemListDTO;
  trigger?: React.ReactNode;
  defaultStatus?: TaskStatus;
  collaborators?: ProjectCollaboratorDTO[];
  /** Catálogo de tags do usuário, para sugestão no Autocomplete. */
  availableTags?: TagDTO[];
  /**
   * Quando definido, cria a tarefa como subtarefa deste pai (enviado num input
   * hidden para a action). Só tem efeito na criação — a edição ignora o vínculo.
   */
  parentId?: string;
  /** Statuses dinâmicos do projeto. Quando informado, substitui os STATUS_ORDER padrão no dropdown. */
  projectStatuses?: { name: string; value: string }[];
}

// ─── View types ───────────────────────────────────────────────────────────────

type View = "form" | "delete-confirm";

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskDialog({
  projectId,
  task,
  trigger,
  defaultStatus = "TODO",
  collaborators = [],
  availableTags = [],
  parentId,
  projectStatuses = [],
}: TaskDialogProps) {
  const theme = useTheme();
  // No mobile o diálogo ocupa a tela inteira para dar mais espaço de edição.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = !!task;
  // Criação de subtarefa: muda os rótulos e envia o parentId à action.
  const isSubtask = !isEdit && !!parentId;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("form");

  // Cada action tem seu próprio estado — sem colisão
  const action = isEdit ? updateTaskAction : createTaskAction;
  const [formState, formAction, isFormPending] = useActionState(action, null);
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteTaskAction,
    null,
  );
  const [assigneeId, setAssigneeId] = useState<string>(
    task?.assignee?.id ?? "",
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    parseDateValue(typeof task?.dueDate === "string" ? task.dueDate : null),
  );
  const [tags, setTags] = useState<string[]>(
    task?.tags?.map((t) => t.name) ?? [],
  );

  // Catálogo + as tags já na task (garante cor correta no modo edição).
  const tagCatalog = [...availableTags, ...(task?.tags ?? [])];

  const prevFormSuccessRef = useRef(false);
  const prevDeleteSuccessRef = useRef(false);

  // Reseta o guard toda vez que o dialog abre, para detectar saves subsequentes
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
        if (!isEdit) {
          setAssigneeId("");
          setDueDate(null);
          setTags([]);
        }
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
        if (!isEdit) {
          setAssigneeId("");
          setDueDate(null);
        }
      });
    }
    if (!deleteState?.success) prevDeleteSuccessRef.current = false;
  }, [deleteState?.success, isEdit]);

  const handleClose = () => {
    if (isFormPending || isDeletePending) return;
    setOpen(false);
    setView("form");
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
        <Tooltip title="Nova tarefa" placement="right">
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
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="assigneeId" value={assigneeId} />
            <input type="hidden" name="tags" value={JSON.stringify(tags)} />
            {isEdit && <input type="hidden" name="id" value={task.id} />}
            {isSubtask && (
              <input type="hidden" name="parentId" value={parentId} />
            )}

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
                <PlaylistAddCheckIcon sx={{ fontSize: 16, color: "#fff" }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}
                >
                  {isEdit
                    ? "Editar tarefa"
                    : isSubtask
                      ? "Nova subtarefa"
                      : "Nova tarefa"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {isEdit
                    ? "Altere as informações ou remova a tarefa."
                    : isSubtask
                      ? "Crie uma subtarefa vinculada a esta tarefa."
                      : "Crie uma nova tarefa para este projeto."}
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
                  name="title"
                  label="Título"
                  placeholder="Ex: Refatorar middleware de auth..."
                  defaultValue={task?.title}
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
                  placeholder="Descreva o escopo e critérios de aceitação..."
                  defaultValue={
                    typeof task?.description === "string"
                      ? task.description
                      : ""
                  }
                  multiline
                  minRows={3}
                  fullWidth
                  disabled={isFormPending}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldSx(theme)}
                />

                {/* Status + Prioridade + Prazo */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: theme.spacing(2),
                  }}
                >
                  <TextField
                    select
                    name="status"
                    label="Status"
                    defaultValue={task?.status ?? defaultStatus}
                    disabled={isFormPending}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx(theme)}
                  >
                    {(projectStatuses.length
                      ? projectStatuses.map((s) => ({ value: s.value, label: STATUS_META[s.value]?.label ?? s.name }))
                      : STATUS_ORDER.map((v) => ({ value: v, label: STATUS_META[v].label }))
                    ).map((opt) => {
                      const meta = STATUS_META[opt.value];
                      const Icon = meta?.icon;
                      return (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: theme.spacing(1),
                            }}
                          >
                            {Icon && (
                              <Icon
                                sx={{
                                  fontSize: 16,
                                  color: meta.color(theme),
                                }}
                              />
                            )}
                            {opt.label}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </TextField>

                  <TextField
                    select
                    name="priority"
                    label="Prioridade"
                    defaultValue={(task?.priority as TaskPriority) ?? "MEDIUM"}
                    disabled={isFormPending}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx(theme)}
                  >
                    {PRIORITY_ORDER.map((p) => (
                      <MenuItem key={p} value={p}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: theme.spacing(1),
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: PRIORITY_META[p].color(theme),
                            }}
                          />
                          {PRIORITY_META[p].label}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Prazo — opcional.
                      Calendário MUI (x-date-pickers) totalmente herdado do
                      theme. Envia YYYY-MM-DD via input hidden p/ a server action. */}
                  <input
                    type="hidden"
                    name="dueDate"
                    value={formatDateValue(dueDate)}
                  />
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={ptBR}
                  >
                    <DatePicker
                      label="Prazo"
                      value={dueDate}
                      onChange={(value) => setDueDate(value)}
                      disabled={isFormPending}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          slotProps: { inputLabel: { shrink: true } },
                          sx: {
                            ...fieldSx(theme),
                            gridColumn: { xs: "auto", sm: "1 / -1" },
                          },
                        },
                        // Botão do ícone e o popover herdam o theme.
                        openPickerButton: {
                          sx: { color: theme.palette.text.secondary },
                        },
                        desktopPaper: {
                          sx: {
                            bgcolor: theme.palette.background.paper,
                            backgroundImage: "none",
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: theme.shape.borderRadius,
                            boxShadow: theme.shadows[8],
                          },
                        },
                        day: {
                          sx: {
                            color: theme.palette.text.primary,
                            "&:hover": {
                              bgcolor: theme.palette.action.hover,
                            },
                            "&.MuiPickersDay-today": {
                              borderColor: theme.palette.primary.main,
                            },
                            "&.Mui-selected": {
                              bgcolor: theme.palette.primary.main,
                              color: theme.palette.primary.contrastText,
                              "&:hover": {
                                bgcolor: theme.palette.primary.dark,
                              },
                              "&:focus": {
                                bgcolor: theme.palette.primary.main,
                              },
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>

                {/* Tags — chips soltos: clicar nas sugestões para selecionar
                    ou no "+" para criar uma com cor própria. */}
                <Box>
                  <FieldLabel>Tags</FieldLabel>
                  <TagSelector
                    value={tags}
                    onChange={setTags}
                    availableTags={tagCatalog}
                    onCreate={(name, color) => createTagAction(name, color)}
                    disabled={isFormPending}
                  />
                </Box>

                {/* Colaboradores — chips com avatar + nome + role; define o
                    responsável (seleção única). */}
                <Box>
                  <FieldLabel>Colaboradores</FieldLabel>
                  <AssigneeSelector
                    collaborators={collaborators}
                    value={assigneeId}
                    onChange={setAssigneeId}
                    disabled={isFormPending}
                  />
                </Box>

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
                          Ao deletar a tarefa, todos os comentários e dados
                          associados serão removidos permanentemente.
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
                          Deletar tarefa
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
                    : isSubtask
                      ? "Criar subtarefa"
                      : "Criar tarefa"}
              </Button>
            </DialogActions>
          </form>
        ) : (
          // ── VIEW: confirmação de delete ─────────────────────────────────────
          <form action={deleteAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="id" value={task!.id} />
            <input type="hidden" name="parentId" value={task?.parentId ?? ""} />

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
                  Deletar tarefa
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
                  <strong>Atenção:</strong> A tarefa{" "}
                  <strong>{task?.title}</strong> e todos os dados associados
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
                {isDeletePending ? "Deletando..." : "Sim, deletar tarefa"}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </>
  );
}

// ─── Field label (seções sem input nativo: Tags / Colaboradores) ──────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        mb: 1,
        color: "text.secondary",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 700,
      }}
    >
      {children}
    </Typography>
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
