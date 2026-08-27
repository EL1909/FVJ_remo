import { apiFetch } from './api';
import { SocialPost, ProjectType, PublicReview, WebsiteProject, WebsiteProjectPhoto } from '../types';

interface SocialPostDTO {
  id: number;
  platform: string;
  title: string;
  thumbnail: string | null;
  video_url: string;
  post_url: string;
  views: number;
  likes: number;
  comments_count: number;
  shares_count: number;
  published_date: string;
  kind: string;
  task: number | null;
  leads_generated: number;
  tags: string[];
  created_at: string;
}

function fromDTO(dto: SocialPostDTO): SocialPost {
  return {
    id: String(dto.id),
    platform: dto.platform as SocialPost['platform'],
    title: dto.title,
    thumbnailUrl: dto.thumbnail || '',
    videoUrl: dto.video_url || undefined,
    postUrl: dto.post_url,
    views: dto.views,
    likes: dto.likes,
    commentsCount: dto.comments_count,
    sharesCount: dto.shares_count,
    publishedDate: dto.published_date,
    projectType: (dto.kind || 'integral') as ProjectType,
    relatedWorkOrderId: dto.task != null ? String(dto.task) : undefined,
    leadsGenerated: dto.leads_generated,
    tags: dto.tags || [],
  };
}

export async function fetchSocialPosts(): Promise<SocialPost[]> {
  const data = await apiFetch<SocialPostDTO[]>('/showcase/posts/');
  return data.map(fromDTO);
}

// Endpoint público (AllowAny) — mismos posts, para el showcase de la landing.
export async function fetchPublicSocialPosts(): Promise<SocialPost[]> {
  const data = await apiFetch<SocialPostDTO[]>('/showcase/social/');
  return data.map(fromDTO);
}

export interface NewSocialPostInput {
  platform: SocialPost['platform'];
  title: string;
  postUrl: string;
  thumbnail?: File;
  publishedDate: string;
  projectType: ProjectType;
  views: number;
  likes: number;
  commentsCount: number;
  sharesCount: number;
  leadsGenerated: number;
  workOrderId?: string;
  tags: string[];
}

export async function createSocialPost(input: NewSocialPostInput): Promise<SocialPost> {
  const formData = new FormData();
  formData.append('platform', input.platform);
  formData.append('title', input.title);
  formData.append('post_url', input.postUrl);
  if (input.thumbnail) formData.append('thumbnail', input.thumbnail);
  formData.append('published_date', input.publishedDate);
  formData.append('kind', input.projectType);
  formData.append('views', String(input.views));
  formData.append('likes', String(input.likes));
  formData.append('comments_count', String(input.commentsCount));
  formData.append('shares_count', String(input.sharesCount));
  formData.append('leads_generated', String(input.leadsGenerated));
  if (input.workOrderId) formData.append('task', input.workOrderId);
  formData.append('tags', JSON.stringify(input.tags));

  const dto = await apiFetch<SocialPostDTO>('/showcase/posts/', {
    method: 'POST',
    body: formData,
  });
  return fromDTO(dto);
}

interface ReviewDTO {
  id: number;
  author_name: string;
  author_location: string;
  rating: number;
  date: string;
  kind: string;
  comment: string;
  verified: boolean;
  avatar: string | null;
  project_photo: string | null;
  created_at: string;
}

function fromReviewDTO(dto: ReviewDTO): PublicReview {
  return {
    id: String(dto.id),
    authorName: dto.author_name,
    authorLocation: dto.author_location,
    rating: dto.rating,
    date: dto.date,
    projectType: (dto.kind || 'integral') as ProjectType,
    comment: dto.comment,
    verified: dto.verified,
    avatarUrl: dto.avatar || undefined,
    projectPhotoUrl: dto.project_photo || undefined,
  };
}

// Endpoint público: solo trae reseñas ya verificadas por el equipo.
export async function fetchPublicReviews(): Promise<PublicReview[]> {
  const data = await apiFetch<ReviewDTO[]>('/showcase/reviews/');
  return data.map(fromReviewDTO);
}

export interface NewReviewInput {
  authorName: string;
  authorLocation: string;
  rating: number;
  date: string;
  projectType: ProjectType;
  comment: string;
}

// El backend siempre guarda verified=False en este endpoint (moderación
// manual desde el panel admin) — la reseña no aparece en fetchPublicReviews
// hasta que el equipo la verifique.
export async function submitReview(input: NewReviewInput): Promise<void> {
  await apiFetch('/showcase/reviews/submit/', {
    method: 'POST',
    body: {
      author_name: input.authorName,
      author_location: input.authorLocation,
      rating: input.rating,
      date: input.date,
      kind: input.projectType,
      comment: input.comment,
    },
  });
}

interface WebsiteProjectPhotoDTO {
  id: number;
  project: number;
  image: string;
  caption: string;
  uploaded_at: string;
}

interface WebsiteProjectDTO {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  execution_time: string;
  kind: string;
  image: string | null;
  description: string;
  estimated_price: string | null;
  is_featured: boolean;
  visible_on_website: boolean;
  task: number | null;
  created_at: string;
  photos: WebsiteProjectPhotoDTO[];
}

function fromProjectPhotoDTO(dto: WebsiteProjectPhotoDTO): WebsiteProjectPhoto {
  return {
    id: String(dto.id),
    url: dto.image,
    caption: dto.caption,
  };
}

