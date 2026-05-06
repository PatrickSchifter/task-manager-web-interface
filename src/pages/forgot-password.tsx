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
          alt="Solut Tasks Logo"
        />
      </div>
      <section className="flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-start gap-1">
            <h1 className="text-xl font-semibold">Forgot your password?</h1>
            <p className="text-sm text-gray-500">
              Enter your email and we'll send you a reset link
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {forgotPasswordMutation.isSuccess ? (
              <p className="text-sm text-green-600">
                If an account with that email exists, you'll receive a password
                reset link shortly.
              </p>
            ) : (
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
                <Button
                  color="primary"
                  fullWidth
                  type="submit"
                  isLoading={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending
                    ? "Sending..."
                    : "Send reset link"}
                </Button>
              </form>
            )}
            {forgotPasswordMutation.isError ? (
              <p className="text-sm text-red-500">
                Something went wrong. Please try again.
              </p>
            ) : null}
            <p className="text-sm text-gray-500">
              Remembered your password?{" "}
              <Link className="text-primary" to="/signin">
                Sign in
              </Link>
            </p>
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}
