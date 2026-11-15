import { create } from "zustand";
type UI = {
  dark: boolean;
  mobile: boolean;
  collapsed: boolean;
  notice: string;
  toggleTheme: () => void;
  setMobile: (v: boolean) => void;
  toggleSidebar: () => void;
  toast: (message: string) => void;
};
export const useUI = create<UI>((set, get) => ({
  dark: false,
  mobile: false,
  collapsed: false,
  notice: "",
  toggleTheme: () => {
    const dark = !get().dark;
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("vouch-theme", dark ? "dark" : "light");
    } catch {
      /* Theme still works in this session when storage is restricted. */
    }
    set({ dark });
  },
  setMobile: (mobile) => set({ mobile }),
  toggleSidebar: () => set((s) => ({ collapsed: !s.collapsed })),
  toast: (notice) => {
    set({ notice });
    setTimeout(() => {
      if (get().notice === notice) set({ notice: "" });
    }, 5000);
  },
}));
