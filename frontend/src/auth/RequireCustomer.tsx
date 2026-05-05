import { Navigate, Outlet } from 'react-router-dom';
import { useCustomer } from './useCustomer.js';

export function RequireCustomer() {
  const { customerId } = useCustomer();

  if (!customerId) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
