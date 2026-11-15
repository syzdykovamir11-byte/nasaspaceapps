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
    <DraggableModal modalKey={CREATE_FIELD_MODAL_KEY} title="New field">
      <div className="w-64">
        <label className="block text-sm text-mute mb-1" htmlFor="crop">
          What grows here?
        </label>
        <Input
          id="crop"
          type="text"
          placeholder="For example: wheat"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="mb-3"
        />
        <label className="block text-sm text-mute mb-1" htmlFor="field-name">
          Field name
        </label>
        <Input
          id="field-name"
          type="text"
          placeholder={`Field ${Math.ceil(Math.random() * 100)}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => close()}
            className="text-mute px-4 py-2 rounded-xl hover:bg-sand duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="bg-leaf text-paper font-medium px-4 py-2 rounded-xl hover:bg-leaf-dark duration-200 disabled:opacity-40"
          >
            Save field
          </button>
        </div>
      </div>
    </DraggableModal>
  );
};
