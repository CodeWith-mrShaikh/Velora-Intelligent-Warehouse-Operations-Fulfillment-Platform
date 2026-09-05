const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL || '';

console.log('🚀 Initializing Velora backend runtime...');

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('🔄 Detected PostgreSQL database URL. Configuring Prisma schema for PostgreSQL...');
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);

  console.log('⚡ Generating Prisma Client for PostgreSQL...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('📦 Pushing database schema to PostgreSQL...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

  console.log('🌱 Checking if database needs initial seeding...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.count().then(async (count) => {
      if (count === 0) {
        console.log('🌱 Empty database detected! Seeding default data...');
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
        console.log('✅ Seeding completed!');
      } else {
        console.log(`ℹ️ Database already contains ${count} users. Skipping seed.`);
      }
      await prisma.$disconnect();
    }).catch((err) => {
      console.warn('⚠️ Seeding check skipped:', err.message);
    });
  } catch (err) {
    console.warn('⚠️ Seeding check skipped:', err.message);
  }
} else {
  console.log('💾 Using SQLite database configuration.');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ Prisma generate error:', err.message);
  }
}

console.log('🚀 Starting Velora Express Server...');
require('../dist/server.js');
