export const API_URL = '/api';

const generateIdempotencyKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // Auto-attach idempotency key for POST requests (prevents duplicate task creation)
  if (options.method?.toUpperCase() === 'POST') {
    headers.set('Idempotency-Key', generateIdempotencyKey());
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }

  return data;
};
