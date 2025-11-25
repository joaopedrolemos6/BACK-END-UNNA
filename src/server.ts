import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const port = env.PORT;

app.listen(port, () => {
  logger.info(`🚀 MODELO-UNNA API running on http://localhost:${port}/api/health`);
});
