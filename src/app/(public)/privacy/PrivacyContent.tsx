"use client";

import NextLink from "next/link";
import { Box, Typography, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowLeft } from "lucide-react";
import { LogoLink } from "@/src/components/ui/LogoLink";

// ---------------------------------------------------------------------------
// Content — kept data-driven so it's easy to keep the policy up to date
// ---------------------------------------------------------------------------
const LAST_UPDATED = "5 de junho de 2026";

interface Section {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Introdução",
    paragraphs: [
      "A Solut Labs Inc. (“Solut Tasks”, “nós”) leva a sua privacidade a sério. Esta Política de Privacidade explica quais dados coletamos, como os utilizamos e quais são os seus direitos ao usar a nossa plataforma.",
      "Ao acessar ou utilizar o Solut Tasks, você concorda com as práticas descritas neste documento.",
    ],
  },
  {
    title: "2. Informações que coletamos",
    paragraphs: ["Coletamos os seguintes tipos de informação:"],
    bullets: [
      "Dados de cadastro: nome, e-mail e senha criptografada.",
      "Dados de uso: projetos, tarefas, mensagens e interações com a plataforma.",
      "Dados técnicos: endereço IP, tipo de navegador e dados de dispositivo.",
    ],
  },
  {
    title: "3. Como usamos suas informações",
    paragraphs: ["Utilizamos os dados coletados para:"],
    bullets: [
      "Fornecer, manter e melhorar a plataforma.",
      "Personalizar a sua experiência e os recursos de IA.",
      "Enviar comunicações operacionais e de segurança.",
      "Cumprir obrigações legais e prevenir fraudes.",
    ],
  },
  {
    title: "4. Compartilhamento de informações",
    paragraphs: [
      "Não vendemos os seus dados pessoais. Compartilhamos informações apenas com prestadores de serviço que nos ajudam a operar a plataforma (como hospedagem e processamento de pagamentos) e quando exigido por lei.",
    ],
  },
  {
    title: "5. Cookies e tecnologias semelhantes",
    paragraphs: [
      "Utilizamos cookies e tecnologias semelhantes para manter a sua sessão ativa, lembrar preferências e entender como a plataforma é utilizada. Você pode gerenciar os cookies nas configurações do seu navegador.",
    ],
  },
  {
    title: "6. Segurança dos dados",
    paragraphs: [
      "Adotamos medidas técnicas e organizacionais para proteger os seus dados, incluindo criptografia em trânsito e em repouso e controles de acesso. Nenhum sistema é 100% seguro, mas trabalhamos continuamente para reduzir riscos.",
    ],
  },
  {
    title: "7. Seus direitos",
    paragraphs: [
      "De acordo com a LGPD (Lei nº 13.709/2018), você pode solicitar a qualquer momento:",
    ],
    bullets: [
      "Acesso, correção ou exclusão dos seus dados.",
      "Portabilidade dos dados a outro fornecedor.",
      "Revogação do consentimento previamente concedido.",
    ],
  },
  {
    title: "8. Retenção de dados",
    paragraphs: [
      "Mantemos os seus dados apenas pelo tempo necessário para cumprir as finalidades descritas nesta política ou para atender a obrigações legais. Após esse período, os dados são anonimizados ou excluídos.",
    ],
  },
  {
    title: "9. Alterações nesta política",
    paragraphs: [
      "Podemos atualizar esta Política de Privacidade periodicamente. Quando isso acontecer, revisaremos a data de “Última atualização” e, se as mudanças forem significativas, notificaremos você por e-mail ou pela própria plataforma.",
    ],
  },
  {
    title: "10. Contato",
    paragraphs: [
      "Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em contato pelo e-mail privacidade@solutlabs.com.",
    ],
  },
];

export function PrivacyContent() {
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
          Política de Privacidade
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
