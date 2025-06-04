export interface EmailFormData {
  recipientEmail: string;
  subject: string;
  message: string;
  linkUrl: string;
  linkText: string;
}

export type EmailStatus = 'idle' | 'sending' | 'success' | 'error';

export interface UserData {
  id?: string;                // Optional user ID (from DB)
  email: string;
  purgeAfterDays: number;
  verified?: boolean;
  last_verified?: string | null;
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
