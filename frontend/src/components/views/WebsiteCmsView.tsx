import React, { useState } from 'react';
import {
  Globe,
  Video,
  FolderPlus,
  Building2,
  Upload,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Plus,
  Eye,
  EyeOff,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
  Info,
  VideoOff,
} from 'lucide-react';
import {
  WebsiteHeroConfig,
  WebsiteProject,
  CompanyData,
  ProjectType,
  WorkOrder,
} from '../../types';
import { WebsiteProjectInput } from '../../lib/showcase';
import { CompanyDataInput } from '../../lib/business';
import { ApiError } from '../../lib/api';

interface WebsiteCmsViewProps {
  heroConfig: WebsiteHeroConfig;
  onUpdateHeroConfig: (config: WebsiteHeroConfig) => Promise<void>;
  projects: WebsiteProject[];
  workOrders: WorkOrder[];
  onAddProject: (input: WebsiteProjectInput) => Promise<void>;
  onUpdateProject: (id: string, input: Partial<WebsiteProjectInput>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onSetFeaturedProject: (id: string) => Promise<void>;
  companyData: CompanyData;
  onUpdateCompanyData: (data: CompanyDataInput) => Promise<void>;
}

export const WebsiteCmsView: React.FC<WebsiteCmsViewProps> = ({
  heroConfig,
  onUpdateHeroConfig,
  projects,
  workOrders,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onSetFeaturedProject,
  companyData,
  onUpdateCompanyData,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'projects' | 'company'>('video');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video Form State
  const [videoUrlInput, setVideoUrlInput] = useState(heroConfig.videoUrl || '');
  const [videoTitleInput, setVideoTitleInput] = useState(heroConfig.videoTitle || '');
  const [videoSubtitleInput, setVideoSubtitleInput] = useState(heroConfig.videoSubtitle || '');
  const [showVideoToggle, setShowVideoToggle] = useState(heroConfig.showVideo);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');

  // Project Modal / Editing State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projTitle, setProjTitle] = useState('');
  const [projSubtitle, setProjSubtitle] = useState('');
  const [projLocation, setProjLocation] = useState('');
  const [projExecutionTime, setProjExecutionTime] = useState('');
  const [projType, setProjType] = useState<ProjectType>('baño');
  const [projImageFile, setProjImageFile] = useState<File | null>(null);
  const [projImagePreview, setProjImagePreview] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projIsFeatured, setProjIsFeatured] = useState(false);
  const [projVisible, setProjVisible] = useState(true);
  const [projWorkOrderId, setProjWorkOrderId] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectError, setProjectError] = useState('');

