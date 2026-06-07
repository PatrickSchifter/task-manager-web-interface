"use client";

import NextLink from "next/link";
import { Box, Typography, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowLeft } from "lucide-react";
import { LogoLink } from "@/src/components/ui/LogoLink";

// ---------------------------------------------------------------------------
// Content — kept data-driven so it's easy to keep the security page up to date
// ---------------------------------------------------------------------------
const LAST_UPDATED = "5 de junho de 2026";

interface Section {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Nosso compromisso",
    paragraphs: [
      "A segurança dos seus dados é uma prioridade no Solut Tasks. Adotamos medidas técnicas e organizacionais para proteger as informações que você confia à nossa plataforma de gerenciamento de tarefas.",
      "Esta página descreve, de forma transparente, as principais práticas de segurança que utilizamos.",
    ],
  },
  {
    title: "2. Criptografia",
    paragraphs: [
      "Protegemos os seus dados em todas as etapas:",
    ],
    bullets: [
      "Criptografia em trânsito: todo o tráfego é protegido por TLS (HTTPS).",
      "Criptografia em repouso: os dados armazenados são criptografados.",
      "Senhas: armazenadas apenas em formato de hash, nunca em texto puro.",
    ],
  },
  {
    title: "3. Controle de acesso",
    paragraphs: [
      "O acesso aos dados é regido pelo princípio do menor privilégio. Cada usuário acessa apenas os projetos e tarefas aos quais foi autorizado, e o acesso interno aos sistemas é restrito e monitorado.",
    ],
  },
  {
    title: "4. Infraestrutura",
    paragraphs: [
      "Nossa plataforma é hospedada em provedores de nuvem reconhecidos, que mantêm certificações de segurança reconhecidas pelo mercado. A infraestrutura conta com isolamento de ambientes, backups regulares e monitoramento contínuo.",
    ],
  },
  {
    title: "5. Monitoramento e resposta a incidentes",
    paragraphs: [
      "Monitoramos continuamente a plataforma em busca de atividades suspeitas. Em caso de incidente de segurança que afete os seus dados, agiremos para conter o problema e notificaremos os usuários impactados conforme exigido por lei.",
    ],
  },
  {
    title: "6. Boas práticas para a sua conta",
    paragraphs: [
      "A segurança também depende de você. Recomendamos:",
    ],
    bullets: [
      "Utilizar uma senha forte e exclusiva para a sua conta.",
      "Não compartilhar as suas credenciais de acesso.",
      "Manter o seu dispositivo e navegador atualizados.",
      "Encerrar a sessão ao utilizar dispositivos compartilhados.",
    ],
  },
  {
    title: "7. Divulgação responsável",
    paragraphs: [
      "Se você identificar uma vulnerabilidade de segurança, pedimos que entre em contato de forma responsável pelo e-mail admin@solutlabs.com.br antes de divulgá-la publicamente. Analisaremos o relato com prioridade.",
    ],
  },
  {
    title: "8. Contato",
    paragraphs: [
      "Em caso de dúvidas sobre as nossas práticas de segurança, entre em contato pelo e-mail admin@solutlabs.com.br.",
    ],
  },
];

export function SecurityContent() {
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
          Segurança
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            mb: theme.spacing(6),
          }}
        >
          Última atualização: {LAST_UPDATED}
        </Typography>

        <Stack spacing={5}>
          {SECTIONS.map((section) => (
            <Box component="section" key={section.title}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mb: theme.spacing(2) }}
              >
                {section.title}
              </Typography>

              {section.paragraphs.map((paragraph, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: theme.spacing(1.5),
                  }}
                >
                  {paragraph}
                </Typography>
              ))}

              {section.bullets && (
                <Box
                  component="ul"
                  sx={{
                    m: 0,
                    pl: theme.spacing(3),
                    color: theme.palette.text.secondary,
                  }}
                >
                  {section.bullets.map((bullet) => (
                    <Typography
                      component="li"
                      variant="body1"
                      key={bullet}
                      sx={{ mb: theme.spacing(1) }}
                    >
                      {bullet}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
