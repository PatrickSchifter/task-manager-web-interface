import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/src/components/layouts/AuthLayout";
import RegisterForm from "@/src/components/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta — Solut Tasks",
  description: "Crie sua conta Solut Tasks em segundos.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Comece grátis. 14 dias de Pro inclusos."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/auth/login" style={{ fontWeight: 700 }}>
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
