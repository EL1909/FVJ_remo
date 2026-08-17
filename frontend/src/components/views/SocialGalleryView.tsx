import React, { useState } from 'react';
import {
  Share2,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Plus,
  ExternalLink,
  Users,
  Bath,
  CookingPot,
  Sparkles,
  Play,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { SocialPost, WorkOrder } from '../../types';

interface SocialGalleryViewProps {
  socialPosts: SocialPost[];
  workOrders: WorkOrder[];
  onAddSocialPost: (post: SocialPost) => void;
}

export const SocialGalleryView: React.FC<SocialGalleryViewProps> = ({
  socialPosts,
  workOrders,
  onAddSocialPost,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'tiktok' | 'instagram'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPublisherOpen, setIsPublisherOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<'tiktok' | 'instagram'>('tiktok');
  const [projectType, setProjectType] = useState<'baño' | 'cocina' | 'integral'>('baño');

  const filteredPosts = socialPosts.filter((p) => {
    if (platformFilter !== 'all' && p.platform !== platformFilter) return false;
    return true;
  });

  const totalViews = socialPosts.reduce((a, b) => a + b.views, 0);
  const totalLeads = socialPosts.reduce((a, b) => a + b.leadsGenerated, 0);

  const handleCopyShareLink = (post: SocialPost) => {
    navigator.clipboard.writeText(post.postUrl);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: SocialPost = {
      id: `soc-${Date.now()}`,
      platform,
      title: title || '🔥 Nueva transformación de baño/cocina por Remodelaciones FVJ',
      thumbnailUrl:
        projectType === 'baño'
          ? 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      postUrl: `https://${platform}.com/@remodelaciones_fvj`,
      views: 12500,
      likes: 980,
      commentsCount: 34,
      sharesCount: 110,
      publishedDate: new Date().toISOString().split('T')[0],
      projectType,
      leadsGenerated: 5,
      tags: ['#Remodelacion', `#${projectType.toUpperCase()}`, '#RemodelacionesFVJ'],
    };

    onAddSocialPost(newPost);
    setIsPublisherOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header - Navy & Crimson */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A192F] text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-stone-100 font-bold text-xs uppercase tracking-wider">
            <span>Portafolio & Captación de Clientes</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-stone-100">
            TikTok & Instagram Showcases
          </h2>
          <p className="text-xs text-stone-300">
            Catálogo de vídeos virales de cambios de bañera por ducha, islas de cocina y remodelaciones. Compartible con clientes en 1-clic.
          </p>
        </div>

        <button
          onClick={() => setIsPublisherOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#580812] hover:bg-[#42050D] text-white font-bold text-xs shadow-lg shadow-[#580812]/40 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Publicación</span>
        </button>
      </div>

      {/* Social Performance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-slate-500">Alcance Total Acumulado</div>
            <div className="text-2xl font-black text-[#0A192F] mt-1">
              {(totalViews / 1000).toFixed(0)}k <span className="text-xs font-normal text-slate-500">vistas</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0A192F] flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-slate-500">Presupuestos Generados (Leads)</div>
            <div className="text-2xl font-black text-[#800020] mt-1">
              +{totalLeads} solicitudes
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#800020] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-slate-500">Redes Activas</div>
            <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#0A192F] text-white font-bold text-[10px]">TikTok</span>
              <span className="px-2 py-0.5 rounded bg-[#800020] text-white font-bold text-[10px]">Instagram</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-[#0A192F] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#800020]" />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm">
        {[
          { id: 'all', label: 'Todos los vídeos' },
          { id: 'tiktok', label: 'TikTok' },
          { id: 'instagram', label: 'Instagram Reels' },
        ].map((pl) => (
          <button
            key={pl.id}
            onClick={() => setPlatformFilter(pl.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              platformFilter === pl.id
                ? 'bg-[#800020] text-white shadow-sm'
                : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
            }`}
          >
            {pl.label}
          </button>
        ))}
      </div>

      {/* Social Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => {
          const relatedOrder = workOrders.find((w) => w.id === post.relatedWorkOrderId);

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Thumbnail Header */}
                <div className="relative h-48 overflow-hidden bg-slate-950">
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white shadow-md ${
                        post.platform === 'tiktok' ? 'bg-[#0A192F]' : 'bg-[#800020]'
                      }`}
                    >
                      {post.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/90 text-[#0A192F]">
                      {post.projectType}
                    </span>
                  </div>

                  {/* Play Overlay Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#800020]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-rose-300" />
                      {post.views.toLocaleString('es-ES')}
                    </span>
                    <span className="flex items-center gap-1 text-rose-300">
                      <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
                      {post.likes.toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3">
                  <h3 className="font-black text-sm text-[#0A192F] leading-snug">{post.title}</h3>

                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((t) => (
                      <span key={t} className="text-[10px] text-[#800020] font-bold">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Related Work Order Badge */}
                  {relatedOrder && (
                    <div className="bg-[#FAF8F5] p-2.5 rounded-xl text-xs text-slate-700">
                      <div className="text-[10px] uppercase text-[#800020] font-black">Obra Real Asociada:</div>
                      <div className="font-bold text-[#0A192F] truncate">{relatedOrder.title}</div>
                      <div className="text-[11px] text-slate-500">Cliente: {relatedOrder.clientName}</div>
                    </div>
                  )}

                  {/* Leads info */}
                  <div className="flex items-center justify-between text-xs bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-[#800020]">
                    <span className="font-bold">Leads conseguidos:</span>
                    <span className="font-black text-sm text-[#800020]">+{post.leadsGenerated} solicitudes</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  onClick={() => handleCopyShareLink(post)}
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#0A192F] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === post.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span className="text-emerald-700">¡Enlace Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#800020]" />
                      <span>Compartir con Cliente</span>
                    </>
                  )}
                </button>

                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 hover:text-[#0A192F]"
                  title="Abrir en TikTok/IG"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Publisher Modal */}
      {isPublisherOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-pink-400" />
                <span>Registrar Nuevo Vídeo / Reel</span>
              </h3>
              <button onClick={() => setIsPublisherOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Plataforma</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram Reel</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipo de Obra</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="baño">Reforma de Baño</option>
                  <option value="cocina">Reforma de Cocina</option>
                  <option value="integral">Reforma Integral</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Título / Gancho del Vídeo</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. ¡Mira este cambio de bañera a plato de ducha!"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPublisherOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-bold"
                >
                  Publicar en Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
