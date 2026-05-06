import { login } from "@/api/client";
import type { LoginDto } from "@/api/client";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signinMutation = useMutation({
    mutationKey: ["auth", "signin"],
    mutationFn: async (payload: LoginDto) => {
      const data = (await login(payload)) as {
        token?: string;
        accessToken?: string;
      };
      return data;
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
    signinMutation.mutate({ email, password } satisfies LoginDto);
  }

  return (
    <DefaultLayout>
      <div className="py-4 pt-10">
        <img
          src="solut-tasks-logo.png"
          className="rounded-full w-70 m-auto"
          alt="Solut Tasks Logo"
        />
      </div>
      <section className="flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-start gap-1">
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="text-sm text-gray-500">
              Sign in with your credentials
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onValueChange={setEmail}
                isRequired
                autoComplete="email"
              />
              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                value={password}
                onValueChange={setPassword}
                isRequired
                autoComplete="current-password"
              />
              <Button
                color="primary"
                fullWidth
                type="submit"
                isLoading={signinMutation.isPending}
              >
                {signinMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            {signinMutation.isError ? (
              <p className="text-sm text-red-500">
                Unable to sign in. Please check your credentials and try again.
              </p>
            ) : null}
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link className="text-primary" to="/signup">
                Sign up
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Forgot your password?{" "}
              <Link className="text-primary" to="/forgot-password">
                Forgot Password
              </Link>
            </p>
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}
