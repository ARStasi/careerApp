import { Hono } from 'hono';
import { db } from '../db/index.js';
import { presentations } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = new Hono();

router.get('/roles/:role_id/presentations', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const rows = db.select().from(presentations).where(eq(presentations.role_id, roleId)).all();
  return c.json(rows);
});

router.post('/roles/:role_id/presentations', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const body = await c.req.json();
  const [created] = await db.insert(presentations).values({ ...body, role_id: roleId }).returning();
  return c.json(created, 201);
});

router.put('/presentations/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const [updated] = await db.update(presentations).set(body).where(eq(presentations.id, id)).returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.delete('/presentations/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(presentations).where(eq(presentations.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(presentations).where(eq(presentations.id, id));
  return new Response(null, { status: 204 });
});

export default router;
