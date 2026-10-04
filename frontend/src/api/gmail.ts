import request from './client';
import type { GmailStatus, GmailConnect } from '../types';

export const gmailApi = {
  getStatus: () => request<GmailStatus>('/integrations/gmail/status'),
  connect: () => request<GmailConnect>('/integrations/gmail/connect', { method: 'POST' }),
};
