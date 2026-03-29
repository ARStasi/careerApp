import { Hono } from 'hono';
import { db } from '../db/index.js';
import { skills, role_skills } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

const router = new Hono();

router.get('/skills', async (c) => {
  const rows = db.select().from(skills).orderBy(asc(skills.name)).all();
  return c.json(rows);
});

router.post('/skills', async (c) => {
  const body = await c.req.json() as { name: string; skill_type?: string };
  const existing = db.select().from(skills).where(eq(skills.name, body.name)).all();
  if (existing.length > 0) return c.json({ detail: 'Skill already exists' }, 409);
  const [created] = await db.insert(skills).values(body).returning();
  return c.json(created, 201);
});

router.get('/roles/:role_id/skills', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const rows = db.select().from(role_skills).where(eq(role_skills.role_id, roleId)).all();
  const result = rows.map(rs => {
    const skill = db.select().from(skills).where(eq(skills.id, rs.skill_id)).limit(1).all()[0];
    return {
      id: rs.id,
      role_id: rs.role_id,
      skill_id: rs.skill_id,
      proficiency: rs.proficiency,
      skill_name: skill?.name ?? null,
      skill_type: skill?.skill_type ?? null,
    };
  });
  return c.json(result);
});

router.post('/roles/:role_id/skills', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const body = await c.req.json() as { skill_id: number; proficiency?: string };

  const existing = db.select().from(role_skills)
    .where(eq(role_skills.role_id, roleId))
    .all()
    .find(rs => rs.skill_id === body.skill_id);
  if (existing) return c.json({ detail: 'Skill already associated with this role' }, 409);

  const [created] = await db.insert(role_skills)
    .values({ role_id: roleId, skill_id: body.skill_id, proficiency: body.proficiency ?? null })
    .returning();
  return c.json(created, 201);
});

router.delete('/roles/:role_id/skills/:skill_id', async (c) => {
  const roleId = parseInt(c.req.param('role_id'));
  const skillId = parseInt(c.req.param('skill_id'));
  const rows = db.select().from(role_skills)
    .where(eq(role_skills.role_id, roleId))
    .all()
    .filter(rs => rs.skill_id === skillId);
  if (rows.length === 0) return c.json({ detail: 'Not found' }, 404);
  await db.delete(role_skills).where(eq(role_skills.id, rows[0].id));
  return new Response(null, { status: 204 });
});

export default router;
