import { create } from "zustand";

export type ModalData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type ModalState = {
  openModals: {
    [key: string]: {
      isOpen: boolean;
      data: ModalData;
    };
  };
  openModal: (key: string, data?: ModalData) => void;
  closeModal: (key: string) => void;
};

export const useModalStore = create<ModalState>((set) => ({
  openModals: {
    // "": { isOpen: true, data: {} },
  },
  openModal: (key, data) =>
    set((state) => ({
      openModals: {
        ...state.openModals,
        [key]: { isOpen: true, data: data ?? {} },
      },
    })),
  closeModal: (key) =>
    set((state) => ({
      openModals: {
        ...state.openModals,
        [key]: { ...state.openModals[key], isOpen: false },
      },
    })),
}));

export const useModal = (modalKey: string) => {
  const { openModals, closeModal } = useModalStore();
  const modalState = openModals[modalKey];

  return {
    isOpen: modalState?.isOpen ?? false,
    data: modalState?.data,
    close: () => closeModal(modalKey),
  };
};
