import type { Metadata } from "next";
import { PrivacyContent } from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Política de Privacidade — Solut Tasks",
  description:
    "Saiba como o Solut Tasks coleta, usa e protege os seus dados pessoais.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
