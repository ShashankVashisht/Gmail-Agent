import { ENV } from '../config/env';

export class ApiError extends Error {
  public status: number;
  public detail: any;
  
  constructor(status: number, detail: any) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail));
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('echo_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${ENV.API_URL}/api/v1${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('echo_token');
        window.location.href = '/login?expired=1';
      }
      
      let errorMessage = 'An error occurred';
      if (response.status === 502) {
        errorMessage = 'The AI service is unavailable right now. Try again shortly.';
      } else if (response.status === 503 && endpoint.includes('/gmail/connect')) {
        errorMessage = 'Gmail integration isn\'t configured on the server.';
      } else if (response.status === 401 && endpoint.includes('/auth/login')) {
        errorMessage = 'Incorrect email or password.';
      } else if (response.status === 409 && endpoint.includes('/auth/register')) {
        errorMessage = 'That email is already registered.';
      } else if (response.status === 409 && endpoint.includes('/chat/agent')) {
        errorMessage = 'Connect Gmail in Settings to use the email agent.';
      } else if (response.status === 422 && data && data.detail && Array.isArray(data.detail)) {
        errorMessage = data.detail[0]?.msg || 'Validation error';
      } else if (data && data.detail) {
        errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }

      throw new ApiError(response.status, errorMessage);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(0, "Can't reach the server.");
  }
}

export default request;
