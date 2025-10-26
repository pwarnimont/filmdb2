export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export type FilmFormat = '35mm' | '6x6' | '6x4_5' | '6x7' | '6x9' | 'other';

export interface Development {
  id: string;
  filmRollId: string;
  developer: string;
  temperatureC: number;
  dilution: string;
  timeSeconds: number;
  dateDeveloped: string;
  agitationScheme: string;
}

export interface FilmRoll {
  id: string;
  filmId: string;
  filmName: string;
  boxIso: number;
  shotIso: number | null;
  dateShot: string | null;
  cameraName: string | null;
  filmFormat: FilmFormat;
  exposures: number;
  isDeveloped: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  development?: Development;
}

export interface FilmRollPayload {
  filmId: string;
  filmName: string;
  boxIso: number;
  shotIso?: number | null;
  dateShot?: string | null;
  cameraName?: string | null;
  filmFormat: FilmFormat;
  exposures: number;
  isDeveloped?: boolean;
}

export interface DevelopmentPayload {
  developer: string;
  temperatureC: number;
  dilution: string;
  timeSeconds: number;
  dateDeveloped: string;
  agitationScheme: string;
}

export interface PaginatedFilmRolls {
  items: FilmRoll[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
