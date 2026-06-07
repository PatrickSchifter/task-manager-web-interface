import type { Metadata } from "next";
import WorkspaceLayout from "@/src/components/layouts/WorkspaceLayout";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Perfil — Solut Tasks",
  description: "Gerencie sua conta e preferências.",
};

export default function ProfilePage() {
  return (
    <WorkspaceLayout>
      <ProfileClient />
    </WorkspaceLayout>
  );
}
