import request from './client';
import type { ChatRequest, ChatResponse, Conversation, Message } from '../types';

export const chatApi = {
  chat: (data: ChatRequest) => request<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  chatAgent: (data: ChatRequest) => request<ChatResponse>('/chat/agent', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getConversations: () => request<Conversation[]>('/chat/conversations'),
  getMessages: (id: string) => request<Message[]>(`/chat/conversations/${id}/messages`),
  deleteConversation: (id: string) => request<void>(`/chat/conversations/${id}`, {
    method: 'DELETE',
  }),
};
