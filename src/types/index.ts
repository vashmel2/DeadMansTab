export interface EmailFormData {
  recipientEmail: string;
  subject: string;
  message: string;
  linkUrl: string;
  linkText: string;
}

export type EmailStatus = 'idle' | 'sending' | 'success' | 'error';

export interface UserData {
  email: string;
  purgeAfterDays: number;
  lastEmailSent?: string;
}

export interface ClickData {
  userId: string;
  timestamp: string;
  ip?: string;
}

export interface StatusResponse {
  status: string;
  daysLeft?: number;
}