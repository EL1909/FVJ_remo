import { apiFetch } from './api';
import { Employee, EmployeeExpense, EmployeeRole, ExpenseCategory, NoteEntry } from '../types';

interface NoteEntryDTO {
  author_email: string | null;
  text: string;
  date: string;
}

function fromNoteDTO(dto: NoteEntryDTO): NoteEntry {
  return { authorEmail: dto.author_email, text: dto.text, date: dto.date };
}

interface TeamMemberDTO {
  id: number;
  display_name: string;
  email: string;
  has_account: boolean;
  photo: string | null;
  bio: string;
  is_active: boolean;
  role: string;
  phone: string;
  hired_at: string | null;
  salary_type: string;
  salary_amount: string | null;
  notes: NoteEntryDTO[];
}

interface ExpenseClaimDTO {
  id: number;
  team_member: number;
  team_member_name: string;
  task: number | null;
  task_title: string;
  date: string;
  concept: string;
  amount: string;
  category: number | null;
  category_name: string;
  status: string;
  created_at: string;
}

interface ExpenseCategoryDTO {
  id: number;
  name: string;
  is_direct: boolean;
}

// El backend guarda la modalidad de pago en inglés (monthly/hourly/per_job);
// el frontend la muestra en español. Sin esto, cada empleado se vería con
// una modalidad vacía o incorrecta.
const SALARY_TYPE_TO_BACKEND: Record<Employee['salaryType'], string> = {
  mensual: 'monthly',
  por_hora: 'hourly',
  por_obra: 'per_job',
};
const SALARY_TYPE_FROM_BACKEND: Record<string, Employee['salaryType']> = {
  monthly: 'mensual',
  hourly: 'por_hora',
  per_job: 'por_obra',
};

const EXPENSE_STATUS_FROM_BACKEND: Record<string, EmployeeExpense['status']> = {
  pending: 'pendiente',
  approved: 'aprobado',
  reimbursed: 'reembolsado',
  rejected: 'rechazado',
};

// ExpenseCategory (evz_treasury) es vocabulario libre, no un enum fijo — el
// frontend sí trabaja con un enum fijo, así que estas etiquetas son las que
// se usan para encontrar/crear la fila real en el backend.
const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  desplazamiento_gasolina: 'Gasolina / Desplazamiento',
  dieta_comida: 'Dieta / Comida',
  material_urgente: 'Material Urgente de Obra',
  herramientas: 'Herramientas & Discos',
  parking_peaje: 'Parking / Peaje',
};

let categoryCache: ExpenseCategoryDTO[] | null = null;

