import type { Metadata } from "next";
import { SecurityContent } from "./SecurityContent";

export const metadata: Metadata = {
  title: "Segurança — Solut Tasks",
  description:
    "Saiba como o Solut Tasks protege os seus dados com criptografia, controles de acesso e boas práticas de segurança.",
};

export default function SecurityPage() {
  return <SecurityContent />;
}
