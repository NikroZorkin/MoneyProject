/**
 * Warmup script - pre-compiles all pages by visiting them after server starts
 * Run with: npm run dev:warmup
 */

const BASE_URL = 'http://localhost:3000';
const LOCALES = ['en', 'ru', 'de'];
const PAGES = [
  '/dashboard',
  '/import',
  '/budgets',
  '/settings',
];
const API_ROUTES = [
  '/api/dashboard',
  '/api/categories',
  '/api/budgets?month=2025-01-01&currency=EUR',
];

async function waitForServer(maxAttempts = 60) {
  console.log('⏳ Waiting for server to start...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(BASE_URL, { method: 'HEAD' });
      if (response.ok || response.status === 307) {
        console.log('✅ Server is ready!\n');
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(r => setTimeout(r, 1000));
    process.stdout.write('.');
  }
  
  console.log('\n❌ Server did not start in time');
  return false;
}

async function warmupUrl(url) {
  const start = Date.now();
  try {
    const response = await fetch(url);
    const duration = Date.now() - start;
    const status = response.ok ? '✓' : '⚠';
    console.log(`  ${status} ${url} (${duration}ms)`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${url} - ${error.message}`);
    return false;
  }
}

async function main() {
  // Wait for server
  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  console.log('🔥 Warming up pages...\n');

  // Warmup locale pages (only one locale to speed up)
  console.log('Pages:');
  for (const page of PAGES) {
    await warmupUrl(`${BASE_URL}/en${page}`);
  }

  // Warmup API routes
  console.log('\nAPI routes:');
  for (const route of API_ROUTES) {
    await warmupUrl(`${BASE_URL}${route}`);
  }

  console.log('\n✨ Warmup complete! All pages pre-compiled.\n');
  console.log('You can now navigate between tabs without compilation delay.');
  console.log('Press Ctrl+C to stop the server when done.\n');
}

main();

