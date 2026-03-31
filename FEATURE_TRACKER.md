# Feature Tracker

Last audited: 2026-02-16

Status legend:
- `[x]` Completed (implemented in current codebase)
- `[ ]` Backlog (planned / not implemented yet)

## App Snapshot (for fast AI context)

- Stack: React + TypeScript (Vite, Mantine, React Query) frontend; Node.js + Hono + Drizzle + SQLite backend for the web app.
- Data store: SQLite database (`backend/career_data.db`) with optional override via `CAREER_DB_PATH`.
- Core domain: career profile management + resume assembly workflow that exports markdown, validates YAML, and converts YAML to `.docx`.

## Completed Features

### Platform and Runtime

- [x] Combined dev launcher starts frontend and backend together (`npm run dev`).
- [x] Dedicated backend and frontend dev commands (`npm run dev:backend`, `npm run dev:frontend`).
- [x] Dev script validates Node and Python prerequisites before boot.
- [x] Node backend with local CORS configuration for Vite dev hosts.
- [x] SQLite-backed API for web app data access.

### Global App UI

- [x] Persistent app shell with left navigation.
- [x] Route-based pages for Dashboard, Profile, Companies, Education, Certifications, and Resume Workflow.
- [x] Role detail deep-link route (`/companies/:companyId/roles/:roleId`).
- [x] Global Knowledge Base route/page in main navigation.

### Dashboard

- [x] Profile-aware greeting.
- [x] Live summary cards for company count, education count, and certification count.
- [x] Resume workflow prompt on dashboard.

### Profile Management

- [x] Profile upsert (single-record profile model).
- [x] Profile display card mode and edit mode toggle.
- [x] Auto-start in edit mode when no profile exists yet.
- [x] Editable fields: name, email, phone, city, state, portfolio, GitHub, LinkedIn.
- [x] Save/cancel flow with success notifications.

### Companies and Roles

- [x] Company CRUD (create, list, edit, delete).
- [x] Company fields for name, description, industry, dates, and location.
- [x] "Current company" UX that clears end date.
- [x] Roles grouped under each company and displayed in accordion sections.
- [x] Role creation from company card.
- [x] Role fields for title, level, dates, location, remote flag, and summary.
- [x] "Current role" UX that clears end date.
- [x] Navigation from company role list to role detail workspace.
- [x] Role edit and delete actions directly on the role detail page.

### Role Detail Workspace

- [x] Breadcrumb navigation back to companies.
- [x] Role header with title, level, date range, location, and remote state.
- [x] Tabbed editing workspace for role-linked data.

### Role Tab: Accomplishments

- [x] Accomplishment CRUD.
- [x] Category support (`resume_bullet`, `supporting_detail`, `knowledge_base`).
- [x] Per-item `tech_stack`, `key_result`, and `sort_order`.
- [x] Category badges and visual differentiation.
- [x] Backend API endpoint for reorder operations by ID list.
- [x] Drag-and-drop reordering UI wired to reorder API.

### Role Tab: Skills

- [x] Global skill catalog list.
- [x] Role-to-skill assignment list with remove action.
- [x] Add existing skill to role from searchable select.
- [x] Create new global skill and immediately assign it to role.
- [x] Duplicate prevention for global skill names and role-skill associations.

### Role Tab: Awards

- [x] Award list and add flow in UI.
- [x] Award delete flow in UI.
- [x] Award edit flow in UI.
- [x] Resume relevance flag captured on create.
- [x] Award update support in backend API.

### Role Tab: Presentations

- [x] Presentation list and add flow in UI.
- [x] Presentation delete flow in UI.
- [x] Presentation edit flow in UI.
- [x] Resume relevance flag captured on create.
- [x] Presentation update support in backend API.

### Role Tab: Team Structure

- [x] Team structure get/upsert in UI.
- [x] Direct reports, team size, and responsibilities fields.
- [x] One team structure record per role (backend one-to-one model).

### Role Tab: Org Position

- [x] Org position get/upsert in UI.
- [x] Reports-to, department, and org-level fields.
- [x] One org position record per role (backend one-to-one model).

### Role Tab: Notes (Knowledge Base)

- [x] Knowledge note list for a role.
- [x] Knowledge note create flow for a role.
- [x] Knowledge note delete flow.
- [x] Knowledge note edit flow for a role.
- [x] Backend filtering by `role_id` and/or `company_id`.
- [x] Backend update endpoint for knowledge entries.
- [x] Global knowledge base page with full CRUD and search/filter support.

### Education

