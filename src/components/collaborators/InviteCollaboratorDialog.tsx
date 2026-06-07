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
  IconButton,
  Avatar,
  InputAdornment,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import StarOutlineIcon from "@mui/icons-material/StarOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  inviteCollaboratorAction,
  updateCollaboratorAction,
  removeCollaboratorAction,
} from "@/src/actions/collaborators";
import type { Theme } from "@mui/material/styles";
import type { components } from "@/src/types/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type CollaboratorItemListDTO = components["schemas"]["CollaboratorItemListDTO"];

type CollaboratorRole = "VIEWER" | "EDITOR" | "OWNER";
type AssignableRole = "VIEWER" | "EDITOR";

// ─── Role metadata ────────────────────────────────────────────────────────────

const ROLE_META: Record<
  CollaboratorRole,
  { label: string; description: string; icon: typeof VisibilityIcon }
> = {
  VIEWER: {
    label: "Viewer",
    description: "Pode visualizar projetos e tarefas",
    icon: VisibilityIcon,
  },
  EDITOR: {
    label: "Editor",
    description: "Pode criar e editar tarefas",
    icon: EditIcon,
  },
  OWNER: {
    label: "Owner",
    description: "Dono do projeto, com acesso total",
    icon: StarOutlineIcon,
  },
};

// Opções selecionáveis na UI (owner fica de fora).
const ASSIGNABLE_ROLES: AssignableRole[] = ["VIEWER", "EDITOR"];

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteCollaboratorDialog({
  projectId,
  collaborators = [],
  trigger,
}: {
  projectId: string;
  collaborators?: CollaboratorItemListDTO[];
  trigger?: React.ReactNode;
}) {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<AssignableRole>("EDITOR");

  const [inviteState, inviteAction, isInvitePending] = useActionState(
    inviteCollaboratorAction,
    null,
  );

  const prevInviteSuccessRef = useRef(false);

  // Limpa o formulário ao concluir um convite com sucesso (mantém o dialog aberto)
  useEffect(() => {
    if (inviteState?.success && !prevInviteSuccessRef.current) {
      prevInviteSuccessRef.current = true;
      startTransition(() => setRole("EDITOR"));
    }
    if (!inviteState?.success) prevInviteSuccessRef.current = false;
  }, [inviteState?.success]);

  const handleClose = () => {
    if (isInvitePending) return;
    setOpen(false);
  };

  return (
    <>
      {/* ── Trigger ── */}
      {trigger ? (
        <Box onClick={() => setOpen(true)} sx={{ display: "contents" }}>
          {trigger}
        </Box>
      ) : (
        <Button
          variant="outlined"
          startIcon={<PersonAddAlt1Icon sx={{ fontSize: 16 }} />}
          onClick={() => setOpen(true)}
          sx={{
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            "&:hover": { borderColor: theme.palette.text.secondary },
          }}
        >
          Convidar
        </Button>
      )}

      {/* ── Dialog ── */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[8],
            },
          },
        }}
      >
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
            <PersonAddAlt1Icon sx={{ fontSize: 16, color: "#fff" }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}
            >
              Convidar colaboradores
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Compartilhe esse projeto com sua equipe escolhendo o nível de
              acesso.
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
            {/* ── Formulário de convite ── */}
            <Box
              component="form"
              action={inviteAction}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1.5),
                pb: theme.spacing(3),
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="role" value={role} />

              {inviteState?.error && (
                <Alert
                  severity="error"
                  sx={{ borderRadius: theme.shape.borderRadius }}
                >
                  {inviteState.error}
                </Alert>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: theme.spacing(1),
                  alignItems: "flex-start",
                }}
              >
                <TextField
                  name="email"
                  type="email"
                  label="E-mail"
                  placeholder="nome@empresa.com"
                  required
                  fullWidth
                  disabled={isInvitePending}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutlineIcon
                            sx={{
                              fontSize: 16,
                              color: theme.palette.text.secondary,
                            }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={fieldSx(theme)}
                />

                <TextField
                  select
                  label="Acesso"
                  value={role}
                  onChange={(e) => setRole(e.target.value as AssignableRole)}
                  disabled={isInvitePending}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ ...fieldSx(theme), minWidth: 120 }}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {ROLE_META[r].label}
                    </MenuItem>
                  ))}
                </TextField>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isInvitePending}
                  startIcon={
                    isInvitePending ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : null
                  }
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    "&:hover": { bgcolor: theme.palette.primary.dark },
                    "&:disabled": { opacity: 0.6 },
                    flexShrink: 0,
                    height: 56,
                  }}
                >
                  Convidar
                </Button>
              </Box>

              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary }}
              >
                {ROLE_META[role].description}
              </Typography>
            </Box>

            {/* ── Lista de membros ── */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1),
                maxHeight: 288,
                overflowY: "auto",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: theme.palette.text.secondary,
                  mb: 1,
                }}
              >
                Membros · {collaborators.length}
              </Typography>

              {collaborators.map((m) => (
                <CollaboratorRow
                  key={m.user.email}
                  projectId={projectId}
                  collaborator={m}
                  theme={theme}
                />
              ))}
            </Box>
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
            disabled={isInvitePending}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              "&:hover": { borderColor: theme.palette.text.secondary },
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Collaborator row (linha de membro com update/remove) ──────────────────────

