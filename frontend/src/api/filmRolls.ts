import client from './client';
import type {
  DevelopmentPayload,
  FilmRoll,
  FilmRollPayload,
  PaginatedFilmRolls
} from '../types/api';

export interface FilmRollFilters {
  search?: string;
  isDeveloped?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'filmName' | 'dateShot' | 'createdAt' | 'filmId' | 'filmFormat' | 'exposures' | 'boxIso' | 'isDeveloped';
  sortDir?: 'asc' | 'desc';
}

export async function listFilmRolls(filters: FilmRollFilters): Promise<PaginatedFilmRolls> {
  const {data} = await client.get<PaginatedFilmRolls>('/film-rolls', {
    params: filters
  });
  return data;
}

export async function getFilmRoll(id: string): Promise<FilmRoll> {
  const {data} = await client.get<FilmRoll>(`/film-rolls/${id}`);
  return data;
}

export async function createFilmRoll(payload: FilmRollPayload): Promise<FilmRoll> {
  const {data} = await client.post<FilmRoll>('/film-rolls', payload);
  return data;
}

export async function updateFilmRoll(id: string, payload: Partial<FilmRollPayload>): Promise<FilmRoll> {
  const {data} = await client.put<FilmRoll>(`/film-rolls/${id}`, payload);
  return data;
}

export async function deleteFilmRoll(id: string): Promise<void> {
  await client.delete(`/film-rolls/${id}`);
}

export async function upsertDevelopment(
  id: string,
  payload: DevelopmentPayload
): Promise<FilmRoll> {
  const {data} = await client.post<FilmRoll>(`/film-rolls/${id}/development`, payload);
  return data;
}

export async function markDeveloped(
  id: string,
  payload?: Partial<{development: DevelopmentPayload}>
): Promise<FilmRoll> {
  const {data} = await client.post<FilmRoll>(`/film-rolls/${id}/mark-developed`, payload ?? {});
  return data;
}

export async function deleteDevelopment(id: string): Promise<FilmRoll> {
  const {data} = await client.delete<FilmRoll>(`/film-rolls/${id}/development`);
  return data;
}
