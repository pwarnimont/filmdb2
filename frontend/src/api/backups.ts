import client from './client';
import type {BackupImportPayload, BackupImportSummary, BackupSnapshot} from '../types/api';

export async function exportBackup(): Promise<BackupSnapshot> {
  const {data} = await client.get<BackupSnapshot>('/backups/export');
  return data;
}

export async function importBackup(
  payload: BackupImportPayload
): Promise<BackupImportSummary> {
  const {data} = await client.post<BackupImportSummary>('/backups/import', payload);
  return data;
}
