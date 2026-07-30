// Sparks UZ — Shared TypeScript Types

export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type JwtPayload = {
  id: string;
  iat?: number;
  exp?: number;
};

export type Gender = 'MALE' | 'FEMALE';

export type DatingGoal = 'FRIENDSHIP' | 'RELATIONSHIP' | 'MARRIAGE';

export type LikeType = 'LIKE' | 'SUPER_LIKE';

export type MessageType = 'TEXT' | 'IMAGE' | 'EMOJI';

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';

export type Language = 'uz' | 'ru' | 'en';
