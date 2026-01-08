// src/utils/auth.ts
import api, { removeStoredToken } from '../api/client';
import type { LoginResponseUser } from '../api/auth';

const STORAGE_KEY = 'sr_user';

export type StoredUser = LoginResponseUser;

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredUser();
}

export function getUserRole():
  | StoredUser['role']
  | null {
  const user = getStoredUser();
  return user?.role ?? null;
}

export function getCurrentUser(): StoredUser | null {
  return getStoredUser();
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // pas grave : on nettoie quand même le localStorage
    console.warn('Erreur lors du logout (ignorée):', err);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      removeStoredToken(); // Supprime aussi le token JWT
    }
  }
}