async function resolveCategoryId(key: ExpenseCategory): Promise<number> {
  const label = EXPENSE_CATEGORY_LABELS[key];
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

function fromTeamMemberDTO(dto: TeamMemberDTO): Employee {
  return {
    id: String(dto.id),
    name: dto.display_name,
    role: dto.role as EmployeeRole,
    phone: dto.phone,
    email: dto.email,
    avatar: dto.photo || undefined,
    salaryType: SALARY_TYPE_FROM_BACKEND[dto.salary_type] || 'mensual',
    salaryAmount: dto.salary_amount ? Number(dto.salary_amount) : 0,
    expenses: [],
    // is_active es lo único que guarda el backend hoy — "vacaciones" vive
    // como TimeBlock en evz_calendars, todavía no se cruza aquí.
    status: dto.is_active ? 'activo' : 'de_baja',
    startDate: dto.hired_at || '',
    bio: dto.bio || undefined,
    notes: (dto.notes || []).map(fromNoteDTO),
    hasAccount: dto.has_account,
  };
}

function fromExpenseClaimDTO(dto: ExpenseClaimDTO): EmployeeExpense {
  const categoryKey = (Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).find(
    (k) => EXPENSE_CATEGORY_LABELS[k] === dto.category_name
  );
  return {
    id: String(dto.id),
    employeeId: String(dto.team_member),
    employeeName: dto.team_member_name,
    date: dto.date,
    concept: dto.concept,
    amount: Number(dto.amount),
    category: categoryKey || 'material_urgente',
    status: EXPENSE_STATUS_FROM_BACKEND[dto.status] || 'pendiente',
    workOrderId: dto.task != null ? String(dto.task) : undefined,
    workOrderTitle: dto.task_title || undefined,
  };
}

export async function fetchEmployees(): Promise<Employee[]> {
  const [members, claims] = await Promise.all([
    apiFetch<TeamMemberDTO[]>('/business/team-members/'),
    apiFetch<ExpenseClaimDTO[]>('/treasury/expense-claims/'),
  ]);
  const expensesByMember = new Map<string, EmployeeExpense[]>();
  for (const claim of claims) {
    const exp = fromExpenseClaimDTO(claim);
    const list = expensesByMember.get(exp.employeeId) || [];
    list.push(exp);
    expensesByMember.set(exp.employeeId, list);
  }
  return members.map((dto) => {
    const emp = fromTeamMemberDTO(dto);
    emp.expenses = expensesByMember.get(emp.id) || [];
    return emp;
  });
}

export type NewEmployeeInput = Pick<
  Employee,
  'name' | 'role' | 'phone' | 'salaryType' | 'salaryAmount' | 'bio'
> & { photo?: File };

// Igual que updateCompanyData (lib/business.ts): JSON normal, o FormData
// cuando hay una foto que subir — el backend acepta ambos (parser_classes
// incluye MultiPartParser) pero un body JSON no puede llevar un archivo.
function toFormBody(fields: Record<string, string>, photo?: File): any {
  if (!photo) return fields;
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  formData.append('photo', photo);
  return formData;
}

export async function createEmployee(input: NewEmployeeInput): Promise<Employee> {
  const dto = await apiFetch<TeamMemberDTO>('/business/team-members/', {
    method: 'POST',
    body: toFormBody(
      {
        display_name: input.name,
        role: input.role,
        phone: input.phone,
        salary_type: SALARY_TYPE_TO_BACKEND[input.salaryType],
        salary_amount: String(input.salaryAmount),
        bio: input.bio || '',
      },
      input.photo
    ),
  });
  return fromTeamMemberDTO(dto);
}

export type UpdateEmployeeInput = NewEmployeeInput & { isActive: boolean };

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
  const dto = await apiFetch<TeamMemberDTO>(`/business/team-members/${id}/`, {
    method: 'PATCH',
    body: toFormBody(
      {
        display_name: input.name,
        role: input.role,
        phone: input.phone,
        salary_type: SALARY_TYPE_TO_BACKEND[input.salaryType],
        salary_amount: String(input.salaryAmount),
        bio: input.bio || '',
        is_active: String(input.isActive),
      },
      input.photo
    ),
  });
  return fromTeamMemberDTO(dto);
}

export async function addEmployeeNote(id: string, text: string): Promise<Employee> {
  const dto = await apiFetch<TeamMemberDTO>(`/business/team-members/${id}/message/`, {
    method: 'POST',
    body: { text },
  });
  return fromTeamMemberDTO(dto);
}

export type NewExpenseInput = Pick<
  EmployeeExpense,
  'employeeId' | 'employeeName' | 'concept' | 'category' | 'amount' | 'date' | 'workOrderId'
>;

export async function createExpenseClaim(input: NewExpenseInput): Promise<EmployeeExpense> {
  const categoryId = await resolveCategoryId(input.category);
  const dto = await apiFetch<ExpenseClaimDTO>('/treasury/expense-claims/', {
    method: 'POST',
    body: {
      team_member: Number(input.employeeId),
      task: input.workOrderId ? Number(input.workOrderId) : undefined,
      date: input.date,
      concept: input.concept,
      amount: input.amount,
      category: categoryId,
    },
  });
  return fromExpenseClaimDTO(dto);
}
