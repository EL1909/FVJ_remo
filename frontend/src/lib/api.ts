// VITE_API_URL (.env.local) manda en desarrollo, donde front y back corren
// en puertos distintos. Sin esa variable —tal cual queda un build de
// producción sin .env.production— el fallback debe seguir funcionando: por
// eso es relativo a BASE_URL (mismo /fvj/ que vite build --base=/fvj/) en
// vez de un localhost hardcodeado, que en el navegador de cada visitante
// apuntaría a su propia máquina, no al servidor.
export const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.BASE_URL}api`;

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

/**
 * Extrae un mensaje legible de un error de DRF: puede venir como
 * { detail: "..." } (errores de negocio, ApiError) o como
 * { campo: ["mensaje"] } (errores de validación de un serializer).
 */
function parseErrorMessage(data: any): string {
  if (!data || typeof data !== 'object') return 'Ocurrió un error inesperado.';
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.error === 'string') return data.error;
  const mensajes = Object.values(data).flat().filter((v) => typeof v === 'string');
  return mensajes.length > 0 ? mensajes.join(' ') : 'Ocurrió un error inesperado.';
}

/**
 * fetch autenticado hacia el backend de FVJ. Todos los módulos del panel
 * (crm, billing, fieldwork, treasury...) lo usan en vez de fetch directo:
 * agrega el Bearer token, arma la URL y parsea errores de forma uniforme.
 */
export async function apiFetch<T>(path: string, options: Omit<RequestInit, 'body'> & { body?: any } = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isFormData && typeof body !== 'string') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, body });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(parseErrorMessage(data), res.status);
  }
  return data as T;
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

// Reutiliza el flujo de auto-servicio ya existente (envía un email con link
// de recuperación) — el panel lo dispara en nombre del empleado en vez de
// pedirle a él que lo haga desde el login.
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/accounts/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || data.detail || 'No se pudo enviar el correo de restablecimiento.', res.status);
  }
}
