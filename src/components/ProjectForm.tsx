import type { ProjectFull } from "@/api/client";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";

interface ProjectFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitButtonText: string;
  project?: ProjectFull;
}

export default function ProjectForm({
  isOpen,
  onOpenChange,
  title,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  isLoading,
  submitButtonText,
}: ProjectFormProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col">{title}</ModalHeader>
            <ModalBody className="space-y-3">
              <Input label="Nome" value={name} onValueChange={onNameChange} isRequired />
              <Textarea
                label="Descrição"
                value={description}
                onValueChange={onDescriptionChange}
                minRows={3}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={close}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={onSubmit}
                isLoading={isLoading}
                isDisabled={!name.trim()}
              >
                {submitButtonText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
