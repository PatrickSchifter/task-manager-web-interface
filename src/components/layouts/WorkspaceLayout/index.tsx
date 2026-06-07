import { WorkspaceProvider } from "@/src/providers/workspace-provider";
import { authServerService } from "@/src/services/api/auth.server.service";
import { projectsService } from "@/src/services/api";
import { AppShell } from "./AppShell";

export const metadata = {
  title: "Workspace — Tasks",
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, { data: projects = [] }] = await Promise.all([
    authServerService.getMe(),
    projectsService.findAll(),
  ]);

  return (
    <WorkspaceProvider user={user} projects={projects}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
