import { useTheme } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export function Logo() {
  const theme = useTheme();

  return (
    <Box
      component="div"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        transition: "opacity 0.2s",
        "&:hover": { opacity: 0.9 },
      }}
    >
      {/* Ícone decorativo (opcional, mas moderno) */}
      <AutoAwesomeIcon
        sx={{
          fontSize: 24,
          color: theme.palette.primary.main,
          filter: "drop-shadow(0 0 2px rgba(0,0,0,0.1))",
        }}
      />

      <Typography
        variant="h6"
        component="span"
        sx={{
          fontWeight: 800,
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          letterSpacing: "-0.02em",
          background: `linear-gradient(135deg, ${theme.palette.text.primary} 60%, ${theme.palette.primary.main} 90%)`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Solut Tasks
        <Box
          component="span"
          sx={{
            color: theme.palette.primary.main,
            fontSize: "1.4em",
            fontWeight: 900,
            display: "inline-block",
            transform: "translateY(2px)",
            textShadow: `0 0 4px ${theme.palette.primary.light}`,
          }}
        >
          .
        </Box>
      </Typography>
    </Box>
  );
}
