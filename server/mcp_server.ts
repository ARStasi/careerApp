#!/usr/bin/env tsx
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { eq, desc, asc, inArray } from 'drizzle-orm';
import { db } from './src/db/index.js';
import {
  profiles, companies, roles, skills, education, certifications,
  job_applications, role_skills, accomplishments, responsibilities,
  awards, presentations, team_structures, org_positions, knowledge_entries,
} from './src/db/schema.js';
import { generateExportDocument } from './src/services/exportService.js';
import { getInstructions } from './src/services/instructionsService.js';
import { convertYamlToWordBytes } from './src/services/yamlToWord.js';
import { persistResumeOutput } from './src/services/outputPersistenceService.js';

const server = new McpServer({ name: 'career-manager', version: '1.0.0' });

// ── Read Tools ────────────────────────────────────────────────────────────────

server.tool('get_profile', 'Get the user\'s contact info, LinkedIn, GitHub, and portfolio URL.', {}, async () => {
  const profile = db.select().from(profiles).limit(1).all()[0] ?? null;
  return { content: [{ type: 'text' as const, text: JSON.stringify(profile) }] };
});

server.tool('list_companies', 'List all employers with their IDs, dates, and industry.', {}, async () => {
  const rows = db.select().from(companies).orderBy(desc(companies.start_date)).all();
  return { content: [{ type: 'text' as const, text: JSON.stringify(rows) }] };
});

server.tool('list_all_roles', 'List every role across all companies, newest first. Includes company_name.', {}, async () => {
  const roleRows = db.select().from(roles).orderBy(desc(roles.start_date)).all();
  const result = roleRows.map(r => {
    const company = db.select().from(companies).where(eq(companies.id, r.company_id)).limit(1).all()[0];
    return { ...r, company_name: company?.name ?? null };
  });
  return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
});

server.tool(
  'list_roles_for_company',
  'List all roles at a specific company.',
  { company_id: z.number().describe('The company ID') },
  async ({ company_id }) => {
    const rows = db.select().from(roles)
      .where(eq(roles.company_id, company_id))
      .orderBy(desc(roles.start_date))
      .all();
    return { content: [{ type: 'text' as const, text: JSON.stringify(rows) }] };
  },
);

