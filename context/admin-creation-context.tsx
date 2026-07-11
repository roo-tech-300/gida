import { createContext, useContext, useState, type ReactNode } from 'react';

import type { RoommateProfile } from '@/types/roommates';

type AdminCandidate = {
  user: RoommateProfile | null;
  role: 'super_admin' | 'regional_admin' | 'field_admin' | 'independent_field_admin' | null;
  regionId: string | null;
  supervisorId: string | null;
  allocatedHouses: string[];
};

type AdminCreationContextType = {
  data: AdminCandidate;
  setUser: (user: RoommateProfile) => void;
  setRole: (role: AdminCandidate['role']) => void;
  setRegionId: (id: string | null) => void;
  setSupervisorId: (id: string | null) => void;
  setAllocatedHouses: (ids: string[]) => void;
  reset: () => void;
};

const defaultValue: AdminCandidate = {
  user: null,
  role: null,
  regionId: null,
  supervisorId: null,
  allocatedHouses: [],
};

const AdminCreationContext = createContext<AdminCreationContextType>({
  data: defaultValue,
  setUser: () => {},
  setRole: () => {},
  setRegionId: () => {},
  setSupervisorId: () => {},
  setAllocatedHouses: () => {},
  reset: () => {},
});

export function AdminCreationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminCandidate>(defaultValue);

  const setUser = (user: RoommateProfile) =>
    setData((prev) => ({ ...prev, user }));

  const setRole = (role: AdminCandidate['role']) =>
    setData((prev) => ({ ...prev, role }));

  const setRegionId = (id: string | null) =>
    setData((prev) => ({ ...prev, regionId: id }));

  const setSupervisorId = (id: string | null) =>
    setData((prev) => ({ ...prev, supervisorId: id }));

  const setAllocatedHouses = (ids: string[]) =>
    setData((prev) => ({ ...prev, allocatedHouses: ids }));

  const reset = () => setData(defaultValue);

  return (
    <AdminCreationContext.Provider value={{ data, setUser, setRole, setRegionId, setSupervisorId, setAllocatedHouses, reset }}>
      {children}
    </AdminCreationContext.Provider>
  );
}

export function useAdminCreation() {
  return useContext(AdminCreationContext);
}
