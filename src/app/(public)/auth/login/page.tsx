import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/src/components/layouts/AuthLayout";
import LoginForm from "@/src/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Entrar — Solut Tasks",
  description: "Acesse sua conta Solut Tasks.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar."
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/auth/register" style={{ fontWeight: 700 }}>
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
