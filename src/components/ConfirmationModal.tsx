import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onOpenChange,
  title,
  message,
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancelar",
  confirmButtonColor = "primary",
  onConfirm,
  isLoading = false,
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="sm">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col">{title}</ModalHeader>
            <ModalBody>
              <p className="text-gray-600">{message}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={close} isDisabled={isLoading}>
                {cancelButtonText}
              </Button>
              <Button color={confirmButtonColor} onPress={handleConfirm} isLoading={isLoading}>
                {confirmButtonText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
