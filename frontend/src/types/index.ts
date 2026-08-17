export type ProjectType = 'baño' | 'cocina' | 'integral' | 'aseo';

export type EstimateStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado';

export type WorkOrderStatus = 'planificacion' | 'en_progreso' | 'pausado' | 'completado';

export type InvoiceStatus = 'borrador' | 'pendiente' | 'pagada' | 'vencida';

export type MaterialCategory = 'griferia_sanitarios' | 'azulejos_pavimentos' | 'muebles_encimeras' | 'fontaneria_electricidad' | 'electrodomesticos' | 'herramientas_varios';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  avatar?: string;
  tags: string[];
  notes?: string;
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
  notes?: string;
  terms?: string;
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
  progressPercentage: number;
  stages: WorkOrderStage[];
  photos: WorkOrderPhoto[];
  budgetTotal: number;
  actualCost: number;
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
  notes?: string;
}

export interface MaterialPurchase {
  id: string;
  purchaseNumber: string;
  supplierName: string;
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
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'visita_tecnica' | 'medicion' | 'inicio_obra' | 'fin_obra' | 'entrega_material' | 'reunion';
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  workOrderId?: string;
  address: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description?: string;
  notes?: string;
  assignedTo?: string;
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
  status: 'pendiente' | 'aprobado' | 'reembolsado';
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
  salaryAmount: number; // e.g. 2100 €/mes or 18 €/hora
  activeAssignments: EmployeeAssignment[];
  expenses: EmployeeExpense[];
  status: 'activo' | 'de_baja' | 'vacaciones';
  startDate: string;
  notes?: string;
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
  isFeatured: boolean;
  visibleOnWebsite: boolean;
  createdAt: string;
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
  copyright: string;
}


