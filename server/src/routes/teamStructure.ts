import { Hono } from 'hono';
import { db } from '../db/index.js';
import { team_structures } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = new Hono();

router.get('/roles/:role_id/team-structure', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const [row] = db.select().from(team_structures).where(eq(team_structures.role_id, roleId)).limit(1).all();
  if (!row) return c.json(null);
  return c.json(row);
});

router.put('/roles/:role_id/team-structure', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const body = await c.req.json();
  const existing = db.select().from(team_structures).where(eq(team_structures.role_id, roleId)).all();

  if (existing.length > 0) {
    const [updated] = await db.update(team_structures)
      .set(body)
      .where(eq(team_structures.role_id, roleId))
      .returning();
    return c.json(updated);
  } else {
    const [created] = await db.insert(team_structures)
      .values({ ...body, role_id: roleId })
      .returning();
    return c.json(created, 201);
  }
});

router.delete('/roles/:role_id/team-structure', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const rows = db.select().from(team_structures).where(eq(team_structures.role_id, roleId)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(team_structures).where(eq(team_structures.role_id, roleId));
  return new Response(null, { status: 204 });
});

export default router;
