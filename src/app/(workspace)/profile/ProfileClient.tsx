"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  PersonOutlined,
  LockOutlined,
  NotificationsOutlined,
  CreditCardOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";

import { Field } from "@/src/components/ui/Field";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { useFeedback } from "@/src/providers/feedback-provider";
import { signOut } from "@/src/lib/auth/actions";
import { updateProfile, uploadAvatar } from "./actions";

type TabId = "perfil" | "seguranca" | "notificacoes" | "cobranca";

const TABS: { id: TabId; label: string; icon: SvgIconComponent }[] = [
  { id: "perfil", label: "Perfil", icon: PersonOutlined },
  { id: "seguranca", label: "Segurança", icon: LockOutlined },
  { id: "notificacoes", label: "Notificações", icon: NotificationsOutlined },
  { id: "cobranca", label: "Cobrança", icon: CreditCardOutlined },
];

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Visualizador",
};

const schema = z.object({
  name: z.string().min(1, "Informe seu nome"),
});

type FormData = z.infer<typeof schema>;

export default function ProfileClient() {
  const theme = useTheme();
  const router = useRouter();
  const { show } = useFeedback();
  const { user, projects } = useWorkspace();

  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name },
  });

  const initials = (user.name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  const accountLabel = user.role === "ADMIN" ? "Admin" : "Pro Account";

  const cardRadius = (theme.shape.borderRadius as number) * 2;
  const cardSx = {
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: `${cardRadius}px`,
    p: theme.spacing(3),
  } as const;

  const onSubmit = async (data: FormData) => {
    const result = await updateProfile({ name: data.name });
    if (result.success) {
      show("Perfil atualizado com sucesso.", "success");
      reset({ name: data.name });
      router.refresh();
    } else {
      show(result.message, "error");
    }
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const result = await uploadAvatar(formData);
    setUploading(false);
    event.target.value = "";

    if (result.success) {
      show("Foto atualizada.", "success");
      router.refresh();
    } else {
      show(result.message, "error");
    }
  };

  return (
    <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          px: { xs: theme.spacing(2), md: theme.spacing(4) },
          py: theme.spacing(3),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Configurações
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
        >
          Gerencie sua conta e preferências.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: "minmax(0, 1fr) minmax(0, 3fr)",
          },
          gap: { xs: theme.spacing(3), md: theme.spacing(4) },
          p: { xs: theme.spacing(2), md: theme.spacing(4) },
          maxWidth: 1152,
        }}
      >
        {/* Tabs — faixa horizontal rolável no mobile, coluna fixa no desktop */}
        <Box
          component="aside"
          sx={{
            display: "flex",
            flexDirection: { xs: "row", lg: "column" },
            gap: 0.5,
            overflowX: { xs: "auto", lg: "visible" },
            pb: { xs: 0.5, lg: 0 },
            mx: { xs: theme.spacing(-0.5), lg: 0 },
            px: { xs: theme.spacing(0.5), lg: 0 },
            "& > *": { flexShrink: 0 },
          }}
        >
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                startIcon={<tab.icon sx={{ fontSize: 16 }} />}
                sx={{
                  justifyContent: "flex-start",
                  gap: theme.spacing(1.5),
                  px: theme.spacing(1.5),
                  py: theme.spacing(1),
                  borderRadius: `${theme.shape.borderRadius}px`,
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 500,
                  textTransform: "none",
                  color: active
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                  bgcolor: active
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                  "&:hover": {
                    bgcolor: active
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.text.primary, 0.04),
                    color: active
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                  },
                }}
              >
                {tab.label}
              </Button>
            );
          })}

          <Button
            onClick={() => signOut()}
            startIcon={<LogoutOutlined sx={{ fontSize: 16 }} />}
            sx={{
              justifyContent: "flex-start",
              gap: theme.spacing(1.5),
              mt: { xs: 0, lg: theme.spacing(2) },
              ml: { xs: theme.spacing(0.5), lg: 0 },
              px: theme.spacing(1.5),
              py: theme.spacing(1),
              borderRadius: `${theme.shape.borderRadius}px`,
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              color: theme.palette.error.main,
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            Sair
          </Button>
        </Box>

        {/* Content */}
        <Box
          component="main"
          sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(3) }}
        >
          {activeTab !== "perfil" ? (
            <Box
              sx={{
                ...cardSx,
                textAlign: "center",
                py: theme.spacing(8),
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Em breve
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mt: 1 }}
              >
                Esta seção ainda está em desenvolvimento.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Header card */}
              <Box sx={cardSx}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(2.5),
                    flexWrap: "wrap",
                  }}
                >
                  <Avatar
                    src={user.avatar ?? undefined}
                    sx={{
                      width: { xs: 64, sm: 80 },
                      height: { xs: 64, sm: 80 },
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    }}
                  >
                    {initials}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                      {user.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {user.email}
                    </Typography>
                    <Chip
                      label={accountLabel}
                      size="small"
                      sx={{
                        mt: 1,
                        height: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    />
                  </Box>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onFileChange}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="outlined"
                    sx={{
                      px: theme.spacing(2),
                      py: theme.spacing(1),
                      borderRadius: `${theme.shape.borderRadius}px`,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "none",
                      flexShrink: 0,
                      color: theme.palette.text.primary,
                      borderColor: theme.palette.divider,
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.text.primary, 0.08),
                        borderColor: theme.palette.divider,
                      },
                    }}
                  >
                    {uploading ? "Enviando..." : "Trocar foto"}
                  </Button>
                </Box>
              </Box>

              {/* Personal info form */}
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                sx={cardSx}
              >
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                  Informações pessoais
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, mb: theme.spacing(3) }}
                >
                  Atualize seus dados públicos.
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "minmax(0, 1fr)",
                      md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: theme.spacing(2.5),
                  }}
                >
                  <Field label="Nome" placeholder="Seu nome" {...register("name")} />
                  <Field
                    label="E-mail"
                    type="email"
                    defaultValue={user.email}
                    readOnly
                    disabled
                  />
                </Box>

                {errors.name && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                    {errors.name.message}
                  </Typography>
                )}

                <Divider sx={{ my: theme.spacing(3), borderColor: theme.palette.divider }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: theme.spacing(1.5),
                  }}
                >
                  <Button
                    type="button"
                    onClick={() => reset({ name: user.name })}
                    disabled={!isDirty || isSubmitting}
                    sx={{
                      px: theme.spacing(2),
                      py: theme.spacing(1),
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "none",
                      color: theme.palette.text.secondary,
                      "&:hover": { color: theme.palette.text.primary },
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isDirty || isSubmitting}
                    variant="contained"
                    color="primary"
                    sx={{
                      px: theme.spacing(2.5),
                      py: theme.spacing(1),
                      borderRadius: `${theme.shape.borderRadius}px`,
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      textTransform: "none",
                    }}
                  >
                    {isSubmitting ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </Box>
              </Box>

              {/* Workspaces */}
              <Box sx={cardSx}>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Workspaces</Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary, mb: theme.spacing(3) }}
                >
                  Você é membro destes workspaces.
                </Typography>

                {projects.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.disabled }}
                  >
                    Você ainda não participa de nenhum workspace.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: theme.spacing(1.5),
                    }}
                  >
                    {projects.map((project) => (
                      <Box
                        key={project.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing(2),
                          p: theme.spacing(2),
                          bgcolor: theme.palette.background.default,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: `${(theme.shape.borderRadius as number) * 1.5}px`,
                        }}
                      >
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            fontWeight: 700,
                            borderRadius: `${theme.shape.borderRadius}px`,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          }}
                        >
                          {project.name[0]?.toUpperCase()}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {project.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {project.membersCount}{" "}
                            {project.membersCount === 1 ? "membro" : "membros"} ·{" "}
                            {ROLE_LABEL[project.role] ?? project.role}
                          </Typography>
                        </Box>

                        <Button
                          component={Link}
                          href={`/projects/${project.id}`}
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "none",
                            color: theme.palette.text.secondary,
                            "&:hover": { color: theme.palette.text.primary },
                          }}
                        >
                          Gerenciar
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
