"use client";

import { Box, Typography, Link as MuiLink, useTheme } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Field } from "@/src/components/ui/Field";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { authService } from "@/src/services/api/auth.service";
import { useFeedback } from "@/src/providers/feedback-provider";
import { ApiError } from "@/src/lib/api/api-error";
import { mapApiError } from "@/src/lib/api/map-api-error";

const schema = z.object({
  email: z.email("E-mail inválido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const theme = useTheme();
  const { show } = useFeedback();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.forgotPassword(data);
      show("Link de recuperação enviado para o seu e-mail", "success");
    } catch (err) {
      const error = err as ApiError;

      show(mapApiError(error), "error");
    }
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2.5),
      }}
    >
      <Field
        label="E-mail"
        type="email"
        placeholder="voce@empresa.com"
        {...register("email")}
      />

      {errors.email && (
        <Typography color="error" variant="caption">
          {errors.email.message}
        </Typography>
      )}

      <PrimaryButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
      </PrimaryButton>

      <Typography
        variant="h6"
        sx={{
          textAlign: "center",
          lineHeight: 3,
        }}
      >
        <MuiLink
          href="/auth/login"
          underline="hover"
          color={theme.palette.text.primary}
        >
          ← Voltar para entrar
        </MuiLink>
      </Typography>
    </Box>
  );
}
