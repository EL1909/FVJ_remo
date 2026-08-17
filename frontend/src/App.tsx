import React, { useState } from 'react';
import { ViewType, Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';

// Views
import { DashboardView } from './components/views/DashboardView';
import { CalendarView } from './components/views/CalendarView';
import { ClientsView } from './components/views/ClientsView';
import { EstimatesView } from './components/views/EstimatesView';
import { WorkOrdersView } from './components/views/WorkOrdersView';
import { InvoicesView } from './components/views/InvoicesView';
import { MaterialsAndCostsView } from './components/views/MaterialsAndCostsView';
import { SocialGalleryView } from './components/views/SocialGalleryView';
import { EmployeesView } from './components/views/EmployeesView';
import { LandingPage } from './components/views/LandingPage';
import { WebsiteCmsView } from './components/views/WebsiteCmsView';

// Modals
import { QuickEventModal, QuickClientModal } from './components/modals/QuickModals';

// Mock Initial Data
import {
  initialClients,
  initialEstimates,
  initialWorkOrders,
  initialInvoices,
  initialMaterialPurchases,
  initialCalendarEvents,
  initialSocialPosts,
  initialEmployees,
  initialReviews,
  initialWebsiteHeroConfig,
  initialWebsiteProjects,
  initialCompanyData,
} from './data/mockData';

import {
  Client,
  Estimate,
  WorkOrder,
  Invoice,
  MaterialPurchase,
  CalendarEvent,
  SocialPost,
  WorkOrderPhoto,
  Employee,
  EmployeeAssignment,
  EmployeeExpense,
  PublicReview,
  ProjectType,
  WebsiteHeroConfig,
  WebsiteProject,
  CompanyData,
} from './types';

export default function App() {
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Main Datasets
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [estimates, setEstimates] = useState<Estimate[]>(initialEstimates);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>(initialMaterialPurchases);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialCalendarEvents);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(initialSocialPosts);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [reviews, setReviews] = useState<PublicReview[]>(initialReviews);

  // Website CMS State
  const [websiteHeroConfig, setWebsiteHeroConfig] = useState<WebsiteHeroConfig>(initialWebsiteHeroConfig);
  const [websiteProjects, setWebsiteProjects] = useState<WebsiteProject[]>(initialWebsiteProjects);
  const [companyData, setCompanyData] = useState<CompanyData>(initialCompanyData);

  // Quick Modal States
  const [isNewEstimateOpen, setIsNewEstimateOpen] = useState(false);
  const [isQuickEventOpen, setIsQuickEventOpen] = useState(false);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [isQuickPurchaseOpen, setIsQuickPurchaseOpen] = useState(false);

  // Handlers
  const handleSaveEstimate = (newEstimate: Estimate) => {
    setEstimates([newEstimate, ...estimates]);
  };

  const handleUpdateEstimateStatus = (id: string, status: Estimate['status']) => {
    setEstimates((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  };

  const handleSaveClient = (newClient: Client) => {
    setClients([newClient, ...clients]);
  };

  const handleSaveCalendarEvent = (newEvt: CalendarEvent) => {
    setCalendarEvents([newEvt, ...calendarEvents]);
  };

  const handleToggleEventComplete = (id: string) => {
    setCalendarEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  };

  const handleToggleWorkOrderStage = (orderId: string, stageId: string) => {
    setWorkOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedStages = order.stages.map((s) =>
            s.id === stageId ? { ...s, completed: !s.completed } : s
          );
          const completedCount = updatedStages.filter((s) => s.completed).length;
          const progressPercentage = Math.round((completedCount / updatedStages.length) * 100);
          const status = progressPercentage === 100 ? 'completado' : 'en_progreso';

          return {
            ...order,
            stages: updatedStages,
            progressPercentage,
            status,
          };
        }
        return order;
      })
    );
  };

  const handleAddWorkOrderPhoto = (orderId: string, photo: WorkOrderPhoto) => {
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, photos: [photo, ...order.photos] }
          : order
      )
    );
  };

  const handleMarkInvoicePaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'pagada', paidAmount: inv.total } : inv))
    );
  };

  const handleSaveInvoice = (newInv: Invoice) => {
    setInvoices([newInv, ...invoices]);
  };

  const handleSavePurchase = (newP: MaterialPurchase) => {
    setPurchases([newP, ...purchases]);
  };

  const handleUpdatePurchaseStatus = (id: string, status: MaterialPurchase['status']) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const handleAddSocialPost = (post: SocialPost) => {
    setSocialPosts([post, ...socialPosts]);
  };

  const handleConvertToWorkOrder = (estimate: Estimate) => {
    const newOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      orderNumber: `OT-2026-0${Math.floor(50 + Math.random() * 50)}`,
      estimateId: estimate.id,
      clientId: estimate.clientId,
      clientName: estimate.clientName,
      clientPhone: estimate.clientPhone,
      address: estimate.clientAddress,
      projectType: estimate.projectType,
      title: estimate.title,
      status: 'en_progreso',
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTeam: ['Carlos Ruiz (Jefe Obra)', 'Mateo V. (Fontanero)'],
      progressPercentage: 10,
      budgetTotal: estimate.total,
      actualCost: estimate.estimatedCost,
      stages: estimate.items.map((it, idx) => ({
        id: `st-${idx}`,
        name: it.category,
        completed: idx === 0,
        assignedWorker: 'Carlos Ruiz',
      })),
      photos: [
        {
          id: `ph-initial-${Date.now()}`,
          url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
          caption: 'Estado inicial antes de iniciar demolición',
          type: 'antes',
          uploadedAt: new Date().toISOString().split('T')[0],
        },
      ],
    };

    setWorkOrders([newOrder, ...workOrders]);
    setCurrentView('work_orders');
  };

  const handleConvertToInvoice = (estimate: Estimate) => {
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `FAC-2026-0${Math.floor(80 + Math.random() * 20)}`,
      estimateId: estimate.id,
      clientId: estimate.clientId,
      clientName: estimate.clientName,
      clientAddress: estimate.clientAddress,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pendiente',
      concept: `Anticipo 30% según Presupuesto ${estimate.estimateNumber} (${estimate.title})`,
      projectType: estimate.projectType,
      subtotal: (estimate.subtotal * 0.3),
      taxAmount: (estimate.taxAmount * 0.3),
      total: (estimate.total * 0.3),
      paidAmount: 0,
      milestones: [
        { description: '30% Anticipo Inicial', percentage: 30, amount: estimate.total * 0.3, isPaid: false, dueDate: 'Inmediata' },
        { description: '40% Avance Montaje', percentage: 40, amount: estimate.total * 0.4, isPaid: false, dueDate: 'En 15 días' },
        { description: '30% Fin de Obra', percentage: 30, amount: estimate.total * 0.3, isPaid: false, dueDate: 'En 30 días' },
      ],
    };

    setInvoices([newInv, ...invoices]);
    setCurrentView('invoices');
  };

  const handleSaveEmployee = (newEmp: Employee) => {
    setEmployees([newEmp, ...employees]);
  };

  const handleAddAssignment = (employeeId: string, assignment: EmployeeAssignment) => {
    setEmployees(
      employees.map((emp) => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            activeAssignments: [assignment, ...emp.activeAssignments],
          };
        }
        return emp;
      })
    );
  };

  const handleRemoveAssignment = (employeeId: string, assignmentId: string) => {
    setEmployees(
      employees.map((emp) => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            activeAssignments: emp.activeAssignments.filter((a) => a.id !== assignmentId),
          };
        }
        return emp;
      })
    );
  };

  const handleAddExpense = (expense: EmployeeExpense) => {
    setEmployees(
      employees.map((emp) => {
        if (emp.id === expense.employeeId) {
          return {
            ...emp,
            expenses: [expense, ...emp.expenses],
          };
        }
        return emp;
      })
    );
  };

  const handleBookAppointment = (data: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    projectType: ProjectType;
    preferredDate: string;
    preferredTime: string;
    notes: string;
  }) => {
    // Create new client in CRM
    const newClientId = `cli-${Date.now()}`;
    const newClient: Client = {
      id: newClientId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      createdAt: new Date().toISOString().split('T')[0],
      preferredContact: 'whatsapp',
      tags: ['Cita Web', `Interés ${data.projectType}`],
      notes: `Solicitud de medición técnica desde Landing Pública: ${data.notes}`,
    };

    // Create new calendar event
    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: `Medición Gratuita: Reforma ${data.projectType}`,
      clientName: data.name,
      clientPhone: data.phone,
      date: data.preferredDate,
      startTime: data.preferredTime.split(' - ')[0] || '10:00',
      endTime: data.preferredTime.split(' - ')[1] || '12:00',
      address: `${data.address}, ${data.city}`,
      type: 'medicion',
      completed: false,
      notes: data.notes || 'Interés en visita técnica y presupuesto 3D.',
    };

    setClients((prev) => [newClient, ...prev]);
    setCalendarEvents((prev) => [newEvt, ...prev]);
  };

  const handleAddReview = (newReview: PublicReview) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  // Website CMS Handlers
  const handleUpdateHeroConfig = (config: WebsiteHeroConfig) => {
    setWebsiteHeroConfig(config);
  };

  const handleAddWebsiteProject = (project: WebsiteProject) => {
    setWebsiteProjects((prev) => [project, ...prev]);
  };

  const handleUpdateWebsiteProject = (id: string, updated: Partial<WebsiteProject>) => {
    setWebsiteProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const handleDeleteWebsiteProject = (id: string) => {
    setWebsiteProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSetFeaturedWebsiteProject = (id: string) => {
    setWebsiteProjects((prev) =>
      prev.map((p) => ({ ...p, isFeatured: p.id === id }))
    );
  };

  const handleUpdateCompanyData = (data: CompanyData) => {
    setCompanyData(data);
  };

  if (viewMode === 'public') {
    return (
      <LandingPage
        socialPosts={socialPosts}
        reviews={reviews}
        workOrders={workOrders}
        heroConfig={websiteHeroConfig}
        websiteProjects={websiteProjects}
        companyData={companyData}
        onBookAppointment={handleBookAppointment}
        onAddReview={handleAddReview}
        onSwitchToAdmin={() => setViewMode('admin')}
      />
    );
  }

  const activeViewTitleMap: Record<ViewType, string> = {
    dashboard: 'Panel General',
    calendar: 'Agenda y Calendario de Mediciones',
    clients: 'Registro de Clientes (CRM)',
    employees: 'Personal, Asignaciones y Gastos',
    estimates: 'Gestión y Creación de Presupuestos',
    work_orders: 'Órdenes de Trabajo y Avance de Obras',
    invoices: 'Facturación y Certificaciones de Cobro',
    materials_costs: 'Compra de Materiales y Registro de Costos',
    social_gallery: 'TikTok & Instagram Showcase',
    website_cms: 'Gestión del Sitio Web (CMS)',
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans antialiased selection:bg-[#580812] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenNewEstimate={() => setCurrentView('estimates')}
        onOpenNewEvent={() => setIsQuickEventOpen(true)}
        onOpenNewPurchase={() => setCurrentView('materials_costs')}
        activeViewTitle={activeViewTitleMap[currentView]}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        onSwitchToPublic={() => setViewMode('public')}
      />


      <div className="flex">
        {/* Desktop Sidebar & Mobile Full-Screen Navigation Drawer */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          pendingEstimatesCount={estimates.filter((e) => e.status === 'enviado').length}
          activeWorkOrdersCount={workOrders.filter((w) => w.status === 'en_progreso').length}
          unpaidInvoicesCount={invoices.filter((i) => i.status === 'pendiente').length}
          isMenuOpen={isMenuOpen}
          onCloseMenu={() => setIsMenuOpen(false)}
        />

        {/* Main Content View */}
        <main className="flex-1 p-4 lg:p-8 min-w-0 overflow-x-hidden bg-[#FAF8F5]">
          {currentView === 'dashboard' && (
            <DashboardView
              estimates={estimates}
              workOrders={workOrders}
              invoices={invoices}
              calendarEvents={calendarEvents}
              socialPosts={socialPosts}
              clients={clients}
              onNavigate={setCurrentView}
              onOpenNewEstimate={() => setCurrentView('estimates')}
              onOpenNewEvent={() => setIsQuickEventOpen(true)}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView
              events={calendarEvents}
              onToggleEventComplete={handleToggleEventComplete}
              onOpenNewEvent={() => setIsQuickEventOpen(true)}
            />
          )}

          {currentView === 'clients' && (
            <ClientsView
              clients={clients}
              estimates={estimates}
              workOrders={workOrders}
              invoices={invoices}
              onOpenNewClient={() => setIsQuickClientOpen(true)}
              onSelectClientForEstimate={(cli) => {
                setCurrentView('estimates');
              }}
            />
          )}

          {currentView === 'employees' && (
            <EmployeesView
              employees={employees}
              workOrders={workOrders}
              calendarEvents={calendarEvents}
              onSaveEmployee={handleSaveEmployee}
              onAddAssignment={handleAddAssignment}
              onRemoveAssignment={handleRemoveAssignment}
              onAddExpense={handleAddExpense}
            />
          )}

          {currentView === 'estimates' && (
            <EstimatesView
              estimates={estimates}
              clients={clients}
              onSaveEstimate={handleSaveEstimate}
              onUpdateEstimateStatus={handleUpdateEstimateStatus}
              onConvertToWorkOrder={handleConvertToWorkOrder}
              onConvertToInvoice={handleConvertToInvoice}
            />
          )}

          {currentView === 'work_orders' && (
            <WorkOrdersView
              workOrders={workOrders}
              onToggleStage={handleToggleWorkOrderStage}
              onAddPhoto={handleAddWorkOrderPhoto}
            />
          )}

          {currentView === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              clients={clients}
              onMarkInvoicePaid={handleMarkInvoicePaid}
              onSaveInvoice={handleSaveInvoice}
            />
          )}

          {currentView === 'materials_costs' && (
            <MaterialsAndCostsView
              purchases={purchases}
              workOrders={workOrders}
              onSavePurchase={handleSavePurchase}
              onUpdatePurchaseStatus={handleUpdatePurchaseStatus}
            />
          )}

          {currentView === 'social_gallery' && (
            <SocialGalleryView
              socialPosts={socialPosts}
              workOrders={workOrders}
              onAddSocialPost={handleAddSocialPost}
            />
          )}

          {currentView === 'website_cms' && (
            <WebsiteCmsView
              heroConfig={websiteHeroConfig}
              onUpdateHeroConfig={handleUpdateHeroConfig}
              projects={websiteProjects}
              onAddProject={handleAddWebsiteProject}
              onUpdateProject={handleUpdateWebsiteProject}
              onDeleteProject={handleDeleteWebsiteProject}
              onSetFeaturedProject={handleSetFeaturedWebsiteProject}
              companyData={companyData}
              onUpdateCompanyData={handleUpdateCompanyData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <MobileNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      {/* Global Quick Modals */}
      <QuickEventModal
        isOpen={isQuickEventOpen}
        onClose={() => setIsQuickEventOpen(false)}
        clients={clients}
        onSaveEvent={handleSaveCalendarEvent}
      />

      <QuickClientModal
        isOpen={isQuickClientOpen}
        onClose={() => setIsQuickClientOpen(false)}
        onSaveClient={handleSaveClient}
      />
    </div>
  );
}
