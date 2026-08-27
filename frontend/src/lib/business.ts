import { apiFetch } from './api';
import { CompanyData, WebsiteHeroConfig } from '../types';

interface BusinessProfileDTO {
  trade_name: string;
  tax_id: string;
  logo: string | null;
  address: string;
  city: string;
  email: string;
  phone: string;
  slogan: string;
  schedule: string;
  social_instagram: string;
  social_tiktok: string;
  hero_video_url: string;
  hero_video_title: string;
  hero_video_subtitle: string;
  hero_show_video: boolean;
  hero_autoplay: boolean;
  hero_muted: boolean;
  hero_video_speed: string;
}

function companyDataFromDTO(dto: BusinessProfileDTO): CompanyData {
  return {
    companyName: dto.trade_name,
    slogan: dto.slogan,
    phone: dto.phone,
    email: dto.email,
    address: dto.address,
    city: dto.city,
    cif: dto.tax_id,
    schedule: dto.schedule,
    socialInstagram: dto.social_instagram,
    socialTikTok: dto.social_tiktok,
    logoUrl: dto.logo || undefined,
  };
}

function heroConfigFromDTO(dto: BusinessProfileDTO): WebsiteHeroConfig {
  return {
    videoUrl: dto.hero_video_url,
    videoTitle: dto.hero_video_title,
    videoSubtitle: dto.hero_video_subtitle,
    showVideo: dto.hero_show_video,
    autoPlay: dto.hero_autoplay,
    muted: dto.hero_muted,
    playbackRate: parseFloat(dto.hero_video_speed) || 1,
  };
}

export interface BusinessProfileData {
  companyData: CompanyData;
  heroConfig: WebsiteHeroConfig;
}

// Endpoint público (AllowAny) — identidad de la empresa para la landing.
export async function fetchPublicBusinessProfile(): Promise<BusinessProfileData> {
  const dto = await apiFetch<BusinessProfileDTO>('/business/');
  return { companyData: companyDataFromDTO(dto), heroConfig: heroConfigFromDTO(dto) };
}

// Endpoint admin (autenticado) — mismos datos, editable desde el panel.
export async function fetchBusinessProfile(): Promise<BusinessProfileData> {
  const dto = await apiFetch<BusinessProfileDTO>('/business/profile/');
  return { companyData: companyDataFromDTO(dto), heroConfig: heroConfigFromDTO(dto) };
}

export interface CompanyDataInput {
  companyName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  cif: string;
  schedule: string;
  socialInstagram: string;
  socialTikTok: string;
  logo?: File;
}

export async function updateCompanyData(input: CompanyDataInput): Promise<CompanyData> {
  const fields: Record<string, string> = {
    trade_name: input.companyName,
    slogan: input.slogan,
    phone: input.phone,
    email: input.email,
    address: input.address,
    city: input.city,
    tax_id: input.cif,
    schedule: input.schedule,
    social_instagram: input.socialInstagram,
    social_tiktok: input.socialTikTok,
  };

  let body: any = fields;
  if (input.logo) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    formData.append('logo', input.logo);
    body = formData;
  }

  const dto = await apiFetch<BusinessProfileDTO>('/business/profile/', {
    method: 'PATCH',
    body,
  });
  return companyDataFromDTO(dto);
}

export interface WebsiteHeroConfigInput {
  videoTitle: string;
  videoSubtitle: string;
  showVideo: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  playbackRate?: number;
  videoFile?: File;
  clearVideo?: boolean;
}

export async function updateHeroConfig(input: WebsiteHeroConfigInput): Promise<WebsiteHeroConfig> {
  const fields: Record<string, string> = {
    hero_video_title: input.videoTitle || '',
    hero_video_subtitle: input.videoSubtitle || '',
    hero_show_video: String(input.showVideo),
    hero_autoplay: String(input.autoPlay ?? true),
    hero_muted: String(input.muted ?? true),
    hero_video_speed: String(input.playbackRate ?? 1),
    clear_hero_video: String(input.clearVideo ?? false),
  };

  let body: any = fields;
  if (input.videoFile) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    formData.append('hero_video_url', input.videoFile);
    body = formData;
  }

  const dto = await apiFetch<BusinessProfileDTO>('/business/profile/', {
    method: 'PATCH',
    body,
  });
  return heroConfigFromDTO(dto);
}
