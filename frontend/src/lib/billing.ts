import { apiFetch } from './api';
import { Estimate, EstimateItem, NoteEntry, ProjectType } from '../types';

interface NoteEntryDTO {
  author_email: string | null;
  text: string;
  date: string;
}

function fromNoteDTO(dto: NoteEntryDTO): NoteEntry {
  return { authorEmail: dto.author_email, text: dto.text, date: dto.date };
}

interface QuotationItemDTO {
  id: number;
  category: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  unit_cost: string | null;
  tax_rate: string;
  subtotal: string;
  total: string;
}

interface QuotationDTO {
  id: number;
  number: string;
  title: string;
  kind: string;
  issue_date: string;
  valid_until: string | null;
  status: string;
  effective_status: string;
  client: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  notes: NoteEntryDTO[];
  terms: string;
  order: number | null;
  items: QuotationItemDTO[];
  subtotal: string;
  tax_amount: string;
  total: string;
  estimated_cost: string;
  estimated_margin: string;
}

// El backend modela draft/sent/accepted/rejected/expired (calculado);
// el frontend usa las mismas 5 en español — 'vencida' se agregó junto con
// esta conexión, antes el tipo no tenía dónde poner un presupuesto caducado.
const STATUS_FROM_BACKEND: Record<string, Estimate['status']> = {
  draft: 'borrador',
  sent: 'enviado',
  accepted: 'aprobado',
  rejected: 'rechazado',
  expired: 'vencida',
};
const STATUS_TO_BACKEND: Record<Estimate['status'], string> = {
  borrador: 'draft',
  enviado: 'sent',
  aprobado: 'accepted',
  rechazado: 'rejected',
  vencida: 'expired',
};

function fromItemDTO(dto: QuotationItemDTO): EstimateItem {
  return {
    id: String(dto.id),
    category: dto.category,
    description: dto.description,
    unit: (dto.unit || 'ud') as EstimateItem['unit'],
    quantity: Number(dto.quantity),
    unitCost: dto.unit_cost != null ? Number(dto.unit_cost) : 0,
    unitPrice: Number(dto.unit_price),
    // "Total lineal" en el mock es cantidad × precio, sin impuesto —
    // dto.total del backend SÍ incluye el impuesto (LineItemBase.total),
    // por eso se usa dto.subtotal aquí, no dto.total.
    totalPrice: Number(dto.subtotal),
  };
}

function fromDTO(dto: QuotationDTO): Estimate {
  const subtotalNum = Number(dto.subtotal);
  const estimatedMarginAbs = Number(dto.estimated_margin);
  return {
    id: String(dto.id),
    estimateNumber: dto.number,
    clientId: dto.client != null ? String(dto.client) : '',
    clientName: dto.customer_name,
    clientPhone: dto.customer_phone,
    clientEmail: dto.customer_email || undefined,
    clientAddress: dto.customer_address,
    projectType: (dto.kind || 'integral') as ProjectType,
    title: dto.title,
    date: dto.issue_date,
    validUntil: dto.valid_until || '',
    status: STATUS_FROM_BACKEND[dto.effective_status] || 'borrador',
    items: dto.items.map(fromItemDTO),
    subtotal: subtotalNum,
    // El backend guarda tax_rate por línea, no uno solo por cotización; el
    // formulario del frontend aplica una tasa uniforme a todas las líneas,
    // así que la de la primera línea representa la de toda la cotización.
    taxRate: dto.items.length > 0 ? Number(dto.items[0].tax_rate) : 21,
    taxAmount: Number(dto.tax_amount),
    total: Number(dto.total),
    estimatedCost: Number(dto.estimated_cost),
    // estimated_margin del backend es un importe absoluto (subtotal - costo),
    // no un porcentaje — el frontend sí lo muestra como porcentaje.
    estimatedMargin: subtotalNum > 0 ? (estimatedMarginAbs / subtotalNum) * 100 : 0,
    notes: (dto.notes || []).map(fromNoteDTO),
    terms: dto.terms || undefined,
    orderId: dto.order != null ? String(dto.order) : undefined,
  };
}

