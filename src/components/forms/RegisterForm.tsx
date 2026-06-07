"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Divider, Typography, Link as MuiLink, useTheme } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Field } from "@/src/components/ui/Field";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { GoogleLoginButton } from "@/src/components/forms/GoogleLoginButton";
import { authService } from "@/src/services/api/auth.service";
import { useFeedback } from "@/src/providers/feedback-provider";
import { ApiError } from "@/src/lib/api/api-error";
import { mapApiError } from "@/src/lib/api/map-api-error";

const schema = z.object({
  name: z.string().min(3, "Informe seu nome"),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterForm() {
  const theme = useTheme();
  const router = useRouter();
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
    try {
      setApiError("");

      await authService.signUp(data);
      show("Conta criada com sucesso. Faça login para continuar.", "success");

      router.push("/auth/login");
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
        label="Nome completo"
        placeholder="Alex Rivers"
        {...register("name")}
      />

      <Field
        label="E-mail"
        type="email"
        placeholder="voce@empresa.com"
        {...register("email")}
      />

      <Field
        label="Senha"
        type="password"
        placeholder="Mínimo 8 caracteres"
        {...register("password")}
      />

      {errors.name && (
        <Typography color="error" variant="caption">
          {errors.name.message}
        </Typography>
      )}

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
        {isSubmitting ? "Criando..." : "Criar conta"}
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
        Ao criar conta você concorda com nossos{" "}
        <MuiLink href="#" underline="hover">
          Termos
        </MuiLink>{" "}
        e{" "}
        <MuiLink href="#" underline="hover">
          Política de Privacidade
        </MuiLink>
        .
      </Typography>
    </Box>
  );
}
