import type { Metadata } from "next";
import { ContactContent } from "./ContactContent";

export const metadata: Metadata = {
  title: "Contato — Solut Tasks",
  description:
    "Fale com a equipe do Solut Tasks. Tire dúvidas, envie sugestões ou peça suporte.",
};

export default function ContactPage() {
  return <ContactContent />;
}
