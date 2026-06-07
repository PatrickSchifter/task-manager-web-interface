import type { Metadata } from "next";
import { AuthLayout } from "@/src/components/layouts/AuthLayout";
import ForgotPasswordForm from "@/src/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar senha — Solut Tasks",
  description: "Envie um link de recuperação para o seu e-mail.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Esqueceu sua senha?"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
