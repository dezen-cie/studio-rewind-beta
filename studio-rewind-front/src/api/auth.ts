// src/api/auth.ts
import api from './client';

export interface LoginResponseUser {
  id: string;
  email: string;
  role: 'client' | 'admin' | 'super_admin';
  account_type: 'particulier' | 'professionnel';
  firstname?: string | null;
  lastname?: string | null;
  company_name?: string | null;
  vat_number?: string | null;
  phone: string;
  is_active: boolean;
}

export interface LoginResponse {
  user: LoginResponseUser;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
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