function CollaboratorRow({
  projectId,
  collaborator,
  theme,
}: {
  projectId: string;
  collaborator: CollaboratorItemListDTO;
  theme: Theme;
}) {
  const [updateState, updateAction, isUpdatePending] = useActionState(
    updateCollaboratorAction,
    null,
  );
  const [, removeAction, isRemovePending] = useActionState(
    removeCollaboratorAction,
    null,
  );

  // Confirmação antes de remover — evita exclusão acidental no clique único.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const removeFormRef = useRef<HTMLFormElement>(null);

  const role = collaborator.role as CollaboratorRole;
  const isOwner = role === "OWNER";
  const Icon = ROLE_META[role].icon;
  const name =
    collaborator.user?.name ?? collaborator.user?.email?.split("@")[0] ?? "—";
  const initials = name.slice(0, 2).toUpperCase();

  // Id do usuário usado nas ações. `user.id` é sempre retornado pelo backend;
  // `userId` é mantido como fallback. Sem ele, não disparamos nenhuma ação.
  const userId = collaborator.user?.id ?? collaborator.userId;

  const handleConfirmRemove = () => {
    setConfirmOpen(false);
    if (!userId) return;
    startTransition(() => removeFormRef.current?.requestSubmit());
  };

  // Troca de role — dispara a action diretamente com a nova role.
  // Evita depender do input oculto do <Select> do MUI no FormData.
  const handleRoleChange = (nextRole: string) => {
    if (nextRole === role || !userId) return;
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("userId", userId);
    fd.set("role", nextRole);
    startTransition(() => updateAction(fd));
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(1.5),
        p: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        transition: "background-color 0.15s",
        "&:hover": { bgcolor: theme.palette.action.hover },
      }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
      >
        {initials}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
        >
          {collaborator.user?.email}
        </Typography>
      </Box>

      <Box
        sx={{ display: "flex", alignItems: "center", gap: theme.spacing(0.5) }}
      >
        <Icon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />

        {isOwner ? (
          // Owner: somente apresentação — sem troca de role, sem remover.
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.secondary,
              px: theme.spacing(1),
            }}
          >
            {ROLE_META.OWNER.label}
          </Typography>
        ) : (
          <>
            {/* Troca de role — persiste automaticamente ao selecionar */}
            <TextField
              select
              size="small"
              value={role}
              disabled={isUpdatePending || !userId}
              onChange={(e) => handleRoleChange(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                ...fieldSx(theme),
                "& .MuiInputBase-input": { fontSize: 12, py: 0.5 },
              }}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {ROLE_META[r].label}
                </MenuItem>
              ))}
            </TextField>

            {/* Remove — abre confirmação; o submit real acontece no diálogo */}
            <Box
              component="form"
              action={removeAction}
              ref={removeFormRef}
              sx={{ display: "contents" }}
            >
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="userId" value={userId ?? ""} />
              <IconButton
                type="button"
                size="small"
                disabled={isRemovePending || !userId}
                onClick={() => setConfirmOpen(true)}
                sx={{
                  width: 32,
                  height: 32,
                  color: theme.palette.text.secondary,
                  "&:hover": {
                    color: theme.palette.error.main,
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                {isRemovePending ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                )}
              </IconButton>
            </Box>
          </>
        )}
      </Box>

      {updateState?.error && (
        <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
          {updateState.error}
        </Typography>
      )}

      {/* ── Confirmação de remoção ── */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[8],
            },
          },
        }}
      >
        <DialogTitle sx={{ color: theme.palette.text.primary, pb: 1 }}>
          Remover colaborador
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Tem certeza que deseja remover <strong>{name}</strong> deste projeto?
            Essa ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: theme.spacing(3), pb: theme.spacing(2.5), gap: theme.spacing(1) }}>
          <Button
            type="button"
            variant="outlined"
            onClick={() => setConfirmOpen(false)}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              "&:hover": { borderColor: theme.palette.text.secondary },
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            color="error"
            onClick={handleConfirmRemove}
            startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
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
