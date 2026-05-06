import {
  type AddMemberDto,
  type MemberListItem,
  type UpdateMemberRoleDto,
  addMember,
  listMembers,
  listUsers,
  removeMember,
  updateMemberRole,
} from "@/api/client";
import ConfirmationModal from "@/components/ConfirmationModal";
import { DeleteIcon, EditIcon } from "@/components/icons";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface MembersModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isOwner: boolean;
}

const ROLE_LABELS = {
  OWNER: "Proprietário",
  EDITOR: "Editor",
  VIEWER: "Visualizador",
} as const;

export default function MembersModal({
  isOpen,
  onOpenChange,
  projectId,
  isOwner,
}: MembersModalProps) {
  const queryClient = useQueryClient();
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onOpenChange: onAddOpenChange,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isRemoveOpen,
    onOpen: onRemoveOpen,
    onOpenChange: onRemoveOpenChange,
    onClose: onRemoveClose,
  } = useDisclosure();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"VIEWER" | "EDITOR" | "OWNER">("EDITOR");
  const [memberToRemove, setMemberToRemove] = useState<MemberListItem | null>(null);
  const [editingMember, setEditingMember] = useState<MemberListItem | null>(null);
  const [newRole, setNewRole] = useState<"VIEWER" | "EDITOR" | "OWNER">("EDITOR");

  // Fetch members
  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: () => listMembers(projectId),
    enabled: isOpen && Boolean(projectId),
  });

  // Fetch all users for adding members
  const { data: usersResponse } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    staleTime: 300_000, // 5 minutes
  });

  const members = membersResponse?.data ?? [];
  const users = usersResponse?.data ?? [];
  const existingUserIds = new Set(members.map((c) => c.userId));
  const availableUsers = users.filter((user) => !existingUserIds.has(user.id));

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (body: AddMemberDto) => addMember(projectId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
      setSelectedUserId("");
      setSelectedRole("EDITOR");
      onAddClose();
      addToast({ title: "Colaborador adicionado com sucesso", color: "success" });
    },
    onError: async () => {
      addToast({ title: "Falha ao adicionar colaborador", color: "danger" });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: UpdateMemberRoleDto }) =>
      updateMemberRole(projectId, userId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
      setEditingMember(null);
      addToast({ title: "Função do membro atualizada com sucesso", color: "success" });
    },
    onError: async () => {
      addToast({ title: "Falha ao atualizar função do membro", color: "danger" });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(projectId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
      setMemberToRemove(null);
      onRemoveClose();
      addToast({ title: "Colaborador removido com sucesso", color: "success" });
    },
    onError: async () => {
      addToast({ title: "Falha ao remover colaborador", color: "danger" });
    },
  });

  const handleAddMember = () => {
    if (!selectedUserId) return;
    addMemberMutation.mutate({
      userId: selectedUserId,
      role: selectedRole,
    });
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    removeMemberMutation.mutate(memberToRemove.userId);
  };

  const handleUpdateRole = () => {
    if (!editingMember) return;
    updateRoleMutation.mutate({
      userId: editingMember.userId,
      body: { role: newRole },
    });
  };

  const openRemoveModal = (member: MemberListItem) => {
    setMemberToRemove(member);
    onRemoveOpen();
  };

  const openEditRole = (member: MemberListItem) => {
    setEditingMember(member);
    setNewRole(member.role as "VIEWER" | "EDITOR" | "OWNER");
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">Membros do Projeto</h2>
                <p className="text-sm text-gray-500">
                  Gerencie quem pode acessar e colaborar neste projeto
                </p>
              </ModalHeader>
              <ModalBody>
                {/* Add Member Section - Only for owners */}
                {isOwner && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div />
                      <Button
                        color="primary"
                        onPress={onAddOpen}
                        isDisabled={availableUsers.length === 0}
                      >
                        Adicionar Colaborador
                      </Button>
                    </div>
                    {availableUsers.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Todos os usuários já são colaboradores deste projeto
                      </p>
                    )}
                  </div>
                )}

                {/* Current Members List */}
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Colaboradores Atuais ({members.length})
                  </h3>

                  {isLoadingMembers ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="w-full">
                          <CardBody>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                              <div className="flex-1">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                              </div>
                              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhum membro encontrado</p>
                      <p className="text-sm">Adicione membros para começar a colaborar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {members.map((member) => (
                        <Card key={member.id} className="w-full">
                          <CardBody>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  size="md"
                                  name={member.user.name}
                                  src={
                                    typeof member.user.avatar === "string"
                                      ? member.user.avatar
                                      : undefined
                                  }
                                />
                                <div>
                                  <p className="font-medium">{member.user.name}</p>
                                  <p className="text-sm text-gray-500">{member.user.email}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    member.role === "OWNER"
                                      ? "bg-red-100 text-red-800"
                                      : member.role === "EDITOR"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                                </span>

                                {/* Only owners can edit/remove members, and can't remove themselves */}
                                {isOwner && member.role !== "OWNER" && (
                                  <div className="flex gap-1">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      onPress={() => openEditRole(member)}
                                      aria-label="Editar função"
                                    >
                                      <EditIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      color="danger"
                                      onPress={() => openRemoveModal(member)}
                                      aria-label="Remover colaborador"
                                    >
                                      <DeleteIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={isAddOpen} onOpenChange={onAddOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Adicionar Novo Membro</ModalHeader>
              <ModalBody className="space-y-4">
                <Select
                  label="Selecionar Usuário"
                  placeholder="Escolha um usuário para adicionar"
                  data-testid="choose-user-select"
                  selectedKeys={selectedUserId ? [selectedUserId] : []}
                  onSelectionChange={(keys) => setSelectedUserId(Array.from(keys)[0] as string)}
                  description="Selecione um usuário da lista abaixo"
                >
                  {availableUsers.map((user) => (
                    <SelectItem
                      key={user.id}
                      textValue={`${user.name} (${user.email})`}
                      data-testid={`user-${user.email}`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          size="sm"
                          name={user.name}
                          src={typeof user.avatar === "string" ? user.avatar : undefined}
                          className="w-6 h-6"
                        />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Função"
                  selectedKeys={[selectedRole]}
                  onSelectionChange={(keys) =>
                    setSelectedRole(Array.from(keys)[0] as "VIEWER" | "EDITOR" | "OWNER")
                  }
                >
                  <SelectItem key="VIEWER">Visualizador - Pode visualizar projeto e tarefas</SelectItem>
                  <SelectItem key="EDITOR">Editor - Pode criar e editar tarefas</SelectItem>
                  <SelectItem key="OWNER">
                    Proprietário - Acesso completo incluindo gerenciamento de membros
                  </SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddMember}
                  isLoading={addMemberMutation.isPending}
                  isDisabled={!selectedUserId}
                  data-testid="btn-add-collaborator-modal"
                >
                  Adicionar Colaborador
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Role Modal */}
      {editingMember && (
        <Modal isOpen={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Editar Função do Membro</ModalHeader>
                <ModalBody className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="md"
                      name={editingMember.user.name}
                      src={
                        typeof editingMember.user.avatar === "string"
                          ? editingMember.user.avatar
                          : undefined
                      }
                    />
                    <div>
                      <p className="font-medium">{editingMember.user.name}</p>
                      <p className="text-sm text-gray-500">{editingMember.user.email}</p>
                    </div>
                  </div>

                  <Select
                    label="Nova Função"
                    selectedKeys={[newRole]}
                    onSelectionChange={(keys) =>
                      setNewRole(Array.from(keys)[0] as "VIEWER" | "EDITOR" | "OWNER")
                    }
                  >
                    <SelectItem key="VIEWER">Visualizador - Pode visualizar projeto e tarefas</SelectItem>
                    <SelectItem key="EDITOR">Editor - Pode criar e editar tarefas</SelectItem>
                    <SelectItem key="OWNER">
                      Proprietário - Acesso completo incluindo gerenciamento de membros
                    </SelectItem>
                  </Select>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleUpdateRole}
                    isLoading={updateRoleMutation.isPending}
                  >
                    Atualizar Função
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}

      {/* Remove Member Confirmation */}
      <ConfirmationModal
        isOpen={isRemoveOpen}
        onOpenChange={onRemoveOpenChange}
        title="Remover Colaborador"
        message={`Tem certeza que deseja remover ${memberToRemove?.user.name} deste projeto? Ele perderá o acesso imediatamente.`}
        confirmButtonText="Remover colaborador"
        confirmButtonColor="danger"
        onConfirm={handleRemoveMember}
        isLoading={removeMemberMutation.isPending}
      />
    </>
  );
}
