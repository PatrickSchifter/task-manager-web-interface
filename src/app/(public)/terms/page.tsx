import type { Metadata } from "next";
import { TermsContent } from "./TermsContent";

export const metadata: Metadata = {
  title: "Termos de Uso — Solut Tasks",
  description:
    "Conheça os termos e condições para utilizar a plataforma de gerenciamento de tarefas Solut Tasks.",
};

export default function TermsPage() {
  return <TermsContent />;
}
