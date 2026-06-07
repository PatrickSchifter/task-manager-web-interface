"use client";

import type { ReactNode } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Logo } from "../../ui/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: "flex",
      }}
    >
      {/* Left visual panel — hidden on mobile */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flex: 1,
          position: "relative",
          overflow: "hidden",
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Background */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `
        radial-gradient(
          circle at 15% 15%,
          ${theme.palette.primary.main}20 0%,
          transparent 35%
        ),
        radial-gradient(
          circle at 75% 55%,
          ${theme.palette.secondary.main}18 0%,
          transparent 45%
        ),
        linear-gradient(
          135deg,
          ${theme.palette.background.paper} 0%,
          ${theme.palette.background.default} 100%
        )
      `,
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            px: 8,
            py: 6,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Logo />

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              maxWidth: 560,
            }}
          >
            {/* Project card */}
            <Box
              sx={{
                mb: 8,
                p: 4,
                borderRadius: 4,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: `${theme.palette.background.paper}CC`,
                backdropFilter: "blur(20px)",
                boxShadow: theme.shadows[10],
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Projeto: Lançamento Mobile
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  ✓ Design System concluído
                </Typography>

                <Typography variant="body1">✓ API integrada</Typography>

                <Typography variant="body1">⏳ Revisão final</Typography>
              </Box>

              <Box
                sx={{
                  mt: 4,
                  height: 8,
                  borderRadius: 999,
                  bgcolor: "action.hover",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: "72%",
                    height: "100%",
                    bgcolor: "primary.main",
                  }}
                />
              </Box>
            </Box>

            {/* Hero text */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                maxWidth: 560,
                mb: 3,
              }}
            >
              Gerencie projetos,
              <br />
              tarefas e equipes
              <br />
              com ajuda de IA.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 400,
                lineHeight: 1.7,
                maxWidth: 520,
              }}
            >
              Planeje, acompanhe e entregue mais rápido com uma plataforma
              moderna construída para times de alta performance.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: theme.spacing(3), lg: theme.spacing(6) },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 448 }}>
          {/* Logo visible only on mobile */}
          <Box
            sx={{ display: { xs: "block", lg: "none" }, mb: theme.spacing(5) }}
          >
            <Logo />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: theme.spacing(1),
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mb: theme.spacing(4) }}
          >
            {subtitle}
          </Typography>

          {children}

          {footer && (
            <Box
              sx={{
                mt: theme.spacing(4),
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                {footer}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
