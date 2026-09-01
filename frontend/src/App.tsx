import React, { useEffect, useState } from 'react';
import { ViewType, Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';

// Views
import { DashboardView } from './components/views/DashboardView';
import { CalendarView } from './components/views/CalendarView';
import { ClientsView } from './components/views/ClientsView';
import { EstimatesView, EstimatePrefill } from './components/views/EstimatesView';
import { WorkOrdersView } from './components/views/WorkOrdersView';
import { InvoicesView } from './components/views/InvoicesView';
import { MaterialsAndCostsView } from './components/views/MaterialsAndCostsView';
import { SocialGalleryView } from './components/views/SocialGalleryView';
import { EmployeesView } from './components/views/EmployeesView';
import { LandingPage } from './components/views/LandingPage';
import { WebsiteCmsView } from './components/views/WebsiteCmsView';
import { CapabilitiesPresentation } from './components/views/CapabilitiesPresentation';

// Modals
import { QuickEventModal, QuickClientModal } from './components/modals/QuickModals';
import { LoginModal } from './components/auth/LoginModal';

// Auth
import { getAccessToken, fetchProfile, logout as apiLogout, Profile } from './lib/api';

// Notificaciones
import { AppNotification } from './lib/notifications';

// CRM
import { fetchClients, createClient, addClientNote, NewClientInput } from './lib/crm';

// Calendario
import {
  fetchCalendarEvents,
  createCalendarEvent,
  toggleEventComplete,
  confirmAppointment,
  addCalendarEventNote,
  addCalendarEventPhoto,
  updateCalendarEventTeamMember,
  NewEventInput,
  bookPublicAppointment,
  PublicAppointmentInput,
} from './lib/calendars';

// Personal
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  addEmployeeNote,
  createExpenseClaim,
  NewEmployeeInput,
  UpdateEmployeeInput,
  NewExpenseInput,
} from './lib/personal';

// Presupuestos
import { fetchEstimates, createEstimate, updateEstimate, updateEstimateStatus, addEstimateNote, NewEstimateInput } from './lib/billing';

// Órdenes de Trabajo
import {
  fetchWorkOrders,
  createWorkOrder,
  toggleWorkOrderStage,
  addWorkOrderPhoto,
  addWorkOrderNote,
  updateWorkOrderTeam,
} from './lib/fieldwork';

// Facturas
import { fetchInvoices, createInvoice, markInvoicePaid, addInvoiceNote, NewInvoiceInput } from './lib/treasury';

// Materiales y Costos
import {
  fetchMaterialPurchases,
  createMaterialPurchase,
  updateMaterialPurchaseStatus,
  payMaterialPurchase,
  NewMaterialPurchaseInput,
} from './lib/materials';

// Social / Showcase
import {
  fetchSocialPosts,
  createSocialPost,
  NewSocialPostInput,
  fetchPublicReviews,
  submitReview,
  NewReviewInput,
  fetchPublicSocialPosts,
  fetchPublicWebsiteProjects,
  fetchWebsiteProjects,
  createWebsiteProject,
  updateWebsiteProject,
  deleteWebsiteProject,
  setFeaturedWebsiteProject,
  addWebsiteProjectPhoto,
  deleteWebsiteProjectPhoto,
  WebsiteProjectInput,
} from './lib/showcase';

// Website CMS (datos de empresa + hero de la landing)
import {
  fetchBusinessProfile,
  fetchPublicBusinessProfile,
  updateCompanyData,
  updateHeroConfig,
  CompanyDataInput,
  WebsiteHeroConfigInput,
} from './lib/business';

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
  EmployeeExpense,
  PublicReview,
  ProjectType,
  WebsiteHeroConfig,
  WebsiteProject,
  CompanyData,
} from './types';

const emptyHeroConfig: WebsiteHeroConfig = {
  videoUrl: '',
  videoTitle: '',
  videoSubtitle: '',
  showVideo: false,
  autoPlay: true,
  muted: true,
};

const emptyCompanyData: CompanyData = {
  companyName: '',
  slogan: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  cif: '',
  schedule: '',
  socialInstagram: '',
  socialTikTok: '',
};

