"use client";

import NextLink from "next/link";
import { Box, Typography, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowLeft } from "lucide-react";
import { LogoLink } from "@/src/components/ui/LogoLink";

// ---------------------------------------------------------------------------
// Content — kept data-driven so it's easy to keep the terms up to date
// ---------------------------------------------------------------------------
const LAST_UPDATED = "5 de junho de 2026";

interface Section {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Aceitação dos termos",
    paragraphs: [
      "Estes Termos de Uso (“Termos”) regem o acesso e a utilização da plataforma Solut Tasks, oferecida pela Solut Labs Inc. (“Solut Tasks”, “nós”).",
      "Ao criar uma conta ou utilizar a plataforma, você declara que leu, entendeu e concorda com estes Termos. Caso não concorde, não utilize o serviço.",
    ],
  },
  {
    title: "2. Descrição do serviço",
    paragraphs: [
      "O Solut Tasks é uma plataforma de gerenciamento de tarefas e projetos que permite organizar atividades, colaborar com sua equipe e utilizar recursos de inteligência artificial para aumentar a produtividade.",
      "Podemos adicionar, alterar ou remover funcionalidades a qualquer momento para melhorar a experiência de uso.",
    ],
  },
  {
    title: "3. Cadastro e conta",
    paragraphs: ["Para utilizar a plataforma você concorda em:"],
    bullets: [
      "Fornecer informações verdadeiras, completas e atualizadas no cadastro.",
      "Manter a confidencialidade das suas credenciais de acesso.",
      "Ser responsável por todas as atividades realizadas na sua conta.",
      "Notificar-nos imediatamente em caso de uso não autorizado da sua conta.",
    ],
  },
  {
    title: "4. Uso aceitável",
    paragraphs: ["Ao utilizar o Solut Tasks, você concorda em não:"],
    bullets: [
      "Violar leis aplicáveis ou direitos de terceiros.",
      "Enviar conteúdo ilegal, ofensivo, malicioso ou que infrinja propriedade intelectual.",
      "Tentar acessar áreas restritas, comprometer a segurança ou interferir no funcionamento da plataforma.",
      "Utilizar a plataforma para envio de spam ou atividades fraudulentas.",
    ],
  },
  {
    title: "5. Conteúdo do usuário",
    paragraphs: [
      "Você mantém todos os direitos sobre os dados, projetos e tarefas que cria na plataforma (“Conteúdo do Usuário”). Você nos concede apenas a licença necessária para hospedar, processar e exibir esse conteúdo com a finalidade de operar o serviço.",
      "Você é o único responsável pelo Conteúdo do Usuário e por garantir que possui os direitos necessários para utilizá-lo.",
    ],
  },
  {
    title: "6. Planos e pagamentos",
    paragraphs: [
      "Alguns recursos podem exigir um plano pago. Os valores, ciclos de cobrança e condições serão informados no momento da contratação.",
      "Salvo disposição em contrário, as assinaturas são renovadas automaticamente até que sejam canceladas. O cancelamento interrompe renovações futuras, mas não gera reembolso de períodos já pagos, exceto quando exigido por lei.",
    ],
  },
  {
    title: "7. Propriedade intelectual",
    paragraphs: [
      "A plataforma, incluindo marca, logotipo, software, interface e demais elementos, é de titularidade da Solut Labs Inc. e protegida por leis de propriedade intelectual. Estes Termos não concedem a você qualquer direito sobre esses ativos além do uso permitido do serviço.",
    ],
  },
  {
    title: "8. Disponibilidade e suporte",
    paragraphs: [
      "Empenhamo-nos para manter a plataforma disponível e estável, mas não garantimos operação ininterrupta ou livre de erros. Poderemos realizar manutenções, atualizações ou suspensões temporárias quando necessário.",
    ],
  },
  {
    title: "9. Limitação de responsabilidade",
    paragraphs: [
      "Na máxima extensão permitida por lei, o Solut Tasks não se responsabiliza por danos indiretos, incidentais ou lucros cessantes decorrentes do uso ou da impossibilidade de uso da plataforma. O serviço é fornecido “no estado em que se encontra”.",
    ],
  },
  {
    title: "10. Suspensão e encerramento",
    paragraphs: [
      "Podemos suspender ou encerrar a sua conta em caso de violação destes Termos ou de uso indevido da plataforma. Você pode encerrar a sua conta a qualquer momento por meio das configurações ou solicitando o cancelamento.",
    ],
  },
  {
    title: "11. Alterações nos termos",
    paragraphs: [
      "Podemos atualizar estes Termos periodicamente. Quando isso acontecer, revisaremos a data de “Última atualização” e, se as mudanças forem significativas, notificaremos você por e-mail ou pela própria plataforma. O uso contínuo após as alterações representa a sua concordância com os novos Termos.",
    ],
  },
  {
    title: "12. Contato",
    paragraphs: [
      "Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail suporte@solutlabs.com.",
    ],
  },
];

export function TermsContent() {
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
          Termos de Uso
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
