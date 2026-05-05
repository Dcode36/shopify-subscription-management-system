import { Route, Routes } from 'react-router-dom';
import { RequireCustomer } from './auth/RequireCustomer.js';
import { PageShell } from './components/PageShell.js';
import { LoginPage } from './pages/LoginPage.js';
import { SubscriptionDetailPage } from './pages/SubscriptionDetailPage.js';
import { SubscriptionListPage } from './pages/SubscriptionListPage.js';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireCustomer />}>
        <Route element={<PageShell />}>
          <Route index element={<SubscriptionListPage />} />
          <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
