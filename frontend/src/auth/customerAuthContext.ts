import { createContext } from 'react';

export interface CustomerAuthContextValue {
  customerId: string | null;
  login: (id: string) => void;
  logout: () => void;
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);
