import { create } from "zustand";

type AdminStore = {
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  clearIsAdmin: () => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  clearIsAdmin: () => set({ isAdmin: false }),
}));