"use client";

import NextLink from "next/link";
import { Box } from "@mui/material";
import { useIsAuthenticated } from "@/src/providers/auth-status-provider";
import { Logo } from "./Logo";

/**
 * Logo clicável que respeita o estado de autenticação:
 * - deslogado → "/"
 * - logado → "/dashboard"
 */
export function LogoLink() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Box
      component={NextLink}
      href={isAuthenticated ? "/dashboard" : "/"}
      sx={{ textDecoration: "none", display: "inline-flex" }}
    >
      <Logo />
    </Box>
  );
}
