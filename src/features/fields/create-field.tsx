"use client";

import { DraggableModal } from "~/components/modal";
import { useAction } from "next-safe-action/hooks";

export type CreateModalProps = [number, number][];

import React, { useEffect, useState } from "react";
import { useModal, useModalStore } from "~/lib/store/modal-store";
import { Input } from "~/components/input";
import { createField } from "./create-action";
import { STATUS_MODAL_KEY } from "../status";

export const CREATE_FIELD_MODAL_KEY = "create-land";

export const CreateLandModal = () => {
  const [crop, setCrop] = useState("");
  const [name, setName] = useState("");
  const { close, data } = useModal(CREATE_FIELD_MODAL_KEY);
  const { openModal, closeModal } = useModalStore();

  const { execute } = useAction(createField, {
    onSettled: () => {
      close();
      closeModal(STATUS_MODAL_KEY);
    },
    onExecute: () => openModal(STATUS_MODAL_KEY),
  });

  useEffect(() => {
    setName((name) => (crop ? `${crop} field 1` : name));
  }, [crop]);

  const handleCreate = () => {
    if (!data) return;
    execute({ name, crop, coordinates: data as CreateModalProps });
  };

  return (
    <DraggableModal modalKey={CREATE_FIELD_MODAL_KEY} title="Create new field">
      <div className="w-56">
        <Input
          type="text"
          placeholder="Crop name"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="mb-2"
        />
        <Input
          type="text"
          placeholder={`Field ${Math.ceil(Math.random() * 100)}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-5"
        />
        <div className="grid grid-cols-2 gap-5">
          <button
            onClick={() => close()}
            className="text-neutral-400 px-4 py-1 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="bg-green-600/50 text-green-300 px-4 py-1 rounded-lg"
          >
            Create
          </button>
        </div>
      </div>
    </DraggableModal>
  );
};
