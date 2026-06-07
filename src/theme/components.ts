import { Components } from "@mui/material/styles";
import { shadows } from "./shadows";

export const components: Components = {
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: "#111827",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        backgroundImage: "none",
      },
    },
  },

  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
      },
    },
  },

  MuiButton: {
    styleOverrides: {
      contained: {
        boxShadow: shadows[4],

        "&:hover": {
          boxShadow: shadows[3],
        },
      },
    },
  },

  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 12,
        },
      },
    },
  },

  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 600,
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      input: {
        "&:-webkit-autofill": {
          WebkitBoxShadow: "0 0 0 1000px #0F172A inset",
          WebkitTextFillColor: "#fff",
          caretColor: "#fff",
          transition: "background-color 9999s ease-in-out 0s",
        },

        "&:-webkit-autofill:hover": {
          WebkitBoxShadow: "0 0 0 1000px #0F172A inset",
        },

        "&:-webkit-autofill:focus": {
          WebkitBoxShadow: "0 0 0 1000px #0F172A inset",
        },
      },
    },
  },
};
