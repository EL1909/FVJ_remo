import { apiFetch } from './api';
import { Invoice, InvoiceStatus, NoteEntry, ProjectType } from '../types';

/**
 * "Factura" en el mock es en realidad un hito de cobro (PaymentMilestone)
 * sobre una Order real — no un documento suelto. El documento fiscal
 * inmutable es Receipt (evz_billing), acción manual aparte, no esto.
 */
interface PaymentMilestoneNoteDTO {
  author_email: string | null;
  text: string;
  date: string;
}

interface PaymentMilestoneDTO {
  id: number;
  order: number;
  order_total: string;
  customer_name: string;
  customer_address: string;
  client_id: number | null;
  task_id: number | null;
  task_title: string;
  kind: string;
  description: string;
  amount: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  due_date: string;
  transaction: number | null;
  is_paid: boolean;
  is_overdue: boolean;
  notes: PaymentMilestoneNoteDTO[];
  created_at: string;
}

function fromDTO(dto: PaymentMilestoneDTO): Invoice {
  const status: InvoiceStatus = dto.is_paid ? 'pagada' : dto.is_overdue ? 'vencida' : 'pendiente';
  return {
    id: String(dto.id),
    // Sin numeración fiscal propia (eso es de Receipt) — se sintetiza del id real.
    invoiceNumber: `FAC-${String(dto.id).padStart(4, '0')}`,
    workOrderId: dto.task_id != null ? String(dto.task_id) : undefined,
    clientId: dto.client_id != null ? String(dto.client_id) : '',
    clientName: dto.customer_name,
    clientAddress: dto.customer_address,
    issueDate: dto.created_at.split('T')[0],
    dueDate: dto.due_date,
    status,
    concept: dto.description,
    projectType: (dto.kind || 'integral') as ProjectType,
    subtotal: Number(dto.amount),
    taxAmount: Number(dto.tax_amount),
    total: Number(dto.total),
    paidAmount: dto.is_paid ? Number(dto.total) : 0,
    notes: (dto.notes || []).map((n) => ({ authorEmail: n.author_email, text: n.text, date: n.date })),
  };
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const data = await apiFetch<PaymentMilestoneDTO[]>('/treasury/payment-milestones/');
  return data.map(fromDTO);
}

export interface NewInvoiceInput {
  /** Order.id real — sale de WorkOrder.orderId. */
  orderId: string;
  description: string;
  /** Base imponible del hito (sin IVA). */
  amount: number;
  taxRate: number;
  dueDate: string;
}

export async function createInvoice(input: NewInvoiceInput): Promise<Invoice> {
  const dto = await apiFetch<PaymentMilestoneDTO>('/treasury/payment-milestones/', {
    method: 'POST',
    body: {
      order: Number(input.orderId),
      description: input.description,
      amount: input.amount,
      tax_rate: input.taxRate,
      due_date: input.dueDate,
    },
  });
  return fromDTO(dto);
}

export async function markInvoicePaid(id: string): Promise<Invoice> {
  const dto = await apiFetch<PaymentMilestoneDTO>(`/treasury/payment-milestones/${id}/collect/`, {
    method: 'POST',
  });
  return fromDTO(dto);
}

export async function addInvoiceNote(id: string, text: string): Promise<Invoice> {
  const dto = await apiFetch<PaymentMilestoneDTO>(`/treasury/payment-milestones/${id}/message/`, {
    method: 'POST',
    body: { text },
  });
  return fromDTO(dto);
}

// La Order real (evz_store) detrás de una obra: sus partidas, notas y estado
// de cobro — no vive en WorkOrder (eso es Task, solo fases de ejecución).
// Se trae bajo demanda para el modal de "Nueva Factura", donde hace falta
// ver el detalle completo de la obra que se está facturando.

interface OrderItemDTO {
  id: number;
  product: number | null;
  product_name: string;
  category: string;
  quantity: string;
  unit: string;
  unit_price: string;
  unit_cost: string | null;
  subtotal: string;
}

interface OrderNoteDTO {
  author_email: string | null;
  text: string;
  date: string;
}

interface OrderDetailDTO {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  created_at: string;
  items: OrderItemDTO[];
  total: string;
  notes: OrderNoteDTO[];
  amount_paid: string;
  balance_due: string;
  is_fully_paid: boolean;
}

export interface OrderDetailItem {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDetail {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  createdAt: string;
  items: OrderDetailItem[];
  total: number;
  amountPaid: number;
  balanceDue: number;
  isFullyPaid: boolean;
  notes: NoteEntry[];
}

function fromOrderDetailDTO(dto: OrderDetailDTO): OrderDetail {
  return {
    id: String(dto.id),
    customerName: dto.customer_name,
    customerEmail: dto.customer_email,
    customerPhone: dto.customer_phone,
    status: dto.status,
    createdAt: dto.created_at.split('T')[0],
    items: dto.items.map((it) => ({
      id: String(it.id),
      productName: it.product_name,
      category: it.category,
      quantity: Number(it.quantity),
      unit: it.unit,
      unitPrice: Number(it.unit_price),
      subtotal: Number(it.subtotal),
    })),
    total: Number(dto.total),
    amountPaid: Number(dto.amount_paid),
    balanceDue: Number(dto.balance_due),
    isFullyPaid: dto.is_fully_paid,
    notes: (dto.notes || []).map((n) => ({ authorEmail: n.author_email, text: n.text, date: n.date })),
  };
}

export async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  const dto = await apiFetch<OrderDetailDTO>(`/store/orders/${orderId}/`);
  return fromOrderDetailDTO(dto);
}
