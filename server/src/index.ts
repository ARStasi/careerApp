import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import profileRouter from './routes/profile.js';
import companiesRouter from './routes/companies.js';
import rolesRouter from './routes/roles.js';
import accomplishmentsRouter from './routes/accomplishments.js';
import responsibilitiesRouter from './routes/responsibilities.js';
import skillsRouter from './routes/skills.js';
import awardsRouter from './routes/awards.js';
import presentationsRouter from './routes/presentations.js';
import teamStructureRouter from './routes/teamStructure.js';
import orgPositionRouter from './routes/orgPosition.js';
import educationRouter from './routes/education.js';
import certificationsRouter from './routes/certifications.js';
import knowledgeBaseRouter from './routes/knowledgeBase.js';
import jobApplicationsRouter from './routes/jobApplications.js';
import workflowRouter from './routes/workflow.js';

const app = new Hono();

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Disposition', 'X-Resume-Output-Path'],
  }),
);

app.route('/api', profileRouter);
app.route('/api', companiesRouter);
app.route('/api', rolesRouter);
app.route('/api', accomplishmentsRouter);
app.route('/api', responsibilitiesRouter);
app.route('/api', skillsRouter);
app.route('/api', awardsRouter);
app.route('/api', presentationsRouter);
app.route('/api', teamStructureRouter);
app.route('/api', orgPositionRouter);
app.route('/api', educationRouter);
app.route('/api', certificationsRouter);
app.route('/api', knowledgeBaseRouter);
app.route('/api', jobApplicationsRouter);
app.route('/api', workflowRouter);

const PORT = parseInt(process.env.PORT ?? '8000', 10);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Career Manager API running on http://localhost:${info.port}`);
});
