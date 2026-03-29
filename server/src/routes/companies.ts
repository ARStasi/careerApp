import { Hono } from 'hono';
import { db } from '../db/index.js';
import { companies } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = new Hono();

router.get('/companies', async (c) => {
  const rows = db.select().from(companies).orderBy(desc(companies.start_date)).all();
  return c.json(rows);
});

router.post('/companies', async (c) => {
  const body = await c.req.json();
  const [created] = await db.insert(companies).values(body).returning();
  return c.json(created, 201);
});

router.get('/companies/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [row] = db.select().from(companies).where(eq(companies.id, id)).limit(1).all();
  if (!row) return c.json({ detail: 'Not found' }, 404);
  return c.json(row);
});

router.put('/companies/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const [updated] = await db.update(companies).set(body).where(eq(companies.id, id)).returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.delete('/companies/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(companies).where(eq(companies.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(companies).where(eq(companies.id, id));
  return new Response(null, { status: 204 });
});

export default router;
