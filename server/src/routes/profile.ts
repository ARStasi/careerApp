import { Hono } from 'hono';
import { db } from '../db/index.js';
import { profiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = new Hono();

router.get('/profile', async (c) => {
  const profile = db.select().from(profiles).limit(1).all()[0];
  if (!profile) return c.json({ detail: 'Not found' }, 404);
  return c.json(profile);
});

router.put('/profile', async (c) => {
  const body = await c.req.json();
  const existing = db.select().from(profiles).limit(1).all()[0];

  if (existing) {
    const [updated] = await db.update(profiles)
      .set(body)
      .where(eq(profiles.id, existing.id))
      .returning();
    return c.json(updated);
  } else {
    const [created] = await db.insert(profiles).values(body).returning();
    return c.json(created, 201);
  }
});

export default router;
