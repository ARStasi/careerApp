import { Hono } from 'hono';
import { db } from '../db/index.js';
import { job_applications } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const VALID_STATUSES = new Set([
  'applied', 'email_rejected', 'ghosted', 'withdrew', 'req_pulled',
  'interview_scheduled', 'interview_rejected', 'offered', 'accepted',
]);

const router = new Hono();

router.get('/job-applications', async (c) => {
  const rows = db.select().from(job_applications)
    .orderBy(desc(job_applications.date_applied))
    .all();
  return c.json(rows);
});

router.post('/job-applications', async (c) => {
  const body = await c.req.json();
  const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000000';
  const [created] = await db.insert(job_applications)
    .values({ ...body, created_at: now, updated_at: now })
    .returning();
  return c.json(created, 201);
});

router.put('/job-applications/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000000';
  const [updated] = await db.update(job_applications)
    .set({ ...body, updated_at: now })
    .where(eq(job_applications.id, id))
    .returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.patch('/job-applications/:id/status', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json() as { status: string; status_date?: string };

  if (!VALID_STATUSES.has(body.status)) {
    return c.json({ detail: `Invalid status '${body.status}'` }, 422);
  }

  const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000000';
  const [updated] = await db.update(job_applications)
    .set({
      status: body.status,
      status_date: body.status_date ?? new Date().toISOString().split('T')[0],
      updated_at: now,
    })
    .where(eq(job_applications.id, id))
    .returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.delete('/job-applications/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(job_applications).where(eq(job_applications.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(job_applications).where(eq(job_applications.id, id));
  return new Response(null, { status: 204 });
});

export default router;
