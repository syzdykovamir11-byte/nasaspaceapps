"use client";

import { Loader } from "lucide-react";
import { useModal } from "~/lib/store/modal-store";

export const STATUS_MODAL_KEY = "status";

export const Status = () => {
  const { isOpen } = useModal(STATUS_MODAL_KEY);

  if (!isOpen) return;

  return (
    <div className="fixed bottom-8 left-1/2 bg-paper border border-line shadow-lg text-ink rounded-2xl p-2 pr-4 items-center flex gap-3 -translate-x-1/2">
      <Loader className="animate-spin text-leaf" /> Saving your field…
    </div>
  );
};
