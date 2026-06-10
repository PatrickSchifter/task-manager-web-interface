"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ptBR } from "date-fns/locale";
import { format, isValid } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import LoopIcon from "@mui/icons-material/Loop";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  createRoutineAction,
  updateRoutineAction,
  deleteRoutineAction,
} from "@/src/actions/routines";
import type { RoutineItemListDTO } from "@/src/services/api/routines.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "form" | "delete-confirm";

interface TimeRow {
  id: string;
  start: Date | null;
  end: Date | null;
}

interface RoutineDialogProps {
  routine?: RoutineItemListDTO;
  trigger?: React.ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTimeStr(d: Date | null): string {
  return d && isValid(d) ? format(d, "HH:mm") : "";
}

function parseTimeStr(hhmm: string): Date | null {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

let _idSeq = 0;
const nextRowId = () => String(++_idSeq);

// ─── DaySelector ─────────────────────────────────────────────────────────────

interface DaySelectorProps {
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

function DaySelector({ value, onChange, disabled }: DaySelectorProps) {
  const theme = useTheme();
  const allSelected = value.length === 0;

  const toggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <Box>
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
        Dias da semana
      </Typography>

      <Box sx={{ display: "flex", gap: theme.spacing(0.75), flexWrap: "wrap" }}>
        {WEEK_DAYS.map(({ value: day, label }) => {
          const active = allSelected || value.includes(day);
          return (
            <Chip
              key={day}
              label={label}
              size="small"
              disabled={disabled}
              onClick={() => toggle(day)}
              sx={{
                cursor: "pointer",
                fontWeight: active ? 700 : 400,
                bgcolor: active
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.text.primary, 0.04),
                color: active
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
                border: `1px solid ${
                  active
                    ? alpha(theme.palette.primary.main, 0.4)
                    : theme.palette.divider
                }`,
                "&:hover": {
                  bgcolor: active
                    ? alpha(theme.palette.primary.main, 0.22)
                    : alpha(theme.palette.text.primary, 0.08),
                },
                "&.Mui-disabled": { opacity: 0.5 },
              }}
            />
          );
        })}
      </Box>

      <Typography
        variant="caption"
        sx={{ display: "block", mt: 0.75, color: theme.palette.text.disabled }}
      >
        {allSelected
          ? "Todos os dias selecionados."
          : `${value.length} dia${value.length > 1 ? "s" : ""} selecionado${value.length > 1 ? "s" : ""}. Clique para alternar.`}
      </Typography>
    </Box>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

function makeEmptyRow(): TimeRow {
  return { id: nextRowId(), start: null, end: null };
}

function rowsFromRoutine(routine?: RoutineItemListDTO): TimeRow[] {
  if (routine?.times.length) {
    return routine.times.map((t) => ({
      id: nextRowId(),
      start: parseTimeStr(t.startTime),
      end: parseTimeStr(t.endTime),
    }));
  }
  return [makeEmptyRow()];
}

export function RoutineDialog({ routine, trigger }: RoutineDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isEdit = !!routine;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("form");

  // Cada linha tem seu próprio par início/fim de Date
  const [rows, setRows] = useState<TimeRow[]>(() => rowsFromRoutine(routine));

  // Dias da semana (0=Dom…6=Sáb). [] = todos os dias.
  const [days, setDays] = useState<number[]>(routine?.days ?? []);

  const action = isEdit ? updateRoutineAction : createRoutineAction;
  const [formState, formAction, isFormPending] = useActionState(action, null);
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteRoutineAction,
    null,
  );

  const prevFormSuccessRef = useRef(false);
  const prevDeleteSuccessRef = useRef(false);

  useEffect(() => {
    if (open) prevFormSuccessRef.current = false;
  }, [open]);

  useEffect(() => {
    if (formState?.success && !prevFormSuccessRef.current) {
      prevFormSuccessRef.current = true;
      startTransition(() => {
        setOpen(false);
        setView("form");
        if (!isEdit) {
          setRows([makeEmptyRow()]);
          setDays([]);
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
      });
    }
    if (!deleteState?.success) prevDeleteSuccessRef.current = false;
  }, [deleteState?.success]);

  const handleClose = () => {
    if (isFormPending || isDeletePending) return;
    setOpen(false);
    setView("form");
  };

  const updateRow = (id: string, field: "start" | "end", value: Date | null) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const addRow = () => setRows((prev) => [...prev, makeEmptyRow()]);

  // Constrói FormData manualmente para garantir que o estado React atual
  // chegue na Server Action (hidden inputs controlados não são confiáveis no
  // React 19 + App Router).
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const validTimes = rows
      .map((r) => ({ startTime: toTimeStr(r.start), endTime: toTimeStr(r.end) }))
      .filter((t) => t.startTime && t.endTime);
    fd.set("times", JSON.stringify(validTimes));
    fd.set("days", JSON.stringify(days));
    startTransition(() => formAction(fd));
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const paperSx = {
    bgcolor: theme.palette.background.paper,
    border: isMobile ? "none" : `1px solid ${theme.palette.divider}`,
    borderRadius: isMobile ? 0 : theme.shape.borderRadius,
    boxShadow: isMobile ? "none" : theme.shadows[8],
  };

  const fieldSx = {
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
  };

  const pickerPaperSx = {
    bgcolor: theme.palette.background.paper,
    backgroundImage: "none",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[8],
  };

  return (
    <>
      {trigger ? (
        <Box onClick={() => setOpen(true)} sx={{ display: "contents" }}>
          {trigger}
        </Box>
      ) : (
        <Tooltip title={isEdit ? "Editar rotina" : "Nova rotina"} placement="right">
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

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        slotProps={{ paper: { sx: paperSx } }}
      >
        {view === "form" ? (
          <form onSubmit={handleFormSubmit}>
            {isEdit && <input type="hidden" name="id" value={routine.id} />}

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
                <LoopIcon
                  sx={{ fontSize: 16, color: theme.palette.primary.contrastText }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}
                >
                  {isEdit ? "Editar rotina" : "Nova rotina"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {isEdit
                    ? "Altere as informações ou remova a rotina."
                    : "Crie uma atividade recorrente com vários horários diários."}
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
                  placeholder="Ex: Tomar água, Alongamento..."
                  defaultValue={routine?.title}
                  required
                  fullWidth
                  autoFocus
                  disabled={isFormPending}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldSx}
                />

                <TextField
                  name="description"
                  label="Descrição"
                  placeholder="Detalhes opcionais sobre esta rotina..."
                  defaultValue={routine?.description ?? ""}
                  multiline
                  minRows={2}
                  fullWidth
                  disabled={isFormPending}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldSx}
                />

                {/* Dias da semana */}
                <DaySelector
                  value={days}
                  onChange={setDays}
                  disabled={isFormPending}
                />

                {/* Horários — lista de linhas dinâmicas */}
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={ptBR}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mb: 1.5,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                      }}
                    >
                      Horários do dia
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.spacing(1.5),
                      }}
                    >
                      {rows.map((row, idx) => (
                        <Box
                          key={row.id}
                          sx={{
                            p: theme.spacing(1.5),
                            bgcolor: alpha(theme.palette.text.primary, 0.02),
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: theme.shape.borderRadius,
                            display: "flex",
                            flexDirection: "column",
                            gap: theme.spacing(1),
                          }}
                        >
                          {/* Cabeçalho da linha: número + botão remover */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.disabled,
                                fontWeight: 600,
                                lineHeight: 1,
                              }}
                            >
                              Horário {idx + 1}
                            </Typography>
                            <Tooltip title="Remover horário">
                              <span>
                                <IconButton
                                  size="small"
                                  type="button"
                                  disabled={isFormPending}
                                  onClick={() => removeRow(row.id)}
                                  sx={{
                                    color: theme.palette.text.disabled,
                                    "&:hover": {
                                      color: theme.palette.error.main,
                                      bgcolor: alpha(
                                        theme.palette.error.main,
                                        0.08,
                                      ),
                                    },
                                  }}
                                >
                                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>

                          {/* Pickers: lado a lado em todas as telas */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: theme.spacing(1),
                            }}
                          >
                            <TimePicker
                              label="Início"
                              value={row.start}
                              onChange={(v) => updateRow(row.id, "start", v)}
                              ampm={false}
                              disabled={isFormPending}
                              slotProps={{
                                textField: {
                                  size: "small",
                                  sx: { ...fieldSx, flex: 1 },
                                  slotProps: { inputLabel: { shrink: true } },
                                },
                                openPickerButton: {
                                  sx: { color: theme.palette.text.secondary },
                                },
                                desktopPaper: { sx: pickerPaperSx },
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.palette.text.disabled,
                                flexShrink: 0,
                              }}
                            >
                              –
                            </Typography>
                            <TimePicker
                              label="Fim"
                              value={row.end}
                              onChange={(v) => updateRow(row.id, "end", v)}
                              ampm={false}
                              disabled={isFormPending}
                              slotProps={{
                                textField: {
                                  size: "small",
                                  sx: { ...fieldSx, flex: 1 },
                                  slotProps: { inputLabel: { shrink: true } },
                                },
                                openPickerButton: {
                                  sx: { color: theme.palette.text.secondary },
                                },
                                desktopPaper: { sx: pickerPaperSx },
                              }}
                            />
                          </Box>
                        </Box>
                      ))}

                      {/* Botão para adicionar nova linha */}
                      <Button
                        type="button"
                        variant="text"
                        startIcon={<AddIcon />}
                        onClick={addRow}
                        disabled={isFormPending}
                        sx={{
                          alignSelf: "flex-start",
                          color: theme.palette.primary.main,
                          px: theme.spacing(1),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        Adicionar horário
                      </Button>
                    </Box>
                  </Box>
                </LocalizationProvider>

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
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <WarningAmberIcon
                          sx={{ fontSize: 16, color: theme.palette.error.main }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: theme.palette.text.primary }}
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
                          Ao deletar a rotina, todo o histórico de conclusões será
                          removido permanentemente.
                        </Typography>
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          onClick={() => setView("delete-confirm")}
                          disabled={isFormPending}
                          sx={{
                            mt: 1.5,
                            borderColor: alpha(theme.palette.error.main, 0.3),
                            color: theme.palette.error.main,
                            "&:hover": {
                              borderColor: theme.palette.error.main,
                              bgcolor: alpha(theme.palette.error.main, 0.08),
                            },
                          }}
                        >
                          Deletar rotina
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </DialogContent>

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
                    : "Criar rotina"}
              </Button>
            </DialogActions>
          </form>
        ) : (
          // ── Confirmação de delete ─────────────────────────────────────────
          <form action={deleteAction}>
            <input type="hidden" name="id" value={routine!.id} />

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
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <WarningAmberIcon
                  sx={{ fontSize: 16, color: theme.palette.error.main }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}
                >
                  Deletar rotina
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Esta ação não pode ser desfeita.
                </Typography>
              </Box>
            </DialogTitle>

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
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.error.main }}
                >
                  <strong>Atenção:</strong> A rotina{" "}
                  <strong>{routine?.title}</strong> e todo o histórico de
                  conclusões serão permanentemente excluídos.
                </Typography>
              </Box>
            </DialogContent>

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
                  bgcolor: theme.palette.error.main,
                  color: theme.palette.error.contrastText,
                  "&:hover": { bgcolor: theme.palette.error.dark },
                  "&:disabled": { opacity: 0.6 },
                }}
              >
                {isDeletePending ? "Deletando..." : "Sim, deletar rotina"}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </>
  );
}