export async function fetchEstimates(): Promise<Estimate[]> {
  const data = await apiFetch<QuotationDTO[]>('/billing/quotations/');
  return data.map(fromDTO);
}

export interface NewEstimateInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress: string;
  projectType: ProjectType;
  title: string;
  items: Array<Pick<EstimateItem, 'category' | 'description' | 'unit' | 'quantity' | 'unitCost' | 'unitPrice'>>;
  taxRate: number;
  /** Texto de la primera nota (opcional) — el backend la agrega al hilo con el usuario autenticado como autor. */
  notes?: string;
  terms: string;
  /** Appointment.id real — viene de "Convertir a Presupuesto" desde una visita en Agenda (opcional). */
  appointmentId?: string;
}

export async function createEstimate(input: NewEstimateInput): Promise<Estimate> {
  const dto = await apiFetch<QuotationDTO>('/billing/quotations/', {
    method: 'POST',
    body: {
      client: input.clientId ? Number(input.clientId) : undefined,
      appointment: input.appointmentId ? Number(input.appointmentId) : undefined,
      customer_name: input.clientName,
      customer_email: input.clientEmail || '',
      customer_phone: input.clientPhone,
      customer_address: input.clientAddress,
      title: input.title,
      kind: input.projectType,
      terms: input.terms,
      notes: input.notes || '',
      valid_days: 30,
      items: input.items.map((it) => ({
        category: it.category,
        description: it.description,
        unit: it.unit,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        unit_cost: it.unitCost,
        tax_rate: input.taxRate,
      })),
    },
  });
  return fromDTO(dto);
}

/**
 * 'aprobado' y 'rechazado' pasan por sus propias acciones (accept/reject) —
 * funcionan sin importar el candado de edición general (ver
 * QuotationViewSet.update, que solo permite PATCH en borrador). Cualquier
 * otro destino es un PATCH normal.
 */
export async function updateEstimateStatus(
  id: string,
  targetStatus: Estimate['status']
): Promise<Estimate> {
  if (targetStatus === 'aprobado') {
    const data = await apiFetch<{ quotation: QuotationDTO; order_id: number }>(
      `/billing/quotations/${id}/accept/`,
      { method: 'POST' }
    );
    return fromDTO(data.quotation);
  }
  if (targetStatus === 'rechazado') {
    const dto = await apiFetch<QuotationDTO>(`/billing/quotations/${id}/reject/`, {
      method: 'POST',
    });
    return fromDTO(dto);
  }
  const dto = await apiFetch<QuotationDTO>(`/billing/quotations/${id}/`, {
    method: 'PATCH',
    body: { status: STATUS_TO_BACKEND[targetStatus] },
  });
  return fromDTO(dto);
}

/**
 * Edita la cabecera (y opcionalmente el desglose completo) de un presupuesto
 * — el backend solo lo permite mientras sigue en borrador.
 */
export async function updateEstimate(
  id: string,
  input: NewEstimateInput
): Promise<Estimate> {
  const dto = await apiFetch<QuotationDTO>(`/billing/quotations/${id}/`, {
    method: 'PATCH',
    body: {
      client: input.clientId ? Number(input.clientId) : null,
      customer_name: input.clientName,
      customer_email: input.clientEmail || '',
      customer_phone: input.clientPhone,
      customer_address: input.clientAddress,
      title: input.title,
      kind: input.projectType,
      terms: input.terms,
      items: input.items.map((it) => ({
        category: it.category,
        description: it.description,
        unit: it.unit,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        unit_cost: it.unitCost,
        tax_rate: input.taxRate,
      })),
    },
  });
  return fromDTO(dto);
}

// A diferencia del resto de los campos, esto funciona sin importar el
// estado de la cotización (borrador, enviada, aprobada...).
export async function addEstimateNote(id: string, text: string): Promise<Estimate> {
  const dto = await apiFetch<QuotationDTO>(`/billing/quotations/${id}/message/`, {
    method: 'POST',
    body: { text },
  });
  return fromDTO(dto);
}
