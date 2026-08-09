import { createContext, useContext, useState, type ReactNode } from 'react';

import type { AdminCandidate, AdminRole } from '@/types/admin';

type AdminCreationState = {
  user: AdminCandidate | null;
  role: AdminRole | null;
  regionId: string | null;
};

type AdminCreationContextType = {
  data: AdminCreationState;
  setUser: (user: AdminCandidate) => void;
  setRole: (role: AdminRole) => void;
  setRegionId: (regionId: string | null) => void;
  reset: () => void;
};

const defaultValue: AdminCreationState = {
  user: null,
  role: null,
  regionId: null,
};

const AdminCreationContext = createContext<AdminCreationContextType>({
  data: defaultValue,
  setUser: () => {},
  setRole: () => {},
  setRegionId: () => {},
  reset: () => {},
});

export function AdminCreationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminCreationState>(defaultValue);

  const setUser = (user: AdminCandidate) =>
    setData((prev) => ({ ...prev, user }));

  const setRole = (role: AdminRole) =>
    setData((prev) => ({ ...prev, role }));

  const setRegionId = (regionId: string | null) =>
    setData((prev) => ({ ...prev, regionId }));

  const reset = () => setData(defaultValue);

  return (
    <AdminCreationContext.Provider value={{ data, setUser, setRole, setRegionId, reset }}>
      {children}
    </AdminCreationContext.Provider>
  );
}

export function useAdminCreation() {
  const context = useContext(AdminCreationContext);
  if (!context) {
    throw new Error('useAdminCreation must be used within an AdminCreationProvider');
  }
  return context;
}
