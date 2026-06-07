"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Box, Typography, Link as MuiLink, useTheme } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

import { Field } from "@/src/components/ui/Field";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { authService } from "@/src/services/api/auth.service";
import { useFeedback } from "@/src/providers/feedback-provider";
import { ApiError } from "@/src/lib/api/api-error";
import { mapApiError } from "@/src/lib/api/map-api-error";

const schema = z
  .object({
    newPassword: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const theme = useTheme();
  const { show } = useFeedback();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [succeeded, setSucceeded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword });
      setSucceeded(true);
      show("Senha redefinida com sucesso", "success");
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (err) {
      const error = err as ApiError;
      show(mapApiError(error), "error");
    }
  };

  if (succeeded) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(2.5),
        }}
      >
        <Typography variant="body1" sx={{ textAlign: "center" }}>
          Senha redefinida! Redirecionando para o login...
        </Typography>
      </Box>
    );
  }

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
        label="Nova senha"
        type="password"
        placeholder="••••••••"
        {...register("newPassword")}
      />

      {errors.newPassword && (
        <Typography color="error" variant="caption">
          {errors.newPassword.message}
        </Typography>
      )}

      <Field
        label="Confirmar nova senha"
        type="password"
        placeholder="••••••••"
        {...register("confirmPassword")}
      />

      {errors.confirmPassword && (
        <Typography color="error" variant="caption">
          {errors.confirmPassword.message}
        </Typography>
      )}

      <PrimaryButton type="submit" disabled={isSubmitting || !token}>
        {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
      </PrimaryButton>

      <Typography variant="h6" sx={{ textAlign: "center", lineHeight: 3 }}>
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
