/**
 * ============================================
 * PROVENIQ CLAIMSIQ - MAIN ENTRY POINT
 * ============================================
 * 
 * Enterprise Claims Intelligence Engine
 * Immutable Truth Machine for Insurance
 * 
 * THE BRAIN: Adjudicates claims with deterministic logic
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  PROVENIQ CLAIMSIQ - THE BRAIN');
  console.log('  Enterprise Claims Intelligence Engine');
  console.log('='.repeat(60));

  // Create Express app
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Health check (public)
  app.get('/health', (_req, res) => {
    res.json({
      status: 'OK',
      service: 'proveniq-claimsiq',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 routes placeholder
  app.get('/api/v1/claims', (_req, res) => {
    res.json({
      message: 'ClaimsIQ API v1',
      endpoints: [
        'POST /api/v1/claims - Submit a claim',
        'GET /api/v1/claims/:id - Get claim status',
        'GET /api/v1/claims/:id/decision - Get claim decision',
      ],
    });
  });

  // Error handler - FAIL LOUDLY
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[CLAIMSIQ ERROR]', err.message);
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  });

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = app.listen(port, () => {
    console.log(`\n[Boot] Server listening on port ${port}`);
    console.log('[Boot] Endpoints:');
    console.log(`  - Health: http://localhost:${port}/health`);
    console.log(`  - API: http://localhost:${port}/api/v1/claims`);
  });

  // Graceful shutdown
  const shutdown = (signal: string): void => {
    console.log(`\n[Shutdown] Received ${signal}, shutting down...`);
    server.close(() => {
      console.log('[Shutdown] HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('\n[Boot] PROVENIQ CLAIMSIQ ONLINE');
  console.log('[Boot] The Brain is ready to adjudicate');
}

// Run
bootstrap().catch((error: Error) => {
  console.error('[Boot] Fatal error during startup:', error.message);
  process.exit(1);
});
