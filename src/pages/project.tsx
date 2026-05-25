import {
  createTask,
  deleteProject,
  getMe,
  getProject,
  listMembers,
  listTasksByProject,
  updateProject,
} from "@/api/client";
import type {
  MemberListItem,
  ProjectRequest,
  TaskListItem,
  TaskRequest,
} from "@/api/client";
import ChatBot from "@/components/ChatBot";
import Column from "@/components/Column";
import ConfirmationModal from "@/components/ConfirmationModal";
import MembersModal from "@/components/MembersModal";
import ProjectForm from "@/components/ProjectForm";
import { DeleteIcon, EditIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Avatar, Chip, Tab, Tabs } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type TaskStatus = TaskRequest["status"]; // "TODO" | "IN_PROGRESS" | "DONE"
type TaskPriority = TaskRequest["priority"]; // "LOW" | "MEDIUM" | "HIGH"

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Progresso",
  DONE: "Concluído",
};

export default function ProjectPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const {
    isOpen: isMembersOpen,
    onOpen: onMembersOpen,
    onOpenChange: onMembersOpenChange,
  } = useDisclosure();

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<TaskStatus>("TODO");

  // Task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);

  // Project edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ["projects", projectId, "tasks", { limit: 100, page: 1 }],
    queryFn: () =>
      listTasksByProject(projectId as string, {
        limit: 100,
        page: 1,
      }),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });

  const tasks = tasksResponse?.data ?? [];

  const { data: project } = useQuery({
    queryKey: ["projects", projectId, "details"],
    queryFn: () => getProject(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  });

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    staleTime: 300_000,
  });

  const isOwner = user?.id === project?.createdById;

  const { data: membersResponse } = useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: () => listMembers(projectId as string),
    staleTime: 60_000,
    enabled: Boolean(projectId),
  });
  const members: MemberListItem[] = membersResponse?.data ?? [];
  const currentMember = user && members.find((m) => m.userId === user.id);
  const canAddTask =
    currentMember &&
    (currentMember.role === "EDITOR" || currentMember.role === "OWNER");

  const editProjectMutation = useMutation({
    mutationFn: (body: ProjectRequest) =>
      updateProject(projectId as string, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      onEditClose();
      setEditName("");
      setEditDescription("");
      addToast({ title: "Projeto atualizado com sucesso", color: "success" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProject(projectId as string),
    onSuccess: () => {
      addToast({ title: "Projeto excluído com sucesso", color: "success" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/");
    },
  });

  const assigneeOptions = members.map((member) => ({
    id: member.user.id,
    name: member.user.name,
    avatar: member.user.avatar,
  }));

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, TaskListItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const t of tasks) {
      const s = t.status as TaskStatus;
      if (map[s]) map[s].push(t);
    }
    return map;
  }, [tasks]);

  const createTaskMutation = useMutation({
    mutationKey: ["projects", projectId, "tasks", "create"],
    mutationFn: () =>
      createTask(projectId as string, {
        title,
        description: description || undefined,
        status,
        priority,
        assigneeId,
        dueDate,
      }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      onClose();
      await queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "tasks"],
      });
      const { addToast } = await import("@heroui/toast");
      addToast({ title: "Tarefa criada com sucesso", color: "success" });
    },
    onError: async () => {
      const { addToast } = await import("@heroui/toast");
      addToast({ title: "Falha ao criar tarefa", color: "danger" });
    },
  });

  const handleEditProject = () => {
    if (project) {
      setEditName(project.name);
      setEditDescription(
        typeof project.description === "string" ? project.description : "",
      );
      onEditOpen();
    }
  };

  const handleEditSubmit = () => {
    editProjectMutation.mutate({
      name: editName,
      description: editDescription,
    });
  };

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate();
  };

  function openAddTask(presetStatus?: TaskStatus) {
    if (presetStatus) setStatus(presetStatus);
    onOpen();
  }

  return (
    <DefaultLayout>
      <section className="py-4 md:py-10">
        {/* ── Header ── */}
        <div className="px-4 md:px-2 mb-6 md:mb-12">
          {/* Mobile header */}
          <div className="flex items-start justify-between md:hidden mb-3">
            <div className="flex-1 min-w-0 pr-3">
              <h1 className="text-lg font-semibold truncate">
                {project?.name ?? "Projeto"}
              </h1>
              {typeof project?.description === "string" &&
                project.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {project.description}
                  </p>
                )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isOwner && (
                <>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={handleEditProject}
                    aria-label="Editar projeto"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    color="danger"
                    onPress={onDeleteOpen}
                    aria-label="Excluir projeto"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile: members row + action buttons */}
          <div className="flex items-center justify-between md:hidden">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={isOwner ? onMembersOpen : undefined}
              onKeyDown={isOwner ? onMembersOpen : undefined}
              role={isOwner ? "button" : undefined}
              tabIndex={isOwner ? 0 : undefined}
              aria-label={isOwner ? "Gerenciar colaboradores" : undefined}
            >
              <div className="flex">
                {members.slice(0, 4).map((m, i) => (
                  <Avatar
                    key={m.userId}
                    size="sm"
                    name={m.user.name}
                    src={
                      typeof m.user.avatar === "string"
                        ? m.user.avatar
                        : undefined
                    }
                    className="w-7 h-7 text-xs ring-2 ring-background"
                    style={{
                      marginLeft: i === 0 ? 0 : -8,
                      zIndex: members.length - i,
                    }}
                  />
                ))}
                {members.length > 4 && (
                  <div
                    className="w-7 h-7 rounded-full bg-default-100 ring-2 ring-background flex items-center justify-center text-xs text-default-500 font-medium"
                    style={{ marginLeft: -8 }}
                  >
                    +{members.length - 4}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {members.length} colaborador{members.length !== 1 ? "es" : ""}
              </span>
            </div>

            {canAddTask && (
              <Button
                size="sm"
                color="primary"
                onPress={() => openAddTask(activeTab)}
                startContent={<span className="text-base leading-none">+</span>}
              >
                Tarefa
              </Button>
            )}
          </div>

          {/* Desktop header (unchanged layout) */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">
                  {project?.name ?? "Projeto"}
                </h1>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleEditProject}
                      aria-label="Editar projeto"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={onDeleteOpen}
                      aria-label="Excluir projeto"
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {typeof project?.description === "string"
                  ? project.description
                  : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {canAddTask && (
                <Button color="primary" onPress={() => openAddTask("TODO")}>
                  Adicionar tarefa
                </Button>
              )}
              {isOwner && (
                <Button
                  color="secondary"
                  variant="flat"
                  onPress={onMembersOpen}
                >
                  Colaboradores
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Desktop: kanban columns ── */}
        <div className="hidden md:flex gap-6 px-2">
          {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
            <Column
              key={s}
              projectId={projectId as string}
              status={s}
              title={STATUS_LABEL[s]}
              isLoading={isLoading}
              tasks={tasksByStatus[s]}
              allTasks={tasks}
              onAddTask={openAddTask}
            />
          ))}
        </div>

        {/* ── Mobile: tabs + single column ── */}
        <div className="md:hidden">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as TaskStatus)}
            variant="underlined"
            classNames={{
              base: "w-full px-4",
              tabList: "w-full gap-0 border-b border-divider pb-0",
              tab: "flex-1 h-10",
              cursor: "bg-primary",
            }}
          >
            {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
              <Tab
                key={s}
                title={
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{STATUS_LABEL[s]}</span>
                    <Chip
                      size="sm"
                      variant="flat"
                      classNames={{
                        base: "h-4 min-w-unit-4 px-1",
                        content: "text-xs leading-none p-0",
                      }}
                    >
                      {tasksByStatus[s].length}
                    </Chip>
                  </div>
                }
              />
            ))}
          </Tabs>

          <div className="px-4 pt-4">
            <Column
              key={activeTab}
              projectId={projectId as string}
              status={activeTab}
              title={STATUS_LABEL[activeTab]}
              isLoading={isLoading}
              tasks={tasksByStatus[activeTab]}
              allTasks={tasks}
              onAddTask={openAddTask}
              mobileView
            />
          </div>
        </div>
      </section>

      {/* ── Add Task Modal ── */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="bottom-center"
        className="md:placement-center"
      >
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex flex-col">
                Adicionar tarefa
              </ModalHeader>
              <ModalBody className="space-y-3">
                <Input
                  label="Título"
                  value={title}
                  onValueChange={setTitle}
                  isRequired
                />
                <Textarea
                  label="Descrição"
                  value={description}
                  onValueChange={setDescription}
                  minRows={3}
                />
                <Select
                  label="Status"
                  selectedKeys={[status]}
                  onSelectionChange={(keys) =>
                    setStatus(Array.from(keys)[0] as TaskStatus)
                  }
                >
                  <SelectItem key="TODO">A Fazer</SelectItem>
                  <SelectItem key="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem key="DONE">Concluído</SelectItem>
                </Select>
                <Select
                  label="Prioridade"
                  selectedKeys={[priority]}
                  onSelectionChange={(keys) =>
                    setPriority(Array.from(keys)[0] as TaskPriority)
                  }
                >
                  <SelectItem key="LOW">Baixa</SelectItem>
                  <SelectItem key="MEDIUM">Média</SelectItem>
                  <SelectItem key="HIGH">Alta</SelectItem>
                </Select>

                <Input
                  type="date"
                  label="Data de entrega"
                  placeholder="DD/MM/AAAA"
                  value={dueDate ?? ""}
                  onChange={(e) => setDueDate(e.target.value)}
                />

                <Select
                  label="Responsável"
                  placeholder="Selecionar responsável"
                  selectedKeys={assigneeId ? [String(assigneeId)] : []}
                  onSelectionChange={(keys) => {
                    if (keys === "all") return;
                    const value = Array.from(keys)[0];
                    setAssigneeId(value ? String(value) : undefined);
                  }}
                  items={assigneeOptions}
                  renderValue={(items) =>
                    items.map((item) => (
                      <div className="flex items-center gap-2" key={item.key}>
                        <Avatar
                          size="sm"
                          name={item.data?.name}
                          src={
                            typeof item.data?.avatar === "string"
                              ? item.data.avatar
                              : undefined
                          }
                          className="w-6 h-6"
                        />
                        <span>{item.data?.name}</span>
                      </div>
                    ))
                  }
                >
                  {(member) => (
                    <SelectItem key={String(member.id)} textValue={member.name}>
                      <div className="flex items-center gap-2">
                        <Avatar
                          size="sm"
                          name={member.name}
                          src={
                            typeof member.avatar === "string"
                              ? member.avatar
                              : undefined
                          }
                          className="w-6 h-6"
                        />
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  )}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={() => createTaskMutation.mutate()}
                  isLoading={createTaskMutation.isPending}
                  isDisabled={!title.trim()}
                >
                  Criar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ── Edit Project Modal ── */}
      <ProjectForm
        isOpen={isEditOpen}
        onOpenChange={onEditOpenChange}
        title="Editar Projeto"
        name={editName}
        description={editDescription}
        onNameChange={setEditName}
        onDescriptionChange={setEditDescription}
        onSubmit={handleEditSubmit}
        isLoading={editProjectMutation.isPending}
        submitButtonText="Atualizar Projeto"
        project={project}
      />

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteOpenChange}
        title="Excluir Projeto"
        message={`Tem certeza que deseja excluir "${project?.name}"? Esta ação não pode ser desfeita e excluirá todas as tarefas deste projeto.`}
        confirmButtonText="Excluir Projeto"
        cancelButtonText="Cancelar"
        confirmButtonColor="danger"
        onConfirm={handleDeleteProject}
        isLoading={deleteProjectMutation.isPending}
      />

      {/* ── Members Modal ── */}
      {projectId && (
        <MembersModal
          isOpen={isMembersOpen}
          onOpenChange={onMembersOpenChange}
          projectId={projectId}
          isOwner={isOwner}
        />
      )}
      <ChatBot />
    </DefaultLayout>
  );
}
