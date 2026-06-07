"use client";

import { forwardRef, type ReactNode } from "react";
import { Box, Typography, InputBase, useTheme } from "@mui/material";
import type { InputBaseProps } from "@mui/material/InputBase";

interface FieldProps extends Omit<InputBaseProps, "sx"> {
  label: string;
  trailing?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, trailing, id, name, ...inputProps }, ref) => {
    const theme = useTheme();

    const inputId =
      id ?? name?.toString() ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(1),
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            component="label"
            htmlFor={inputId}
            sx={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: theme.palette.text.secondary,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {label}
          </Typography>

          {trailing}
        </Box>

        <InputBase
          inputRef={ref}
          id={inputId}
          name={name}
          {...inputProps}
          sx={{
            width: "100%",
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
            px: theme.spacing(2),
            py: theme.spacing(1.5),
            fontSize: "0.875rem",
            color: theme.palette.text.primary,
            transition: theme.transitions.create([
              "border-color",
              "box-shadow",
            ]),

            "& input::placeholder": {
              color: theme.palette.text.disabled,
              opacity: 1,
            },

            "&.Mui-focused": {
              borderColor: theme.palette.primary.main,
              boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`,
            },
          }}
        />
      </Box>
    );
  },
);

Field.displayName = "Field";
