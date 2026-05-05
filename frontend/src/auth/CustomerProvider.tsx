import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CustomerAuthContext } from './customerAuthContext.js';

const STORAGE_KEY = 'valar_selected_customer_id';

function readStorage(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && v.trim().length > 0 ? v.trim() : null;
  } catch {
    return null;
  }
}

function writeStorage(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}

function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customerId, setCustomerId] = useState<string | null>(() => readStorage());

  const login = useCallback((id: string) => {
    writeStorage(id);
    setCustomerId(id);
  }, []);

  const logout = useCallback(() => {
    clearStorage();
    setCustomerId(null);
  }, []);

  const value = useMemo(
    () => ({
      customerId,
      login,
      logout,
    }),
    [customerId, login, logout],
  );

  return (
    <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
  );
}
