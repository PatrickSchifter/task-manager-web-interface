"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, IconButton, useTheme } from "@mui/material";
import { MenuOutlined } from "@mui/icons-material";

import { Sidebar } from "@/src/components/ui/Sidebar";
import { Logo } from "@/src/components/ui/Logo";

/**
 * Casca do workspace. Mantém o estado do drawer mobile e renderiza:
 * - a {@link Sidebar} responsiva (permanente no desktop, temporária no mobile);
 * - uma barra superior com botão de menu, visível só em telas pequenas.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Barra superior — apenas mobile (< md) */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: theme.spacing(1),
            px: theme.spacing(1.5),
            py: theme.spacing(1),
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            position: "sticky",
            top: 0,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <IconButton
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
            sx={{ color: theme.palette.text.primary }}
          >
            <MenuOutlined />
          </IconButton>
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex" }}>
            <Logo />
          </Link>
        </Box>

        {children}
      </Box>
    </Box>
  );
}
