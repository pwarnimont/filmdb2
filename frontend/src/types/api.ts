export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
  isScanned: boolean;
  scanFolder: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  development?: Development;
  prints?: Print[];
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
  isScanned?: boolean;
  scanFolder?: string | null;
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

export interface SplitGradeStep {
  filter: string;
  exposureSeconds: number;
}

export interface Print {
  id: string;
  filmRollId: string;
  frameNumber: number;
  paperType: string;
  paperSize: string;
  paperManufacturer: string;
  developmentTimeSeconds: number;
  fixingTimeSeconds: number;
  washingTimeSeconds: number;
  splitGradeInstructions: string | null;
  splitGradeSteps: SplitGradeStep[] | null;
  createdAt: string;
  updatedAt: string;
  filmRoll?: {
    id: string;
    filmName: string;
    filmId: string;
  };
}

export interface PrintPayload {
  filmRollId: string;
  frameNumber: number;
  paperType: string;
  paperSize: string;
  paperManufacturer: string;
  developmentTimeSeconds: number;
  fixingTimeSeconds: number;
  washingTimeSeconds: number;
  splitGradeInstructions?: string | null;
  splitGradeSteps?: SplitGradeStep[] | null;
}

export interface PaginatedPrints {
  items: Print[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BackupSnapshot {
  generatedAt: string;
  filmRolls: FilmRoll[];
  prints: Print[];
}

export interface BackupImportPayload {
  filmRolls: FilmRoll[];
  prints?: Print[];
}

export interface BackupImportSummary {
  filmRollsCreated: number;
  filmRollsUpdated: number;
  printsCreated: number;
  printsUpdated: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
