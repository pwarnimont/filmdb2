import {prisma} from '../config/prisma';
import env from '../config/env';

class SettingsService {
  private async getSettingsRecord() {
    return prisma.appSettings.findFirst();
  }

  async ensureAppSettings(): Promise<void> {
    const existing = await this.getSettingsRecord();
    if (!existing) {
      await prisma.appSettings.create({
        data: {
          allowRegistration: env.defaultAllowRegistration
        }
      });
    }
  }

  async getAllowRegistration(): Promise<boolean> {
    await this.ensureAppSettings();
    const settings = await this.getSettingsRecord();
    return settings?.allowRegistration ?? env.defaultAllowRegistration;
  }

  async updateAllowRegistration(allowRegistration: boolean): Promise<boolean> {
    const settings = await this.getSettingsRecord();
    if (!settings) {
      const created = await prisma.appSettings.create({
        data: {allowRegistration}
      });
      return created.allowRegistration;
    }

    const updated = await prisma.appSettings.update({
      where: {id: settings.id},
      data: {allowRegistration}
    });
    return updated.allowRegistration;
  }
}

export const settingsService = new SettingsService();
