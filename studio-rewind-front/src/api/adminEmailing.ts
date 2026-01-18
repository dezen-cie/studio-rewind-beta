// src/api/adminEmailing.ts
import api from './client';

// Types
export interface OptinUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface ExcelContact {
  email: string;
  name: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  open_rate: number;
  click_rate: number;
  sent_at: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export interface MailerStatus {
  configured: boolean;
  valid?: boolean;
  email?: string;
  host?: string;
  message?: string;
}

// API functions

/**
 * Recupere les utilisateurs optin
 */
export async function getOptinUsers(): Promise<{ users: OptinUser[]; count: number }> {
  const res = await api.get<{ users: OptinUser[]; count: number }>('/admin/emailing/optin-users');
  return res.data;
}

/**
 * Upload et parse un fichier Excel
 */
export async function uploadExcelFile(file: File): Promise<{ contacts: ExcelContact[]; count: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<{ success: boolean; contacts: ExcelContact[]; count: number }>(
    '/admin/emailing/upload-excel',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return { contacts: res.data.contacts, count: res.data.count };
}

/**
 * Cree une nouvelle campagne
 */
export async function createCampaign(data: {
  name: string;
  subject: string;
  html_content: string;
  recipients: Array<{ email: string; name?: string }>;
  scheduled_at?: string | null;
}): Promise<{ success: boolean; message: string; campaign: { id: string; name: string; subject: string; status: string; scheduled_at: string | null; recipients_count: number } }> {
  const res = await api.post('/admin/emailing/campaigns', data);
  return res.data;
}

/**
 * Envoie une campagne
 */
export async function sendCampaign(id: string): Promise<{ success: boolean; sent: number; failed: number; errors: Array<{ email: string; error: string }> }> {
  const res = await api.post(`/admin/emailing/campaigns/${id}/send`);
  return res.data;
}

/**
 * Liste toutes les campagnes
 */
export async function getCampaigns(): Promise<{ campaigns: Campaign[] }> {
  const res = await api.get<{ campaigns: Campaign[] }>('/admin/emailing/campaigns');
  return res.data;
}

/**
 * Supprime une campagne
 */
export async function deleteCampaign(id: string): Promise<{ success: boolean }> {
  const res = await api.delete(`/admin/emailing/campaigns/${id}`);
  return res.data;
}

/**
 * Verifie le statut du mailer SMTP
 */
export async function getMailerStatus(): Promise<MailerStatus> {
  const res = await api.get<MailerStatus>('/admin/emailing/mailer-status');
  return res.data;
}
