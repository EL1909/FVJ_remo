import { apiFetch } from './api';
import { WorkOrder, WorkOrderPhoto, WorkOrderStage, NoteEntry, ProjectType } from '../types';

interface NoteEntryDTO {
  author_email: string | null;
  text: string;
  date: string;
}

function fromNoteDTO(dto: NoteEntryDTO): NoteEntry {
  return { authorEmail: dto.author_email, text: dto.text, date: dto.date };
}

interface TaskStageDTO {
  id: number;
  task: number;
  name: string;
  completed: boolean;
  due_date: string | null;
  assigned_to: number | null;
  assigned_to_name: string;
  order_index: number;
}

interface TaskPhotoDTO {
  id: number;
  task: number;
  image: string;
  caption: string;
  type: string;
  uploaded_at: string;
}

interface TaskDTO {
  id: number;
  order: number;
  title: string;
  kind: string;
  site_address: string;
  status: string;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  team: number[];
  team_names: string[];
  progress_percentage: number;
  budget_total: string;
  client_id: number | null;
  client_name: string;
  client_phone: string;
  stages: TaskStageDTO[];
  photos: TaskPhotoDTO[];
  notes: NoteEntryDTO[];
  created_at: string;
}

const STATUS_FROM_BACKEND: Record<string, WorkOrder['status']> = {
  planning: 'planificacion',
  in_progress: 'en_progreso',
  paused: 'pausado',
  completed: 'completado',
};

const PHOTO_TYPE_FROM_BACKEND: Record<string, WorkOrderPhoto['type']> = {
  before: 'antes',
  during: 'durante',
  after: 'despues',
};
const PHOTO_TYPE_TO_BACKEND: Record<WorkOrderPhoto['type'], string> = {
  antes: 'before',
  durante: 'during',
  despues: 'after',
};

function fromStageDTO(dto: TaskStageDTO): WorkOrderStage {
  return {
    id: String(dto.id),
    name: dto.name,
    completed: dto.completed,
    dueDate: dto.due_date || undefined,
    assignedWorker: dto.assigned_to_name || undefined,
  };
}

function fromPhotoDTO(dto: TaskPhotoDTO): WorkOrderPhoto {
  return {
    id: String(dto.id),
    url: dto.image,
    caption: dto.caption,
    type: PHOTO_TYPE_FROM_BACKEND[dto.type] || 'durante',
    uploadedAt: dto.uploaded_at.split('T')[0],
  };
}

function fromDTO(dto: TaskDTO): WorkOrder {
  return {
    // No hay número de obra en el backend (no es documento fiscal, no
    // necesita serie sin huecos como Quotation/Receipt) — se sintetiza del
    // id real.
    id: String(dto.id),
    orderId: String(dto.order),
    orderNumber: `OT-${String(dto.id).padStart(4, '0')}`,
    clientId: dto.client_id != null ? String(dto.client_id) : '',
    clientName: dto.client_name,
    clientPhone: dto.client_phone,
    address: dto.site_address,
    projectType: (dto.kind || 'integral') as ProjectType,
    title: dto.title,
    status: STATUS_FROM_BACKEND[dto.status] || 'planificacion',
    startDate: dto.start_date || '',
    expectedEndDate: dto.expected_end_date || '',
    actualEndDate: dto.actual_end_date || undefined,
    assignedTeam: dto.team_names,
    assignedTeamIds: dto.team.map(String),
    progressPercentage: dto.progress_percentage,
    stages: dto.stages.map(fromStageDTO),
    photos: dto.photos.map(fromPhotoDTO),
    budgetTotal: Number(dto.budget_total),
    // Pendiente del módulo 8 (Materiales y Costos, aún no conectado): el
    // costo real se acumula de compras/gastos imputados a esta obra.
    actualCost: 0,
    notes: (dto.notes || []).map(fromNoteDTO),
  };
}

export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const data = await apiFetch<TaskDTO[]>('/fieldwork/tasks/');
  return data.map(fromDTO);
}

async function fetchTaskById(id: number): Promise<TaskDTO> {
  return apiFetch<TaskDTO>(`/fieldwork/tasks/${id}/`);
}

export interface NewWorkOrderInput {
  /** Order.id real — sale de Estimate.orderId tras aprobar la cotización. */
  orderId: string;
  title: string;
  kind: ProjectType;
  siteAddress: string;
  startDate: string;
  expectedEndDate: string;
  /** Una etapa por cada partida del presupuesto, en el mismo orden. */
  stageNames: string[];
}

export async function createWorkOrder(input: NewWorkOrderInput): Promise<WorkOrder> {
  const dto = await apiFetch<TaskDTO>('/fieldwork/tasks/', {
    method: 'POST',
    body: {
      order: Number(input.orderId),
      title: input.title,
      kind: input.kind,
      site_address: input.siteAddress,
      start_date: input.startDate,
      expected_end_date: input.expectedEndDate,
      status: 'in_progress',
    },
  });

  await Promise.all(
    input.stageNames.map((name, idx) =>
      apiFetch('/fieldwork/stages/', {
        method: 'POST',
        body: { task: dto.id, name, order_index: idx },
      })
    )
  );

  return fromDTO(await fetchTaskById(dto.id));
}

export async function toggleWorkOrderStage(stageId: string, currentlyCompleted: boolean): Promise<void> {
  await apiFetch(`/fieldwork/stages/${stageId}/`, {
    method: 'PATCH',
    body: { completed: !currentlyCompleted },
  });
}

export async function addWorkOrderPhoto(
  taskId: string,
  file: File,
  caption: string,
  type: WorkOrderPhoto['type']
): Promise<WorkOrderPhoto> {
  const formData = new FormData();
  formData.append('task', taskId);
  formData.append('image', file);
  formData.append('caption', caption);
  formData.append('type', PHOTO_TYPE_TO_BACKEND[type]);
  const dto = await apiFetch<TaskPhotoDTO>('/fieldwork/photos/', {
    method: 'POST',
    body: formData,
  });
  return fromPhotoDTO(dto);
}

export async function addWorkOrderNote(id: string, text: string): Promise<WorkOrder> {
  const dto = await apiFetch<TaskDTO>(`/fieldwork/tasks/${id}/message/`, {
    method: 'POST',
    body: { text },
  });
  return fromDTO(dto);
}

export async function updateWorkOrderTeam(id: string, teamMemberIds: string[]): Promise<WorkOrder> {
  const dto = await apiFetch<TaskDTO>(`/fieldwork/tasks/${id}/`, {
    method: 'PATCH',
    body: { team: teamMemberIds.map(Number) },
  });
  return fromDTO(dto);
}
