import { apiFetch } from './api';
import { MaterialPurchase, MaterialCategory, NoteEntry, Supplier } from '../types';

interface MaterialPurchaseDTO {
  id: number;
  task: number | null;
  task_title: string;
  supplier_name: string;
  supplier: number | null;
  supplier_display_name: string;
  category: number | null;
  category_name: string;
  item_name: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  purchase_date: string;
  delivery_date: string | null;
  status: string;
  invoice_reference: string;
  is_paid: boolean;
  created_at: string;
}

interface SupplierNoteDTO {
  author_email: string | null;
  text: string;
  date: string;
}

interface SupplierDTO {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  tax_id: string;
  notes: SupplierNoteDTO[];
  created_at: string;
}

function fromSupplierNoteDTO(dto: SupplierNoteDTO): NoteEntry {
  return { authorEmail: dto.author_email, text: dto.text, date: dto.date };
}

function fromSupplierDTO(dto: SupplierDTO): Supplier {
  return {
    id: String(dto.id),
    name: dto.name,
    phone: dto.phone,
    email: dto.email,
    address: dto.address,
    city: dto.city,
    taxId: dto.tax_id,
    notes: (dto.notes || []).map(fromSupplierNoteDTO),
  };
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const data = await apiFetch<SupplierDTO[]>('/treasury/suppliers/');
  return data.map(fromSupplierDTO);
}

interface ExpenseCategoryDTO {
  id: number;
  name: string;
  is_direct: boolean;
}

const STATUS_FROM_BACKEND: Record<string, MaterialPurchase['status']> = {
  requested: 'solicitado',
  in_transit: 'en_transito',
  received: 'recibido',
  returned: 'devuelto',
};
const STATUS_TO_BACKEND: Record<MaterialPurchase['status'], string> = {
  solicitado: 'requested',
  en_transito: 'in_transit',
  recibido: 'received',
  devuelto: 'returned',
};

// MaterialCategory es un enum fijo en el frontend; ExpenseCategory
// (evz_treasury) es vocabulario libre — mismo patrón de resolución que ya
// se usa en lib/personal.ts para los gastos de personal.
const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  griferia_sanitarios: 'Griferías & Sanitarios',
  azulejos_pavimentos: 'Azulejos & Solados',
  muebles_encimeras: 'Muebles & Encimeras',
  fontaneria_electricidad: 'Fontanería & Electricidad',
  electrodomesticos: 'Electrodomésticos',
  herramientas_varios: 'Herramientas Varios',
};

let categoryCache: ExpenseCategoryDTO[] | null = null;

async function resolveCategoryId(key: MaterialCategory): Promise<number> {
  const label = CATEGORY_LABELS[key];
  if (!categoryCache) {
    categoryCache = await apiFetch<ExpenseCategoryDTO[]>('/treasury/categories/');
  }
  const found = categoryCache.find((c) => c.name === label);
  if (found) return found.id;

  const created = await apiFetch<ExpenseCategoryDTO>('/treasury/categories/', {
    method: 'POST',
    body: { name: label, is_direct: true },
  });
  categoryCache.push(created);
  return created.id;
}

function categoryKeyFromLabel(label: string): MaterialCategory {
  const found = (Object.keys(CATEGORY_LABELS) as MaterialCategory[]).find(
    (k) => CATEGORY_LABELS[k] === label
  );
  return found || 'herramientas_varios';
}

function fromDTO(dto: MaterialPurchaseDTO): MaterialPurchase {
  return {
    id: String(dto.id),
    // Sin numeración fiscal — se sintetiza del id real, como en otros módulos.
    purchaseNumber: `COMP-${String(dto.id).padStart(4, '0')}`,
    supplierName: dto.supplier_display_name || dto.supplier_name,
    supplierId: dto.supplier != null ? String(dto.supplier) : undefined,
    workOrderId: dto.task != null ? String(dto.task) : undefined,
    workOrderTitle: dto.task_title || 'General Stock',
    category: categoryKeyFromLabel(dto.category_name),
    itemName: dto.item_name,
    quantity: Number(dto.quantity),
    unitPrice: Number(dto.unit_price),
    totalPrice: Number(dto.total_price),
    purchaseDate: dto.purchase_date,
    deliveryDate: dto.delivery_date || '',
    status: STATUS_FROM_BACKEND[dto.status] || 'solicitado',
    invoiceReference: dto.invoice_reference || undefined,
    isPaid: dto.is_paid,
  };
}

export async function fetchMaterialPurchases(): Promise<MaterialPurchase[]> {
  const data = await apiFetch<MaterialPurchaseDTO[]>('/treasury/material-purchases/');
  return data.map(fromDTO);
}

export interface NewMaterialPurchaseInput {
  supplierName: string;
  /** Id de un Supplier ya existente — si viene, el backend lo usa tal cual
   * en vez de resolver/crear uno por nombre/teléfono/email. */
  supplierId?: string;
  /** Solo se usan si no hay supplierId y hace falta crear un Supplier nuevo. */
  supplierPhone?: string;
  supplierEmail?: string;
  /** Task.id real (WorkOrder.id) — opcional, "General Stock" si se omite. */
  workOrderId?: string;
  category: MaterialCategory;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export async function createMaterialPurchase(input: NewMaterialPurchaseInput): Promise<MaterialPurchase> {
  const categoryId = await resolveCategoryId(input.category);
  const dto = await apiFetch<MaterialPurchaseDTO>('/treasury/material-purchases/', {
    method: 'POST',
    body: {
      supplier_name: input.supplierName,
      supplier: input.supplierId ? Number(input.supplierId) : undefined,
      supplier_phone: input.supplierPhone || '',
      supplier_email: input.supplierEmail || '',
      task: input.workOrderId ? Number(input.workOrderId) : undefined,
      category: categoryId,
      item_name: input.itemName,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      purchase_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });
  return fromDTO(dto);
}

export async function updateMaterialPurchaseStatus(
  id: string,
  status: MaterialPurchase['status']
): Promise<MaterialPurchase> {
  const dto = await apiFetch<MaterialPurchaseDTO>(`/treasury/material-purchases/${id}/`, {
    method: 'PATCH',
    body: { status: STATUS_TO_BACKEND[status] },
  });
  return fromDTO(dto);
}

export async function payMaterialPurchase(id: string): Promise<MaterialPurchase> {
  const dto = await apiFetch<MaterialPurchaseDTO>(`/treasury/material-purchases/${id}/pay/`, {
    method: 'POST',
  });
  return fromDTO(dto);
}
