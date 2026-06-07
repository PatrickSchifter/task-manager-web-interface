import type { Metadata } from "next";
import { projectsService, tagsService } from "@/src/services/api";
import { ProjectBoard } from "./ProjectBoard";
import WorkspaceLayout from "@/src/components/layouts/WorkspaceLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const project = await projectsService.findById(id);

    return {
      title: `${project.name} — Solut Tasks`,
      description:
        project.description ||
        `Gerencie as tarefas do projeto ${project.name} no Solut Tasks.`,
    };
  } catch {
    return {
      title: "Projeto — Solut Tasks",
      description: "Gerencie as tarefas do seu projeto no Solut Tasks.",
    };
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await projectsService.findById(id);
  // Catálogo de tags do usuário para sugerir no Autocomplete. Não bloqueia a
  // página caso falhe.
  const availableTags = await tagsService.findAll().catch(() => []);

  return (
    <WorkspaceLayout>
      <ProjectBoard
        key={project.id}
        project={project}
        availableTags={availableTags}
      />
    </WorkspaceLayout>
  );
}
