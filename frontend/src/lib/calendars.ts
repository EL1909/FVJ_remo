import { apiFetch } from './api';
import { CalendarEvent, NoteEntry, VisitPhoto } from '../types';

interface NoteEntryDTO {
  author_email: string | null;
  text: string;
  date: string;
}

function fromNoteDTO(dto: NoteEntryDTO): NoteEntry {
  return { authorEmail: dto.author_email, text: dto.text, date: dto.date };
}

/** Última nota del hilo, para el resumen compacto de la tarjeta del evento. */
function latestNoteText(notes: NoteEntryDTO[]): string | undefined {
  return notes.length > 0 ? notes[notes.length - 1].text : undefined;
}

interface AppointmentPhotoDTO {
  id: number;
  appointment: number;
  image: string;
  caption: string;
  uploaded_at: string;
}

function fromPhotoDTO(dto: AppointmentPhotoDTO): VisitPhoto {
  return {
    id: String(dto.id),
    url: dto.image,
    caption: dto.caption,
    uploadedAt: dto.uploaded_at.split('T')[0],
  };
}

/** Formato que devuelve el listado (estilo FullCalendar, ver evz_calendars/views.py). */
interface FullCalendarEventDTO {
  id: number | string;
  title: string;
  start: string;
  end: string;
  display?: string;
  extendedProps?: {
    title?: string;
    kind?: string;
    address?: string;
    client_id?: number | null;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    status?: string;
    notes?: NoteEntryDTO[];
    photos?: AppointmentPhotoDTO[];
    team_member_id?: number | null;
    team_member_name?: string | null;
  };
}

/** Formato que devuelve crear/editar una cita (AppointmentSerializer). */
interface AppointmentDTO {
  id: number;
  client: number | null;
  team_member: number | null;
  title: string;
  kind: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: NoteEntryDTO[];
  photos: AppointmentPhotoDTO[];
  team_member_name: string;
}

function splitDateTime(iso: string): { date: string; time: string } {
  const [date, timePart] = iso.split('T');
  return { date, time: timePart.slice(0, 5) };
}

function fromListDTO(dto: FullCalendarEventDTO): CalendarEvent | null {
  if (String(dto.id).startsWith('block-')) return null; // bloqueo de agenda, no una cita
  const ext = dto.extendedProps || {};
  const start = splitDateTime(dto.start);
  const end = splitDateTime(dto.end);
  const notes = ext.notes || [];
  return {
    id: String(dto.id),
    title: ext.title || dto.title,
    type: (ext.kind as CalendarEvent['type']) || 'reunion',
    clientId: ext.client_id != null ? String(ext.client_id) : undefined,
    clientName: ext.customer_name || undefined,
    clientPhone: ext.customer_phone || undefined,
    clientEmail: ext.customer_email || undefined,
    address: ext.address || '',
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    description: latestNoteText(notes),
    notes: notes.map(fromNoteDTO),
    photos: (ext.photos || []).map(fromPhotoDTO),
    assignedTo: ext.team_member_name || undefined,
    teamMemberId: ext.team_member_id != null ? String(ext.team_member_id) : undefined,
    status: (ext.status as CalendarEvent['status']) || 'pending',
    completed: ext.status === 'completed',
  };
}

function fromAppointmentDTO(dto: AppointmentDTO): CalendarEvent {
  const start = splitDateTime(dto.start_time);
  const end = splitDateTime(dto.end_time);
  const notes = dto.notes || [];
  return {
    id: String(dto.id),
    title: dto.title,
    type: (dto.kind as CalendarEvent['type']) || 'reunion',
    clientId: dto.client != null ? String(dto.client) : undefined,
    clientName: dto.customer_name || undefined,
    clientPhone: dto.customer_phone || undefined,
    clientEmail: dto.customer_email || undefined,
    address: dto.address || '',
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    description: latestNoteText(notes),
    notes: notes.map(fromNoteDTO),
    photos: (dto.photos || []).map(fromPhotoDTO),
    assignedTo: dto.team_member_name || undefined,
    teamMemberId: dto.team_member != null ? String(dto.team_member) : undefined,
    status: (dto.status as CalendarEvent['status']) || 'pending',
    completed: dto.status === 'completed',
  };
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const data = await apiFetch<FullCalendarEventDTO[]>('/calendars/appointments/');
  return data.map(fromListDTO).filter((e): e is CalendarEvent => e !== null);
}