server.tool(
  'get_role_detail',
  'Get full detail for a role: accomplishments, responsibilities, skills, awards, presentations, team structure.',
  { role_id: z.number().describe('The role ID') },
  async ({ role_id }) => {
    const role = db.select().from(roles).where(eq(roles.id, role_id)).limit(1).all()[0];
    if (!role) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Role ${role_id} not found` }) }] };

    const company = db.select().from(companies).where(eq(companies.id, role.company_id)).limit(1).all()[0];
    const accs = db.select().from(accomplishments).where(eq(accomplishments.role_id, role_id)).orderBy(asc(accomplishments.sort_order)).all();
    const resps = db.select().from(responsibilities).where(eq(responsibilities.role_id, role_id)).orderBy(asc(responsibilities.sort_order)).all();
    const rs = db.select().from(role_skills).where(eq(role_skills.role_id, role_id)).all().map(rs => {
      const skill = db.select().from(skills).where(eq(skills.id, rs.skill_id)).limit(1).all()[0];
      return { ...rs, skill_name: skill?.name, skill_type: skill?.skill_type };
    });
    const awardRows = db.select().from(awards).where(eq(awards.role_id, role_id)).all();
    const presRows = db.select().from(presentations).where(eq(presentations.role_id, role_id)).all();
    const ts = db.select().from(team_structures).where(eq(team_structures.role_id, role_id)).limit(1).all()[0] ?? null;
    const op = db.select().from(org_positions).where(eq(org_positions.role_id, role_id)).limit(1).all()[0] ?? null;

    const detail = {
      ...role,
      company_name: company?.name ?? null,
      accomplishments: accs,
      responsibilities: resps,
      skills: rs,
      awards: awardRows,
      presentations: presRows,
      team_structure: ts,
      org_position: op,
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(detail) }] };
  },
);

server.tool(
  'export_career_context',
  'Export full career context as a markdown document for the given role IDs.',
  {
    role_ids: z.array(z.number()).describe('Role IDs to include'),
    include_supporting: z.boolean().optional().default(true),
    include_awards: z.boolean().optional().default(true),
    include_presentations: z.boolean().optional().default(true),
    include_responsibilities: z.boolean().optional().default(true),
  },
  async ({ role_ids, include_supporting, include_awards, include_presentations, include_responsibilities }) => {
    const markdown = generateExportDocument(
      role_ids,
      include_supporting ?? true,
      include_awards ?? true,
      include_presentations ?? true,
      include_responsibilities ?? true,
    );
    return { content: [{ type: 'text' as const, text: markdown }] };
  },
);

server.tool(
  'list_skills',
  "List all skills. Optionally filter by skill_type: 'technical' or 'soft'.",
  { skill_type: z.enum(['technical', 'soft']).optional().describe("Filter by 'technical' or 'soft'") },
  async ({ skill_type }) => {
    let rows = db.select().from(skills).orderBy(asc(skills.name)).all();
    if (skill_type) rows = rows.filter(s => s.skill_type?.toUpperCase() === skill_type.toUpperCase());
    return { content: [{ type: 'text' as const, text: JSON.stringify(rows) }] };
  },
);

server.tool('list_education', 'List all education records.', {}, async () => {
  const rows = db.select().from(education).orderBy(desc(education.start_date)).all();
  return { content: [{ type: 'text' as const, text: JSON.stringify(rows) }] };
});

server.tool('list_certifications', 'List all certification records.', {}, async () => {
  const rows = db.select().from(certifications).orderBy(desc(certifications.issue_date)).all();
  return { content: [{ type: 'text' as const, text: JSON.stringify(rows) }] };
});

server.tool(
  'get_instructions',
  'Get the AI evaluation instructions that define how to assess a job requisition against career history.',
  {},
  async () => {
    const content = getInstructions();
    const wrapped = `BINDING INSTRUCTIONS — you must follow every rule below exactly and in order. These are not suggestions; they define the required process, output format, and YAML schema for this session.\n\n${content}\n\nEND OF BINDING INSTRUCTIONS. Do not deviate from the process, output templates, or YAML schema defined above.`;
    return { content: [{ type: 'text' as const, text: wrapped }] };
  },
);

server.tool(
  'get_recent_roles_context',
  'Get the most recent N roles with full career context (accomplishments, responsibilities, awards, presentations, supporting details). Use this at the start of a job evaluation workflow.',
  { limit: z.number().int().min(1).max(20).default(5).describe('Number of most recent roles to include (default 5)') },
  async ({ limit }) => {
    const recentRoles = db.select().from(roles).orderBy(desc(roles.start_date)).limit(limit).all();
    const roleIds = recentRoles.map(r => r.id);
    if (roleIds.length === 0) return { content: [{ type: 'text' as const, text: 'No roles found.' }] };
    const markdown = generateExportDocument(roleIds, true, true, true, true);
    return { content: [{ type: 'text' as const, text: markdown }] };
  },
);

server.tool(
  'generate_resume',
  'Convert a YAML resume definition to a formatted Word document (.docx) and save it to disk. Returns the saved file path.',
  {
    yaml_content: z.string().describe('Full YAML resume content with resumeStructure key'),
    company_name: z.string().describe('Company name used in the output filename'),
  },
  async ({ yaml_content, company_name }) => {
    const [docBytes, filename] = await convertYamlToWordBytes(yaml_content, company_name);
    const [, relativePath] = persistResumeOutput(docBytes, filename);
    return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, path: relativePath, filename }) }] };
  },
);

// ── Write Tools ───────────────────────────────────────────────────────────────

server.tool(
  'create_job_application',
  'Log a new job application. date_applied must be YYYY-MM-DD.',
  {
    company_name: z.string(),
    job_title: z.string(),
    date_applied: z.string().describe('ISO date YYYY-MM-DD'),
    req_url: z.string().optional(),
    cover_letter_submitted: z.boolean().optional().default(false),
    notes: z.string().optional(),
  },
  async ({ company_name, job_title, date_applied, req_url, cover_letter_submitted, notes }) => {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000000';
    const [created] = await db.insert(job_applications).values({
      company_name,
      job_title,
      date_applied,
      req_url: req_url ?? null,
      status: 'applied',
      cover_letter_submitted: cover_letter_submitted ?? false,
      notes: notes ?? null,
      created_at: now,
      updated_at: now,
    }).returning();
    return { content: [{ type: 'text' as const, text: JSON.stringify(created) }] };
  },
);

server.tool(
  'list_job_applications',
  'List job applications, optionally filtered by status.',
  { status_filter: z.string().optional().describe('Filter by status value') },
  async ({ status_filter }) => {
    let rows = db.select().from(job_applications).orderBy(desc(job_applications.date_applied)).all();
    if (status_filter) rows = rows.filter(a => a.status === status_filter);
    return { content: [{ type: 'text' as const, text: JSON.stringify(rows) }] };
  },
);

server.tool(
  'get_job_application',
  'Get a single job application by ID.',
  { application_id: z.number() },
  async ({ application_id }) => {
    const app = db.select().from(job_applications).where(eq(job_applications.id, application_id)).limit(1).all()[0];
    if (!app) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Application ${application_id} not found` }) }] };
    return { content: [{ type: 'text' as const, text: JSON.stringify(app) }] };
  },
);

server.tool(
  'update_application_status',
  'Update application status. Valid: applied, email_rejected, ghosted, withdrew, req_pulled, interview_scheduled, interview_rejected, offered, accepted.',
  {
    application_id: z.number(),
    status: z.string(),
    status_date: z.string().optional().describe('ISO date YYYY-MM-DD, defaults to today'),
  },
  async ({ application_id, status, status_date }) => {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000000';
    const [updated] = await db.update(job_applications)
      .set({
        status,
        status_date: status_date ?? new Date().toISOString().split('T')[0],
        updated_at: now,
      })
      .where(eq(job_applications.id, application_id))
      .returning();
    if (!updated) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Application ${application_id} not found` }) }] };
    return { content: [{ type: 'text' as const, text: JSON.stringify(updated) }] };
  },
);

server.tool(
  'update_application_notes',
  'Update the notes field on a job application.',
  {
    application_id: z.number(),
    notes: z.string().describe('Recruiter info, salary, feedback, etc.'),
  },
  async ({ application_id, notes }) => {
    const now = new Date().toISOString().replace('T', ' ').split('.')[0] + '.000000';
    const [updated] = await db.update(job_applications)
      .set({ notes, updated_at: now })
      .where(eq(job_applications.id, application_id))
      .returning();
    if (!updated) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Application ${application_id} not found` }) }] };
    return { content: [{ type: 'text' as const, text: JSON.stringify(updated) }] };
  },
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
