import app from './app';
import env from './config/env';
import {settingsService} from './services/settings.service';

async function bootstrap() {
  await settingsService.ensureAppSettings();

  const port = env.port;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

void bootstrap();
