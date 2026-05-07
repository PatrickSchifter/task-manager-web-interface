import { changePassword, getMe, uploadAvatar } from "@/api/client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
} from "@heroui/react";
import { useDisclosure } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useNavigate } from "react-router-dom";

export const Logo = () => {
  return (
    <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
      <title>Logo</title>
      {/* TODO: Add logo */}
    </svg>
  );
};

export default function NavbarComponent() {
  const navigate = useNavigate();
  const [isLogged, setIsLogged] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("token"));
  });
  const { data: me } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: isLogged,
  });
  React.useEffect(() => {
    if (me) setIsLogged(true);
  }, [me]);
  const settings = useDisclosure();
  const queryClient = useQueryClient();

  const passwordMutation = useMutation({
    mutationKey: ["auth", "change-password"],
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      changePassword(payload),
    onSuccess: () => {
      addToast({ title: "Senha atualizada com sucesso", color: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => {
      addToast({ title: "Falha ao atualizar senha", color: "danger" });
    },
  });

  const avatarMutation = useMutation({
    mutationKey: ["auth", "upload-avatar"],
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: async () => {
      await queryClient.removeQueries({
        queryKey: ["auth", "me"],
        type: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: ["auth", "me"],
        refetchType: "active",
      });
      addToast({ title: "Avatar atualizado com sucesso", color: "success" });
    },
    onError: () => {
      addToast({ title: "Falha ao enviar avatar", color: "danger" });
    },
  });

  function getInitials(name?: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function onSelectAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.currentTarget.value = ""; // limpa antes de usar a variável local
    if (file) avatarMutation.mutate(file);
  }

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Edit</title>
      <path
        d="M16.862 3.487a2.121 2.121 0 0 1 3 3L8.35 18l-4.35 1 1-4.35L16.862 3.487Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 5l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  function handleLogout() {
    try {
      localStorage.removeItem("token");
      queryClient.removeQueries({ type: "all" });
      addToast({ title: "Desconectado", color: "success" });
    } finally {
      setIsLogged(false);
      navigate("/signin", { replace: true });
    }
  }

  if (!isLogged) return null;

  return (
    <Navbar>
      <NavbarBrand>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/");
            }
          }}
        >
          <img
            src="/solut-tasks-logo.png"
            alt="Solut Tasks Logo"
            className="h-12 w-auto"
          />
        </div>
      </NavbarBrand>

      <NavbarContent as="div" justify="end">
        {isLogged ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="secondary"
                name={me?.name ?? "User"}
                size="sm"
                src={typeof me?.avatar === "string" ? me?.avatar : undefined}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Ações do Perfil" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Conectado como</p>
                <p className="font-semibold">{me?.email ?? ""}</p>
              </DropdownItem>
              <DropdownItem key="settings" onPress={settings.onOpen}>
                Minhas Configurações
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                Sair
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : null}
      </NavbarContent>

      <Modal
        isOpen={settings.isOpen}
        onOpenChange={settings.onOpenChange}
        placement="center"
      >
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader
                data-testid="my-settings-modal"
                className="flex flex-col"
              >
                Minhas Configurações
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Avatar</p>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border border-gray-200 bg-white flex items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarMutation.isPending}
                    >
                      {avatarMutation.isPending ? (
                        <span className="flex items-center justify-center h-full w-full">
                          <svg
                            className="animate-spin h-12 w-12 text-gray-400"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                        </span>
                      ) : typeof me?.avatar === "string" && me.avatar ? (
                        <img
                          alt={me?.name ?? "User avatar"}
                          src={me.avatar}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center h-full w-full text-5xl font-bold text-gray-400 select-none">
                          {getInitials(me?.name)}
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <PencilIcon className="h-8 w-8 text-white" />
                      </div>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="avatar-input"
                    onChange={onSelectAvatarFile}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Alterar senha</p>
                  <Input
                    label="Senha atual"
                    type="password"
                    value={currentPassword}
                    onValueChange={setCurrentPassword}
                    data-testid="current-password-input"
                  />
                  <Input
                    label="Nova senha"
                    type="password"
                    value={newPassword}
                    onValueChange={setNewPassword}
                    data-testid="new-password-input"
                  />
                  <Input
                    label="Confirmar nova senha"
                    type="password"
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                    data-testid="confirm-password-input"
                  />
                  {confirmPassword && newPassword !== confirmPassword ? (
                    <p className="text-sm text-red-500">
                      As senhas não coincidem.
                    </p>
                  ) : null}
                  <Button
                    className="mt-2"
                    color="primary"
                    size="sm"
                    onPress={() =>
                      passwordMutation.mutate({ currentPassword, newPassword })
                    }
                    isLoading={passwordMutation.isPending}
                    isDisabled={
                      !currentPassword ||
                      !newPassword ||
                      newPassword !== confirmPassword
                    }
                  >
                    Salvar senha
                  </Button>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Navbar>
  );
}
