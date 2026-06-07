"use client";

import type { ReactNode } from "react";
import { Button, useTheme } from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";

interface PrimaryButtonProps extends ButtonProps {
  children: ReactNode;
  loading?: boolean;
}

export function PrimaryButton({
  children,
  loading = false,
  disabled,
  onClick,
  type = "submit",
  ...props
}: PrimaryButtonProps) {
  const theme = useTheme();

  return (
    <Button
      {...props}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      fullWidth
      variant="contained"
      color="primary"
      sx={{
        borderRadius: theme.shape.borderRadius,
        px: theme.spacing(3),
        py: theme.spacing(1.5),
        fontWeight: 700,
        fontSize: "0.875rem",
        textTransform: "none",
        transition: theme.transitions.create([
          "box-shadow",
          "transform",
          "background-color",
        ]),

        "&:hover": {
          boxShadow: theme.shadows[3],
        },

        "&:disabled": {
          opacity: 0.6,
          cursor: "not-allowed",
        },

        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
}
