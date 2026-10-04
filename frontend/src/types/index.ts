export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'notice';
  content: string;
  created_at: string;
  status?: 'sending' | 'failed' | 'sent';
  errorType?: 'gmail_409' | 'retryable' | 'general';
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
}

export interface GmailStatus {
  status: 'not_connected' | 'pending' | 'active';
}

export interface GmailConnect {
  redirect_url: string;
}
