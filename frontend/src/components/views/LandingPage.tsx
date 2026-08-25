import React, { useState } from 'react';
import {
  Bath,
  CookingPot,
  Star,
  Calendar,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  Send,
  Share2,
  Eye,
  Heart,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Plus,
  User,
  Building,
  HardHat,
  Lock,
  ThumbsUp,
  X,
  Check,
  LayoutGrid,
} from 'lucide-react';
import {
  SocialPost,
  WorkOrder,
  PublicReview,
  ProjectType,
  Client,
  CalendarEvent,
  WebsiteHeroConfig,
  WebsiteProject,
  CompanyData,
} from '../../types';
import { NewReviewInput } from '../../lib/showcase';
import { PublicAppointmentInput } from '../../lib/calendars';
import { ApiError } from '../../lib/api';

interface LandingPageProps {
  socialPosts: SocialPost[];
  reviews: PublicReview[];
  workOrders: WorkOrder[];
  heroConfig?: WebsiteHeroConfig;
  websiteProjects?: WebsiteProject[];
  companyData?: CompanyData;
  onBookAppointment: (appointmentData: PublicAppointmentInput) => Promise<void>;
  onAddReview: (review: NewReviewInput) => Promise<void>;
  onSwitchToAdmin: () => void;
  isAuthenticated?: boolean;
  onOpenAppsMenu?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  socialPosts,
  reviews,
  workOrders,
  heroConfig,
  websiteProjects,
  companyData,
  onBookAppointment,
  onAddReview,
  onSwitchToAdmin,
  isAuthenticated,
  onOpenAppsMenu,
}) => {
  const handleAdminButtonClick = isAuthenticated ? onOpenAppsMenu : onSwitchToAdmin;
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<'all' | ProjectType>('all');
  const [isBookingSuccessOpen, setIsBookingSuccessOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Form States for Booking
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('baño');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('10:00 - 12:00');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Form States for New Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [revName, setRevName] = useState('');
  const [revLocation, setRevLocation] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revType, setRevType] = useState<ProjectType>('baño');
  const [revComment, setRevComment] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [isReviewPendingOpen, setIsReviewPendingOpen] = useState(false);

  // Selected Project Detail Modal
  const [selectedProject, setSelectedProject] = useState<WorkOrder | null>(null);

  // Handle Booking Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;

    const [startTime, endTime] = preferredTime.split(' - ');
    const data: PublicAppointmentInput = {
      title: `Medición Gratuita: Reforma ${projectType}`,
      kind: 'medicion',
      customerName: clientName.trim(),
      customerEmail: clientEmail.trim(),
      customerPhone: clientPhone.trim(),
      address: clientAddress.trim() || `${clientCity} (sin dirección exacta)`,
      date: preferredDate,
      startTime,
      endTime,
      notes: bookingNotes.trim() || `Interés en reforma de ${projectType}.`,
    };

    setBookingError('');
    setIsBookingSubmitting(true);
    try {
      await onBookAppointment(data);
      setBookingDetails({
        name: data.customerName,
        phone: data.customerPhone,
        address: data.address,
        city: clientCity,
        projectType,
        preferredDate: data.date,
      });
      setIsBookingSuccessOpen(true);

      // Reset Form
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientCity('');
      setClientAddress('');
      setBookingNotes('');
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : 'No se pudo confirmar la cita.');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Handle Add Review Submit
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;

    setReviewError('');
    setIsSavingReview(true);
    try {
      await onAddReview({
        authorName: revName.trim(),
        authorLocation: revLocation.trim() || 'España',
        rating: revRating,
        date: new Date().toISOString().split('T')[0],
        projectType: revType,
        comment: revComment.trim(),
      });
      setIsReviewModalOpen(false);
      setIsReviewPendingOpen(true);
      setRevName('');
      setRevLocation('');
      setRevRating(5);
      setRevType('baño');
      setRevComment('');
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : 'No se pudo enviar tu opinión.');
    } finally {
      setIsSavingReview(false);
    }
  };

  // Derive active featured project for fallback
  const featuredProject =
    websiteProjects?.find((p) => p.isFeatured && p.visibleOnWebsite) ||
    websiteProjects?.find((p) => p.visibleOnWebsite) ||
    websiteProjects?.[0];

  // Promedio y total reales de reseñas verificadas (antes hardcodeado a 4.9 / 120+).
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Portfolio items filtered from websiteProjects or workOrders
  const visibleWebProjects = websiteProjects?.filter((p) => p.visibleOnWebsite) || [];

  const displayProjects = visibleWebProjects.length > 0
    ? visibleWebProjects.filter((p) => activeTab === 'all' || p.projectType === activeTab)
    : workOrders.filter((wo) => activeTab === 'all' || wo.projectType === activeTab);

  const activeCompanyName = companyData?.companyName || 'REMODELACIONES FVJ';
  const activeSlogan = companyData?.slogan || 'Empresa líder en remodelaciones integrales de baños y cocinas de lujo en España. Calidad, garantía y diseño 3D exclusivo.';
  const activePhone = companyData?.phone || '+34 611 223 344';
  const activeEmail = companyData?.email || 'info@remodelacionesfvj.es';
  const activeAddress = companyData?.address ? `${companyData.address}, ${companyData.city || 'España'}` : 'Av. Diagonal 450, Barcelona';
  const activeCif = companyData?.cif || 'B-987654321';
  const activeCopyright = `${activeCompanyName}. Todos los derechos reservados.`;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 font-sans selection:bg-[#580812] selection:text-white pb-16">
      {/* TOP FOLD: 100VH CONTAINER FOR TOP BANNER + (COVER VIDEO or DESTACADO) */}
      <div className="min-h-screen flex flex-col bg-[#F3F1EC] text-slate-900 relative overflow-hidden border-b border-stone-300">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#580812_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none z-0" />

        {/* 1. PUBLIC TOP HEADER (TOP BANNER) */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md text-slate-900 border-b border-stone-200 shadow-xs shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#580812] flex items-center justify-center font-black text-white shadow-md shadow-[#580812]/30">
                <Bath className="w-5 h-5 text-stone-100" />
              </div>
              <div>
                <div className="font-black text-xl tracking-wider text-[#0A192F]">
                  {activeCompanyName.toUpperCase()}
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold hidden sm:block">
                  Reformas de Lujo • Baños & Cocinas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#agendar"
                className="px-4 py-2 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-md shadow-[#580812]/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Solicitar Presupuesto</span>
              </a>

              {/* Switch to Admin ERP / Apps Menu */}
              <button
                onClick={handleAdminButtonClick}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-slate-700 hover:text-slate-900 text-xs font-bold border border-stone-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title={isAuthenticated ? 'Módulos de Gestión' : 'Acceso exclusivo administración'}
              >
                {isAuthenticated ? (
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{isAuthenticated ? 'Menú de Apps' : 'Acceso / Login'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* 2. COVER VIDEO HERO OR PROYECTO DESTACADO (CENTRALIZED IN 100VH) */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
          {heroConfig?.showVideo && heroConfig?.videoUrl ? (
            /* HERO COVER VIDEO PLAYER BANNER */
            <section className="w-full max-w-5xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl border border-stone-300 aspect-video md:aspect-21/9 bg-slate-950 flex flex-col justify-end p-6 sm:p-10">
              <video
                src={heroConfig.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

              <div className="relative z-10 space-y-3 text-white max-w-3xl">
                <span className="px-3 py-1 rounded-full bg-[#580812] text-white font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-stone-200" />
                  <span>Vídeo de Portada Oficial</span>
                </span>

                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                  {heroConfig.videoTitle || 'Diseño y Remodelación de Espacios Exclusivos'}
                </h2>

                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
                  {heroConfig.videoSubtitle || 'Transformamos tu baño y cocina con acabados de lujo, microcemento y piedra natural.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#agendar"
                    className="px-5 py-2.5 rounded-xl bg-[#580812] hover:bg-rose-900 text-white font-black text-xs shadow-xl transition-all flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Pedir Cita para Medición</span>
                  </a>
                  <a
                    href="#proyectos"
                    className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-2"
                  >
                    <span>Ver Proyectos</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </section>
          ) : (
            /* PROYECTO DESTACADO (FALLBACK WHEN NO VIDEO) */
            <section className="w-full max-w-5xl mx-auto">
              <div className="bg-white border border-stone-300 p-5 sm:p-7 rounded-3xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <span className="px-3 py-1 rounded-full bg-[#580812] text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-stone-200" />
                    <span>Proyecto Destacado del Mes</span>
                  </span>
                  <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                    {featuredProject?.location || 'Reforma Entregada'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 relative rounded-2xl overflow-hidden aspect-16/10 group border border-stone-200 shadow-inner">
                    <img
                      src={
                        featuredProject?.imageUrl ||
                        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={featuredProject?.title || 'Proyecto Destacado'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                      <h3 className="font-black text-white text-lg sm:text-xl">
                        {featuredProject?.title || 'Cocina Abierta con Isla Calacatta'}
                      </h3>
                      <p className="text-xs text-stone-200">
                        {featuredProject?.location} • {featuredProject?.executionTime || 'Ejecutado con garantía'}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-4">
                    <h3 className="text-xl sm:text-2xl font-black text-[#0A192F] leading-tight">
                      {featuredProject?.subtitle || featuredProject?.title || 'Transformación Integral'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {featuredProject?.description ||
                        'Transformación completa de espacio cerrado a concepto abierto. Revestimientos porcelánicos de gran formato, encimera imitación Calacatta con frentin iluminado LED y fontanería oculta de alta gama.'}
                    </p>

                    <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-300 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                          ✓
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Inspección Gratuita</span>
                          <span className="text-[10px] text-slate-500">Sin compromiso en tu vivienda</span>
                        </div>
                      </div>
                      <a
                        href="#agendar"
                        className="px-3.5 py-2 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-md shrink-0"
                      >
                        Solicitar Cita
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>


      {/* 3. HERO SECTION */}
      <section className="relative bg-[#FAF8F5] text-slate-900 overflow-hidden py-16 px-4 sm:px-6 lg:px-8 border-y border-stone-300">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#580812_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#580812] text-white text-xs font-bold uppercase tracking-wider shadow-md">
            <Sparkles className="w-4 h-4 text-stone-200" />
            <span>Estudio de Arquitectura e Interiorismo de Baños y Cocinas</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0A192F] leading-tight tracking-tight">
            Transformamos tu <span className="text-[#580812]">Baño y Cocina</span> en Espacios de Lujo y Confort
          </h1>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium">
            Especialistas en reformas integrales, microcemento continuo, islas de cocina en Mármol Calacatta y platos de ducha a medida con griferías empotradas oro cepillado. Visita técnica y presupuesto 3D sin compromiso.
          </p>

          {/* Action Buttons: Presupuesto & Login */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#agendar"
              className="px-6 py-3.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-sm shadow-xl shadow-[#580812]/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Solicitar Presupuesto</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={handleAdminButtonClick}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-slate-800 font-bold text-sm border border-stone-300 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {isAuthenticated ? (
                <LayoutGrid className="w-4 h-4 text-slate-500" />
              ) : (
                <Lock className="w-4 h-4 text-slate-500" />
              )}
              <span>{isAuthenticated ? 'Menú de Apps' : 'Acceso / Login'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE OF REAL WORKS / PORTFOLIO */}
      <section id="proyectos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#580812] flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>Galería de Trabajos Realizados</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0A192F] mt-1">
              Reformas Entregadas en Barcelona, Madrid y Valencia
            </h2>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Explora nuestros proyectos reales de baños de diseño, cocinas integradas y reformas integrales.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'baño', label: 'Baños' },
              { id: 'cocina', label: 'Cocinas' },
              { id: 'integral', label: 'Integrales' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#580812] text-white shadow-md shadow-[#580812]/30'
                    : 'bg-white text-slate-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProjects.map((project: any) => {
            const pTitle = project.title;
            const pImage = project.imageUrl || project.photos?.[0]?.url || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80';
            const pType = project.projectType || 'baño';
            const pAddress = project.location || project.address || 'Barcelona / Madrid';
            const pDesc = project.description || project.notes || 'Reforma ejecutada con acabados de alta gama e instalaciones garantizadas.';
            const pDate = project.executionTime || project.startDate || 'Obra Entregada';

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Image Banner */}
                  <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                    <img
                      src={pImage}
                      alt={pTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#0A192F]/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                        {pType === 'baño'
                          ? 'Baño de Lujo'
                          : pType === 'cocina'
                          ? 'Cocina Abierta'
                          : 'Reforma Integral'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Entregado</span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-black text-slate-900 text-base group-hover:text-[#580812] transition-colors leading-snug">
                      {pTitle}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{pAddress}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {pDesc}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{pDate}</span>
                      </span>

                      <span className="text-[#580812] font-bold group-hover:underline flex items-center gap-1">
                        Ver Ficha
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* 4. BOOKING / APPOINTMENT & ESTIMATE FORM */}
      <section id="agendar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#0A192F] rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#580812]/30 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#580812] text-stone-100 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-stone-300" />
                <span>Cita Gratuita en tu Domicilio</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Agenda tu Visita de Medición y Presupuesto 3D
              </h2>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
                Un técnico especialista acudirá a tu vivienda para tomar cotas exactas, evaluar la fontanería/electricidad y preparar tu presupuesto detallado con desglose de materiales sin ningún coste.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs text-stone-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <span>Visita técnica 100% gratuita y sin compromiso</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <span>Asesoramiento en elección de grifería, azulejos y distribución</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <span>Respuesta y propuesta económica en 24-48 horas</span>
                </div>
              </div>

              {/* Direct Contact Phone Box */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">¿Prefieres llamar directamente?</span>
                <div className="flex items-center gap-2 text-white font-black text-lg">
                  <Phone className="w-5 h-5 text-stone-300" />
                  <span>+34 900 123 456</span>
                </div>
                <span className="text-[11px] text-stone-400 block">Atención telefónica Lunes a Viernes de 08:30 a 19:30</span>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7 bg-white text-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <h3 className="font-black text-xl text-[#0A192F] mb-1">Solicitar Cita de Medición</h3>
              <p className="text-xs text-slate-500 mb-6">Completa tus datos y seleccionaremos un técnico para tu zona.</p>

              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nombre y Apellidos *</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej. María Elena Torres"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono Móvil *</label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+34 612 345 678"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="maria@ejemplo.com"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ciudad / Provincia *</label>
                    <input
                      type="text"
                      required
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                      placeholder="Ej. Barcelona"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dirección de la Vivienda</label>
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Ej. Calle Muntaner 120, 3º 1ª"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Reforma *</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value as ProjectType)}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                    >
                      <option value="baño">Baño Completo</option>
                      <option value="cocina">Cocina Abierta</option>
                      <option value="integral">Reforma Integral</option>
                      <option value="aseo">Aseo de Cortesía</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha Preferida</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Franja Horaria</label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                    >
                      <option value="09:00 - 11:00">09:00 - 11:00 (Mañana)</option>
                      <option value="11:00 - 13:00">11:00 - 13:00 (Mediodía)</option>
                      <option value="16:00 - 18:00">16:00 - 18:00 (Tarde)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Comentarios / Qué te gustaría reformar</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Ej. Querer cambiar bañera por ducha walk-in con nicho iluminado y mueble lavabo suspendido..."
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>

                {bookingError && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                    {bookingError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isBookingSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-black text-sm shadow-lg shadow-[#580812]/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>{isBookingSubmitting ? 'Enviando...' : 'Confirmar Solicitud de Cita Gratuita'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CUSTOMER RATINGS & REVIEWS SECTION */}
      <section id="opiniones" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#580812] flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Calificaciones y Experiencias de Clientes</span>
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#0A192F] mt-1">
                Lo Que Opinan Quienes Ya Han Reformado Con Nosotros
              </h2>
            </div>

            <div className="flex items-center gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200 shrink-0">
              <div className="text-center">
                <div className="text-3xl font-black text-[#0A192F]">
                  {reviews.length > 0 ? avgRating.toFixed(1) : '—'}
                </div>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 font-bold block mt-1">
                  {reviews.length > 0 ? `${reviews.length} Reseñas Verificadas` : 'Sé el primero en opinar'}
                </span>
              </div>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#580812]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Escribir Opinión</span>
              </button>
            </div>
          </div>

          {/* Review Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                        alt={rev.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-stone-300"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{rev.authorName}</h4>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {rev.authorLocation}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400 bg-white px-2 py-1 rounded-lg border border-stone-200 shadow-xs">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="px-2 py-0.5 rounded bg-stone-200/70 text-slate-700 font-bold uppercase text-[9px]">
                    Reforma {rev.projectType}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cliente Verificado • {rev.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SOCIAL MEDIA SHOWCASE (TIKTOK & INSTAGRAM) */}
      <section id="rrss" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#580812] flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              <span>Vídeos y Tendencias en Redes Sociales</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0A192F] mt-1">
              Síguenos en TikTok e Instagram @remodelaciones_fvj
            </h2>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Mira en vídeo los cambios antes y después y trucos para elegir materiales en tu reforma.
            </p>
          </div>

          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-slate-900 font-bold text-xs transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Ver Canal Oficial</span>
          </a>
        </div>

        {/* Social Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {socialPosts.map((post) => (
            <a
              key={post.id}
              href={post.postUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-9/16 max-h-72 overflow-hidden bg-slate-900">
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-between">
                    <span
                      className={`self-start px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        post.platform === 'tiktok'
                          ? 'bg-black text-white border border-stone-700'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      }`}
                    >
                      {post.platform}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-3 text-white text-[11px] font-bold">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-stone-300" />
                          {(post.views / 1000).toFixed(1)}k
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                          {(post.likes / 1000).toFixed(1)}k
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-stone-300" />
                          {post.commentsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug group-hover:text-[#580812]">
                    {post.title}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] font-medium text-slate-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 7. BOOKING SUCCESS MODAL */}
      {isBookingSuccessOpen && bookingDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-5 border border-stone-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-black">
              ✓
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">¡Cita Registrada Correctamente!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Gracias <strong>{bookingDetails.name}</strong>. Hemos programado tu solicitud de medición técnica para el día <strong>{bookingDetails.preferredDate}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left text-xs space-y-1.5">
              <div className="font-bold text-slate-900 border-b border-stone-200 pb-1.5">
                Resumen de la Solicitud
              </div>
              <div><strong>Tipo:</strong> Reforma de {bookingDetails.projectType}</div>
              <div><strong>Teléfono:</strong> {bookingDetails.phone}</div>
              <div><strong>Ubicación:</strong> {bookingDetails.address}, {bookingDetails.city}</div>
              <div><strong>Estado:</strong> Registrado en agenda de visitas</div>
            </div>

            <p className="text-[11px] text-slate-500">
              Un asesor técnico te llamará al teléfono facilitado para confirmar la hora exacta.
            </p>

            <button
              onClick={() => setIsBookingSuccessOpen(false)}
              className="w-full py-3 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 8. NEW REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-[#0A192F]">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-black text-lg">Escribir Opinión de tu Reforma</h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 text-stone-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tu Nombre / Familia *</label>
                  <input
                    type="text"
                    required
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="Ej. Roberto & Elena"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#580812]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ubicación / Ciudad</label>
                  <input
                    type="text"
                    value={revLocation}
                    onChange={(e) => setRevLocation(e.target.value)}
                    placeholder="Ej. Eixample, Barcelona"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#580812]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Reforma</label>
                  <select
                    value={revType}
                    onChange={(e) => setRevType(e.target.value as ProjectType)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#580812]"
                  >
                    <option value="baño">Baño Completo</option>
                    <option value="cocina">Cocina Abierta</option>
                    <option value="integral">Reforma Integral</option>
                    <option value="aseo">Aseo de Cortesía</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valoración (Estrellas)</label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRevRating(star)}
                        className="p-1 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= revRating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tu Comentario / Experiencia *</label>
                <textarea
                  rows={3}
                  required
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Escribe detalles de los plazos, atención del jefe de obra y acabados..."
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#580812]"
                />
              </div>

              {reviewError && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {reviewError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 font-bold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingReview}
                  className="px-5 py-2 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingReview ? 'Enviando...' : 'Publicar Opinión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8b. REVIEW PENDING CONFIRMATION MODAL */}
      {isReviewPendingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-stone-200 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-black text-lg text-slate-900">¡Gracias por tu opinión!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tu reseña fue enviada y se publicará en la web en cuanto nuestro equipo la revise.
            </p>
            <button
              onClick={() => setIsReviewPendingOpen(false)}
              className="w-full px-4 py-2 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* 9. PROJECT DETAIL MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#580812] tracking-wider block">Ficha de Proyecto Entregado</span>
                <h3 className="font-black text-xl text-slate-900">{selectedProject.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 text-stone-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-stone-100">
                <img
                  src={
                    selectedProject.photos?.[0]?.url ||
                    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Ubicación</span>
                  <span className="font-bold text-slate-900">{selectedProject.address}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Cliente</span>
                  <span className="font-bold text-slate-900">{selectedProject.clientName}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Descripción de la Reforma</h4>
                <p className="text-slate-600 leading-relaxed">
                  {selectedProject.notes || 'Reforma completa con materiales de alta calidad, aislamiento e instalaciones según normativa vigente.'}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <a
                  href="#agendar"
                  onClick={() => setSelectedProject(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold cursor-pointer shadow-md"
                >
                  Quiero Una Reforma Similar
                </a>

                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. PUBLIC FOOTER */}
      <footer className="mt-20 bg-[#0A192F] text-stone-300 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="font-black text-xl text-white">
              {activeCompanyName.toUpperCase()}
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {activeSlogan}
            </p>
            <div className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} {activeCopyright}
            </div>
            {activeCif && (
              <div className="text-[10px] text-slate-500 font-mono">
                CIF: {activeCif}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Servicios Principales</h4>
            <ul className="space-y-2 text-slate-400">
              <li>• Reformas de Baños de Lujo</li>
              <li>• Cambio de Bañera por Ducha Walk-in</li>
              <li>• Cocinas Abiertas con Isla Calacatta</li>
              <li>• Revestimientos en Microcemento Continuo</li>
              <li>• Proyectos 3D e Interiorismo</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Contacto Directo</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-300" />
                <span>{activePhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-300" />
                <span>{activeEmail}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-300" />
                <span>{activeAddress}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Acceso Interno Equipo</h4>
            <p className="text-slate-400 text-[11px]">
              Acceso restringido para jefes de obra, gestores y operarios de la empresa.
            </p>
            <button
              onClick={handleAdminButtonClick}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isAuthenticated ? (
                <LayoutGrid className="w-3.5 h-3.5 text-stone-300" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-stone-300" />
              )}
              <span>{isAuthenticated ? 'Menú de Apps' : 'Entrar al Portal ERP / Admin'}</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
