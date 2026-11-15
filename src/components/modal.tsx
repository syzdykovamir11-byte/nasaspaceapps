"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useModal } from "~/lib/store/modal-store";
import { useDraggable } from "~/lib/use-draggable";

interface ModalProps {
  modalKey: string;
  title: string;
  children: React.ReactNode;
}

export const DraggableModal: React.FC<ModalProps> = ({
  modalKey,
  title,
  children,
}) => {
  const { isOpen, close } = useModal(modalKey);
  const { position, startDragging } = useDraggable({ x: 0, y: 0 });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed bg-paper border border-line text-ink shadow-xl rounded-2xl overflow-hidden bottom-8 left-6 p-3"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            zIndex: 1000,
          }}
        >
          <div
            className="px-1 mb-3 cursor-move flex justify-between items-center"
            onMouseDown={startDragging}
          >
            <Dialog.Title className="font-semibold">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="text-mute hover:text-ink text-xl leading-none px-1 duration-200 focus:outline-none">
              ×
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
