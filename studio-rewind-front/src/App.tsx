// src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import MemberLayout from './layouts/MemberLayout';
import AdminLayout from './layouts/AdminLayout';
import PodcasterLayout from './layouts/PodcasterLayout';

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
import AdminPodcastersPage from './pages/admin/AdminPodcastersPage';

import PodcasterCalendarPage from './pages/podcaster/PodcasterCalendarPage';
import PodcasterPasswordPage from './pages/podcaster/PodcasterPasswordPage';
import PodcasterBlockedSlotsPage from './pages/podcaster/PodcasterBlockedSlotsPage';
import PodcasterProfilePage from './pages/podcaster/PodcasterProfilePage';

import { isAuthenticated, getUserRole } from './utils/auth';
import type { JSX } from 'react';
import Team from './pages/Team';
import CGV from './pages/CGV';
import MentionsLegales from './pages/MentionsLegales';
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';
import NotFound from './pages/NotFound';
import AdminArchivesPage from './pages/admin/AdminArchivesPage';
import BecomePodcaster from './pages/BecomePodcaster';

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

type PodcasterRouteProps = {
  children: JSX.Element;
};

function PodcasterRoute({ children }: PodcasterRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = getUserRole();

  if (role !== 'podcaster') {
    // Si c'est un admin, rediriger vers l'admin
    if (role === 'admin' || role === 'super_admin') {
      return <Navigate to="/admin" state={{ from: location }} replace />;
    }
    // Sinon vers l'espace membre
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
        <Route path="/devenez-podcasteur" element={<BecomePodcaster />} />
        <Route path="/cgv" element={<CGV />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
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
        <Route path="podcasters" element={<AdminPodcastersPage />} />
        {/* Routes pour admin qui est aussi podcaster */}
        <Route path="mon-calendrier" element={<PodcasterCalendarPage />} />
        <Route path="mes-disponibilites" element={<PodcasterBlockedSlotsPage />} />
        <Route path="mon-profil-equipe" element={<PodcasterProfilePage />} />
      </Route>

      {/* Layout podcasteur */}
      <Route
        path="/podcaster/*"
        element={
          <PodcasterRoute>
            <PodcasterLayout />
          </PodcasterRoute>
        }
      >
        <Route index element={<PodcasterCalendarPage />} />
        <Route path="disponibilites" element={<PodcasterBlockedSlotsPage />} />
        <Route path="profil" element={<PodcasterProfilePage />} />
        <Route path="password" element={<PodcasterPasswordPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
