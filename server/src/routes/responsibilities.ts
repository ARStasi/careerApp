import { Hono } from 'hono';
import { db } from '../db/index.js';
import { responsibilities } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

const router = new Hono();

router.get('/roles/:role_id/responsibilities', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const rows = db.select().from(responsibilities)
    .where(eq(responsibilities.role_id, roleId))
    .orderBy(asc(responsibilities.sort_order))
    .all();
  return c.json(rows);
});

router.post('/roles/:role_id/responsibilities', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const body = await c.req.json();
  const [created] = await db.insert(responsibilities)
    .values({ ...body, role_id: roleId })
    .returning();
  return c.json(created, 201);
});

router.put('/responsibilities/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const [updated] = await db.update(responsibilities)
    .set(body)
    .where(eq(responsibilities.id, id))
    .returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.delete('/responsibilities/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(responsibilities).where(eq(responsibilities.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(responsibilities).where(eq(responsibilities.id, id));
  return new Response(null, { status: 204 });
});

router.patch('/roles/:role_id/responsibilities/reorder', async (c) => {
  const body = await c.req.json() as { responsibility_ids: number[] };
  const ids: number[] = body.responsibility_ids ?? [];

  for (let i = 0; i < ids.length; i++) {
    await db.update(responsibilities)
      .set({ sort_order: i })
      .where(eq(responsibilities.id, ids[i]));
  }

  const roleId = parseInt(c.req.param('role_id'));
  const rows = db.select().from(responsibilities)
    .where(eq(responsibilities.role_id, roleId))
    .orderBy(asc(responsibilities.sort_order))
    .all();
  return c.json(rows);
});

export default router;
