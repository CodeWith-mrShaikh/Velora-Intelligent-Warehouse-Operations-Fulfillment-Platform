import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  seedConfig: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@warehouse.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'admin123',
  }
};
