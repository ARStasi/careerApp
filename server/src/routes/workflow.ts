import { Hono } from 'hono';
import yaml from 'js-yaml';
import { desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { roles } from '../db/schema.js';
import { generateExportDocument } from '../services/exportService.js';
import { getInstructions, saveInstructions } from '../services/instructionsService.js';
import { convertYamlToWordBytes } from '../services/yamlToWord.js';
import { persistResumeOutput } from '../services/outputPersistenceService.js';

const router = new Hono();

router.post('/workflow/quick-export', async (c) => {
  const body = await c.req.json() as {
    include_supporting?: boolean;
    include_awards?: boolean;
    include_presentations?: boolean;
    include_responsibilities?: boolean;
    include_team_narrative?: boolean;
  };

  const recentRoles = db.select().from(roles).orderBy(desc(roles.start_date)).limit(5).all();
  const roleIds = recentRoles.map((r) => r.id);

  const content = generateExportDocument(
    roleIds,
    body.include_supporting ?? false,
    body.include_awards ?? false,
    body.include_presentations ?? false,
    body.include_responsibilities ?? true,
    body.include_team_narrative ?? false,
  );

  return c.json({
    content,
    role_ids: roleIds,
    roles: recentRoles.map((r) => ({ id: r.id, title: r.title, start_date: r.start_date, end_date: r.end_date })),
  });
});

router.post('/workflow/export-document', async (c) => {
  const body = await c.req.json() as {
    role_ids: number[];
    include_supporting?: boolean;
    include_awards?: boolean;
    include_presentations?: boolean;
    include_responsibilities?: boolean;
    include_team_narrative?: boolean;
  };

  const content = generateExportDocument(
    body.role_ids,
    body.include_supporting ?? false,
    body.include_awards ?? false,
    body.include_presentations ?? false,
    body.include_responsibilities ?? true,
    body.include_team_narrative ?? false,
  );

  return c.json({ content });
});

router.get('/workflow/instructions', (c) => {
  const content = getInstructions();
  return c.json({ content });
});

router.put('/workflow/instructions', async (c) => {
  const body = await c.req.json() as { content: string };
  saveInstructions(body.content);
  return c.json({ content: body.content });
});

router.post('/workflow/validate-yaml', async (c) => {
  const body = await c.req.json() as { yaml_content: string };

  let parsed: unknown;
  try {
    parsed = yaml.load(body.yaml_content);
  } catch (e: unknown) {
    return c.json({ valid: false, error: `YAML parse error: ${String(e)}` });
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return c.json({ valid: false, error: 'YAML must be a mapping/object' });
  }

  const doc = parsed as Record<string, unknown>;
  if (!('resumeStructure' in doc)) {
    return c.json({ valid: false, error: "Missing top-level 'resumeStructure' key" });
  }

  const rs = doc['resumeStructure'] as Record<string, unknown>;
  const errors: string[] = [];

  for (const key of ['header', 'workExperience', 'education', 'certificationsSkills']) {
    if (!(key in rs)) errors.push(`Missing 'resumeStructure.${key}'`);
  }

  if ('header' in rs) {
    const header = rs['header'] as Record<string, unknown>;
    if (!('line1' in header)) errors.push("Missing 'header.line1'");
    if (!('line2' in header)) errors.push("Missing 'header.line2'");
  }

  if ('workExperience' in rs) {
    const we = rs['workExperience'] as Record<string, unknown>;
    if (!('companies' in we)) errors.push("Missing 'workExperience.companies'");
    else if (!Array.isArray(we['companies'])) errors.push("'workExperience.companies' must be a list");
  }

  if (errors.length > 0) return c.json({ valid: false, errors });
  return c.json({ valid: true });
});

router.post('/workflow/convert-yaml', async (c) => {
  const body = await c.req.json() as { yaml_content: string; company_name: string };

  try {
    const [docBytes, filename] = await convertYamlToWordBytes(body.yaml_content, body.company_name);
    const [, relativePath] = persistResumeOutput(docBytes, filename);

    return new Response(docBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Resume-Output-Path': relativePath,
      },
    });
  } catch (e: unknown) {
    return c.json({ detail: String(e) }, 400);
  }
});

export default router;
