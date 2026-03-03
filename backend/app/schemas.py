import datetime
from typing import Optional
from pydantic import BaseModel


# ---- Profile ----
class ProfileBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None

class ProfileOut(ProfileBase):
    id: int
    model_config = {"from_attributes": True}


# ---- Company ----
class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    city: Optional[str] = None
    state: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyOut(CompanyBase):
    id: int
    model_config = {"from_attributes": True}


# ---- Role ----
class RoleBase(BaseModel):
    title: str
    level: Optional[str] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_remote: bool = False
    summary: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int
    company_id: int
    model_config = {"from_attributes": True}


# ---- Accomplishment ----
class AccomplishmentBase(BaseModel):
    description: str
    tech_stack: Optional[str] = None
    key_result: Optional[str] = None
    category: str = "resume_bullet"
    sort_order: int = 0

class AccomplishmentCreate(AccomplishmentBase):
    pass

class AccomplishmentOut(AccomplishmentBase):
    id: int
    role_id: int
    model_config = {"from_attributes": True}


# ---- Responsibility ----
class ResponsibilityBase(BaseModel):
    description: str
    sort_order: int = 0

class ResponsibilityCreate(ResponsibilityBase):
    pass

class ResponsibilityOut(ResponsibilityBase):
    id: int
    role_id: int
    model_config = {"from_attributes": True}


# ---- Skill ----
class SkillBase(BaseModel):
    name: str
    skill_type: str = "technical"

class SkillCreate(SkillBase):
    pass

class SkillOut(SkillBase):
    id: int
    model_config = {"from_attributes": True}


# ---- RoleSkill ----
class RoleSkillBase(BaseModel):
    skill_id: int
    proficiency: Optional[str] = None

class RoleSkillCreate(RoleSkillBase):
    pass

class RoleSkillOut(RoleSkillBase):
    id: int
    role_id: int
    skill_name: Optional[str] = None
    model_config = {"from_attributes": True}


# ---- Award ----
class AwardBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[datetime.date] = None
    issuer: Optional[str] = None
    resume_relevant: bool = False

class AwardCreate(AwardBase):
    pass

class AwardOut(AwardBase):
    id: int
    role_id: int
    model_config = {"from_attributes": True}


# ---- Presentation ----
class PresentationBase(BaseModel):
    title: str
    venue: Optional[str] = None
    date: Optional[datetime.date] = None
    audience: Optional[str] = None
    resume_relevant: bool = False

class PresentationCreate(PresentationBase):
    pass

class PresentationOut(PresentationBase):
    id: int
    role_id: int
    model_config = {"from_attributes": True}


# ---- TeamStructure ----
class TeamStructureBase(BaseModel):
    direct_reports: int = 0
    team_size: int = 0
    responsibilities: Optional[str] = None

class TeamStructureOut(TeamStructureBase):
    id: int
    role_id: int
    model_config = {"from_attributes": True}


# ---- OrgPosition ----
class OrgPositionBase(BaseModel):
    reports_to: Optional[str] = None
    department: Optional[str] = None
    org_level: Optional[str] = None

class OrgPositionOut(OrgPositionBase):
    id: int
    role_id: int
    model_config = {"from_attributes": True}


# ---- Education ----
class EducationBase(BaseModel):
    institution: str
    degree: Optional[str] = None
    field: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None

class EducationCreate(EducationBase):
    pass

class EducationOut(EducationBase):
    id: int
    model_config = {"from_attributes": True}


# ---- Certification ----
class CertificationBase(BaseModel):
    name: str
    issuing_org: Optional[str] = None
    issue_date: Optional[datetime.date] = None
    expiry_date: Optional[datetime.date] = None
    credential_id: Optional[str] = None

class CertificationCreate(CertificationBase):
    pass

class CertificationOut(CertificationBase):
    id: int
    model_config = {"from_attributes": True}


# ---- KnowledgeEntry ----
class KnowledgeEntryBase(BaseModel):
    company_id: Optional[int] = None
    role_id: Optional[int] = None
    title: str
    content: Optional[str] = None

class KnowledgeEntryCreate(KnowledgeEntryBase):
    pass

class KnowledgeEntryOut(KnowledgeEntryBase):
    id: int
    created_at: Optional[datetime.datetime] = None
    model_config = {"from_attributes": True}


# ---- JobApplication ----
class JobApplicationBase(BaseModel):
    company_name: str
    job_title: str
    req_url: Optional[str] = None
    date_applied: datetime.date
    status: str = "applied"
    status_date: Optional[datetime.date] = None
    cover_letter_submitted: bool = False
    notes: Optional[str] = None

class JobApplicationCreate(JobApplicationBase):
    pass

class JobApplicationUpdate(JobApplicationBase):
    pass

class JobApplicationStatusUpdate(BaseModel):
    status: str
    status_date: Optional[datetime.date] = None

class JobApplicationOut(JobApplicationBase):
    id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None
    model_config = {"from_attributes": True}


# ---- Workflow ----
class ExportRequest(BaseModel):
    role_ids: list[int]
    include_supporting: bool = True
    include_awards: bool = True
    include_presentations: bool = True
    include_responsibilities: bool = True

class YamlConvertRequest(BaseModel):
    yaml_content: str
    company_name: str

class YamlValidateRequest(BaseModel):
    yaml_content: str

class ReorderRequest(BaseModel):
    accomplishment_ids: list[int]

class ReorderResponsibilitiesRequest(BaseModel):
    responsibility_ids: list[int]