  // Company Form State
  const [companyForm, setCompanyForm] = useState<CompanyData>({ ...companyData });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Video Handlers
  const handleSaveVideoHero = async () => {
    setVideoError('');
    setIsSavingVideo(true);
    try {
      await onUpdateHeroConfig({
        videoUrl: videoUrlInput.trim(),
        videoTitle: videoTitleInput.trim(),
        videoSubtitle: videoSubtitleInput.trim(),
        showVideo: showVideoToggle,
        autoPlay: true,
        muted: true,
      });
      showToast('¡Configuración de vídeo de portada guardada correctamente!');
    } catch (err) {
      setVideoError(err instanceof ApiError ? err.message : 'No se pudo guardar el vídeo de portada.');
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleClearVideo = async () => {
    setVideoError('');
    setIsSavingVideo(true);
    try {
      await onUpdateHeroConfig({
        ...heroConfig,
        videoUrl: '',
        showVideo: false,
      });
      setVideoUrlInput('');
      setShowVideoToggle(false);
      showToast('Vídeo eliminado. La web mostrará ahora el Proyecto Destacado.');
    } catch (err) {
      setVideoError(err instanceof ApiError ? err.message : 'No se pudo eliminar el vídeo.');
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Project Handlers
  const handleOpenAddProject = () => {
    setEditingProjectId(null);
    setProjTitle('');
    setProjSubtitle('');
    setProjLocation('');
    setProjExecutionTime('');
    setProjType('baño');
    setProjImageFile(null);
    setProjImagePreview('');
    setProjDescription('');
    setProjIsFeatured(false);
    setProjVisible(true);
    setProjWorkOrderId('');
    setProjectError('');
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: WebsiteProject) => {
    setEditingProjectId(proj.id);
    setProjTitle(proj.title);
    setProjSubtitle(proj.subtitle);
    setProjLocation(proj.location);
    setProjExecutionTime(proj.executionTime);
    setProjType(proj.projectType);
    setProjImageFile(null);
    setProjImagePreview(proj.imageUrl);
    setProjDescription(proj.description);
    setProjIsFeatured(proj.isFeatured);
    setProjVisible(proj.visibleOnWebsite);
    setProjWorkOrderId(proj.workOrderId || '');
    setProjectError('');
    setIsProjectModalOpen(true);
  };

  const handleProjectImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProjImageFile(file);
      setProjImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProjectModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    setProjectError('');
    setIsSavingProject(true);
    try {
      const input: WebsiteProjectInput = {
        title: projTitle.trim(),
        subtitle: projSubtitle.trim(),
        location: projLocation.trim(),
        executionTime: projExecutionTime.trim(),
        projectType: projType,
        description: projDescription.trim(),
        visibleOnWebsite: projVisible,
        workOrderId: projWorkOrderId || undefined,
        ...(projImageFile ? { image: projImageFile } : {}),
      };

      if (editingProjectId) {
        await onUpdateProject(editingProjectId, input);
        if (projIsFeatured) await onSetFeaturedProject(editingProjectId);
        showToast('Proyecto actualizado con éxito');
      } else {
        await onAddProject(input);
        showToast('Nuevo proyecto añadido a la landing web');
      }
      setIsProjectModalOpen(false);
    } catch (err) {
      setProjectError(err instanceof ApiError ? err.message : 'No se pudo guardar el proyecto.');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleToggleVisible = async (proj: WebsiteProject) => {
    try {
      await onUpdateProject(proj.id, { visibleOnWebsite: !proj.visibleOnWebsite });
    } catch (err) {
      console.error('No se pudo cambiar la visibilidad del proyecto.', err);
    }
  };

  const handleDeleteProject = async (proj: WebsiteProject) => {
    if (!confirm(`¿Eliminar proyecto "${proj.title}" de la web?`)) return;
    try {
      await onDeleteProject(proj.id);
      showToast('Proyecto eliminado.');
    } catch (err) {
      console.error('No se pudo eliminar el proyecto.', err);
    }
  };

  const handleSetFeatured = async (proj: WebsiteProject) => {
    try {
      await onSetFeaturedProject(proj.id);
    } catch (err) {
      console.error('No se pudo destacar el proyecto.', err);
    }
  };

  // Company Data Save Handler
  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoFile(file);
  };

  const handleSaveCompanyData = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError('');
    setIsSavingCompany(true);
    try {
      await onUpdateCompanyData({
        companyName: companyForm.companyName,
        slogan: companyForm.slogan,
        phone: companyForm.phone,
        email: companyForm.email,
        address: companyForm.address,
        city: companyForm.city,
        cif: companyForm.cif,
        schedule: companyForm.schedule,
        socialInstagram: companyForm.socialInstagram,
        socialTikTok: companyForm.socialTikTok,
        ...(logoFile ? { logo: logoFile } : {}),
      });
      setLogoFile(null);
      showToast('Datos de la empresa actualizados. Visibles inmediatamente en el Footer.');
    } catch (err) {
      setCompanyError(err instanceof ApiError ? err.message : 'No se pudieron guardar los datos de la empresa.');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const featuredProject = projects.find((p) => p.isFeatured) || projects[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0A192F] text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#580812]/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-stone-200 text-xs font-semibold mb-3">
              <Globe className="w-4 h-4 text-rose-400" />
              <span>CMS & Gestión del Website Público</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Control de Vídeo, Proyectos y Footer
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Administra el vídeo de portada hero, el portafolio de obras publicadas y los datos corporativos del pie de página.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-[#071324] border border-white/10 rounded-xl p-3 flex items-center gap-3">
              {heroConfig.showVideo && heroConfig.videoUrl ? (
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-amber-500" />
              )}
              <div className="text-xs">
                <div className="text-stone-400">Estado Portada</div>
                <div className="font-bold text-white">
                  {heroConfig.showVideo && heroConfig.videoUrl
                    ? 'Vídeo Activo'
                    : 'Proyecto Destacado (Fallback)'}
                </div>
              </div>
            </div>

            <div className="bg-[#071324] border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#580812] flex items-center justify-center font-bold text-white text-xs">
                {projects.filter((p) => p.visibleOnWebsite).length}
              </div>
              <div className="text-xs">
                <div className="text-stone-400">Proyectos en Web</div>
                <div className="font-bold text-white">
                  {projects.filter((p) => p.visibleOnWebsite).length} de {projects.length} Visibles
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-1">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'video'
              ? 'bg-[#580812] text-white shadow-md shadow-[#580812]/30'
              : 'bg-white text-slate-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>1. Vídeo de Portada (Hero)</span>
          {heroConfig.showVideo && heroConfig.videoUrl && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-[#580812] text-white shadow-md shadow-[#580812]/30'
              : 'bg-white text-slate-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>2. Proyectos del Website ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'company'
              ? 'bg-[#580812] text-white shadow-md shadow-[#580812]/30'
              : 'bg-white text-slate-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>3. Datos Empresa (Footer)</span>
        </button>
      </div>

      {/* TAB 1: COVER VIDEO */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#580812]" />
                  Vídeo de Portada de la Landing
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Mostrar Vídeo:</label>
                <input
                  type="checkbox"
                  checked={showVideoToggle}
                  onChange={(e) => setShowVideoToggle(e.target.checked)}
                  className="w-5 h-5 accent-[#580812] rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Fallback info box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold">Comportamiento del Fallback:</p>
                <p className="mt-0.5">
                  Si no se especifica ningún URL de vídeo o si desactivas la opción, la portada de la web mostrará automáticamente la tarjeta del <strong>"Proyecto Destacado"</strong> con su fotografía, especificaciones de obra y botón de cita previa.
                </p>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                URL del Vídeo (alojado externamente: CDN, YouTube, Vimeo...)
              </label>
              <input
                type="url"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://tuservidor.com/videos/hero_portada.mp4"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#580812] font-mono"
              />
            </div>

            {/* Title / Subtitle Overlays */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Título Superpuesto
                </label>
                <input
                  type="text"
                  value={videoTitleInput}
                  onChange={(e) => setVideoTitleInput(e.target.value)}
                  placeholder="Diseño y Remodelación de Espacios Exclusivos"
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Subtítulo Superpuesto
                </label>
                <input
                  type="text"
                  value={videoSubtitleInput}
                  onChange={(e) => setVideoSubtitleInput(e.target.value)}
                  placeholder="Especialistas en reformas integrales de baños y cocinas"
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>
            </div>

            {videoError && (
              <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {videoError}
              </p>
            )}

            {/* Submit & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleClearVideo}
                disabled={isSavingVideo}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <VideoOff className="w-4 h-4" />
                <span>Eliminar Vídeo (Usar Proyecto Destacado)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveVideoHero}
                disabled={isSavingVideo}
                className="px-6 py-2.5 bg-[#580812] hover:bg-rose-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-[#580812]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingVideo ? 'Guardando...' : 'Guardar Cambios de Vídeo'}</span>
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center justify-between">
              <span>Simulación Vista Previa Web</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                Live Preview
              </span>
            </h3>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#0A192F] shadow-inner border border-stone-200">
              {showVideoToggle && videoUrlInput ? (
                <>
                  <video
                    src={videoUrlInput}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 flex flex-col justify-end p-4 text-white">
                    <span className="px-2 py-0.5 bg-[#580812] text-[10px] font-extrabold uppercase rounded self-start mb-1">
                      Vídeo Portada Hero
                    </span>
                    <h4 className="text-sm font-black leading-snug">
                      {videoTitleInput || 'Diseño y Remodelación Exclusiva'}
                    </h4>
                    <p className="text-[10px] text-stone-200 mt-0.5 line-clamp-2">
                      {videoSubtitleInput || 'Transformamos tu espacio.'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full relative flex flex-col justify-end p-4 text-white">
                  <img
                    src={featuredProject?.imageUrl}
                    alt="Proyecto Destacado Fallback"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded mb-1">
                      <Star className="w-3 h-3 fill-slate-950" />
                      <span>Proyecto Destacado (Fallback Activo)</span>
                    </div>
                    <h4 className="text-sm font-black">{featuredProject?.title}</h4>
                    <p className="text-[10px] text-amber-200 font-semibold">{featuredProject?.subtitle}</p>
                    <p className="text-[10px] text-stone-300 mt-1 line-clamp-2">
                      {featuredProject?.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl text-xs text-slate-600 space-y-1 border border-stone-200">
              <div className="font-bold text-slate-900">Estado de Carga:</div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Modo Portada:</span>
                <span className="font-bold text-slate-900">
                  {showVideoToggle && videoUrlInput ? 'Vídeo HTML5 Player' : 'Tarjeta Proyecto Destacado'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Origen Vídeo:</span>
                <span className="font-mono text-slate-700 truncate max-w-[200px]">
                  {videoUrlInput || 'Ninguno (Modo Fallback)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS CATALOG MANAGEMENT */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#580812]" />
                Catálogo de Proyectos para la Web
              </h3>
            </div>

            <button
              onClick={handleOpenAddProject}
              className="px-5 py-2.5 bg-[#580812] hover:bg-rose-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-[#580812]/30 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Nuevo Proyecto</span>
            </button>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                  proj.isFeatured
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                    : 'border-stone-200 shadow-sm'
                }`}
              >
                <div className="relative aspect-video bg-slate-900">
                  {proj.imageUrl ? (
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs font-bold">
                      Sin fotografía
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 bg-[#0A192F]/90 text-white text-[10px] font-extrabold uppercase rounded-lg backdrop-blur-sm">
                      {proj.projectType}
                    </span>
                    {proj.isFeatured && (
                      <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-lg flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>Destacado (Portada)</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleToggleVisible(proj)}
                      title={proj.visibleOnWebsite ? 'Ocultar en Web' : 'Hacer Visible en Web'}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow backdrop-blur-sm transition-all cursor-pointer ${
                        proj.visibleOnWebsite
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-slate-800/90 text-stone-300'
                      }`}
                    >
                      {proj.visibleOnWebsite ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Oculto</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-[11px] text-stone-300 font-semibold">{proj.location} • {proj.executionTime}</div>
                    <h4 className="text-sm font-black leading-snug line-clamp-1">{proj.title}</h4>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <button
                      onClick={() => handleSetFeatured(proj)}
                      disabled={proj.isFeatured}
                      className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        proj.isFeatured
                          ? 'bg-amber-100 text-amber-900 cursor-default'
                          : 'bg-stone-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${proj.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span>{proj.isFeatured ? 'Es Destacado' : 'Fijar Destacado'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditProject(proj)}
                        className="p-1.5 text-slate-600 hover:text-[#580812] hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Editar Proyecto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteProject(proj)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Eliminar Proyecto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY DATA (FOOTER & CONTACT) */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveCompanyData} className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#580812]" />
                Datos Corporativos de la Empresa (Footer)
              </h3>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">Logo</label>
              <div className="flex items-center gap-3">
                {(logoFile || companyData.logoUrl) && (
                  <img
                    src={logoFile ? URL.createObjectURL(logoFile) : companyData.logoUrl}
                    alt="Logo actual"
                    className="w-12 h-12 rounded-lg object-cover border border-stone-300"
                  />
                )}
                <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoFile ? logoFile.name : 'Subir Logo'}</span>
                  <input type="file" accept="image/*" onChange={handleCompanyLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">CIF / NIF Fiscal</label>
                <input
                  type="text"
                  required
                  value={companyForm.cif}
                  onChange={(e) => setCompanyForm({ ...companyForm, cif: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Eslogan Principal (Footer)</label>
              <textarea
                rows={2}
                value={companyForm.slogan}
                onChange={(e) => setCompanyForm({ ...companyForm, slogan: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Teléfono Público</label>
                <input
                  type="text"
                  required
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Email de Contacto</label>
                <input
                  type="email"
                  required
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Dirección / Sede</label>
                <input
                  type="text"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Ciudad / Área de Servicio</label>
                <input
                  type="text"
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Horario de Atención</label>
              <input
                type="text"
                value={companyForm.schedule}
                onChange={(e) => setCompanyForm({ ...companyForm, schedule: e.target.value })}
                placeholder="Ej. Lunes a Viernes: 08:30 - 19:00"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Instagram (URL completa)</label>
                <input
                  type="url"
                  value={companyForm.socialInstagram}
                  onChange={(e) => setCompanyForm({ ...companyForm, socialInstagram: e.target.value })}
                  placeholder="https://instagram.com/tu_cuenta"
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">TikTok (URL completa)</label>
                <input
                  type="url"
                  value={companyForm.socialTikTok}
                  onChange={(e) => setCompanyForm({ ...companyForm, socialTikTok: e.target.value })}
                  placeholder="https://tiktok.com/@tu_cuenta"
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>
            </div>

            {companyError && (
              <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {companyError}
              </p>
            )}

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <button
                type="submit"
                disabled={isSavingCompany}
                className="px-6 py-2.5 bg-[#580812] hover:bg-rose-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-[#580812]/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingCompany ? 'Guardando...' : 'Guardar Datos de Empresa'}</span>
              </button>
            </div>
          </form>

          {/* Footer Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
              <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center justify-between">
                <span>Previsualización del Footer Web</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  Sincronizado
                </span>
              </h3>

              <div className="bg-[#0A192F] text-white rounded-xl p-6 text-xs space-y-4 border border-white/10">
                <div>
                  <div className="font-black text-lg text-white">
                    {companyForm.companyName}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                    {companyForm.slogan}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/10 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-300" />
                    <span>{companyForm.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-300" />
                    <span>{companyForm.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-300" />
                    <span>{companyForm.address}, {companyForm.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-stone-300" />
                    <span>{companyForm.schedule}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 text-[10px] text-slate-400 flex justify-between items-center">
                  <span>CIF: {companyForm.cif}</span>
                  <span>{companyForm.socialInstagram}</span>
                </div>

                <div className="text-[10px] text-stone-500 pt-2 text-center border-t border-white/5">
                  © {new Date().getFullYear()} {companyForm.companyName}. Todos los derechos reservados.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT ADD / EDIT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingProjectId ? 'Editar Proyecto Web' : 'Añadir Nuevo Proyecto a la Web'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Título del Proyecto *</label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="Ej: Cocina Abierta con Isla de Calacatta"
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Tipo de Proyecto</label>
                  <select
                    value={projType}
                    onChange={(e) => setProjType(e.target.value as ProjectType)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  >
                    <option value="baño">Baño</option>
                    <option value="cocina">Cocina</option>
                    <option value="integral">Integral</option>
                    <option value="aseo">Aseo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Ubicación / Ciudad</label>
                  <input
                    type="text"
                    value={projLocation}
                    onChange={(e) => setProjLocation(e.target.value)}
                    placeholder="Ej: Calle Velázquez, Madrid"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Tiempo de Ejecución</label>
                  <input
                    type="text"
                    value={projExecutionTime}
                    onChange={(e) => setProjExecutionTime(e.target.value)}
                    placeholder="Ej: 7 días de obra"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Subtítulo / Tagline</label>
                  <input
                    type="text"
                    value={projSubtitle}
                    onChange={(e) => setProjSubtitle(e.target.value)}
                    placeholder="Ej: Sustitución de bañera por ducha"
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Vincular a Obra Real (opcional)</label>
                <select
                  value={projWorkOrderId}
                  onChange={(e) => setProjWorkOrderId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                >
                  <option value="">Sin vincular</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.title} — {wo.clientName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Fotografía del Proyecto
                </label>
                <div className="flex items-center gap-3">
                  {projImagePreview && (
                    <img
                      src={projImagePreview}
                      alt="Vista previa"
                      className="w-14 h-14 rounded-lg object-cover border border-stone-300"
                    />
                  )}
                  <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{projImageFile ? projImageFile.name : 'Subir Fotografía'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProjectImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Descripción Detallada</label>
                <textarea
                  rows={3}
                  value={projDescription}
                  onChange={(e) => setProjDescription(e.target.value)}
                  placeholder="Detalles sobre materiales, acabados, azulejos, grifería..."
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#580812]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={projIsFeatured}
                    disabled={editingProjectId != null && projects.find((p) => p.id === editingProjectId)?.isFeatured}
                    onChange={(e) => setProjIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#580812] rounded"
                  />
                  <span>Fijar como Proyecto Destacado (Fallback Portada)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={projVisible}
                    onChange={(e) => setProjVisible(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span>Visible en Landing Web</span>
                </label>
              </div>

              {projectError && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {projectError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProject}
                  className="px-6 py-2 bg-[#580812] hover:bg-rose-900 text-white rounded-xl text-xs font-bold shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingProject ? 'Guardando...' : editingProjectId ? 'Guardar Cambios' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
