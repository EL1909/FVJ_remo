export type ProjectType = 'baño' | 'cocina' | 'integral' | 'aseo';

export type EstimateStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'vencida';

export type WorkOrderStatus = 'planificacion' | 'en_progreso' | 'pausado' | 'completado';

export type InvoiceStatus = 'borrador' | 'pendiente' | 'pagada' | 'vencida';

export type MaterialCategory = 'griferia_sanitarios' | 'azulejos_pavimentos' | 'muebles_encimeras' | 'fontaneria_electricidad' | 'electrodomesticos' | 'herramientas_varios';

// Hilo de notas: lista de mensajes con quién y cuándo, no un bloque de
// texto que se sobrescribe. authorEmail null = nota automática del sistema.
export interface NoteEntry {
  authorEmail: string | null;
  text: string;
  date: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  avatar?: string;
  tags: string[];
  notes: NoteEntry[];
  createdAt: string;
  preferredContact: 'whatsapp' | 'email' | 'phone';
}

export interface EstimateItem {
  id: string;
  category: string;
  description: string;
  unit: 'm²' | 'm.l.' | 'ud' | 'global' | 'horas';
  quantity: number;
  unitCost: number; // Cost for contractor
  unitPrice: number; // Price for client
  totalPrice: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress: string;
  projectType: ProjectType;
  title: string;
  date: string;
  validUntil: string;
  status: EstimateStatus;
  items: EstimateItem[];
  subtotal: number;
  taxRate: number; // e.g., 21 for 21% IVA
  taxAmount: number;
  total: number;
  estimatedCost: number;
  estimatedMargin: number;
  notes: NoteEntry[];
  terms?: string;
  orderId?: string; // se llena al aprobarse (Quotation.order) — habilita "Crear Orden Obra"
}

export interface WorkOrderStage {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string;
  assignedWorker?: string;
}

export interface WorkOrderPhoto {
  id: string;
  url: string;
  caption: string;
  type: 'antes' | 'durante' | 'despues';
  uploadedAt: string;
}

export interface WorkOrder {
  id: string;
  orderId?: string; // Order.id real (evz_store) — hace falta para crear hitos de pago sobre esta obra
  orderNumber: string;
  estimateId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  address: string;
  projectType: ProjectType;
  title: string;
  status: WorkOrderStatus;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  assignedTeam: string[];
  assignedTeamIds: string[];
  progressPercentage: number;
  stages: WorkOrderStage[];
  photos: WorkOrderPhoto[];
  budgetTotal: number;
  actualCost: number;
  notes: NoteEntry[];
}

export interface InvoiceMilestone {
  description: string;
  percentage: number;
  amount: number;
  isPaid: boolean;
  dueDate: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  workOrderId?: string;
  estimateId?: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  concept: string;
  projectType: ProjectType;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  milestones?: InvoiceMilestone[];
  notes: NoteEntry[];
}

export interface MaterialPurchase {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  supplierId?: string;
  workOrderId?: string;
  workOrderTitle?: string;
  category: MaterialCategory;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseDate: string;
  deliveryDate: string;
  status: 'solicitado' | 'en_transito' | 'recibido' | 'devuelto';
  receiptUrl?: string;
  invoiceReference?: string;
  isPaid: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  taxId: string;
  notes: NoteEntry[];
}

export interface VisitPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'visita_tecnica' | 'medicion' | 'inicio_obra' | 'fin_obra' | 'entrega_material' | 'reunion';
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  workOrderId?: string;
  address: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description?: string;
  notes: NoteEntry[];
  photos: VisitPhoto[];
  assignedTo?: string;
  teamMemberId?: string;
  // 'pending' = reserva de un guest sin confirmar todavía (requiere que el
  // operador la confirme y asigne un empleado).
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  completed: boolean;
}

export interface SocialPost {
  id: string;
  platform: 'tiktok' | 'instagram';
  title: string;
  thumbnailUrl: string;
  videoUrl?: string;
  postUrl: string;
  views: number;
  likes: number;
  commentsCount: number;
  sharesCount: number;
  publishedDate: string;
  projectType: ProjectType;
  relatedWorkOrderId?: string;
  leadsGenerated: number;
  tags: string[];
}

export type EmployeeRole =
  | 'fontanero'
  | 'alicatador'
  | 'electricista'
  | 'montador_muebles'
  | 'jefe_obra'
  | 'tecnico_medicion'
  | 'pintor_acabados';

export type ExpenseCategory =
  | 'dieta_comida'
  | 'desplazamiento_gasolina'
  | 'material_urgente'
  | 'herramientas'
  | 'parking_peaje';

export interface EmployeeExpense {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  concept: string;
  amount: number;
  category: ExpenseCategory;
  status: 'pendiente' | 'aprobado' | 'reembolsado' | 'rechazado';
  workOrderId?: string;
  workOrderTitle?: string;
  receiptNote?: string;
}

export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  type: 'obra' | 'visita';
  targetId: string; // workOrderId or calendarEventId
  targetTitle: string;
  targetAddress: string;
  roleInTask: string;
  startDate: string;
  status: 'activa' | 'completada';
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  email: string;
  avatar?: string;
  salaryType: 'mensual' | 'por_hora' | 'por_obra';
  salaryAmount: number; // e.g. 2100 $/mes or 18 $/hora
  // Las asignaciones activas (obras/visitas) no viven acá: se derivan de
  // WorkOrder.assignedTeamIds y CalendarEvent.teamMemberId, que son la
  // fuente real — ver EmployeesView.getAssignmentsForEmployee. Guardar una
  // copia aparte fue justo el bug de "el empleado asignado no permanece":
  // esta lista nunca se sincronizaba con el backend.
  expenses: EmployeeExpense[];
  status: 'activo' | 'de_baja' | 'vacaciones';
  startDate: string;
  // Texto libre de presentación (certificaciones, observaciones) — distinto
  // del hilo de notas de abajo, que es un registro de eventos con autor y fecha.
  bio?: string;
  notes: NoteEntry[];
  hasAccount: boolean;
}

export interface PublicReview {
  id: string;
  authorName: string;
  authorLocation: string;
  rating: number; // 1-5
  date: string;
  projectType: ProjectType;
  comment: string;
  verified: boolean;
  avatarUrl?: string;
  projectPhotoUrl?: string;
}

export interface WebsiteHeroConfig {
  videoUrl: string; // If empty or disabled, landing page displays 'Proyecto Destacado'
  videoTitle?: string;
  videoSubtitle?: string;
  showVideo: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  playbackRate?: number;
}

export interface WebsiteProjectPhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface WebsiteProject {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  executionTime: string;
  projectType: ProjectType;
  imageUrl: string;
  description: string;
  estimatedPrice?: number;
  isFeatured: boolean;
  visibleOnWebsite: boolean;
  workOrderId?: string;
  createdAt: string;
  photos: WebsiteProjectPhoto[];
}

export interface CompanyData {
  companyName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  cif: string;
  schedule: string;
  socialInstagram: string;
  socialTikTok: string;
  logoUrl?: string;
}


