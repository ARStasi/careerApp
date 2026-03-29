import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  city: text('city'),
  state: text('state'),
  portfolio_url: text('portfolio_url'),
  github_url: text('github_url'),
  linkedin_url: text('linkedin_url'),
});

export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  industry: text('industry'),
  start_date: text('start_date'),
  end_date: text('end_date'),
  city: text('city'),
  state: text('state'),
});

export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company_id: integer('company_id').notNull().references(() => companies.id),
  title: text('title').notNull(),
  level: text('level'),
  start_date: text('start_date'),
  end_date: text('end_date'),
  city: text('city'),
  state: text('state'),
  is_remote: integer('is_remote', { mode: 'boolean' }).default(false),
  summary: text('summary'),
});

export const accomplishments = sqliteTable('accomplishments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role_id: integer('role_id').notNull().references(() => roles.id),
  description: text('description').notNull(),
  tech_stack: text('tech_stack'),
  key_result: text('key_result'),
  category: text('category').default('resume_bullet'),
  sort_order: integer('sort_order').default(0),
});

export const responsibilities = sqliteTable('responsibilities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role_id: integer('role_id').notNull().references(() => roles.id),
  description: text('description').notNull(),
  sort_order: integer('sort_order').default(0),
});

export const skills = sqliteTable('skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  skill_type: text('skill_type').default('technical'),
});

export const role_skills = sqliteTable('role_skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role_id: integer('role_id').notNull().references(() => roles.id),
  skill_id: integer('skill_id').notNull().references(() => skills.id),
  proficiency: text('proficiency'),
});

export const awards = sqliteTable('awards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role_id: integer('role_id').notNull().references(() => roles.id),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date'),
  issuer: text('issuer'),
  resume_relevant: integer('resume_relevant', { mode: 'boolean' }).default(false),
});

export const presentations = sqliteTable('presentations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role_id: integer('role_id').notNull().references(() => roles.id),
  title: text('title').notNull(),
  venue: text('venue'),
  date: text('date'),
  audience: text('audience'),
  resume_relevant: integer('resume_relevant', { mode: 'boolean' }).default(false),
});

export const team_structures = sqliteTable('team_structures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role_id: integer('role_id').notNull().unique().references(() => roles.id),
  direct_reports: integer('direct_reports').default(0),
  team_size: integer('team_size').default(0),
  responsibilities: text('responsibilities'),
});

export const org_positions = sqliteTable('org_positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  role_id: integer('role_id').notNull().unique().references(() => roles.id),
  reports_to: text('reports_to'),
  department: text('department'),
  org_level: text('org_level'),
});

export const education = sqliteTable('education', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  institution: text('institution').notNull(),
  degree: text('degree'),
  field: text('field'),
  city: text('city'),
  state: text('state'),
  start_date: text('start_date'),
  end_date: text('end_date'),
});

export const certifications = sqliteTable('certifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  issuing_org: text('issuing_org'),
  issue_date: text('issue_date'),
  expiry_date: text('expiry_date'),
  credential_id: text('credential_id'),
});

export const job_applications = sqliteTable('job_applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company_name: text('company_name').notNull(),
  job_title: text('job_title').notNull(),
  req_url: text('req_url'),
  date_applied: text('date_applied').notNull(),
  status: text('status').default('applied'),
  status_date: text('status_date'),
  cover_letter_submitted: integer('cover_letter_submitted', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
});

export const knowledge_entries = sqliteTable('knowledge_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company_id: integer('company_id'),
  role_id: integer('role_id'),
  title: text('title').notNull(),
  content: text('content'),
  created_at: text('created_at'),
});
