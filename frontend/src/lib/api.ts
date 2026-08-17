const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/fvj/api';

const ACCESS_TOKEN_KEY = 'fvj_access_token';
const REFRESH_TOKEN_KEY = 'fvj_refresh_token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  date_joined: string;
  profile: {
    phone: string;
    profile_picture: string | null;
  };
}

export async function login(email: string, password: string): Promise<Profile> {
  const res = await fetch(`${API_URL}/accounts/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.detail || 'No se pudo iniciar sesión.', res.status);
  }

  setTokens(data.access, data.refresh);
  return fetchProfile();
}

export async function fetchProfile(): Promise<Profile> {
  const token = getAccessToken();
  if (!token) {
    throw new ApiError('No hay sesión activa.', 401);
  }

  const res = await fetch(`${API_URL}/accounts/profile/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearTokens();
    throw new ApiError('Sesión expirada, vuelve a iniciar sesión.', res.status);
  }

  return res.json();
}

export function logout() {
  clearTokens();
}
