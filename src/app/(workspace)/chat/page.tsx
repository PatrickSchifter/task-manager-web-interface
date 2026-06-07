import type { Metadata } from "next";

import WorkspaceLayout from "@/src/components/layouts/WorkspaceLayout";
import { chatService } from "@/src/services/api/chat.service";
import ChatClient from "./ChatClient";

export const metadata: Metadata = {
  title: "Solut AI — Solut Tasks",
  description: "Converse com a IA sobre suas tarefas, projetos e prioridades.",
};

export default async function ChatPage() {
  // Conversa única por usuário — o backend não tem threads, apenas o
  // histórico do usuário autenticado (mais recentes primeiro).
  const history = await chatService.findAll(50).catch(() => []);
  const messages = [...history].reverse();

  return (
    <WorkspaceLayout>
      <ChatClient initialMessages={messages} />
    </WorkspaceLayout>
  );
}
