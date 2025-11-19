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
  cameraId: string | null;
  camera?: FilmRollCamera;
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
  cameraId?: string | null;
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
  cameras: CameraBackup[];
  users?: UserBackup[];
}

export interface BackupImportPayload {
  filmRolls: FilmRoll[];
  prints?: Print[];
  cameras?: CameraBackup[];
  users?: UserBackup[];
}

export interface BackupImportSummary {
  filmRollsCreated: number;
  filmRollsUpdated: number;
  camerasCreated: number;
  camerasUpdated: number;
  printsCreated: number;
  printsUpdated: number;
}

export interface FilmRollCamera {
  id: string;
  manufacturer: string;
  model: string;
  filmType: string;
  releaseDate: string | null;
  purchaseDate: string | null;
}

export interface CameraFilmReference {
  id: string;
  filmName: string;
  filmId: string;
  dateShot: string | null;
}

export interface Camera {
  id: string;
  manufacturer: string;
  model: string;
  releaseDate: string | null;
  purchaseDate: string | null;
  filmType: string;
  lenses: string[];
  notes: string | null;
  linkedFilmRolls: CameraFilmReference[];
  linkedFilmRollsCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CameraPayload {
  manufacturer: string;
  model: string;
  releaseDate?: string | null;
  purchaseDate?: string | null;
  filmType: string;
  lenses: string[];
  notes?: string | null;
}

export interface PaginatedCameras {
  items: Camera[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CameraBackup {
  id: string;
  manufacturer: string;
  model: string;
  releaseDate: string | null;
  purchaseDate: string | null;
  filmType: string;
  lenses: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
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

export interface UserBackup {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  passwordHash: string;
  failedLoginAttempts: number;
  lockoutUntil: string | null;
  createdAt: string;
  updatedAt: string;
}
