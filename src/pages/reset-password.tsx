import { resetPassword } from "@/api/client";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const resetPasswordMutation = useMutation({
    mutationKey: ["auth", "resetPassword"],
    mutationFn: async ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => {
      await resetPassword({ token, newPassword });
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    if (newPassword !== confirmPassword) {
      setValidationError("As senhas não coincidem.");
      return;
    }

    resetPasswordMutation.mutate({ token, newPassword });
  }

  return (
    <DefaultLayout>
      <div className="py-4 pt-10">
        <img
          src="solut-tasks-logo.png"
          className="rounded-full w-70 m-auto"
          alt="Logo Solut Tasks"
        />
      </div>
      <section className="flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-start gap-1">
            <h1 className="text-xl font-semibold">Redefinir sua senha</h1>
            <p className="text-sm text-gray-500">
              Digite sua nova senha abaixo
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {resetPasswordMutation.isSuccess ? (
              <p className="text-sm text-green-600">
                Sua senha foi redefinida com sucesso.{" "}
                <Link className="text-primary" to="/signin">
                  Entrar
                </Link>
              </p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Nova Senha"
                  placeholder="Digite sua nova senha"
                  type="password"
                  value={newPassword}
                  onValueChange={(val) => {
                    setNewPassword(val);
                    setValidationError("");
                  }}
                  isRequired
                  autoComplete="new-password"
                />
                <Input
                  label="Confirmar Senha"
                  placeholder="Confirme sua nova senha"
                  type="password"
                  value={confirmPassword}
                  onValueChange={(val) => {
                    setConfirmPassword(val);
                    setValidationError("");
                  }}
                  isRequired
                  autoComplete="new-password"
                  isInvalid={!!validationError}
                  errorMessage={validationError}
                />
                <Button
                  color="primary"
                  fullWidth
                  type="submit"
                  isLoading={resetPasswordMutation.isPending}
                  isDisabled={!token}
                >
                  {resetPasswordMutation.isPending
                    ? "Redefinindo..."
                    : "Redefinir senha"}
                </Button>
              </form>
            )}
            {resetPasswordMutation.isError ? (
              <p className="text-sm text-red-500">
                Algo deu errado. Tente novamente ou solicite um novo link.
              </p>
            ) : null}
            {!token ? (
              <p className="text-sm text-red-500">
                Token de recuperação inválido ou ausente.
              </p>
            ) : null}
            <p className="text-sm text-gray-500">
              Lembrou da sua senha?{" "}
              <Link className="text-primary" to="/signin">
                Entrar
              </Link>
            </p>
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}
