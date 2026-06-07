import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout } from "@/src/components/layouts/AuthLayout";
import ResetPasswordForm from "@/src/components/forms/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Redefinir senha — Solut Tasks",
  description: "Crie uma nova senha para a sua conta.",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Escolha uma nova senha para acessar a sua conta."
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
