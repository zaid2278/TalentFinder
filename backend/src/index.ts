import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import prisma from './lib/prisma.js';
import { errorHandler } from './middleware/errorHandler.js';
import tenantsRouter from './routes/tenants.js';
import skillsRouter from './routes/skills.js';
import candidatesRouter from './routes/candidates.js';
import jobOrdersRouter from './routes/jobOrders.js';
import submissionsRouter from './routes/submissions.js';
import authRouter from './routes/auth.js';
import recruitersRouter from './routes/recruiters.js';
import { authenticate } from './middleware/authenticate.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const uploadsPath = path.resolve(process.cwd(), 'uploads');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsPath));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.use(authenticate);

app.use('/api/tenants', tenantsRouter);
app.use('/api/recruiters', recruitersRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/job-orders', jobOrdersRouter);
app.use('/api/submissions', submissionsRouter);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`TalentFinder API listening on http://localhost:${PORT}`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
    process.exit(0);
  });

  // Hard exit if close hangs (keeps tsx watch from force-killing forever)
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
