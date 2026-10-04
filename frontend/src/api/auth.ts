import request from './client';
import type { User, AuthResponse } from '../types';

export const authApi = {
  register: (data: any) => request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data: any) => request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  me: () => request<User>('/auth/me'),
};
