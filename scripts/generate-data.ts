import { execSync } from 'child_process';
import path from 'path';

function parseArgs() {
  const args = process.argv.slice(2);
  const config: Record<string, string> = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key && value) {
        config[key] = value;
      }
    }
  });
  
  return config;
}

function main() {
  const config = parseArgs();
  
  console.log('Generating data with custom parameters:');
  console.log(config);

  const env = { ...process.env };
  if (config.seed) env.SEED = config.seed;
  if (config.products) env.PRODUCT_COUNT = config.products;
  if (config.orders) env.ORDER_COUNT = config.orders;
  if (config.rows) env.ROW_COUNT = config.rows;
  if (config.bins) env.BINS_PER_ROW = config.bins;

  try {
    const backendPath = path.resolve(__dirname, '../backend');
    execSync('npx prisma db seed', { 
      cwd: backendPath, 
      env, 
      stdio: 'inherit',
      shell: true
    });
    console.log('Data generation successful.');
  } catch (error) {
    console.error('Failed to generate data:', error);
    process.exit(1);
  }
}

main();
