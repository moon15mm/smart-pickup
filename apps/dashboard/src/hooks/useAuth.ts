import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Staff } from '@smart-pickup/shared';

interface AuthStore {
  staff: Staff | null;
  token: string | null;
  storeId: string | null;
  login: (staff: Staff, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      staff: null,
      token: null,
      storeId: null,
      login: (staff, token) => {
        localStorage.setItem('sp_staff_token', token);
        set({ staff, token, storeId: staff.storeId });
      },
      logout: () => {
        localStorage.removeItem('sp_staff_token');
        set({ staff: null, token: null, storeId: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'sp-staff-auth' },
  ),
);
