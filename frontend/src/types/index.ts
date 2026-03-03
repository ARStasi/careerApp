export interface Profile {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  industry?: string;
  start_date?: string;
  end_date?: string;
  city?: string;
  state?: string;
}

export interface Role {
  id: number;
  company_id: number;
  title: string;
  level?: string;
  start_date?: string;
  end_date?: string;
  city?: string;
  state?: string;
  is_remote: boolean;
  summary?: string;
}

export interface Accomplishment {
  id: number;
  role_id: number;
  description: string;
  tech_stack?: string;
  key_result?: string;
  category: 'resume_bullet' | 'supporting_detail' | 'knowledge_base';
  sort_order: number;
}

export interface Responsibility {
  id: number;
  role_id: number;
  description: string;
  sort_order: number;
}

export interface Skill {
  id: number;
  name: string;
  skill_type: 'technical' | 'soft';
}

export interface RoleSkill {
  id: number;
  role_id: number;
  skill_id: number;
  proficiency?: string;
  skill_name?: string;
}

export interface Award {
  id: number;
  role_id: number;
  title: string;
  description?: string;
  date?: string;
  issuer?: string;
  resume_relevant: boolean;
}

export interface Presentation {
  id: number;
  role_id: number;
  title: string;
  venue?: string;
  date?: string;
  audience?: string;
  resume_relevant: boolean;
}

export interface TeamStructure {
  id: number;
  role_id: number;
  direct_reports: number;
  team_size: number;
  responsibilities?: string;
}

export interface OrgPosition {
  id: number;
  role_id: number;
  reports_to?: string;
  department?: string;
  org_level?: string;
}

export interface Education {
  id: number;
  institution: string;
  degree?: string;
  field?: string;
  city?: string;
  state?: string;
  start_date?: string;
  end_date?: string;
}

export interface Certification {
  id: number;
  name: string;
  issuing_org?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
}

export type ApplicationStatus =
  | 'applied'
  | 'email_rejected'
  | 'ghosted'
  | 'withdrew'
  | 'req_pulled'
  | 'interview_scheduled'
  | 'interview_rejected'
  | 'offered'
  | 'accepted';

export interface JobApplication {
  id: number;
  company_name: string;
  job_title: string;
  req_url?: string;
  date_applied: string;
  status: ApplicationStatus;
  status_date?: string;
  cover_letter_submitted: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeEntry {
  id: number;
  company_id?: number;
  role_id?: number;
  title: string;
  content?: string;
  created_at?: string;
}
