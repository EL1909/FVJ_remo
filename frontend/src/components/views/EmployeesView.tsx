import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  Briefcase,
  DollarSign,
  Receipt,
  MapPin,
  Calendar,
  HardHat,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Trash2,
  FileText,
  X,
  PlusCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Employee,
  EmployeeRole,
  EmployeeExpense,
  EmployeeAssignment,
  WorkOrder,
  CalendarEvent,
  ExpenseCategory,
} from '../../types';

interface EmployeesViewProps {
  employees: Employee[];
  workOrders: WorkOrder[];
  calendarEvents: CalendarEvent[];
  onSaveEmployee: (employee: Employee) => void;
  onAddAssignment: (employeeId: string, assignment: EmployeeAssignment) => void;
  onRemoveAssignment: (employeeId: string, assignmentId: string) => void;
  onAddExpense: (expense: EmployeeExpense) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  workOrders,
  calendarEvents,
  onSaveEmployee,
  onAddAssignment,
  onRemoveAssignment,
  onAddExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Modal States
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Preselected IDs for modals
  const [selectedEmpForAssignment, setSelectedEmpForAssignment] = useState<string>('');
  const [selectedEmpForExpense, setSelectedEmpForExpense] = useState<string>('');

  // Form states - New Employee
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<EmployeeRole>('fontanero');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpSalaryType, setNewEmpSalaryType] = useState<'mensual' | 'por_hora' | 'por_obra'>('mensual');
  const [newEmpSalaryAmount, setNewEmpSalaryAmount] = useState<number>(2000);
  const [newEmpNotes, setNewEmpNotes] = useState('');

  // Form states - Assignment
  const [assignType, setAssignType] = useState<'obra' | 'visita'>('obra');
  const [assignTargetId, setAssignTargetId] = useState<string>('');
  const [assignRoleInTask, setAssignRoleInTask] = useState('');

  // Form states - Expense
  const [expConcept, setExpConcept] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('desplazamiento_gasolina');
  const [expAmount, setExpAmount] = useState<number>(30);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expWorkOrderId, setExpWorkOrderId] = useState<string>('');

  // Filtered list
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Global calculations
  const totalEmployees = employees.length;
  const activeEmployeesCount = employees.filter((e) => e.status === 'activo').length;
  const totalMonthlySalaries = employees.reduce((sum, e) => {
    return sum + (e.salaryType === 'mensual' ? e.salaryAmount : e.salaryAmount * 160);
  }, 0);

  const allExpenses = employees.flatMap((e) => e.expenses);
  const totalExpensesAmount = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const totalActiveAssignments = employees.reduce(
    (sum, e) => sum + e.activeAssignments.length,
    0
  );

  const handleCreateEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpName.trim(),
      role: newEmpRole,
      phone: newEmpPhone.trim() || '+34 600 000 000',
      email: newEmpEmail.trim() || `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@remodelacionesfvj.es`,
      salaryType: newEmpSalaryType,
      salaryAmount: Number(newEmpSalaryAmount) || 2000,
      status: 'activo',
      startDate: new Date().toISOString().split('T')[0],
      notes: newEmpNotes.trim(),
      activeAssignments: [],
      expenses: [],
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
    };

    onSaveEmployee(newEmp);
    setIsAddEmployeeOpen(false);
    resetNewEmpForm();
  };

  const resetNewEmpForm = () => {
    setNewEmpName('');
    setNewEmpRole('fontanero');
    setNewEmpPhone('');
    setNewEmpEmail('');
    setNewEmpSalaryAmount(2000);
    setNewEmpNotes('');
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForAssignment || !assignTargetId) return;

    let targetTitle = '';
    let targetAddress = '';

    if (assignType === 'obra') {
      const wo = workOrders.find((w) => w.id === assignTargetId);
      if (wo) {
        targetTitle = wo.title;
        targetAddress = wo.address;
      }
    } else {
      const evt = calendarEvents.find((c) => c.id === assignTargetId);
      if (evt) {
        targetTitle = evt.title;
        targetAddress = evt.address;
      }
    }

    const newAsg: EmployeeAssignment = {
      id: `asg-${Date.now()}`,
      employeeId: selectedEmpForAssignment,
      type: assignType,
      targetId: assignTargetId,
      targetTitle: targetTitle || 'Tarea Asignada',
      targetAddress: targetAddress || 'Ubicación de cliente',
      roleInTask: assignRoleInTask.trim() || (assignType === 'obra' ? 'Operario de Obra' : 'Visita Técnica'),
      startDate: new Date().toISOString().split('T')[0],
      status: 'activa',
    };

    onAddAssignment(selectedEmpForAssignment, newAsg);
    setIsAssignModalOpen(false);
    setAssignTargetId('');
    setAssignRoleInTask('');
  };

  const handleCreateExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForExpense || !expConcept.trim()) return;

    const emp = employees.find((e) => e.id === selectedEmpForExpense);

    let woTitle = '';
    if (expWorkOrderId) {
      const wo = workOrders.find((w) => w.id === expWorkOrderId);
      if (wo) woTitle = wo.title;
    }

    const newExp: EmployeeExpense = {
      id: `exp-${Date.now()}`,
      employeeId: selectedEmpForExpense,
      employeeName: emp?.name || 'Empleado',
      concept: expConcept.trim(),
      category: expCategory,
      amount: Number(expAmount) || 0,
      date: expDate,
      status: 'pendiente',
      workOrderId: expWorkOrderId || undefined,
      workOrderTitle: woTitle || undefined,
    };

    onAddExpense(newExp);
    setIsExpenseModalOpen(false);
    setExpConcept('');
    setExpAmount(30);
    setExpWorkOrderId('');
  };

  const getRoleBadgeLabel = (role: EmployeeRole) => {
    switch (role) {
      case 'jefe_obra':
        return { label: 'Jefe de Obra', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
      case 'fontanero':
        return { label: 'Fontanero Oficial', color: 'bg-blue-100 text-blue-900 border-blue-200' };
      case 'alicatador':
        return { label: 'Alicatador / Solador', color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'electricista':
        return { label: 'Electricista', color: 'bg-yellow-100 text-yellow-900 border-yellow-200' };
      case 'montador_muebles':
        return { label: 'Montador Muebles Cocina', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'tecnico_medicion':
        return { label: 'Técnico Medición & 3D', color: 'bg-purple-100 text-purple-900 border-purple-200' };
      case 'pintor_acabados':
        return { label: 'Pintor & Acabados', color: 'bg-stone-200 text-stone-800 border-stone-300' };
      default:
        return { label: 'Operario', color: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'desplazamiento_gasolina':
        return 'Gasolina / Kilometraje';
      case 'dieta_comida':
        return 'Dieta Comida';
      case 'material_urgente':
        return 'Material Urgente Obra';
      case 'herramientas':
        return 'Herramientas';
      case 'parking_peaje':
        return 'Parking / Peaje';
      default:
        return 'Gasto Varios';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner - Navy & Dark Wine Red */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0A192F] text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-stone-100 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-stone-300" />
            <span>Recursos Humanos & Gestión de Operarios</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-stone-100">
            Personal, Asignaciones y Gastos
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            Asigna jefes de obra, fontaneros y alicatadores a reformas activas o visitas técnicas, y gestiona sueldos y gastos reportados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            onClick={() => setIsAddEmployeeOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Empleado</span>
          </button>

          <button
            onClick={() => {
              if (employees.length > 0) {
                setSelectedEmpForAssignment(employees[0].id);
              }
              setIsAssignModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-stone-100 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-stone-300" />
            <span>Asignar Obra/Visita</span>
          </button>

          <button
            onClick={() => {
              if (employees.length > 0) {
                setSelectedEmpForExpense(employees[0].id);
              }
              setIsExpenseModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-stone-100 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-stone-300" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plantilla Operarios</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A192F] mt-2">
            {activeEmployeesCount} <span className="text-xs font-semibold text-slate-500">/ {totalEmployees} activos</span>
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Jefes de obra, fontaneros y técnicos
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Salarial / Mes</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A192F] mt-2">
            {totalMonthlySalaries.toLocaleString('es-ES')} €
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Presupuesto estimado nómina base
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gastos Reportados</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#580812] flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A192F] mt-2">
            {totalExpensesAmount.toLocaleString('es-ES')} €
          </div>
          <div className="text-xs font-bold text-[#580812] mt-1">
            {allExpenses.length} recibos de dietas, gasolina y material
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tareas Asignadas</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A192F] mt-2">
            {totalActiveAssignments} <span className="text-xs font-semibold text-slate-500">en curso</span>
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            En obras de baños, cocinas o visitas
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email..."
            className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-stone-400 focus:outline-none focus:border-[#580812] focus:ring-1 focus:ring-[#580812]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#580812]"
          >
            <option value="all">Todas las especialidades</option>
            <option value="jefe_obra">Jefe de Obra</option>
            <option value="fontanero">Fontanero</option>
            <option value="alicatador">Alicatador</option>
            <option value="electricista">Electricista</option>
            <option value="montador_muebles">Montador de Muebles</option>
            <option value="tecnico_medicion">Técnico Medición</option>
            <option value="pintor_acabados">Pintor & Acabados</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#580812]"
          >
            <option value="all">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="de_baja">De Baja</option>
            <option value="vacaciones">Vacaciones</option>
          </select>
        </div>
      </div>

      {/* Employee Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => {
          const roleInfo = getRoleBadgeLabel(emp.role);
          const isExpanded = expandedEmployeeId === emp.id;
          const totalEmpExpenses = emp.expenses.reduce((sum, exp) => sum + exp.amount, 0);

          return (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Employee Card Header */}
                <div className="p-5 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                        alt={emp.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shadow-sm shrink-0"
                      />
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{emp.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        emp.status === 'activo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : emp.status === 'de_baja'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  </div>
                </div>

                {/* Salary & Metrics Banner */}
                <div className="p-4 bg-[#FAF8F5] border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sueldo / Tarifa</span>
                    <span className="text-sm font-black text-[#0A192F]">
                      {emp.salaryAmount.toLocaleString('es-ES')} €{' '}
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({emp.salaryType})
                      </span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gastos Reportados</span>
                    <span className="text-sm font-black text-[#580812]">
                      {totalEmpExpenses.toLocaleString('es-ES')} €
                    </span>
                  </div>
                </div>

                {/* Active Assignments Section */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#580812]" />
                      <span>Obras y Visitas Asignadas ({emp.activeAssignments.length})</span>
                    </h4>

                    <button
                      onClick={() => {
                        setSelectedEmpForAssignment(emp.id);
                        setIsAssignModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#580812] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Asignar</span>
                    </button>
                  </div>

                  {emp.activeAssignments.length === 0 ? (
                    <div className="p-3 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-400">
                      Sin obras o visitas asignadas actualmente
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {emp.activeAssignments.map((asg) => (
                        <div
                          key={asg.id}
                          className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-1 relative group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                asg.type === 'obra' ? 'bg-indigo-100 text-indigo-900' : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {asg.type === 'obra' ? 'Obra Activa' : 'Visita Medición'}
                            </span>

                            <button
                              onClick={() => onRemoveAssignment(emp.id, asg.id)}
                              className="text-stone-300 hover:text-rose-600 transition-colors p-0.5 cursor-pointer opacity-80 group-hover:opacity-100"
                              title="Finalizar/Retirar asignación"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            {asg.targetTitle}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{asg.targetAddress}</span>
                          </div>

                          <div className="text-[10px] font-semibold text-slate-600 bg-stone-100 px-2 py-0.5 rounded inline-block">
                            Rol: {asg.roleInTask}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable Reported Expenses Section */}
              <div className="border-t border-stone-100 p-4 bg-stone-50/60">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                    className="text-xs font-bold text-slate-700 hover:text-[#580812] flex items-center gap-1 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#580812]" />
                    <span>Ver Gastos ({emp.expenses.length})</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEmpForExpense(emp.id);
                      setIsExpenseModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#580812] hover:underline cursor-pointer"
                  >
                    + Registrar Gasto
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-200 space-y-2">
                    {emp.expenses.length === 0 ? (
                      <div className="text-center text-xs text-stone-400 py-2">
                        No hay gastos reportados para este operario
                      </div>
                    ) : (
                      emp.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs space-y-1 shadow-xs"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900">{exp.concept}</span>
                            <span className="text-[#580812] font-black">{exp.amount} €</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>{getCategoryLabel(exp.category)} • {exp.date}</span>
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded uppercase ${
                                exp.status === 'aprobado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : exp.status === 'reembolsado'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {exp.status}
                            </span>
                          </div>

                          {exp.workOrderTitle && (
                            <div className="text-[10px] text-slate-600 bg-stone-50 p-1 rounded font-medium">
                              Vinc. Obra: {exp.workOrderTitle}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Register New Employee */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-stone-200 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-[#0A192F]">
                <UserCheck className="w-5 h-5 text-[#580812]" />
                <h3 className="font-black text-lg">Registrar Nuevo Empleado</h3>
              </div>
              <button
                onClick={() => setIsAddEmployeeOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployeeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="Ej. Roberto Sánchez"
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Especialidad / Cargo *</label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value as EmployeeRole)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  >
                    <option value="jefe_obra">Jefe de Obra</option>
                    <option value="fontanero">Fontanero Oficial 1ª</option>
                    <option value="alicatador">Alicatador / Solador</option>
                    <option value="electricista">Electricista</option>
                    <option value="montador_muebles">Montador de Cocinas</option>
                    <option value="tecnico_medicion">Técnico de Mediciones</option>
                    <option value="pintor_acabados">Pintor & Acabados</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    placeholder="+34 600 112 233"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  placeholder="roberto.sanchez@remodelacionesfvj.es"
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modalidad de Pago</label>
                  <select
                    value={newEmpSalaryType}
                    onChange={(e) => setNewEmpSalaryType(e.target.value as any)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  >
                    <option value="mensual">Sueldo Mensual (€/mes)</option>
                    <option value="por_hora">Tarifa por Hora (€/h)</option>
                    <option value="por_obra">Por Ajuste de Obra (€/obra)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Importe Base (€) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newEmpSalaryAmount}
                    onChange={(e) => setNewEmpSalaryAmount(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones o Certificaciones</label>
                <textarea
                  rows={2}
                  value={newEmpNotes}
                  onChange={(e) => setNewEmpNotes(e.target.value)}
                  placeholder="Ej. Carnet de conducir B, curso PRL 20h instalaciones de agua y prevención..."
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold cursor-pointer shadow-md shadow-[#580812]/30"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Employee to Work Order or Visit */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-stone-200 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-[#0A192F]">
                <Briefcase className="w-5 h-5 text-[#580812]" />
                <h3 className="font-black text-lg">Asignar Obra o Visita a Empleado</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seleccionar Empleado *</label>
                <select
                  value={selectedEmpForAssignment}
                  onChange={(e) => setSelectedEmpForAssignment(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({getRoleBadgeLabel(emp.role).label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Tarea *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignType('obra');
                      setAssignTargetId('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer ${
                      assignType === 'obra'
                        ? 'bg-[#580812] text-white border-[#580812]'
                        : 'bg-[#FAF8F5] text-slate-700 border-stone-300'
                    }`}
                  >
                    Obra en Ejecución
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignType('visita');
                      setAssignTargetId('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer ${
                      assignType === 'visita'
                        ? 'bg-[#580812] text-white border-[#580812]'
                        : 'bg-[#FAF8F5] text-slate-700 border-stone-300'
                    }`}
                  >
                    Visita de Medición
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {assignType === 'obra' ? 'Seleccionar Obra Activa *' : 'Seleccionar Visita Programada *'}
                </label>

                {assignType === 'obra' ? (
                  <select
                    required
                    value={assignTargetId}
                    onChange={(e) => setAssignTargetId(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  >
                    <option value="">-- Elige una obra --</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.orderNumber} - {wo.title} ({wo.address})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    required
                    value={assignTargetId}
                    onChange={(e) => setAssignTargetId(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  >
                    <option value="">-- Elige una visita en agenda --</option>
                    {calendarEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.date} {evt.startTime} - {evt.title} ({evt.address})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol / Tarea Específica</label>
                <input
                  type="text"
                  value={assignRoleInTask}
                  onChange={(e) => setAssignRoleInTask(e.target.value)}
                  placeholder="Ej. Alicatado pared frontal, montaje de mampara, toma de presiones..."
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!assignTargetId}
                  className="px-5 py-2 rounded-xl bg-[#580812] hover:bg-[#42050D] disabled:opacity-50 text-white font-bold cursor-pointer shadow-md shadow-[#580812]/30"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Report Expense for Employee */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-stone-200 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-[#0A192F]">
                <Receipt className="w-5 h-5 text-[#580812]" />
                <h3 className="font-black text-lg">Registrar Gasto de Personal</h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Empleado Que Reporta *</label>
                <select
                  value={selectedEmpForExpense}
                  onChange={(e) => setSelectedEmpForExpense(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({getRoleBadgeLabel(emp.role).label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Concepto del Gasto *</label>
                <input
                  type="text"
                  required
                  value={expConcept}
                  onChange={(e) => setExpConcept(e.target.value)}
                  placeholder="Ej. Repostaje gasolina furgoneta o ticket de parking"
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría *</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  >
                    <option value="desplazamiento_gasolina">Gasolina / Desplazamiento</option>
                    <option value="dieta_comida">Dieta / Comida</option>
                    <option value="material_urgente">Material Urgente de Obra</option>
                    <option value="herramientas">Herramientas & Discos</option>
                    <option value="parking_peaje">Parking / Peaje</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Importe (€) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0}
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha del Ticket *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vincular a Obra (Opcional)</label>
                  <select
                    value={expWorkOrderId}
                    onChange={(e) => setExpWorkOrderId(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  >
                    <option value="">-- Sin obra asociada --</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.orderNumber} - {wo.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold cursor-pointer shadow-md shadow-[#580812]/30"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
