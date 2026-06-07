"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  DashboardOutlined,
  AutoAwesomeOutlined,
  TagOutlined,
  SearchOutlined,
  SettingsOutlined,
  LogoutOutlined,
  AddOutlined,
} from "@mui/icons-material";
import { Logo } from "./Logo";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { ProjectDialog } from "@/src/components/projects/ProjectDialog";
import { signOut } from "@/src/lib/auth/actions";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SIDEBAR_WIDTH = 256;

/**
 * Altura compartilhada do "header" do workspace (logo do sidebar e os headers
 * das páginas dashboard/project/task). Manter o mesmo valor garante que os
 * divisores fiquem alinhados horizontalmente no desktop.
 */
export const HEADER_HEIGHT = 72;

const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: DashboardOutlined,
    label: "Dashboard",
    badge: null,
  },
  {
    href: "/chat",
    icon: AutoAwesomeOutlined,
    label: "Solut AI",
    badge: null,
  },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  active,
  onNavigate,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string | null;
  active: boolean;
  onNavigate?: () => void;
}) {
  const theme = useTheme();

  return (
    <ListItemButton
      component={Link}
      href={href}
      selected={active}
      onClick={onNavigate}
      sx={{
        borderRadius: `${theme.shape.borderRadius}px`,
        mb: 0.5,
        px: theme.spacing(1.5),
        py: theme.spacing(1),
        gap: theme.spacing(1.5),
        transition: "background 0.15s ease",
        "&.Mui-selected": {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.15),
          },
          "& .MuiListItemIcon-root": {
            color: theme.palette.primary.main,
          },
        },
        "&:not(.Mui-selected)": {
          color: theme.palette.text.secondary,
          "&:hover": {
            bgcolor: alpha(theme.palette.text.primary, 0.04),
            color: theme.palette.text.primary,
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
        <Icon sx={{ fontSize: 18 }} />
      </ListItemIcon>
      <ListItemText
        primary={label}
        slotProps={{
          primary: {
            variant: "body2",
            sx: { lineHeight: 1, fontWeight: active ? 600 : 400 },
          },
        }}
        sx={{ my: 0 }}
      />
      {badge && (
        <Box
          sx={{
            px: 0.75,
            py: 0.25,
            bgcolor: alpha(theme.palette.text.primary, 0.06),
            borderRadius: `${(theme.shape.borderRadius as number) / 2}px`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: 10,
              fontWeight: 700,
              color: theme.palette.text.secondary,
            }}
          >
            {badge}
          </Typography>
        </Box>
      )}
    </ListItemButton>
  );
}

// ─── Drawer content (compartilhado entre mobile e desktop) ──────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const theme = useTheme();
  const pathname = usePathname();
  const { user, projects } = useWorkspace();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  // Gera as iniciais a partir do nome (ex: "Alex Rivers" → "AR")
  const initials = (user.name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      {/* ── Logo ── */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          px: theme.spacing(2.5),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
      </Box>

      {/* ── Search ── */}
      <Box sx={{ px: theme.spacing(2), py: theme.spacing(1.5) }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1),
            px: theme.spacing(1.5),
            py: theme.spacing(0.75),
            bgcolor: alpha(theme.palette.text.primary, 0.04),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            cursor: "pointer",
            transition: "border-color 0.15s",
            "&:hover": {
              borderColor: alpha(theme.palette.primary.main, 0.4),
            },
          }}
        >
          <SearchOutlined
            sx={{ fontSize: 14, color: theme.palette.text.disabled }}
          />
          <Typography
            variant="caption"
            sx={{ flex: 1, color: theme.palette.text.disabled, fontSize: 12 }}
          >
            Buscar...
          </Typography>
        </Box>
      </Box>

      {/* ── Main Nav ── */}
      <List sx={{ px: theme.spacing(1.5), py: 0 }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            active={isActive(item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </List>

      {/* ── Projects ── */}
      <Box
        sx={{
          mt: theme.spacing(3),
          px: theme.spacing(1.5),
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: theme.spacing(1.5),
            mb: theme.spacing(1),
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: 10,
              fontWeight: 700,
              color: theme.palette.text.disabled,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Projetos
          </Typography>
          <ProjectDialog />
        </Box>

        {/* CTA "Novo projeto" — sempre visível e legível */}
        <ProjectDialog
          trigger={
            <Box
              role="button"
              tabIndex={0}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
                px: theme.spacing(1.5),
                py: theme.spacing(1),
                mb: theme.spacing(1),
                borderRadius: `${theme.shape.borderRadius}px`,
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
                color: theme.palette.primary.main,
                cursor: "pointer",
                transition: "background 0.15s ease, border-color 0.15s ease",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderColor: alpha(theme.palette.primary.main, 0.7),
                },
              }}
            >
              <AddOutlined sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
                Novo projeto
              </Typography>
            </Box>
          }
        />

        {projects.length === 0 ? (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              px: theme.spacing(1.5),
              color: theme.palette.text.disabled,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            Nenhum projeto ainda. Crie o primeiro para organizar suas tarefas.
          </Typography>
        ) : (
          <List sx={{ py: 0 }}>
            {projects.map((project) => {
              const href = `/projects/${project.id}`;
              const active = pathname === href;
              return (
              <ListItemButton
                key={project.id}
                component={Link}
                href={href}
                selected={active}
                onClick={onNavigate}
                sx={{
                  borderRadius: `${theme.shape.borderRadius}px`,
                  mb: 0.5,
                  px: theme.spacing(1.5),
                  py: theme.spacing(0.875),
                  gap: theme.spacing(1.25),
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                  "&:not(.Mui-selected)": {
                    color: theme.palette.text.secondary,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                      color: theme.palette.text.primary,
                    },
                  },
                }}
              >
                <TagOutlined sx={{ fontSize: 14, color: "inherit" }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.name}
                </Typography>
              </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>

      {/* ── User Footer ── */}
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <Box sx={{ p: theme.spacing(1.5) }}>
        <ListItemButton
          component={Link}
          href="/profile"
          onClick={onNavigate}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            p: theme.spacing(1),
            gap: theme.spacing(1.5),
            "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.04) },
          }}
        >
          <Avatar
            src={user.avatar ?? undefined}
            sx={{
              width: 32,
              height: 32,
              fontSize: 12,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: 13,
                color: theme.palette.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.disabled, fontSize: 11 }}
            >
              {user.role === "ADMIN" ? "Admin" : "Pro Account"}
            </Typography>
          </Box>
          <SettingsOutlined
            sx={{ fontSize: 16, color: theme.palette.text.disabled }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => signOut()}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            mt: 0.5,
            px: theme.spacing(1),
            py: theme.spacing(1),
            gap: theme.spacing(1.5),
            color: theme.palette.text.secondary,
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.08),
              color: theme.palette.error.main,
              "& .MuiListItemIcon-root": {
                color: theme.palette.error.main,
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: "auto", color: "inherit" }}>
            <LogoutOutlined sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText
            primary="Sair"
            slotProps={{
              primary: {
                variant: "body2",
                sx: { lineHeight: 1, fontWeight: 500 },
              },
            }}
            sx={{ my: 0 }}
          />
        </ListItemButton>
      </Box>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Sidebar responsiva:
 * - Desktop (md+): drawer permanente, sempre visível, ocupa espaço no layout.
 * - Mobile (< md): drawer temporário sobreposto, controlado por `mobileOpen`
 *   (acionado pelo botão de menu da barra superior em {@link AppShell}).
 */
export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const theme = useTheme();

  const paperSx = {
    width: SIDEBAR_WIDTH,
    boxSizing: "border-box",
    bgcolor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as const;

  return (
    <Box
      component="nav"
      sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
    >
      {/* Mobile: drawer temporário (overlay) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": paperSx,
        }}
      >
        <SidebarContent onNavigate={onClose} />
      </Drawer>

      {/* Desktop: drawer permanente */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": paperSx,
        }}
      >
        <SidebarContent />
      </Drawer>
    </Box>
  );
}
