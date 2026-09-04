import { execSync } from 'child_process';
import path from 'path';

function main() {
  console.log('Resetting Database...');
  try {
    const backendPath = path.resolve(__dirname, '../backend');
    
    // In Prisma with SQLite, we can just push schema or recreate. 
    // Since we want to clear data and re-seed:
    console.log('Pushing schema to ensure database structure...');
    execSync('npx prisma db push --accept-data-loss', { cwd: backendPath, stdio: 'inherit', shell: true });
    
    console.log('Running seed...');
    execSync('npx prisma db seed', { cwd: backendPath, stdio: 'inherit', shell: true });
    
    console.log('Database reset successfully.');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }
}

main();
