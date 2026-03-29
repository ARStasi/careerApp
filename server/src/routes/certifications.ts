import { Hono } from 'hono';
import { db } from '../db/index.js';
import { certifications } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = new Hono();

router.get('/certifications', async (c) => {
  const rows = db.select().from(certifications).orderBy(desc(certifications.issue_date)).all();
  return c.json(rows);
});

router.post('/certifications', async (c) => {
  const body = await c.req.json();
  const [created] = await db.insert(certifications).values(body).returning();
  return c.json(created, 201);
});

router.put('/certifications/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const [updated] = await db.update(certifications).set(body).where(eq(certifications.id, id)).returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.delete('/certifications/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(certifications).where(eq(certifications.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(certifications).where(eq(certifications.id, id));
  return new Response(null, { status: 204 });
});

export default router;
