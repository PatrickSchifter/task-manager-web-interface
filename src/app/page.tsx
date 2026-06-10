"use client";

import React from "react";
import NextLink from "next/link";
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ArrowRight,
  Bot,
  Check,
  MessageSquare,
  Repeat2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { LogoLink } from "../components/ui/LogoLink";
import { AppFooter } from "../components/ui/AppFooter";

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------
function Nav() {
  const theme = useTheme();
  return (
    <Box
      component="nav"
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

      <Stack
        direction="row"
        spacing={4}
        sx={{ display: { xs: "none", md: "flex" } }}
      >
        {["Produto", "Recursos", "Preços"].map((label) => (
          <Box
            key={label}
            component="a"
            href={`#${label.toLowerCase()}`}
            sx={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: theme.palette.text.secondary,
              textDecoration: "none",
              "&:hover": { color: theme.palette.primary.main },
              transition: "color 0.2s",
            }}
          >
            {label}
          </Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Box
          component={NextLink}
          href="/auth/login"
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: theme.palette.text.primary,
            textDecoration: "none",
            "&:hover": { color: theme.palette.primary.main },
            transition: "color 0.2s",
          }}
        >
          Entrar
        </Box>
        <Button
          component={NextLink}
          href="/auth/register"
          variant="contained"
          size="small"
          sx={{
            bgcolor: theme.palette.text.primary,
            color: theme.palette.background.default,
            borderRadius: "9999px",
            px: theme.spacing(2.5),
            fontWeight: 700,
            "&:hover": { bgcolor: theme.palette.text.primary, opacity: 0.9 },
          }}
        >
          Começar grátis
        </Button>
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function Hero() {
  const theme = useTheme();
  return (
    <Box
      component="section"
      id={"produto"}
      sx={{
        px: { xs: theme.spacing(2), md: theme.spacing(4) },
        pt: { xs: theme.spacing(8), md: theme.spacing(12) },
        pb: theme.spacing(6),
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial glow */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 0%, ${theme.palette.primary.main}30, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative" }}>
        {/* Badge */}
        <Chip
          icon={
            <Box
              sx={{
                position: "relative",
                display: "flex",
                ml: theme.spacing(0.5),
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  bgcolor: theme.palette.primary.main,
                  opacity: 0.75,
                  animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
                  "@keyframes ping": {
                    "75%, 100%": { transform: "scale(2)", opacity: 0 },
                  },
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: theme.palette.primary.main,
                }}
              />
            </Box>
          }
          label="AGORA COM ASSISTENTE DE IA"
          size="small"
          sx={{
            mb: theme.spacing(3),
            bgcolor: `${theme.palette.primary.main}1a`,
            border: `1px solid ${theme.palette.primary.main}33`,
            color: theme.palette.primary.main,
            fontWeight: 700,
            fontSize: "0.7rem",
            letterSpacing: "0.05em",
          }}
        />

        {/* Headline */}
        <Typography
          variant="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "2.5rem", md: "4.5rem" },
            lineHeight: 1.05,
            maxWidth: "56rem",
            mx: "auto",
            mb: theme.spacing(3),
            color: theme.palette.text.primary,
          }}
        >
          Gerencie tarefas com{" "}
          <Box component="span" sx={{ color: theme.palette.primary.main }}>
            inteligência de máquina.
          </Box>
        </Typography>

        <Typography
          variant="body1"
          sx={{
            maxWidth: "42rem",
            mx: "auto",
            color: theme.palette.text.secondary,
            fontSize: "1.125rem",
            mb: theme.spacing(5),
          }}
        >
          O workspace all-in-one para times de alta velocidade. Projetos,
          tarefas, rotinas pessoais e colaboração com IA em tempo real, numa
          interface única e bonita.
        </Typography>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mb: theme.spacing(10), justifyContent: "center" }}
        >
          <Button
            component={NextLink}
            href="/auth/register"
            variant="contained"
            color="primary"
            endIcon={<ArrowRight size={16} />}
            sx={{
              borderRadius: "9999px",
              px: theme.spacing(3),
              py: theme.spacing(1.5),
              fontWeight: 700,
              fontSize: "0.875rem",
            }}
          >
            Comece grátis
          </Button>
          <Button
            component={NextLink}
            href="/dashboard"
            variant="outlined"
            sx={{
              borderRadius: "9999px",
              px: theme.spacing(3),
              py: theme.spacing(1.5),
              fontWeight: 700,
              fontSize: "0.875rem",
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              bgcolor: `${theme.palette.common.white}0d`,
              "&:hover": { bgcolor: `${theme.palette.common.white}1a` },
            }}
          >
            Ver demo
          </Button>
        </Stack>

        {/* Dashboard preview */}
        <Box sx={{ maxWidth: "72rem", mx: "auto", position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              inset: -16,
              bgcolor: `${theme.palette.primary.main}33`,
              filter: "blur(48px)",
              borderRadius: "9999px",
              opacity: 0.4,
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "relative",
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[24],
              overflow: "hidden",
            }}
          >
            <DashboardPreview />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Preview
// ---------------------------------------------------------------------------
function DashboardPreview() {
  const theme = useTheme();

  const tasks = [
    { label: "Finalizar responsividade do dashboard", done: false },
    { label: "Refatorar middleware de auth", done: false },
    { label: "Sessão inicial de branding", done: true },
  ];

  return (
    <Grid container sx={{ height: { xs: "auto", md: 500 } }}>
      {/* Sidebar */}
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          borderRight: `1px solid ${theme.palette.divider}`,
          p: theme.spacing(2),
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.secondary,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            display: "block",
            mb: theme.spacing(1.5),
          }}
        >
          Projetos
        </Typography>
        <Stack spacing={0.5}>
          {["Q3 Roadmap", "API Engine", "Design System"].map((p, i) => (
            <Box
              key={p}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
                px: theme.spacing(1),
                py: theme.spacing(0.75),
                borderRadius: theme.shape.borderRadius,
                bgcolor:
                  i === 0 ? `${theme.palette.primary.main}1a` : "transparent",
                color:
                  i === 0
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                fontSize: "0.75rem",
              }}
            >
              # {p}
            </Box>
          ))}
        </Stack>
      </Grid>

      {/* Task list */}
      <Grid size={{ xs: 12, md: 6 }} sx={{ p: theme.spacing(3), overflow: "hidden" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: theme.spacing(2) }}>
          Q3 Roadmap
        </Typography>
        <Stack spacing={1}>
          {tasks.map(({ label, done }) => (
            <Box
              key={label}
              sx={{
                p: theme.spacing(1.5),
                bgcolor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1.5),
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "4px",
                  border: `2px solid ${done ? theme.palette.primary.main : theme.palette.text.disabled}`,
                  bgcolor: done ? theme.palette.primary.main : "transparent",
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: done
                    ? theme.palette.text.secondary
                    : theme.palette.text.primary,
                  textDecoration: done ? "line-through" : "none",
                }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Grid>

      {/* AI panel */}
      <Grid
        size={{ xs: 12, md: 3 }}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: `${theme.palette.background.paper}80`,
          p: theme.spacing(2),
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: theme.spacing(2), alignItems: "center" }}
        >
          <Sparkles size={16} color={theme.palette.primary.main} />
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: theme.palette.text.primary }}
          >
            Solut Tasks AI
          </Typography>
        </Stack>
        <Stack spacing={1}>
          <Box
            sx={{
              bgcolor: theme.palette.background.default,
              p: theme.spacing(1.5),
              borderRadius: theme.shape.borderRadius,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary }}
            >
              Como posso ajudar com a tarefa de auth hoje?
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${theme.palette.primary.main}1a`,
              p: theme.spacing(1.5),
              borderRadius: theme.shape.borderRadius,
              border: `1px solid ${theme.palette.primary.main}33`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.primary.main }}
            >
              Sugira casos de teste para o middleware.
            </Typography>
          </Box>
        </Stack>
      </Grid>

      {/* Routines panel */}
      <Grid
        size={{ xs: 12, md: 3 }}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          borderLeft: `1px solid ${theme.palette.divider}`,
          p: theme.spacing(2),
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: theme.spacing(2), alignItems: "center" }}
        >
          <Repeat2 size={16} color={theme.palette.secondary.main} />
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: theme.palette.text.primary }}
          >
            Rotinas de hoje
          </Typography>
        </Stack>
        <Stack spacing={1}>
          {[
            { label: "Tomar água", done: true, ratio: "3/3" },
            { label: "Exercitar", done: false, ratio: "1/2" },
            { label: "Leitura", done: false, ratio: "0/1" },
          ].map(({ label, done, ratio }) => (
            <Box
              key={label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
                px: theme.spacing(1),
                py: theme.spacing(0.75),
                borderRadius: theme.shape.borderRadius,
                bgcolor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: `2px solid ${done ? theme.palette.success.main : theme.palette.text.disabled}`,
                  bgcolor: done ? theme.palette.success.main : "transparent",
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  flex: 1,
                  color: done
                    ? theme.palette.text.disabled
                    : theme.palette.text.primary,
                  textDecoration: done ? "line-through" : "none",
                  fontSize: "0.7rem",
                }}
              >
                {label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.65rem",
                  color: done
                    ? theme.palette.success.main
                    : theme.palette.text.disabled,
                  fontWeight: done ? 700 : 400,
                }}
              >
                {ratio}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
}

// ---------------------------------------------------------------------------
// Feature Card
// ---------------------------------------------------------------------------
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  description: string;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: theme.spacing(3),
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: (theme.shape.borderRadius as number) * 2,
        transition: "border-color 0.2s",
        "&:hover": { borderColor: `${theme.palette.primary.main}66` },
        "&:hover .feature-icon": {
          bgcolor: `${theme.palette.primary.main}33`,
        },
      }}
    >
      <Box
        className="feature-icon"
        sx={{
          width: 40,
          height: 40,
          borderRadius: theme.shape.borderRadius,
          bgcolor: `${theme.palette.primary.main}1a`,
          border: `1px solid ${theme.palette.primary.main}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: theme.spacing(2.5),
          transition: "background-color 0.2s",
        }}
      >
        <Icon size={20} color={theme.palette.primary.main} />
      </Box>
      <Typography
        variant="body1"
        sx={{ fontWeight: 700, mb: theme.spacing(1) }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}
      >
        {description}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Features Section
