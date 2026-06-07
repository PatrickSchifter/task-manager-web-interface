"use client";
import Link from "next/link";
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  Button,
  alpha,
  useTheme,
} from "@mui/material";
import {
  AutoAwesomeOutlined,
  TagOutlined,
  NorthEastOutlined,
  CalendarTodayOutlined,
  AddOutlined,
  RocketLaunchOutlined,
} from "@mui/icons-material";
import {
  PriorityConfigItem,
  RecentProject,
  StatItem,
  TaskItem,
  TaskPriorityLevel,
} from "./types";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { ProjectDialog } from "@/src/components/projects/ProjectDialog";
import { HEADER_HEIGHT } from "@/src/components/ui/Sidebar";
interface IProps {
  stats: StatItem[];
  recentProjects: RecentProject[];
  upcoming: TaskItem[];
  priorityConfig: Record<TaskPriorityLevel, PriorityConfigItem>;
}

export default function DashboardClient({
  stats,
  recentProjects,
  upcoming,
  priorityConfig,
}: IProps) {
  const theme = useTheme();
  const { user } = useWorkspace();
  const firstName = user.name?.split(" ")[0] ?? "você";

  return (
    <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
      <Box
        component="header"
        sx={() => ({
          px: { xs: theme.spacing(2), md: theme.spacing(4) },
          py: { xs: theme.spacing(2.5), md: 0 },
          minHeight: { md: HEADER_HEIGHT },
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: theme.spacing(2), sm: 0 },
          // No mobile o header rola junto com o conteúdo; só fixa no desktop.
          position: { xs: "static", md: "sticky" },
          top: { md: 0 },
          zIndex: { md: theme.zIndex.appBar - 1 },
        })}
      >
        <Box>
          <Typography
            variant="h5"
            sx={() => ({
              fontWeight: 700,
              color: theme.palette.text.primary,
              letterSpacing: "-0.02em",
            })}
          >
            Olá, {firstName} 👋
          </Typography>
          <Typography
            variant="body2"
            sx={() => ({
              color: theme.palette.text.secondary,
              mt: theme.spacing(0.5),
            })}
          >
            Aqui está o resumo do seu workspace.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing(1.5),
            flexWrap: "wrap",
          }}
        >
          <Button
            component={Link}
            href="/chat"
            startIcon={<AutoAwesomeOutlined />}
            variant="outlined"
            size="small"
            color="primary"
            sx={() => ({
              borderColor: alpha(theme.palette.primary.main, 0.3),
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              color: theme.palette.primary.main,
              fontWeight: 600,
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                borderColor: alpha(theme.palette.primary.main, 0.5),
              },
            })}
          >
            Perguntar à IA
          </Button>

          <ProjectDialog
            trigger={
              <Button
                startIcon={<AddOutlined />}
                variant="contained"
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              >
                Novo projeto
              </Button>
            }
          />
        </Box>
      </Box>

      {/* ── Content ── */}
      <Box
        sx={(theme) => ({
          p: { xs: theme.spacing(2), md: theme.spacing(4) },
          "& > * + *": { mt: { xs: theme.spacing(3), md: theme.spacing(4) } },
        })}
      >
        {/* Stats Row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {stats.map((stat) => (
            <Card
              key={stat.label}
              elevation={0}
              sx={(theme) => ({
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: `${(theme.shape.borderRadius as number) * 2}px`,
                bgcolor: theme.palette.background.paper,
                transition:
                  "border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
                // accent bar along the top edge
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: stat.accent,
                },
                // soft accent glow in the corner
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${alpha(stat.accent, 0.18)}, transparent 70%)`,
                  pointerEvents: "none",
                },
                "&:hover": {
                  borderColor: alpha(stat.accent, 0.5),
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(stat.accent, 0.15)}`,
                },
              })}
            >
              <CardContent
                sx={(theme) => ({
                  position: "relative",
                  p: theme.spacing(2.5),
                  "&:last-child": { pb: theme.spacing(2.5) },
                })}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={() => ({
                      width: 36,
                      height: 36,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      bgcolor: alpha(stat.accent, 0.12),
                      border: `1px solid ${alpha(stat.accent, 0.25)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    <stat.icon
                      sx={() => ({
                        fontSize: 16,
                        color: stat.accent,
                      })}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({
                      fontWeight: 700,
                      color: theme.palette.success.main,
                      fontSize: 11,
                    })}
                  >
                    {stat.trend}
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={(theme) => ({
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  })}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: theme.palette.text.disabled,
                    fontSize: 11,
                    mt: theme.spacing(0.5),
                    display: "block",
                  })}
                >
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Projects + Upcoming */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: 3,
          }}
        >
          {/* Projects — takes 2/3 */}
          <Box sx={{ minWidth: 0, gridColumn: { xs: "auto", md: "span 2" } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={(theme) => ({
                  fontWeight: 700,
                  fontSize: 15,
                  color: theme.palette.text.primary,
                  letterSpacing: "-0.01em",
                })}
              >
                Projetos ativos
              </Typography>
            </Box>

            {recentProjects.length === 0 ? (
              <ProjectDialog
                trigger={
                  <Box
                    role="button"
                    tabIndex={0}
                    sx={(theme) => ({
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: theme.spacing(2),
                      px: { xs: theme.spacing(3), sm: theme.spacing(5) },
                      py: { xs: theme.spacing(4), sm: theme.spacing(6) },
                      border: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
                      borderRadius: `${(theme.shape.borderRadius as number) * 2}px`,
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                      cursor: "pointer",
                      transition:
                        "border-color 0.15s ease, background 0.15s ease",
                      "&:hover": {
                        borderColor: alpha(theme.palette.primary.main, 0.7),
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                      },
                    })}
                  >
                    <Box
                      sx={(theme) => ({
                        width: 52,
                        height: 52,
                        borderRadius: `${(theme.shape.borderRadius as number) * 1.5}px`,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      })}
                    >
                      <RocketLaunchOutlined sx={{ fontSize: 24, color: "#fff" }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={(theme) => ({
                          fontWeight: 700,
                          fontSize: 16,
                          color: theme.palette.text.primary,
                          letterSpacing: "-0.01em",
                        })}
                      >
                        Crie seu primeiro projeto
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={(theme) => ({
                          color: theme.palette.text.secondary,
                          mt: theme.spacing(0.5),
                          maxWidth: 360,
                        })}
                      >
                        Um projeto é onde você organiza tarefas, prazos e
                        colaboradores. Comece criando o seu agora.
                      </Typography>
                    </Box>
                    <Button
                      component="span"
                      startIcon={<AddOutlined />}
                      variant="contained"
                      color="primary"
                      sx={{ fontWeight: 600, mt: theme.spacing(0.5) }}
                    >
                      Novo projeto
                    </Button>
                  </Box>
                }
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                {recentProjects.map((project) => {
                const pct = Math.round((project.done / project.tasks) * 100);
                return (
                  <Card
                    key={project.id}
                    component={Link}
                    href={`/projects/${project.id}`}
                    elevation={0}
                    sx={(theme) => ({
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: `${(theme.shape.borderRadius as number) * 2}px`,
                      bgcolor: theme.palette.background.paper,
                      textDecoration: "none",
                      display: "block",
                      transition: "border-color 0.15s ease",
                      "&:hover": {
                        borderColor: alpha(theme.palette.primary.main, 0.4),
                        "& .project-arrow": {
                          color: theme.palette.primary.main,
                        },
                      },
                    })}
                  >
                    <CardContent
                      sx={(theme) => ({
                        p: theme.spacing(2.5),
                        "&:last-child": { pb: theme.spacing(2.5) },
                      })}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={(theme) => ({
                            width: 38,
                            height: 38,
                            borderRadius: `${theme.shape.borderRadius}px`,
                            background: project.gradientCss,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          })}
                        >
                          <TagOutlined sx={{ fontSize: 18, color: "#fff" }} />
                        </Box>
                        <NorthEastOutlined
                          className="project-arrow"
                          sx={(theme) => ({
                            fontSize: 16,
                            color: theme.palette.text.disabled,
                            transition: "color 0.15s",
                          })}
                        />
                      </Box>

                      <Typography
                        variant="body1"
                        sx={(theme) => ({
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          mb: theme.spacing(1.5),
                          fontSize: 14,
                        })}
                      >
                        {project.name}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 0.75,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={(theme) => ({
                            color: theme.palette.text.secondary,
                            fontSize: 11,
                          })}
                        >
                          {project.done}/{project.tasks} tarefas
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={(theme) => ({
                            fontFamily: "monospace",
                            fontSize: 11,
                            color: theme.palette.text.secondary,
                          })}
                        >
                          {isNaN(pct) ? 0 : pct}%
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={(theme) => ({
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.text.primary, 0.06),
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 2,
                            background: project.gradientCss,
                          },
                        })}
                      />
                    </CardContent>
                  </Card>
                );
                })}
              </Box>
            )}
          </Box>

          {/* Upcoming Tasks */}
          <Box>
            <Typography
              variant="h6"
              sx={(theme) => ({
                fontWeight: 700,
                fontSize: 15,
                color: theme.palette.text.primary,
                letterSpacing: "-0.01em",
                mb: theme.spacing(2),
              })}
            >
              Próximas
            </Typography>

            <Stack spacing={1.5}>
              {upcoming.map((task) => (
                <Card
                  key={task.id}
                  component={Link}
                  href={`/projects/${task.project.id}/tasks/${task.id}`}
                  elevation={0}
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: `${(theme.shape.borderRadius as number) * 1.5}px`,
                    bgcolor: theme.palette.background.paper,
                    textDecoration: "none",
                    display: "block",
                    transition: "border-color 0.15s ease",
                    "&:hover": {
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      "& .task-title": { color: "primary.main" },
                    },
                  })}
                >
                  <CardContent
                    sx={(theme) => ({
                      p: theme.spacing(2),
                      "&:last-child": { pb: theme.spacing(2) },
                    })}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={(theme) => ({
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontFamily: "monospace",
                          fontSize: 10,
                          color: theme.palette.text.disabled,
                        })}
                      >
                        {task.id}
                      </Typography>
                      <Chip
                        label={task.priority}
                        color={priorityConfig[task.priority].color}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          "& .MuiChip-label": { px: 0.75 },
                        }}
                      />
                    </Box>

                    <Typography
                      className="task-title"
                      variant="body2"
                      sx={(theme) => ({
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                        mb: theme.spacing(1.5),
                        fontSize: 13,
                        lineHeight: 1.4,
                        transition: "color 0.15s",
                      })}
                    >
                      {task.title}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={(theme) => ({
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: theme.palette.text.disabled,
                          fontSize: 11,
                        })}
                      >
                        # {task.project.name}
                      </Typography>
                      <Box
                        sx={(theme) => ({
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing(0.5),
                          color: theme.palette.text.disabled,
                        })}
                      >
                        <CalendarTodayOutlined sx={{ fontSize: 11 }} />
                        <Typography variant="caption" sx={{ fontSize: 11 }}>
                          {task.due}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
