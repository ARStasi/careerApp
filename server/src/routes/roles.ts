import { Hono } from 'hono';
import { db } from '../db/index.js';
import { roles, companies } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = new Hono();

router.get('/roles', async (c) => {
  const roleRows = db.select().from(roles).orderBy(desc(roles.start_date)).all();
  const result = roleRows.map(r => {
    const company = db.select().from(companies).where(eq(companies.id, r.company_id)).limit(1).all()[0];
    return { ...r, company_name: company?.name ?? null };
  });
  return c.json(result);
});

router.get('/companies/:company_id/roles', async (c) => {
  const companyId = parseInt(c.req.param('company_id'));
  const rows = db.select().from(roles)
    .where(eq(roles.company_id, companyId))
    .orderBy(desc(roles.start_date))
    .all();
  return c.json(rows);
});

router.post('/companies/:company_id/roles', async (c) => {
  const companyId = parseInt(c.req.param('company_id'));
  const companyExists = db.select().from(companies).where(eq(companies.id, companyId)).all();
  if (companyExists.length === 0) return c.json({ detail: 'Company not found' }, 404);

  const body = await c.req.json();
  const [created] = await db.insert(roles).values({ ...body, company_id: companyId }).returning();
  return c.json(created, 201);
});

router.get('/roles/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [row] = db.select().from(roles).where(eq(roles.id, id)).limit(1).all();
  if (!row) return c.json({ detail: 'Not found' }, 404);
  return c.json(row);
});

router.put('/roles/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const [updated] = await db.update(roles).set(body).where(eq(roles.id, id)).returning();
  if (!updated) return c.json({ detail: 'Not found' }, 404);
  return c.json(updated);
});

router.delete('/roles/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const rows = db.select().from(roles).where(eq(roles.id, id)).all();
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(roles).where(eq(roles.id, id));
  return new Response(null, { status: 204 });
});

export default router;
