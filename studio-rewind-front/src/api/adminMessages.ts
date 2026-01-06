// src/api/adminMessages.ts
import api from './client';

export type MessageStatus = 'new' | 'read' | 'archived';

export interface AdminMessageUser {
  id: string;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  company_name?: string | null;
}

export interface AdminMessage {
  id: string;
  user_id?: string | null;
  email: string;
  subject: string;
  content: string;
  status: MessageStatus;
  createdAt?: string;
  created_at?: string;
  User?: AdminMessageUser;
}

export async function getAdminMessages(): Promise<AdminMessage[]> {
  const res = await api.get<AdminMessage[]>('/messages/admin');
  return res.data;
}

export async function getAdminMessageById(id: string): Promise<AdminMessage> {
  const res = await api.get<AdminMessage>(`/messages/admin/${id}`);
  return res.data;
}

export async function deleteAdminMessage(id: string): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/messages/admin/${id}`);
  return res.data;
}

export async function replyToAdminMessage(id: string, subject: string, text: string) {
  const res = await api.post(`/messages/admin/${id}/reply`, {
    subject,
    text
  });
  return res.data;
}
