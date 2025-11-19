import client from './client';
import type {
  Camera,
  CameraPayload,
  PaginatedCameras
} from '../types/api';

export interface CameraFilters {
  search?: string;
  filmType?: string;
  page?: number;
  pageSize?: number;
}

export async function listCameras(filters: CameraFilters): Promise<PaginatedCameras> {
  const {data} = await client.get<PaginatedCameras>('/cameras', {
    params: filters
  });
  return data;
}

export async function getCamera(id: string): Promise<Camera> {
  const {data} = await client.get<Camera>(`/cameras/${id}`);
  return data;
}

export async function createCamera(payload: CameraPayload): Promise<Camera> {
  const {data} = await client.post<Camera>('/cameras', payload);
  return data;
}

export async function updateCamera(id: string, payload: Partial<CameraPayload>): Promise<Camera> {
  const {data} = await client.put<Camera>(`/cameras/${id}`, payload);
  return data;
}

export async function deleteCamera(id: string): Promise<void> {
  await client.delete(`/cameras/${id}`);
}
