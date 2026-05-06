import { login, signup } from "@/api/client";
import type { LoginDto, SignUpDto } from "@/api/client";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationKey: ["auth", "signup"],
    mutationFn: async (payload: SignUpDto) => {
      await signup(payload);
      const auth = (await login({
        email: payload.email,
        password: payload.password,
      } satisfies LoginDto)) as {
        token?: string;
        accessToken?: string;
      };
      return auth;
    },
    onSuccess: (data) => {
      const token = data.token ?? data.accessToken;
      if (token) {
        localStorage.setItem("token", token);
      }
      navigate("/", { replace: true });
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signupMutation.mutate({
      name,
      email,
      password,
      role: "ADMIN",
    } satisfies SignUpDto);
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
            <h1 className="text-xl font-semibold">Criar sua conta</h1>
            <p className="text-sm text-gray-500">Cadastre-se para começar</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Nome"
                placeholder="João Silva"
                type="text"
                value={name}
                onValueChange={setName}
                isRequired
                autoComplete="name"
              />
              <Input
                label="E-mail"
                placeholder="seu@email.com"
                type="email"
                value={email}
                onValueChange={setEmail}
                isRequired
                autoComplete="email"
              />
              <Input
                label="Senha"
                placeholder="••••••••"
                type="password"
                value={password}
                onValueChange={setPassword}
                isRequired
                autoComplete="new-password"
              />
              <Button
                color="primary"
                fullWidth
                type="submit"
                isLoading={signupMutation.isPending}
              >
                {signupMutation.isPending ? "Criando..." : "Criar conta"}
              </Button>
            </form>
            {signupMutation.isError ? (
              <p className="text-sm text-red-500">
                Não foi possível criar sua conta. Tente novamente.
              </p>
            ) : null}
            <p className="text-sm text-gray-500">
              Já tem uma conta?{" "}
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
