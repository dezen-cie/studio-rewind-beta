// src/api/auth.ts
import api, { setStoredToken } from './client';

export interface LoginResponseUser {
  id: string;
  email: string;
  role: 'client' | 'admin' | 'super_admin' | 'podcaster';
  account_type?: 'particulier' | 'professionnel' | null;
  firstname?: string | null;
  lastname?: string | null;
  company_name?: string | null;
  vat_number?: string | null;
  phone?: string | null;
  is_active: boolean;
  must_change_password?: boolean;
}

export interface LoginResponse {
  user: LoginResponseUser;
  token?: string; // Ajouté pour Safari iOS
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });

  // Stocke le token pour Safari iOS (fallback si cookies bloqués)
  if (response.data.token) {
    setStoredToken(response.data.token);
  }

  return response.data;
}


//  Changer le mot de passe de l'utilisateur connecté
export async function changeMyPassword(
  current_password: string,
  new_password: string,
  confirm_password: string
): Promise<{ message: string }> {
  const res = await api.patch<{ message: string }>('/auth/change-password', {
    current_password,
    new_password,
    confirm_password,
  });
  return res.data;
}