import { apiFetch } from './api';
import { Client, NoteEntry } from '../types';

interface NoteEntryDTO {
  author_email: string | null;
  text: string;
  date: string;
}

interface ClientDTO {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  avatar: string | null;
  tags: string[];
  notes: NoteEntryDTO[];
  preferred_contact: Client['preferredContact'];
  created_at: string;
}

function fromNoteDTO(dto: NoteEntryDTO): NoteEntry {
  return { authorEmail: dto.author_email, text: dto.text, date: dto.date };
}

function fromDTO(dto: ClientDTO): Client {
  return {
    id: String(dto.id),
    name: dto.name,
    phone: dto.phone,
    email: dto.email,
    address: dto.address,
    city: dto.city,
    avatar: dto.avatar || undefined,
    tags: dto.tags || [],
    notes: (dto.notes || []).map(fromNoteDTO),
    createdAt: dto.created_at.split('T')[0],
    preferredContact: dto.preferred_contact,
  };
}

export interface NewClientInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  tags: string[];
  /** Texto de la primera nota (opcional) — el backend la agrega al hilo con el usuario autenticado como autor. */
  notes?: string;
  preferredContact: Client['preferredContact'];
}

export async function fetchClients(search?: string): Promise<Client[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await apiFetch<ClientDTO[]>(`/crm/clients/${qs}`);
  return data.map(fromDTO);
}

export async function createClient(input: NewClientInput): Promise<Client> {
  const dto = await apiFetch<ClientDTO>('/crm/clients/', {
    method: 'POST',
    body: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      tags: input.tags,
      notes: input.notes || '',
      preferred_contact: input.preferredContact,
    },
  });
  return fromDTO(dto);
}

export async function addClientNote(id: string, text: string): Promise<Client> {
  const dto = await apiFetch<ClientDTO>(`/crm/clients/${id}/message/`, {
    method: 'POST',
    body: { text },
  });
  return fromDTO(dto);
}