function fromProjectDTO(dto: WebsiteProjectDTO): WebsiteProject {
  return {
    id: String(dto.id),
    title: dto.title,
    subtitle: dto.subtitle,
    location: dto.location,
    executionTime: dto.execution_time,
    projectType: (dto.kind || 'integral') as ProjectType,
    imageUrl: dto.image || '',
    description: dto.description,
    estimatedPrice: dto.estimated_price != null ? parseFloat(dto.estimated_price) : undefined,
    isFeatured: dto.is_featured,
    visibleOnWebsite: dto.visible_on_website,
    workOrderId: dto.task != null ? String(dto.task) : undefined,
    createdAt: dto.created_at,
    photos: (dto.photos || []).map(fromProjectPhotoDTO),
  };
}

// Público (AllowAny) — solo proyectos marcados visibles, para el portafolio de la landing.
export async function fetchPublicWebsiteProjects(): Promise<WebsiteProject[]> {
  const data = await apiFetch<WebsiteProjectDTO[]>('/showcase/projects/');
  return data.map(fromProjectDTO);
}

// Admin — todos los proyectos (visibles y ocultos), para gestionarlos desde el CMS.
export async function fetchWebsiteProjects(): Promise<WebsiteProject[]> {
  const data = await apiFetch<WebsiteProjectDTO[]>('/showcase/project-admin/');
  return data.map(fromProjectDTO);
}

export interface WebsiteProjectInput {
  title: string;
  subtitle: string;
  location: string;
  executionTime: string;
  projectType: ProjectType;
  image?: File;
  description: string;
  estimatedPrice?: number | null;
  visibleOnWebsite: boolean;
  workOrderId?: string;
}

export async function createWebsiteProject(input: WebsiteProjectInput): Promise<WebsiteProject> {
  const formData = new FormData();
  formData.append('title', input.title);
  formData.append('subtitle', input.subtitle);
  formData.append('location', input.location);
  formData.append('execution_time', input.executionTime);
  formData.append('kind', input.projectType);
  if (input.image) formData.append('image', input.image);
  formData.append('description', input.description);
  if (input.estimatedPrice != null) formData.append('estimated_price', String(input.estimatedPrice));
  formData.append('visible_on_website', String(input.visibleOnWebsite));
  if (input.workOrderId) formData.append('task', input.workOrderId);

  const dto = await apiFetch<WebsiteProjectDTO>('/showcase/project-admin/', {
    method: 'POST',
    body: formData,
  });
  return fromProjectDTO(dto);
}

export async function updateWebsiteProject(
  id: string,
  input: Partial<WebsiteProjectInput>
): Promise<WebsiteProject> {
  let body: any;
  if (input.image) {
    const formData = new FormData();
    if (input.title !== undefined) formData.append('title', input.title);
    if (input.subtitle !== undefined) formData.append('subtitle', input.subtitle);
    if (input.location !== undefined) formData.append('location', input.location);
    if (input.executionTime !== undefined) formData.append('execution_time', input.executionTime);
    if (input.projectType !== undefined) formData.append('kind', input.projectType);
    formData.append('image', input.image);
    if (input.description !== undefined) formData.append('description', input.description);
    if (input.estimatedPrice !== undefined) {
      formData.append('estimated_price', input.estimatedPrice != null ? String(input.estimatedPrice) : '');
    }
    if (input.visibleOnWebsite !== undefined) formData.append('visible_on_website', String(input.visibleOnWebsite));
    if (input.workOrderId) formData.append('task', input.workOrderId);
    body = formData;
  } else {
    body = {};
    if (input.title !== undefined) body.title = input.title;
    if (input.subtitle !== undefined) body.subtitle = input.subtitle;
    if (input.location !== undefined) body.location = input.location;
    if (input.executionTime !== undefined) body.execution_time = input.executionTime;
    if (input.projectType !== undefined) body.kind = input.projectType;
    if (input.description !== undefined) body.description = input.description;
    if (input.estimatedPrice !== undefined) body.estimated_price = input.estimatedPrice;
    if (input.visibleOnWebsite !== undefined) body.visible_on_website = input.visibleOnWebsite;
    if (input.workOrderId !== undefined) body.task = input.workOrderId ? Number(input.workOrderId) : null;
  }

  const dto = await apiFetch<WebsiteProjectDTO>(`/showcase/project-admin/${id}/`, {
    method: 'PATCH',
    body,
  });
  return fromProjectDTO(dto);
}

export async function deleteWebsiteProject(id: string): Promise<void> {
  await apiFetch(`/showcase/project-admin/${id}/`, { method: 'DELETE' });
}

// Destaca este proyecto y desmarca los demás — atómico en el backend.
export async function setFeaturedWebsiteProject(id: string): Promise<WebsiteProject> {
  const dto = await apiFetch<WebsiteProjectDTO>(`/showcase/project-admin/${id}/set-featured/`, {
    method: 'POST',
  });
  return fromProjectDTO(dto);
}

// Galería adicional del proyecto (más allá de la foto de portada).
export async function addWebsiteProjectPhoto(
  projectId: string,
  file: File,
  caption: string = ''
): Promise<WebsiteProjectPhoto> {
  const formData = new FormData();
  formData.append('project', projectId);
  formData.append('image', file);
  formData.append('caption', caption);

  const dto = await apiFetch<WebsiteProjectPhotoDTO>('/showcase/project-photos/', {
    method: 'POST',
    body: formData,
  });
  return fromProjectPhotoDTO(dto);
}

export async function deleteWebsiteProjectPhoto(photoId: string): Promise<void> {
  await apiFetch(`/showcase/project-photos/${photoId}/`, { method: 'DELETE' });
}
