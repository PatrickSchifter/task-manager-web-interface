import { createProject, listProjects } from "@/api/client";
import ProjectForm from "@/components/ProjectForm";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useDisclosure } from "@heroui/modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function IndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: projectsResponse, isLoading } = useQuery({
    queryKey: ["projects", "list"],
    queryFn: listProjects,
    staleTime: 30_000,
  });

  const projects = projectsResponse?.data ?? [];

  const createProjectMutation = useMutation({
    mutationKey: ["projects", "create"],
    mutationFn: () => createProject({ name, description }),
    onSuccess: async () => {
      setName("");
      setDescription("");
      onClose();
      await queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      const { addToast } = await import("@heroui/toast");
      addToast({ title: "Projeto criado com sucesso", color: "success" });
    },
    onError: async () => {
      const { addToast } = await import("@heroui/toast");
      addToast({ title: "Falha ao criar projeto", color: "danger" });
    },
  });

  return (
    <DefaultLayout>
      <section className="py-8 md:py-10">
        <div className="mb-6 flex items-center justify-between px-2">
          <h1 className="text-xl font-semibold">Seus Projetos</h1>
          <Button color="primary" onPress={onOpen}>
            Adicionar projeto
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="h-32">
                <CardBody>
                  <div className="mb-2 h-5 w-2/3 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-100" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3">
            {projects.length === 0 && <p>Nenhum projeto encontrado.</p>}
            {projects.map((project) => (
              <Card
                key={project.id}
                isPressable
                onPress={() => navigate(`/${project.id}`)}
                className="hover:shadow-md"
              >
                <CardHeader className="pb-0 pt-4 px-4">
                  <h3 className="text-base font-semibold">{project.name}</h3>
                </CardHeader>
                <CardBody className="px-4 pb-4 text-sm text-gray-500">
                  {typeof project.description === "string" ? project.description : ""}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ProjectForm
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title="Adicionar projeto"
        name={name}
        description={description}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onSubmit={() => createProjectMutation.mutate()}
        isLoading={createProjectMutation.isPending}
        submitButtonText="Criar"
      />
    </DefaultLayout>
  );
}
