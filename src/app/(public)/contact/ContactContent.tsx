"use client";

import NextLink from "next/link";
import { Box, Typography, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowLeft, Mail } from "lucide-react";
import { LogoLink } from "@/src/components/ui/LogoLink";

const CONTACT_EMAIL = "admin@solutlabs.com.br";

export function ContactContent() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: theme.spacing(2), md: theme.spacing(4) },
          py: theme.spacing(2.5),
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: "sticky",
          top: 0,
          bgcolor: `${theme.palette.background.default}cc`,
          backdropFilter: "blur(12px)",
          zIndex: theme.zIndex.appBar,
        }}
      >
        <LogoLink />

        <Box
          component={NextLink}
          href="/"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(1),
            fontSize: "0.875rem",
            fontWeight: 600,
            color: theme.palette.text.secondary,
            textDecoration: "none",
            "&:hover": { color: theme.palette.text.primary },
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </Box>
      </Box>

      {/* Content */}
      <Box
        component="main"
        sx={{
          maxWidth: "48rem",
          mx: "auto",
          px: { xs: theme.spacing(3), md: theme.spacing(4) },
          py: { xs: theme.spacing(6), md: theme.spacing(10) },
        }}
      >
        <Typography variant="h2" sx={{ fontWeight: 800, mb: theme.spacing(2) }}>
          Contato
        </Typography>

        <Stack spacing={3}>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary }}
          >
            Tem alguma dúvida, sugestão ou precisa de suporte? Nossa equipe está
            à disposição para ajudar. Envie uma mensagem e responderemos o mais
            breve possível.
          </Typography>

          <Box
            component={NextLink}
            href={`mailto:${CONTACT_EMAIL}`}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: theme.spacing(1.5),
              alignSelf: "flex-start",
              px: theme.spacing(2.5),
              py: theme.spacing(1.5),
              borderRadius: theme.shape.borderRadius,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary,
              textDecoration: "none",
              fontWeight: 600,
              transition: "border-color 0.2s, background-color 0.2s",
              "&:hover": {
                borderColor: theme.palette.primary.main,
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <Mail size={18} />
            {CONTACT_EMAIL}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
