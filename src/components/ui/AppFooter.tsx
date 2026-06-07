"use client";

import NextLink from "next/link";
import { Box, Typography, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LogoLink } from "./LogoLink";

const FOOTER_LINKS = [
  { label: "Privacidade", href: "/privacy" },
  { label: "Termos", href: "/terms" },
  { label: "Segurança", href: "/security" },
  { label: "Contato", href: "/contact" },
];

export function AppFooter() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        py: theme.spacing(6),
        px: theme.spacing(4),
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{
          maxWidth: "88rem",
          mx: "auto",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <LogoLink />
        <Stack
          direction="row"
          spacing={4}
          sx={{ flexWrap: "wrap", justifyContent: "center", rowGap: 1 }}
        >
          {FOOTER_LINKS.map(({ label, href }) => (
            <Box
              key={label}
              component={NextLink}
              href={href}
              sx={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: theme.palette.text.secondary,
                textDecoration: "none",
                "&:hover": { color: theme.palette.text.primary },
              }}
            >
              {label}
            </Box>
          ))}
        </Stack>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary }}
        >
          © 2026 Solut Labs Inc.
        </Typography>
      </Stack>
    </Box>
  );
}
