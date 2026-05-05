import { useContext } from 'react';
import { CustomerAuthContext } from './customerAuthContext.js';

export function useCustomer() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return ctx;
}
