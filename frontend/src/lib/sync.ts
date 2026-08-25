import { apiFetch } from './api';

// evz_sync: publicación de resúmenes agregados hacia EsfuerzoVZ. Solo
// agregados del período — nunca nombres de clientas ni datos individuales
// (ver evz_backbone/evz_sync/collector.py).

export interface SyncExpenseBreakdownItem {
  category: string;
  is_direct: boolean;
  amount: string;
  pct_of_expenses: number;
}

export interface SyncReport {
  schema_version: number;
  currency: string;
  period: { start: string; end: string };
  totals: { income: string; expenses: string };
  expense_breakdown: SyncExpenseBreakdownItem[];
  metrics: {
    customers_served: number;
    appointments: number;
    units_sold: number;
    orders: number;
    receipts_issued: number;
    avg_ticket: string;
  };
}

export interface SyncLogEntry {
  period_start: string;
  period_end: string;
  status: 'ok' | 'failed';
  http_status: number | null;
  error: string;
  sent_at: string;
  totals?: { income: string; expenses: string };
}

export interface SyncRemoteStatus {
  available: boolean;
  reason?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface SyncStatusResponse {
  remote: SyncRemoteStatus;
  suggested_period: { start: string; end: string };
  history: SyncLogEntry[];
}

export function fetchSyncStatus(): Promise<SyncStatusResponse> {
  return apiFetch<SyncStatusResponse>('/sync/status/');
}

export function fetchSyncPreview(periodStart: string, periodEnd: string): Promise<SyncReport> {
  return apiFetch<SyncReport>(`/sync/preview/?period_start=${periodStart}&period_end=${periodEnd}`);
}

export interface PublishSyncResult {
  status: string;
  period: { start: string; end: string };
  response: unknown;
}

export function publishSync(periodStart: string, periodEnd: string): Promise<PublishSyncResult> {
  return apiFetch<PublishSyncResult>('/sync/publish/', {
    method: 'POST',
    body: { period_start: periodStart, period_end: periodEnd },
  });
}
