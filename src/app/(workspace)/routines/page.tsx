import type { Metadata } from "next";
import WorkspaceLayout from "@/src/components/layouts/WorkspaceLayout";
import { routinesService } from "@/src/services/api/routines.service";
import { RoutinesClient } from "./RoutinesClient";

export const metadata: Metadata = {
  title: "Rotinas — Solut Tasks",
  description: "Gerencie suas atividades recorrentes diárias.",
};

export default async function RoutinesPage() {
  const { data: routines = [] } = await routinesService.findAll().catch(() => ({
    data: [],
  }));

  return (
    <WorkspaceLayout>
      <RoutinesClient routines={routines} />
    </WorkspaceLayout>
  );
}