- [x] Education CRUD page.
- [x] Education fields for institution, degree, field, location, and optional dates.
- [x] Date normalization (`"" -> null`) before save.

### Certifications

- [x] Certification CRUD page.
- [x] Certification fields for issuing org, issue/expiry dates, and credential ID.

### Resume Workflow

- [x] 5-step guided workflow (data selection -> export -> instructions -> YAML validation -> Word download).
- [x] Multi-role selection across companies.
- [x] Export toggles for supporting details, awards, and presentations.
- [x] Markdown export generation from selected role data.
- [x] Copy-to-clipboard for export content.
- [x] Fetch and display AI instructions from backend asset file.
- [x] Copy-to-clipboard for AI instructions.
- [x] YAML paste/edit area for AI-generated resume output.
- [x] YAML validation endpoint integration with structured pass/fail feedback.
- [x] YAML-to-Word conversion endpoint integration.
- [x] Browser download of generated `.docx` with filename from response headers.
- [x] Each YAML-to-Word conversion is persisted on disk to `tailored-resumes/` with collision-safe filenames.

### Export and Document Services

- [x] Markdown export builder groups selected roles by company.
- [x] Export includes profile, work experience, education, and certifications sections.
- [x] Export includes team context and role skills.
- [x] Export includes resume bullets by category and optional supporting details.
- [x] Export includes only resume-relevant awards/presentations when enabled.
- [x] YAML validator checks parseability and required schema keys.
- [x] Word generator builds a formatted resume document from YAML structure.
- [x] Word filename pattern includes candidate name, target company, and current date.

### API Surface (Implemented)

- [x] Profile: `GET/PUT /api/profile`
- [x] Companies: `GET/POST /api/companies`, `GET/PUT/DELETE /api/companies/{company_id}`
- [x] Roles: `GET/POST /api/companies/{company_id}/roles`, `GET/PUT/DELETE /api/roles/{role_id}`
- [x] Accomplishments: `GET/POST /api/roles/{role_id}/accomplishments`, `PUT/DELETE /api/accomplishments/{acc_id}`, `PATCH /api/roles/{role_id}/accomplishments/reorder`
- [x] Skills: `GET/POST /api/skills`, `GET/POST /api/roles/{role_id}/skills`, `DELETE /api/roles/{role_id}/skills/{skill_id}`
- [x] Awards: `GET/POST /api/roles/{role_id}/awards`, `PUT/DELETE /api/awards/{award_id}`
- [x] Presentations: `GET/POST /api/roles/{role_id}/presentations`, `PUT/DELETE /api/presentations/{pres_id}`
- [x] Team structure: `GET/PUT/DELETE /api/roles/{role_id}/team-structure`
- [x] Org position: `GET/PUT/DELETE /api/roles/{role_id}/org-position`
- [x] Education: `GET/POST /api/education`, `PUT/DELETE /api/education/{edu_id}`
- [x] Certifications: `GET/POST /api/certifications`, `PUT/DELETE /api/certifications/{cert_id}`
- [x] Knowledge base: `GET/POST /api/knowledge`, `PUT/DELETE /api/knowledge/{entry_id}`
- [x] Resume workflow: `POST /api/workflow/export-document`, `GET /api/workflow/instructions`, `POST /api/workflow/validate-yaml`, `POST /api/workflow/convert-yaml`

### Data Model Capabilities

- [x] Relational model linking companies -> roles -> accomplishments/skills/awards/presentations/team/org/knowledge.
- [x] Cascading deletes from company and role down to dependent records.
- [x] Unique constraints: `skills.name`, `(role_id, skill_id)` in role-skill association.
- [x] Enum-backed accomplishment categories and skill types.

### Seed/Bootstrap Data

- [x] Bulk loader script that can populate profile, companies, roles, accomplishments, skills, awards, presentations, team/org structure, certifications, and knowledge entries via API.

### Quality Automation

- [x] GitHub Actions CI for backend tests plus frontend lint/build (`.github/workflows/ci.yml`).

## Backlog (Add New Features Here)

- [ ] Reorder Resume Workflow steps so users start by copying instructions, then select roles/options, then generate export data.
- [ ] Update Resume Workflow step labels/descriptions so they reflect the actual process: instructions -> role data export -> paste YAML -> validate -> convert/download.

## Maintenance Rules

- When a feature is implemented, change its checkbox from `[ ]` to `[x]`.
- Keep completed items in place (do not delete history).
- For any new feature, add one short line under the most relevant section.
- Re-run a feature audit after large refactors and update `Last audited` date.
