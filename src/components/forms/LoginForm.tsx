"use client";

import { useState } from "react";
import { Box, Divider, Typography, Link as MuiLink, useTheme } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Field } from "@/src/components/ui/Field";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { GoogleLoginButton } from "@/src/components/forms/GoogleLoginButton";
// ✅ Importa a Server Action — não o service
import { signIn } from "@/src/lib/auth/actions";
import { useFeedback } from "@/src/providers/feedback-provider";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const theme = useTheme();
  const { show } = useFeedback();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError("");

    // A Server Action salva o cookie e redireciona para /dashboard em caso de sucesso.
    // Só retorna { success: false } se der erro — nunca retorna { success: true }
    // porque o redirect() interrompe a execução antes.
    const result = await signIn(data);

    if (!result.success) {
      setApiError(result.message);
      show(result.message, "error");
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

      <Field
        label="Senha"
        type="password"
        placeholder="Sua senha"
        {...register("password")}
      />

      {errors.email && (
        <Typography color="error" variant="caption">
          {errors.email.message}
        </Typography>
      )}

      {errors.password && (
        <Typography color="error" variant="caption">
          {errors.password.message}
        </Typography>
      )}

      {apiError && (
        <Typography color="error" variant="caption">
          {apiError}
        </Typography>
      )}

      <PrimaryButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </PrimaryButton>

      <Divider sx={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>
        ou
      </Divider>

      <GoogleLoginButton />

      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.secondary,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        <MuiLink href="/auth/forgot-password" underline="hover">
          Esqueceu sua senha?
        </MuiLink>
      </Typography>
    </Box>
  );
}
