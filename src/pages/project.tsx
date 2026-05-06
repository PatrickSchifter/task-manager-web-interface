import {
  createTask,
  deleteProject,
  getMe,
  getProject,
  listMembers,
  listTasksByProject,
  listUsers,
  updateProject,
} from "@/api/client";
import type { MemberListItem, ProjectRequest, TaskListItem, TaskRequest } from "@/api/client";
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
import { Avatar } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type TaskStatus = TaskRequest["status"]; // "TODO" | "IN_PROGRESS" | "DONE"
type TaskPriority = TaskRequest["priority"]; // "LOW" | "MEDIUM" | "HIGH"

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
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
    queryKey: ["projects", projectId, "tasks"],
    queryFn: () => listTasksByProject(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });

  const { data: usersResponse } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    staleTime: 300_000, // 5 minutes
  });

  const users = usersResponse?.data ?? [];

  const tasks = tasksResponse?.data ?? [];

  const { data: project } = useQuery({
    queryKey: ["projects", projectId, "details"],
    queryFn: () => getProject(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  });

  // Get current user to check ownership
  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    staleTime: 300_000, // 5 minutes
  });

  const isOwner = user?.id === project?.createdById;
  console.log("isOwner", isOwner);

  // Fetch project members to check user role
  const { data: membersResponse } = useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: () => listMembers(projectId as string),
    staleTime: 60_000,
    enabled: Boolean(projectId),
  });
  const members: MemberListItem[] = membersResponse?.data ?? [];
  const currentMember = user && members.find((m) => m.userId === user.id);
  const canAddTask =
    currentMember && (currentMember.role === "EDITOR" || currentMember.role === "OWNER");

  // Project edit mutation
  const editProjectMutation = useMutation({
    mutationFn: (body: ProjectRequest) => updateProject(projectId as string, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      onEditClose();
      setEditName("");
      setEditDescription("");
      addToast({ title: "Project edited successfully", color: "success" });
    },
  });

  // Project delete mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProject(projectId as string),
    onSuccess: () => {
      addToast({ title: "Project deleted successfully", color: "success" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/");
    },
  });

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

  // Column drop logic moved into Column component

  const createTaskMutation = useMutation({
    mutationKey: ["projects", projectId, "tasks", "create"],
    mutationFn: () =>
      createTask(projectId as string, {
        title,
        description: description || undefined,
        status,
        priority,
      }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      onClose();
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tasks"] });
      const { addToast } = await import("@heroui/toast");
      addToast({ title: "Task created successfully", color: "success" });
    },
    onError: async () => {
      const { addToast } = await import("@heroui/toast");
      addToast({ title: "Failed to create task", color: "danger" });
    },
  });

  // Handler for opening edit modal and initializing form
  const handleEditProject = () => {
    if (project) {
      setEditName(project.name);
      setEditDescription(typeof project.description === "string" ? project.description : "");
      onEditOpen();
    }
  };

  // Handler for submitting project edit
  const handleEditSubmit = () => {
    editProjectMutation.mutate({
      name: editName,
      description: editDescription,
    });
  };

  // Handler for confirming project deletion
  const handleDeleteProject = () => {
    deleteProjectMutation.mutate();
  };

  function openAddTask(presetStatus?: TaskStatus) {
    if (presetStatus) setStatus(presetStatus);
    onOpen();
  }

  const assignee = users.find((u) => u.id === assigneeId);
  console.log("assignee", assignee);

  return (
    <DefaultLayout>
      <section className="py-8 md:py-10">
        <div className="mb-4 flex items-center justify-between px-2 mb-12">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{project?.name ?? "Project"}</h1>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={handleEditProject}
                    aria-label="Edit project"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={onDeleteOpen}
                    aria-label="Delete project"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {typeof project?.description === "string" ? project.description : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {canAddTask && (
              <Button color="primary" onPress={() => openAddTask("TODO")}>
                Add task
              </Button>
            )}
            {isOwner && (
              <Button color="secondary" variant="flat" onPress={onMembersOpen}>
                Collaborators
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-6 px-2">
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
      </section>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex flex-col">Add task</ModalHeader>
              <ModalBody className="space-y-3">
                <Input label="Title" value={title} onValueChange={setTitle} isRequired />
                <Textarea
                  label="Description"
                  value={description}
                  onValueChange={setDescription}
                  minRows={3}
                />
                <Select
                  label="Status"
                  selectedKeys={[status]}
                  onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as TaskStatus)}
                >
                  <SelectItem key="TODO">To Do</SelectItem>
                  <SelectItem key="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem key="DONE">Done</SelectItem>
                </Select>
                <Select
                  label="Priority"
                  selectedKeys={[priority]}
                  onSelectionChange={(keys) => setPriority(Array.from(keys)[0] as TaskPriority)}
                >
                  <SelectItem key="LOW">Low</SelectItem>
                  <SelectItem key="MEDIUM">Medium</SelectItem>
                  <SelectItem key="HIGH">High</SelectItem>
                </Select>

                <Input
                  type="date"
                  label="Due date"
                  placeholder="YYYY-MM-DD HH:mm"
                  value={dueDate ?? ""}
                  onChange={(e) => setDueDate(e.target.value)}
                />

                <Select
                  label="Assignee"
                  placeholder="Select assignee"
                  selectedKeys={assigneeId ? [assigneeId] : []}
                  onChange={(e) => {
                    setAssigneeId(e.target.value);
                  }}
                  items={users}
                  renderValue={(items) => {
                    return items.map((item) => {
                      return (
                        <div className="flex items-center gap-2" key={item.key}>
                          <Avatar
                            size="sm"
                            name={item.data?.name}
                            src={
                              typeof item.data?.avatar === "string" ? item.data.avatar : undefined
                            }
                            className="w-6 h-6"
                          />
                          <span>{item.data?.name}</span>
                        </div>
                      );
                    });
                  }}
                >
                  {users.map((user) => (
                    <SelectItem key={user.id}>
                      <div className="flex items-center gap-2">
                        {user.id === "" ? (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-500">?</span>
                          </div>
                        ) : (
                          <Avatar
                            size="sm"
                            name={user.name}
                            src={typeof user.avatar === "string" ? user.avatar : undefined}
                            className="w-6 h-6"
                          />
                        )}
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => createTaskMutation.mutate()}
                  isLoading={createTaskMutation.isPending}
                  isDisabled={!title.trim()}
                >
                  Create
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Project Modal */}
      <ProjectForm
        isOpen={isEditOpen}
        onOpenChange={onEditOpenChange}
        title="Edit Project"
        name={editName}
        description={editDescription}
        onNameChange={setEditName}
        onDescriptionChange={setEditDescription}
        onSubmit={handleEditSubmit}
        isLoading={editProjectMutation.isPending}
        submitButtonText="Update Project"
        project={project}
      />

      {/* Delete Project Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteOpenChange}
        title="Delete Project"
        message={`Are you sure you want to delete "${project?.name}"? This action cannot be undone and will delete all tasks within this project.`}
        confirmButtonText="Delete Project"
        cancelButtonText="Cancel"
        confirmButtonColor="danger"
        onConfirm={handleDeleteProject}
        isLoading={deleteProjectMutation.isPending}
      />

      {/* Members Modal */}
      {projectId && (
        <MembersModal
          isOpen={isMembersOpen}
          onOpenChange={onMembersOpenChange}
          projectId={projectId}
          isOwner={isOwner}
        />
      )}
    </DefaultLayout>
  );
}
