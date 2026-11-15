"use client";

import { Loader } from "lucide-react";
import { useModal } from "~/lib/store/modal-store";

export const STATUS_MODAL_KEY = "status";

export const Status = () => {
  const { isOpen } = useModal(STATUS_MODAL_KEY);

  if (!isOpen) return;

  return (
    <div className="fixed bottom-8 left-1/2 bg-neutral-800/90 backdrop-blur text-neutral-400 rounded-xl p-2 pr-3 flex gap-3 -translate-x-1/2">
      <Loader className="animate-spin" /> Loading
    </div>
  );
};