export default function App() {
  // Página de capacidades: enlace del footer público, abre en pestaña nueva
  // vía #capacidades — no usa react-router, así que se resuelve a mano.
  const [showCapabilities, setShowCapabilities] = useState(
    () => window.location.hash === '#capacidades'
  );
  useEffect(() => {
    const onHashChange = () => setShowCapabilities(window.location.hash === '#capacidades');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [focusEventId, setFocusEventId] = useState<string | null>(null);
  const [focusEstimateId, setFocusEstimateId] = useState<string | null>(null);
  const [focusClientId, setFocusClientId] = useState<string | null>(null);

  // Service worker de Web Push (evz_core.push): sin VAPID configurada en el
  // backend, el bell sigue funcionando igual y esto queda inerte.
  //
  // Ruta relativa a BASE_URL, no '/push-sw.js' a secas: en producción la
  // app cuelga de /fvj/ (ver vite build --base=/fvj/ en package.json), y un
  // service worker registrado en la raíz del dominio no puede controlar
  // páginas fuera de su propio scope.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}push-sw.js`).catch(() => {});
    }
  }, []);

  // "Instalar App" (Panel General): Chrome/Edge/Android avisan con este
  // evento cuando la PWA es instalable — puede disparar en cualquier
  // momento, no solo al entrar al Dashboard, por eso se captura acá arriba.
  // Safari/iOS nunca lo dispara (no tiene esta API); ahí el botón muestra
  // instrucciones manuales en vez de intentar instalar.
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    const view = notification.data?.view;
    if (view === 'calendar' && notification.data?.appointment_id != null) {
      setCurrentView('calendar');
      setFocusEventId(String(notification.data.appointment_id));
    } else if (view === 'estimates' && notification.data?.quotation_id != null) {
      setCurrentView('estimates');
      setFocusEstimateId(String(notification.data.quotation_id));
    }
  };

  // Auth
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleRequestAdminAccess = async () => {
    if (getAccessToken()) {
      try {
        const profile = await fetchProfile();
        setCurrentUser(profile);
        setViewMode('admin');
        return;
      } catch {
        // Token inválido o expirado: cae al login de abajo.
      }
    }
    setIsLoginOpen(true);
  };

  const handleOpenAppsMenuFromPublic = async () => {
    await handleRequestAdminAccess();
    setIsMenuOpen(true);
  };

  const handleLoginSuccess = (profile: Profile) => {
    setCurrentUser(profile);
    setIsLoginOpen(false);
    setViewMode('admin');
  };

  const handleLogout = () => {
    apiLogout();
    setCurrentUser(null);
    setViewMode('public');
  };

  // Main Datasets
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchClients()
      .then(setClients)
      .catch((err) => console.error('No se pudieron cargar los clientes.', err));
  }, [viewMode]);

  const [estimates, setEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchEstimates()
      .then(setEstimates)
      .catch((err) => console.error('No se pudieron cargar los presupuestos.', err));
  }, [viewMode]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchWorkOrders()
      .then(setWorkOrders)
      .catch((err) => console.error('No se pudieron cargar las órdenes de trabajo.', err));
  }, [viewMode]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchInvoices()
      .then(setInvoices)
      .catch((err) => console.error('No se pudieron cargar las facturas.', err));
  }, [viewMode]);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchMaterialPurchases()
      .then(setPurchases)
      .catch((err) => console.error('No se pudieron cargar las compras de material.', err));
  }, [viewMode]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchCalendarEvents()
      .then(setCalendarEvents)
      .catch((err) => console.error('No se pudo cargar la agenda.', err));
  }, [viewMode]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchSocialPosts()
      .then(setSocialPosts)
      .catch((err) => console.error('No se pudieron cargar las publicaciones.', err));
  }, [viewMode]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchEmployees()
      .then(setEmployees)
      .catch((err) => console.error('No se pudo cargar el personal.', err));
  }, [viewMode]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    if (viewMode !== 'public') return;
    fetchPublicReviews()
      .then(setReviews)
      .catch((err) => console.error('No se pudieron cargar las reseñas.', err));
  }, [viewMode]);

  // Website CMS State (panel admin — todos los proyectos, editable)
  const [websiteHeroConfig, setWebsiteHeroConfig] = useState<WebsiteHeroConfig>(emptyHeroConfig);
  const [websiteProjects, setWebsiteProjects] = useState<WebsiteProject[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData>(emptyCompanyData);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchBusinessProfile()
      .then(({ companyData, heroConfig }) => {
        setCompanyData(companyData);
        setWebsiteHeroConfig(heroConfig);
      })
      .catch((err) => console.error('No se pudieron cargar los datos de la empresa.', err));
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== 'admin') return;
    fetchWebsiteProjects()
      .then(setWebsiteProjects)
      .catch((err) => console.error('No se pudieron cargar los proyectos del sitio.', err));
  }, [viewMode]);

  // Landing pública — mismos datos, vía endpoints AllowAny, independientes del login.
  const [publicHeroConfig, setPublicHeroConfig] = useState<WebsiteHeroConfig>(emptyHeroConfig);
  const [publicCompanyData, setPublicCompanyData] = useState<CompanyData>(emptyCompanyData);
  const [publicWebsiteProjects, setPublicWebsiteProjects] = useState<WebsiteProject[]>([]);
  const [publicSocialPosts, setPublicSocialPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    if (viewMode !== 'public') return;
    fetchPublicBusinessProfile()
      .then(({ companyData, heroConfig }) => {
        setPublicCompanyData(companyData);
        setPublicHeroConfig(heroConfig);
      })
      .catch((err) => console.error('No se pudo cargar la identidad pública de la empresa.', err));
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== 'public') return;
    fetchPublicWebsiteProjects()
      .then(setPublicWebsiteProjects)
      .catch((err) => console.error('No se pudo cargar el portafolio público.', err));
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== 'public') return;
    fetchPublicSocialPosts()
      .then(setPublicSocialPosts)
      .catch((err) => console.error('No se pudieron cargar las publicaciones públicas.', err));
  }, [viewMode]);

  // Quick Modal States
  const [isNewEstimateOpen, setIsNewEstimateOpen] = useState(false);
  const [isQuickEventOpen, setIsQuickEventOpen] = useState(false);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [isQuickPurchaseOpen, setIsQuickPurchaseOpen] = useState(false);

  // Handlers
  const handleSaveEstimate = async (data: NewEstimateInput) => {
    const newEstimate = await createEstimate(data);
    setEstimates((prev) => [newEstimate, ...prev]);
  };

  const handleUpdateEstimate = async (id: string, data: NewEstimateInput) => {
    const updated = await updateEstimate(id, data);
    setEstimates((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const handleUpdateEstimateStatus = async (id: string, status: Estimate['status']) => {
    const updated = await updateEstimateStatus(id, status);
    setEstimates((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const handleAddEstimateNote = async (id: string, text: string) => {
    const updated = await addEstimateNote(id, text);
    setEstimates((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const handleSaveClient = async (data: NewClientInput) => {
    const newClient = await createClient(data);
    setClients((prev) => [newClient, ...prev]);
  };

  const handleAddClientNote = async (id: string, text: string) => {
    const updated = await addClientNote(id, text);
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleSaveCalendarEvent = async (data: NewEventInput) => {
    const newEvt = await createCalendarEvent(data);
    setCalendarEvents((prev) => [newEvt, ...prev]);
  };

  const handleAddCalendarEventNote = async (id: string, text: string) => {
    const updated = await addCalendarEventNote(id, text);
    setCalendarEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const handleAddCalendarEventPhoto = async (id: string, file: File, caption: string) => {
    const photo = await addCalendarEventPhoto(id, file, caption);
    setCalendarEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, photos: [photo, ...e.photos] } : e))
    );
  };

  // "Convertir a Presupuesto" desde una visita/medición — precarga los datos
  // del cliente en el generador y, al crear, vincula la cita real
  // (Quotation.appointment) para poder copiar sus fotos como "antes" a la
  // Orden de Trabajo más adelante.
  const [estimatePrefill, setEstimatePrefill] = useState<EstimatePrefill | null>(null);

  const handleConvertEventToEstimate = (event: CalendarEvent) => {
    setEstimatePrefill({
      clientName: event.clientName || '',
      clientPhone: event.clientPhone || '',
      clientEmail: event.clientEmail,
      clientAddress: event.address,
      appointmentId: event.id,
    });
    setCurrentView('estimates');
  };

  const handleToggleEventComplete = async (id: string) => {
    const current = calendarEvents.find((e) => e.id === id);
    if (!current) return;
    await toggleEventComplete(id, current.completed);
    setCalendarEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  };

  const handleConfirmCalendarEvent = async (id: string, teamMemberId: string) => {
    const updated = await confirmAppointment(id, teamMemberId);
    setCalendarEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const handleToggleWorkOrderStage = async (orderId: string, stageId: string) => {
    const order = workOrders.find((o) => o.id === orderId);
    const stage = order?.stages.find((s) => s.id === stageId);
    if (!order || !stage) return;

    await toggleWorkOrderStage(stageId, stage.completed);

    // El backend recalcula progress_percentage y puede cerrar la Task
    // automáticamente si todas las etapas quedan completas — se refleja
    // la misma lógica acá para no esperar un refetch completo.
    const updatedStages = order.stages.map((s) =>
      s.id === stageId ? { ...s, completed: !s.completed } : s
    );
    const completedCount = updatedStages.filter((s) => s.completed).length;
    const progressPercentage = Math.round((completedCount / updatedStages.length) * 100);
    const status = progressPercentage === 100 ? 'completado' : 'en_progreso';

    setWorkOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, stages: updatedStages, progressPercentage, status } : o))
    );
  };

  const handleAddWorkOrderPhoto = async (
    orderId: string,
    file: File,
    caption: string,
    type: WorkOrderPhoto['type']
  ) => {
    const photo = await addWorkOrderPhoto(orderId, file, caption, type);
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, photos: [photo, ...order.photos] }
          : order
      )
    );
  };

  const handleAddWorkOrderNote = async (orderId: string, text: string) => {
    const updated = await addWorkOrderNote(orderId, text);
    setWorkOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  const handleUpdateWorkOrderTeam = async (orderId: string, teamMemberIds: string[]) => {
    const updated = await updateWorkOrderTeam(orderId, teamMemberIds);
    setWorkOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  const handleGoToClient = (clientId: string) => {
    if (!clientId) return;
    setCurrentView('clients');
    setFocusClientId(clientId);
  };

  const handleMarkInvoicePaid = async (id: string) => {
    const updated = await markInvoicePaid(id);
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
  };

  const handleSaveInvoice = async (data: NewInvoiceInput) => {
    const newInv = await createInvoice(data);
    setInvoices((prev) => [newInv, ...prev]);
  };

  const handleAddInvoiceNote = async (id: string, text: string) => {
    const updated = await addInvoiceNote(id, text);
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
  };

  const handleSavePurchase = async (data: NewMaterialPurchaseInput) => {
    const newP = await createMaterialPurchase(data);
    setPurchases((prev) => [newP, ...prev]);
  };

  const handleUpdatePurchaseStatus = async (id: string, status: MaterialPurchase['status']) => {
    const updated = await updateMaterialPurchaseStatus(id, status);
    setPurchases((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handlePayMaterialPurchase = async (id: string) => {
    const updated = await payMaterialPurchase(id);
    setPurchases((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleAddSocialPost = async (data: NewSocialPostInput) => {
    const post = await createSocialPost(data);
    setSocialPosts((prev) => [post, ...prev]);
  };

  const handleConvertToWorkOrder = async (estimate: Estimate) => {
    if (!estimate.orderId) {
      console.error('Este presupuesto todavía no tiene una orden asociada (debe estar aprobado).');
      return;
    }
    const newOrder = await createWorkOrder({
      orderId: estimate.orderId,
      title: estimate.title,
      kind: estimate.projectType,
      siteAddress: estimate.clientAddress,
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      stageNames: estimate.items.map((it) => it.category),
    });

    setWorkOrders((prev) => [newOrder, ...prev]);
    setCurrentView('work_orders');
  };

  const handleConvertToInvoice = async (estimate: Estimate) => {
    if (!estimate.orderId) {
      console.error('Este presupuesto todavía no tiene una orden asociada (debe estar aprobado).');
      return;
    }
    // Genera el primer hito (30% anticipo, según los términos estándar del
    // presupuesto) — los otros dos (avance/fin de obra) se agregan luego a
    // mano desde "Nueva Factura", ya con una obra real que elegir.
    const newInv = await createInvoice({
      orderId: estimate.orderId,
      description: `Anticipo 30% según Presupuesto ${estimate.estimateNumber} (${estimate.title})`,
      amount: estimate.subtotal * 0.3,
      taxRate: estimate.taxRate,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    setInvoices((prev) => [newInv, ...prev]);
    setCurrentView('invoices');
  };

  const handleSaveEmployee = async (data: NewEmployeeInput) => {
    const newEmp = await createEmployee(data);
    setEmployees((prev) => [newEmp, ...prev]);
  };

  // fromTeamMemberDTO no trae expenses (se combina aparte en fetchEmployees,
  // cruzando team-members con expense-claims) — hay que conservarlo del
  // registro que ya estaba en memoria en vez de pisarlo con un array vacío.
  const handleUpdateEmployee = async (id: string, data: UpdateEmployeeInput) => {
    const updated = await updateEmployee(id, data);
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...updated, expenses: emp.expenses } : emp))
    );
  };

  const handleAddEmployeeNote = async (id: string, text: string) => {
    const updated = await addEmployeeNote(id, text);
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? { ...emp, notes: updated.notes } : emp)));
  };

  // Asigna/quita un empleado de una obra (Task.team, M2M real) o de una
  // visita (Appointment.team_member, FK real) — antes esto solo mutaba
  // estado local sin llamar al backend, por eso la asignación desaparecía
  // al recargar. Ahora escribe donde WorkOrdersView/CalendarView también
  // leen, así que ambas vistas quedan siempre consistentes.
  const handleAssignEmployee = async (
    employeeId: string,
    type: 'obra' | 'visita',
    targetId: string
  ) => {
    if (type === 'obra') {
      const wo = workOrders.find((w) => w.id === targetId);
      if (!wo || wo.assignedTeamIds.includes(employeeId)) return;
      await handleUpdateWorkOrderTeam(targetId, [...wo.assignedTeamIds, employeeId]);
    } else {
      const updated = await updateCalendarEventTeamMember(targetId, employeeId);
      setCalendarEvents((prev) => prev.map((e) => (e.id === targetId ? updated : e)));
    }
  };

  const handleUnassignEmployee = async (
    employeeId: string,
    type: 'obra' | 'visita',
    targetId: string
  ) => {
    if (type === 'obra') {
      const wo = workOrders.find((w) => w.id === targetId);
      if (!wo) return;
      await handleUpdateWorkOrderTeam(targetId, wo.assignedTeamIds.filter((id) => id !== employeeId));
    } else {
      const updated = await updateCalendarEventTeamMember(targetId, null);
      setCalendarEvents((prev) => prev.map((e) => (e.id === targetId ? updated : e)));
    }
  };

  const handleAddExpense = async (data: NewExpenseInput) => {
    const expense = await createExpenseClaim(data);
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

  // Reserva pública real (evz_calendars.Appointment, AllowAny). No crea
  // Client en el CRM (solo el equipo puede) — el equipo la ve en su agenda
  // con los datos del visitante y puede convertirla en Client si quiere.
  const handleBookAppointment = async (data: PublicAppointmentInput) => {
    await bookPublicAppointment(data);
  };

  // La reseña queda pendiente de verificación por el equipo (verified=False
  // en el backend) — no se agrega a `reviews` de inmediato, ya que esa lista
  // solo refleja reseñas ya verificadas.
  const handleAddReview = async (data: NewReviewInput) => {
    await submitReview(data);
  };

  // Website CMS Handlers
  const handleUpdateHeroConfig = async (input: WebsiteHeroConfigInput) => {
    const updated = await updateHeroConfig(input);
    setWebsiteHeroConfig(updated);
  };

  const handleAddWebsiteProject = async (input: WebsiteProjectInput) => {
    const project = await createWebsiteProject(input);
    setWebsiteProjects((prev) => [project, ...prev]);
  };

  const handleUpdateWebsiteProject = async (id: string, input: Partial<WebsiteProjectInput>) => {
    const updated = await updateWebsiteProject(id, input);
    setWebsiteProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDeleteWebsiteProject = async (id: string) => {
    await deleteWebsiteProject(id);
    setWebsiteProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSetFeaturedWebsiteProject = async (id: string) => {
    await setFeaturedWebsiteProject(id);
    setWebsiteProjects((prev) =>
      prev.map((p) => ({ ...p, isFeatured: p.id === id }))
    );
  };

  const handleAddProjectPhoto = async (projectId: string, file: File, caption: string) => {
    const photo = await addWebsiteProjectPhoto(projectId, file, caption);
    setWebsiteProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, photos: [...p.photos, photo] } : p))
    );
  };

  const handleDeleteProjectPhoto = async (projectId: string, photoId: string) => {
    await deleteWebsiteProjectPhoto(photoId);
    setWebsiteProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, photos: p.photos.filter((ph) => ph.id !== photoId) } : p
      )
    );
  };

  const handleUpdateCompanyData = async (data: CompanyDataInput) => {
    const updated = await updateCompanyData(data);
    setCompanyData(updated);
  };

  if (showCapabilities) {
    return <CapabilitiesPresentation companyData={publicCompanyData} />;
  }

  if (viewMode === 'public') {
    return (
      <>
        <LandingPage
          socialPosts={publicSocialPosts}
          reviews={reviews}
          workOrders={workOrders}
          heroConfig={publicHeroConfig}
          websiteProjects={publicWebsiteProjects}
          companyData={publicCompanyData}
          onBookAppointment={handleBookAppointment}
          onAddReview={handleAddReview}
          onSwitchToAdmin={handleRequestAdminAccess}
          isAuthenticated={!!currentUser || !!getAccessToken()}
          onOpenAppsMenu={handleOpenAppsMenuFromPublic}
        />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
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
        currentUser={currentUser}
        onNotificationClick={handleNotificationClick}
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
          onLogout={handleLogout}
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
              currentUser={currentUser}
              installPrompt={installPrompt}
              onInstallApp={handleInstallApp}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView
              events={calendarEvents}
              employees={employees}
              onToggleEventComplete={handleToggleEventComplete}
              onOpenNewEvent={() => setIsQuickEventOpen(true)}
              onAddCalendarEventNote={handleAddCalendarEventNote}
              onAddCalendarEventPhoto={handleAddCalendarEventPhoto}
              onConvertToEstimate={handleConvertEventToEstimate}
              onConfirmEvent={handleConfirmCalendarEvent}
              focusEventId={focusEventId}
              onFocusEventConsumed={() => setFocusEventId(null)}
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
              onAddClientNote={handleAddClientNote}
              focusClientId={focusClientId}
              onFocusClientConsumed={() => setFocusClientId(null)}
            />
          )}

          {currentView === 'employees' && (
            <EmployeesView
              employees={employees}
              workOrders={workOrders}
              calendarEvents={calendarEvents}
              onSaveEmployee={handleSaveEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onAddEmployeeNote={handleAddEmployeeNote}
              onAssignEmployee={handleAssignEmployee}
              onUnassignEmployee={handleUnassignEmployee}
              onAddExpense={handleAddExpense}
            />
          )}

          {currentView === 'estimates' && (
            <EstimatesView
              estimates={estimates}
              clients={clients}
              onSaveEstimate={handleSaveEstimate}
              onUpdateEstimate={handleUpdateEstimate}
              onUpdateEstimateStatus={handleUpdateEstimateStatus}
              onConvertToWorkOrder={handleConvertToWorkOrder}
              onConvertToInvoice={handleConvertToInvoice}
              onAddEstimateNote={handleAddEstimateNote}
              prefill={estimatePrefill}
              onPrefillConsumed={() => setEstimatePrefill(null)}
              focusEstimateId={focusEstimateId}
              onFocusEstimateConsumed={() => setFocusEstimateId(null)}
            />
          )}

          {currentView === 'work_orders' && (
            <WorkOrdersView
              workOrders={workOrders}
              employees={employees}
              onToggleStage={handleToggleWorkOrderStage}
              onAddPhoto={handleAddWorkOrderPhoto}
              onAddWorkOrderNote={handleAddWorkOrderNote}
              onUpdateTeam={handleUpdateWorkOrderTeam}
              onSelectClient={handleGoToClient}
            />
          )}

          {currentView === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              workOrders={workOrders}
              onMarkInvoicePaid={handleMarkInvoicePaid}
              onSaveInvoice={handleSaveInvoice}
              onAddInvoiceNote={handleAddInvoiceNote}
            />
          )}

          {currentView === 'materials_costs' && (
            <MaterialsAndCostsView
              purchases={purchases}
              workOrders={workOrders}
              onSavePurchase={handleSavePurchase}
              onUpdatePurchaseStatus={handleUpdatePurchaseStatus}
              onPayPurchase={handlePayMaterialPurchase}
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
              workOrders={workOrders}
              onAddProject={handleAddWebsiteProject}
              onUpdateProject={handleUpdateWebsiteProject}
              onDeleteProject={handleDeleteWebsiteProject}
              onSetFeaturedProject={handleSetFeaturedWebsiteProject}
              onAddProjectPhoto={handleAddProjectPhoto}
              onDeleteProjectPhoto={handleDeleteProjectPhoto}
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
