import client from './client';
import type {PaginatedPrints, Print, PrintPayload} from '../types/api';

export interface PrintFilters {
  page?: number;
  pageSize?: number;
  filmRollId?: string;
}

export async function listPrints(filters: PrintFilters = {}): Promise<PaginatedPrints> {
  const {data} = await client.get<PaginatedPrints>('/prints', {params: filters});
  return data;
}

export async function getPrint(id: string): Promise<Print> {
  const {data} = await client.get<Print>(`/prints/${id}`);
  return data;
}

export async function createPrint(payload: PrintPayload): Promise<Print> {
  const {data} = await client.post<Print>('/prints', payload);
  return data;
}

export async function updatePrint(id: string, payload: PrintPayload): Promise<Print> {
  const {data} = await client.put<Print>(`/prints/${id}`, payload);
  return data;
}

export async function deletePrint(id: string): Promise<void> {
  await client.delete(`/prints/${id}`);
}
