export type PostType = 'NEWS' | 'ANNOUNCEMENT' | 'ACTIVITY_REPORT' | 'OTHER';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type PostImage = {
  id: string;
  imageUrl: string;
  attachmentKind?: 'IMAGE' | 'FILE' | string;
  fileName?: string | null;
  createdAt?: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  type: PostType;
  organizationId: string;
  authorId?: string | null;
  status: PostStatus;
  images: PostImage[];
  createdAt?: string;
  updatedAt?: string;
};

export type PostFormValues = {
  title: string;
  content: string;
  type: PostType;
  organizationId: string;
  status: PostStatus;
};

export type PostFilters = {
  organization?: string;
  type?: PostType | '';
  date?: string;
  page: number;
  size: number;
};
