const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL || '';

console.log('🚀 Initializing Velora backend runtime...');

async function init() {
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
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('🌱 Empty database detected! Running initial seed...');
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
        console.log('✅ Seeding completed!');
      } else {
        console.log(`ℹ️ Database already contains ${userCount} users. Skipping seed.`);
      }
      await prisma.$disconnect();
    } catch (err) {
      console.warn('⚠️ Seeding check error:', err.message);
    }
  } else {
    console.log('💾 Using SQLite database configuration.');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
    } catch (err) {
      console.warn('⚠️ Prisma generate error:', err.message);
    }
  }

  console.log('⚡ Ensuring bins have ample capacity for inwarding and storage...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const updateResult = await prisma.bin.updateMany({
      where: { capacity: { lt: 2000 } },
      data: { capacity: 2000 }
    });
    if (updateResult.count > 0) {
      console.log(`✅ Updated ${updateResult.count} bins to minimum 2000 capacity.`);
    }
    await prisma.$disconnect();
  } catch (err) {
    console.warn('⚠️ Bin capacity update warning:', err.message);
  }

  console.log('🚀 Starting Velora Express Server...');
  require('../dist/server.js');
}

init().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
