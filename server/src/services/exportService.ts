import { eq, inArray, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  profiles, companies, roles, accomplishments, responsibilities,
  role_skills, skills, awards, presentations, team_structures,
  education, certifications,
} from '../db/schema.js';

function formatDateRange(start: string | null, end: string | null): string {
  const parts: string[] = [];
  if (start) parts.push(formatMonthYear(start));
  if (end) parts.push(formatMonthYear(end));
  else parts.push('Present');
  return parts.length > 0 ? parts.join(' - ') : 'N/A';
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatLocation(city: string | null, state: string | null, isRemote: boolean | null): string {
  let location = '';
  if (city && state) location = `${city}, ${state}`;
  if (isRemote) location = location ? `Remote (${location})` : 'Remote';
  return location || 'N/A';
}

export function generateExportDocument(
  roleIds: number[],
  includingSupporting = false,
  includeAwards = false,
  includePresentations = false,
  includeResponsibilities = true,
  includeTeamNarrative = false,
): string {
  const sections: string[] = [];

  // Profile
  const profile = db.select().from(profiles).limit(1).all()[0];
  if (profile) {
    sections.push('# Profile');
    sections.push(`**Name:** ${profile.name}`);
    if (profile.email) sections.push(`**Email:** ${profile.email}`);
    if (profile.phone) sections.push(`**Phone:** ${profile.phone}`);
    if (profile.city && profile.state) sections.push(`**Location:** ${profile.city}, ${profile.state}`);
    if (profile.portfolio_url) sections.push(`**Portfolio:** ${profile.portfolio_url}`);
    if (profile.linkedin_url) sections.push(`**LinkedIn:** ${profile.linkedin_url}`);
    sections.push('');
  }

  // Roles grouped by company
  const roleRows = roleIds.length > 0
    ? db.select().from(roles).where(inArray(roles.id, roleIds))
        .orderBy(asc(roles.start_date)).all()
        .sort((a, b) => {
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          return a.start_date < b.start_date ? 1 : -1;
        })
    : [];

  const companyRoles: Record<number, typeof roleRows> = {};
  for (const role of roleRows) {
    if (!companyRoles[role.company_id]) companyRoles[role.company_id] = [];
    companyRoles[role.company_id].push(role);
  }

  sections.push('# Work Experience');
  sections.push('');

  for (const [companyIdStr, companyRoleList] of Object.entries(companyRoles)) {
    const companyId = parseInt(companyIdStr);
    const company = db.select().from(companies).where(eq(companies.id, companyId)).limit(1).all()[0];
    if (!company) continue;

    const dateRange = formatDateRange(company.start_date, company.end_date);
    sections.push(`## ${company.name} (${dateRange})`);
    if (company.description) sections.push(`*${company.description}*`);
    if (company.industry) sections.push(`Industry: ${company.industry}`);
    sections.push('');

    for (const role of companyRoleList) {
      const roleRange = formatDateRange(role.start_date, role.end_date);
      const location = formatLocation(role.city, role.state, role.is_remote);
      sections.push(`### ${role.title} (${roleRange}) — ${location}`);
      if (role.summary) sections.push(`\n${role.summary}`);
      sections.push('');

      // Team structure
      const ts = db.select().from(team_structures).where(eq(team_structures.role_id, role.id)).limit(1).all()[0];
      if (ts) {
        const compactParts: string[] = [];
        if (ts.direct_reports) compactParts.push(`${ts.direct_reports} direct reports`);
        if (ts.team_size) compactParts.push(`team of ${ts.team_size}`);
        if (compactParts.length > 0) {
          sections.push(`**Team Context:** ${compactParts.join('; ')}`);
          sections.push('');
        }
        if (includeTeamNarrative && ts.responsibilities) {
          sections.push('**Team Structure Detail:**');
          sections.push(ts.responsibilities);
          sections.push('');
        }
      }

      // Responsibilities
      if (includeResponsibilities) {
        const resps = db.select().from(responsibilities)
          .where(eq(responsibilities.role_id, role.id))
          .orderBy(asc(responsibilities.sort_order))
          .all();
        if (resps.length > 0) {
          sections.push('**Key Responsibilities:**');
          for (const resp of resps) sections.push(`- ${resp.description}`);
          sections.push('');
        }
      }

      // Resume bullets
      const bullets = db.select().from(accomplishments)
        .where(eq(accomplishments.role_id, role.id))
        .orderBy(asc(accomplishments.sort_order))
        .all()
        .filter(a => a.category?.toUpperCase() === 'RESUME_BULLET');
      if (bullets.length > 0) {
        sections.push('**Key Accomplishments:**');
        for (const acc of bullets) {
          sections.push(`- ${acc.description}`);
          if (acc.tech_stack) sections.push(`  - Tech Stack: ${acc.tech_stack}`);
          if (acc.key_result) sections.push(`  - Key Result: ${acc.key_result}`);
        }
        sections.push('');
      }

      // Supporting details
      if (includingSupporting) {
        const supporting = db.select().from(accomplishments)
          .where(eq(accomplishments.role_id, role.id))
          .orderBy(asc(accomplishments.sort_order))
          .all()
          .filter(a => a.category?.toUpperCase() === 'SUPPORTING_DETAIL');
        if (supporting.length > 0) {
          sections.push('**Supporting Details (additional context for AI):**');
          for (const acc of supporting) {
            sections.push(`- ${acc.description}`);
            if (acc.tech_stack) sections.push(`  - Tech Stack: ${acc.tech_stack}`);
            if (acc.key_result) sections.push(`  - Key Result: ${acc.key_result}`);
          }
          sections.push('');
        }
      }

      // Skills for this role
      const roleSkillRows = db.select().from(role_skills)
        .where(eq(role_skills.role_id, role.id))
        .all();
      if (roleSkillRows.length > 0) {
        const skillNames: string[] = [];
        for (const rs of roleSkillRows) {
          const skill = db.select().from(skills).where(eq(skills.id, rs.skill_id)).limit(1).all()[0];
          if (skill) {
            skillNames.push(rs.proficiency ? `${skill.name} (${rs.proficiency})` : skill.name);
          }
        }
        if (skillNames.length > 0) {
          sections.push(`**Skills:** ${skillNames.join(', ')}`);
          sections.push('');
        }
      }

      // Awards
      if (includeAwards) {
        const awardRows = db.select().from(awards)
          .where(eq(awards.role_id, role.id))
          .all()
          .filter(a => a.resume_relevant);
        if (awardRows.length > 0) {
          sections.push('**Awards:**');
          for (const award of awardRows) {
            let line = `- ${award.title}`;
            if (award.issuer) line += ` (${award.issuer})`;
            if (award.date) line += ` — ${formatMonthYear(award.date)}`;
            sections.push(line);
            if (award.description) sections.push(`  ${award.description}`);
          }
          sections.push('');
        }
      }

      // Presentations
      if (includePresentations) {
        const presRows = db.select().from(presentations)
          .where(eq(presentations.role_id, role.id))
          .all()
          .filter(p => p.resume_relevant);
        if (presRows.length > 0) {
          sections.push('**Presentations:**');
          for (const pres of presRows) {
            let line = `- ${pres.title}`;
            if (pres.venue) line += ` at ${pres.venue}`;
            if (pres.date) line += ` (${formatMonthYear(pres.date)})`;
            if (pres.audience) line += ` — Audience: ${pres.audience}`;
            sections.push(line);
          }
          sections.push('');
        }
      }
    }
  }

  // Education
  const eduRows = db.select().from(education).all();
  if (eduRows.length > 0) {
    sections.push('# Education');
    for (const edu of eduRows) {
      let line = `**${edu.institution}**`;
      if (edu.degree && edu.field) line += ` — ${edu.degree} in ${edu.field}`;
      else if (edu.degree) line += ` — ${edu.degree}`;
      if (edu.city && edu.state) line += ` (${edu.city}, ${edu.state})`;
      sections.push(line);
    }
    sections.push('');
  }

  // Certifications
  const certRows = db.select().from(certifications).all();
  if (certRows.length > 0) {
    sections.push('# Certifications');
    for (const cert of certRows) {
      let line = `- **${cert.name}**`;
      if (cert.issuing_org) line += ` — ${cert.issuing_org}`;
      if (cert.issue_date) line += ` (${formatMonthYear(cert.issue_date)})`;
      sections.push(line);
    }
    sections.push('');
  }

  return sections.join('\n');
}
