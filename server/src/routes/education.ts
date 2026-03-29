import { Hono } from 'hono';
import { db } from '../db/index.js';
import { education } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = new Hono();

router.get('/education', async (c) => {
  const rows = db.select().from(education).orderBy(desc(education.start_date)).all();
  return c.json(rows);
});

router.post('/education', async (c) => {
  const body = await c.req.json();
  const [created] = await db.insert(education).values(body).returning();
  return c.json(created, 201);
});

router.put('/education/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const [updated] = await db.update(education).set(body).where(eq(education.id, id)).returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.delete('/education/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(education).where(eq(education.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(education).where(eq(education.id, id));
  return new Response(null, { status: 204 });
});

export default router;
