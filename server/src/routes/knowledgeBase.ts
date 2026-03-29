import { Hono } from 'hono';
import { db } from '../db/index.js';
import { knowledge_entries } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = new Hono();

router.get('/knowledge', async (c) => {
  const companyId = c.req.query('company_id');
  const roleId = c.req.query('role_id');

  let rows = db.select().from(knowledge_entries).orderBy(desc(knowledge_entries.created_at)).all();

  if (companyId) {
    rows = rows.filter(r => r.company_id === parseInt(companyId));
  }
  if (roleId) {
    rows = rows.filter(r => r.role_id === parseInt(roleId));
  }

  return c.json(rows);
});

router.post('/knowledge', async (c) => {
  const body = await c.req.json();
  const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000000';
  const [created] = await db.insert(knowledge_entries)
    .values({ ...body, created_at: now })
    .returning();
  return c.json(created, 201);
});

router.put('/knowledge/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const [updated] = await db.update(knowledge_entries)
    .set(body)
    .where(eq(knowledge_entries.id, id))
    .returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.delete('/knowledge/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(knowledge_entries).where(eq(knowledge_entries.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(knowledge_entries).where(eq(knowledge_entries.id, id));
  return new Response(null, { status: 204 });
});

export default router;
