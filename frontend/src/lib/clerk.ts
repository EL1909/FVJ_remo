/**
 * Enlaces a la carga por chat (evz_clerk). La pantalla la sirve Django en
 * /fvj/clerk/, no este frontend; en desarrollo, Vite la pasa al backend
 * (ver server.proxy en vite.config.ts) para que quede en el mismo origen y
 * lea el mismo token de localStorage.
 */
const CLERK_BASE = `${import.meta.env.BASE_URL}clerk/`;

export function clerkUrl(params?: Record<string, string | number>): string {
  if (!params) return CLERK_BASE;
  return `${CLERK_BASE}?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`;
}

/** Abrir (o retomar) la carga de avance de una obra. */
export function clerkTaskUrl(taskId: string | number): string {
  return clerkUrl({ stage: 'obra_avance', task: taskId });
}