export interface NewEventInput {
  title: string;
  type: CalendarEvent['type'];
  /** Cliente real del CRM a vincular (opcional, solo trazabilidad). */
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  workOrderId?: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  /** Texto de la primera nota (opcional) — el backend la agrega al hilo con el usuario autenticado como autor. */
  notes?: string;
}

export async function createCalendarEvent(input: NewEventInput): Promise<CalendarEvent> {
  const dto = await apiFetch<AppointmentDTO>('/calendars/appointments/', {
    method: 'POST',
    body: {
      title: input.title,
      kind: input.type,
      customer_name: input.clientName || '',
      customer_email: input.clientEmail || '',
      customer_phone: input.clientPhone || '',
      client: input.clientId ? Number(input.clientId) : undefined,
      address: input.address,
      start_time: `${input.date}T${input.startTime}:00`,
      end_time: `${input.date}T${input.endTime}:00`,
      notes: input.notes || '',
    },
  });
  return fromAppointmentDTO(dto);
}

export interface PublicAppointmentInput {
  title: string;
  kind: CalendarEvent['type'];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  notes?: string;
}

// Reserva pública (sin login) — no crea Client en el CRM (solo el equipo
// puede, ver evz_crm.ClientViewSet), guarda los datos del visitante
// directamente en la cita (customer_name/email/phone). El equipo puede
// convertirla en un Client real desde el panel más adelante si quiere.
export async function bookPublicAppointment(input: PublicAppointmentInput): Promise<CalendarEvent> {
  const dto = await apiFetch<AppointmentDTO>('/calendars/appointments/', {
    method: 'POST',
    body: {
      title: input.title,
      kind: input.kind,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      address: input.address,
      start_time: `${input.date}T${input.startTime}:00`,
      end_time: `${input.date}T${input.endTime}:00`,
      notes: input.notes || '',
    },
  });
  return fromAppointmentDTO(dto);
}

export async function toggleEventComplete(id: string, currentlyCompleted: boolean): Promise<void> {
  await apiFetch(`/calendars/appointments/${id}/`, {
    method: 'PATCH',
    body: { status: currentlyCompleted ? 'confirmed' : 'completed' },
  });
}

// Confirma una cita pendiente (reserva de un guest) y asigna quién la
// atiende — el backend ya asigna automáticamente a alguien disponible al
// crearla, pero el operador puede confirmar/cambiar esa asignación acá.
export async function confirmAppointment(id: string, teamMemberId: string): Promise<CalendarEvent> {
  const dto = await apiFetch<AppointmentDTO>(`/calendars/appointments/${id}/`, {
    method: 'PATCH',
    body: { status: 'confirmed', team_member: Number(teamMemberId) },
  });
  return fromAppointmentDTO(dto);
}

/** Reasigna (o libera, con null) quién atiende una cita ya confirmada. */
export async function updateCalendarEventTeamMember(
  id: string,
  teamMemberId: string | null
): Promise<CalendarEvent> {
  const dto = await apiFetch<AppointmentDTO>(`/calendars/appointments/${id}/`, {
    method: 'PATCH',
    body: { team_member: teamMemberId ? Number(teamMemberId) : null },
  });
  return fromAppointmentDTO(dto);
}

export async function addCalendarEventNote(id: string, text: string): Promise<CalendarEvent> {
  const dto = await apiFetch<AppointmentDTO>(`/calendars/appointments/${id}/message/`, {
    method: 'POST',
    body: { text },
  });
  return fromAppointmentDTO(dto);
}

export async function addCalendarEventPhoto(
  appointmentId: string,
  file: File,
  caption: string
): Promise<VisitPhoto> {
  const formData = new FormData();
  formData.append('appointment', appointmentId);
  formData.append('image', file);
  formData.append('caption', caption);
  const dto = await apiFetch<AppointmentPhotoDTO>('/calendars/photos/', {
    method: 'POST',
    body: formData,
  });
  return fromPhotoDTO(dto);
}
