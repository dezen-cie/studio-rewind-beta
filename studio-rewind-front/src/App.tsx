// src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import MemberLayout from './layouts/MemberLayout';
import AdminLayout from './layouts/AdminLayout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReservationPage from './pages/ReservationPage';
import MemberDashboardPage from './pages/MemberDashboardPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';
import AdminFormulasPage from './pages/admin/AdminFormulasPage';
import AdminBlockedSlotsPage from './pages/admin/AdminBlockedSlotsPage';

import { isAuthenticated, getUserRole } from './utils/auth';
import type { JSX } from 'react';
import Team from './pages/Team';
import AdminArchivesPage from './pages/admin/AdminArchivesPage';

type PrivateRouteProps = {
  children: JSX.Element;
};

function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

type AdminRouteProps = {
  children: JSX.Element;
};

function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = getUserRole();
  const isAdmin = role === 'admin' || role === 'super_admin';

  if (!isAdmin) {
    return <Navigate to="/member" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Layout public : home / réservation */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/equipe" element={<Team />} />
      </Route>

      {/* 🔓 Page de login SANS layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reservation" element={<ReservationPage />} />

      {/* Layout membre */}
      <Route
        path="/member/*"
        element={
          <PrivateRoute>
            <MemberLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<MemberDashboardPage />} />
      </Route>

      {/* Layout admin */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="reservations" element={<AdminReservationsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="archives" element={<AdminArchivesPage />} />
        <Route path="formulas" element={<AdminFormulasPage />} />
        <Route path="blocked-slots" element={<AdminBlockedSlotsPage />} />
      </Route>

      {/* 404 -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