// ---------------------------------------------------------------------------
function FeaturesSection() {
  const theme = useTheme();

  const features = [
    {
      icon: Bot,
      title: "Chat com IA contextual",
      description:
        "Converse com a Solut Tasks AI sobre qualquer tarefa, projeto ou rotina. Ela entende o contexto e gera planos de ação.",
    },
    {
      icon: Users,
      title: "Colaboradores em tempo real",
      description:
        "Atribua tarefas, marque colegas e veja atualizações ao vivo. Sem mais e-mails infinitos.",
    },
    {
      icon: Repeat2,
      title: "Rotinas inteligentes",
      description:
        "Cadastre hábitos recorrentes com horário de início e fim, escolha os dias da semana e acompanhe sua evolução diária direto no dashboard.",
    },
    {
      icon: MessageSquare,
      title: "Comentários ricos",
      description:
        "Discussões com markdown, menções e anexos diretamente em cada tarefa. Decisões sempre rastreáveis.",
    },
    {
      icon: Zap,
      title: "Performance instantânea",
      description:
        "Construído sobre infraestrutura edge. Cada clique parece instantâneo, em qualquer dispositivo.",
    },
  ];

  return (
    <Box
      component="section"
      id="recursos"
      sx={{
        px: { xs: theme.spacing(2), md: theme.spacing(4) },
        py: { xs: theme.spacing(8), md: theme.spacing(16) },
        maxWidth: "88rem",
        mx: "auto",
      }}
    >
      <Box sx={{ textAlign: "center", mb: theme.spacing(8) }}>
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 700,
            letterSpacing: "0.15em",
            display: "block",
            mb: theme.spacing(1.5),
          }}
        >
          Recursos
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "2rem", md: "3rem" },
            maxWidth: "32rem",
            mx: "auto",
          }}
        >
          Tudo que seu time precisa, num lugar só.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {features.map((f) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.title}>
            <FeatureCard {...f} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Price Card
// ---------------------------------------------------------------------------
function PriceCard({
  name,
  price,
  tagline,
  perks,
  highlight,
}: {
  name: string;
  price: string;
  tagline: string;
  perks: string[];
  highlight?: boolean;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: theme.spacing(4),
        borderRadius: (theme.shape.borderRadius as number) * 2,
        border: `1px solid ${highlight ? `${theme.palette.primary.main}66` : theme.palette.divider}`,
        bgcolor: highlight
          ? `${theme.palette.primary.main}0d`
          : theme.palette.background.paper,
        boxShadow: highlight ? theme.shadows[8] : theme.shadows[0],
      }}
    >
      <Stack
        direction="row"
        sx={{
          mb: theme.spacing(2),
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {name}
        </Typography>
        {highlight && (
          <Chip
            label="Popular"
            size="small"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontWeight: 700,
              fontSize: "0.65rem",
              letterSpacing: "0.08em",
            }}
          />
        )}
      </Stack>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{ mb: theme.spacing(1), alignItems: "baseline" }}
      >
        <Typography variant="h2" sx={{ fontWeight: 700, lineHeight: 1 }}>
          {price}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          /mês
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, mb: theme.spacing(3) }}
      >
        {tagline}
      </Typography>

      <List dense disablePadding sx={{ mb: theme.spacing(4) }}>
        {perks.map((p) => (
          <ListItem
            key={p}
            disableGutters
            disablePadding
            sx={{ mb: theme.spacing(1) }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Check size={16} color={theme.palette.primary.main} />
            </ListItemIcon>
            <ListItemText
              primary={p}
              slotProps={{
                primary: {
                  variant: "body2",
                  color: theme.palette.text.primary,
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      <Button
        component={NextLink}
        href="/auth/register"
        fullWidth
        variant={highlight ? "contained" : "outlined"}
        color="primary"
        sx={{
          borderRadius: (theme.shape.borderRadius as number) * 1.5,
          fontWeight: 700,
          py: theme.spacing(1.5),
          ...(highlight
            ? {}
            : {
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                bgcolor: `${theme.palette.common.white}0d`,
                "&:hover": { bgcolor: `${theme.palette.common.white}1a` },
              }),
        }}
      >
        Começar
      </Button>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Pricing Section
// ---------------------------------------------------------------------------
function PricingSection() {
  const theme = useTheme();
  return (
    <Box
      component="section"
      id="preços"
      sx={{
        px: { xs: theme.spacing(2), md: theme.spacing(4) },
        py: { xs: theme.spacing(8), md: theme.spacing(12) },
        bgcolor: `${theme.palette.background.paper}80`,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ maxWidth: "60rem", mx: "auto" }}>
        <Box sx={{ textAlign: "center", mb: theme.spacing(6) }}>
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: "0.15em",
              display: "block",
              mb: theme.spacing(1.5),
            }}
          >
            Preços
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontWeight: 700, fontSize: { xs: "2rem", md: "3rem" } }}
          >
            Simples e justo.
          </Typography>
        </Box>

        <Grid container sx={{ justifyContent: "center" }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PriceCard
              name="Free"
              price="R$0"
              tagline="Para começar com seu time."
              perks={[
                "Até 5 colaboradores",
                "Projetos ilimitados",
                "Rotinas pessoais ilimitadas",
                "100 mensagens de IA/mês",
              ]}
            />
          </Grid>
          {/* <Grid size={6}>
            <PriceCard
              name="Pro"
              price="R$39"
              tagline="Para times sérios sobre velocidade."
              perks={[
                "Colaboradores ilimitados",
                "IA contextual ilimitada",
                "Histórico avançado",
                "Suporte prioritário",
              ]}
              highlight
            />
          </Grid> */}
        </Grid>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// CTA Section
// ---------------------------------------------------------------------------
function CTASection() {
  const theme = useTheme();
  return (
    <Box
      component="section"
      sx={{
        px: { xs: theme.spacing(2), md: theme.spacing(4) },
        py: { xs: theme.spacing(8), md: theme.spacing(12) },
        textAlign: "center",
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "2rem", md: "3rem" },
          maxWidth: "32rem",
          mx: "auto",
          mb: theme.spacing(2),
        }}
      >
        Pronto para acelerar seu time?
      </Typography>
      {/* <Typography
        variant="body1"
        sx={{ color: theme.palette.text.secondary, mb: theme.spacing(4) }}
      >
        14 dias grátis. Sem cartão.
      </Typography> */}
      <Button
        component={NextLink}
        href="/auth/register"
        variant="contained"
        color="primary"
        endIcon={<ArrowRight size={16} />}
        sx={{
          borderRadius: "9999px",
          px: theme.spacing(4),
          py: theme.spacing(2),
          fontWeight: 700,
          fontSize: "0.875rem",
        }}
      >
        Criar minha conta
      </Button>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Page (Next.js default export)
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      <Nav />
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <AppFooter />
    </Box>
  );
}
