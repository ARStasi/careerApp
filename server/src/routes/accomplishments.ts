import { Hono } from 'hono';
import { db } from '../db/index.js';
import { accomplishments } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

// SQLAlchemy stored enum names (RESUME_BULLET); normalize to lowercase values for the frontend
function normalize(row: typeof accomplishments.$inferSelect) {
  return { ...row, category: row.category?.toLowerCase() ?? row.category };
}

const router = new Hono();

router.get('/roles/:role_id/accomplishments', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const rows = db.select().from(accomplishments)
    .where(eq(accomplishments.role_id, roleId))
    .orderBy(asc(accomplishments.sort_order))
    .all();
  return c.json(rows.map(normalize));
});

router.post('/roles/:role_id/accomplishments', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const body = await c.req.json();
  const [created] = await db.insert(accomplishments)
    .values({ ...body, role_id: roleId })
    .returning();
  return c.json(normalize(created), 201);
});

router.put('/accomplishments/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const [updated] = await db.update(accomplishments)
    .set(body)
    .where(eq(accomplishments.id, id))
    .returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(normalize(updated));
});

router.delete('/accomplishments/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(accomplishments).where(eq(accomplishments.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(accomplishments).where(eq(accomplishments.id, id));
  return new Response(null, { status: 204 });
});

router.patch('/roles/:role_id/accomplishments/reorder', async (c) => {
  const body = await c.req.json() as { accomplishment_ids: number[] };
  const ids: number[] = body.accomplishment_ids ?? [];

  for (let i = 0; i < ids.length; i++) {
    await db.update(accomplishments)
      .set({ sort_order: i })
      .where(eq(accomplishments.id, ids[i]));
  }

  const roleId = parseInt(c.req.param('role_id'));
  const rows = db.select().from(accomplishments)
    .where(eq(accomplishments.role_id, roleId))
    .orderBy(asc(accomplishments.sort_order))
    .all();
  return c.json(rows.map(normalize));
});

export default router;
