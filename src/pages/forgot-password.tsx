import { forgotPassword } from "@/api/client";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationKey: ["auth", "forgotPassword"],
    mutationFn: async (email: string) => {
      await forgotPassword({ email });
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    forgotPasswordMutation.mutate(email);
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
            <h1 className="text-xl font-semibold">Esqueceu sua senha?</h1>
            <p className="text-sm text-gray-500">
              Digite seu e-mail que enviaremos um link de recuperação
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {forgotPasswordMutation.isSuccess ? (
              <p className="text-sm text-green-600">
                Se existir uma conta com esse e-mail, você receberá um link de recuperação de senha em breve.
              </p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="E-mail"
                  placeholder="seu@email.com"
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                  isRequired
                  autoComplete="email"
                />
                <Button
                  color="primary"
                  fullWidth
                  type="submit"
                  isLoading={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending
                    ? "Enviando..."
                    : "Enviar link de recuperação"}
                </Button>
              </form>
            )}
            {forgotPasswordMutation.isError ? (
              <p className="text-sm text-red-500">
                Algo deu errado. Tente novamente.
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
