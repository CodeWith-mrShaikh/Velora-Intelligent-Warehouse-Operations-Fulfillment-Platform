import app from './app';
import { config } from './config';
import logger from './utils/logger';
import prisma from './utils/db';

const PORT = config.port;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to database');

    const server = app.listen(PORT, () => {
      logger.info(`Server is running in ${config.nodeEnv} mode on port ${PORT}`);
    });

    const gracefulShutdown = async () => {
      logger.info('Received shutdown signal, closing server...');
      server.close(async () => {
        logger.info('Server closed');
        await prisma.$disconnect();
        logger.info('Database connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
