# Resume Creator — Agent Workflow

This project exposes career data and resume generation tools via the **career-manager MCP server**.

## Job Requisition Workflow

When the user expresses interest in a role or provides a job requisition, follow these steps **in order**. Do not skip or reorder steps.

### Step 1 — Fetch instructions and career context (run in parallel)

Immediately call both of these MCP tools before doing any analysis:

1. `get_instructions` — retrieves the evaluation and resume-generation instructions
2. `get_recent_roles_context` with `limit: 5` — retrieves the last 5 roles with full supporting details, accomplishments, awards, presentations, and responsibilities

Do not proceed until both calls return.

### Step 2 — Apply the instructions (Phase 1: Analysis)

The text returned by `get_instructions` contains the full process to follow. Apply it exactly:

- Use the career context from `get_recent_roles_context` as the user's materials (substitutes for the user pasting their history manually)
- The job requisition the user provided is the input for Phase 1 analysis
- Output the Analysis as specified in the instructions — fit score, qualification table, keyword coverage, gaps, top adjustments, and clarifying questions
- **Do not generate YAML yet.** Wait for the user to review and respond.

### Step 3 — Answer questions / proceed

Wait for the user to answer the clarifying questions or explicitly say to proceed.

### Step 4 — Generate resume (Phase 2)

Once the user confirms or answers:

1. Generate the YAML resume following the schema defined in `get_instructions`
2. Call `generate_resume` with the complete YAML content and the company name
3. Report the saved file path to the user

### Step 5 — Log the application

Call `create_job_application` with:
- `company_name` — from the req
- `job_title` — from the req
- `date_applied` — today's date (YYYY-MM-DD)
- `req_url` — if the user provided a URL
- `notes` — brief summary of fit score and any notable gaps

## MCP Tools Reference

| Tool | When to use |
|---|---|
| `get_instructions` | Step 1 — fetch evaluation + YAML generation rules |
| `get_recent_roles_context(limit)` | Step 1 — fetch last N roles with full context (default 5) |
| `get_profile` | If you need contact info for the resume header |
| `list_education` | If education is needed and not in the roles context |
| `list_certifications` | If certs are needed for the skills section |
| `generate_resume(yaml_content, company_name)` | Step 4 — convert finalized YAML to Word doc |
| `create_job_application(...)` | Step 5 — log the application |
| `update_application_notes(id, notes)` | If you need to add notes to an existing application |
