import enum
from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Boolean, Enum, Float,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


class AccomplishmentCategory(enum.Enum):
    RESUME_BULLET = "resume_bullet"
    SUPPORTING_DETAIL = "supporting_detail"
    KNOWLEDGE_BASE = "knowledge_base"


class SkillType(enum.Enum):
    TECHNICAL = "technical"
    SOFT = "soft"


class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    city = Column(String)
    state = Column(String)
    portfolio_url = Column(String)
    github_url = Column(String)
    linkedin_url = Column(String)


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    industry = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    city = Column(String)
    state = Column(String)
    roles = relationship("Role", back_populates="company", cascade="all, delete-orphan")


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    level = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    city = Column(String)
    state = Column(String)
    is_remote = Column(Boolean, default=False)
    summary = Column(Text)

    company = relationship("Company", back_populates="roles")
    accomplishments = relationship("Accomplishment", back_populates="role", cascade="all, delete-orphan")
    role_skills = relationship("RoleSkill", back_populates="role", cascade="all, delete-orphan")
    awards = relationship("Award", back_populates="role", cascade="all, delete-orphan")
    presentations = relationship("Presentation", back_populates="role", cascade="all, delete-orphan")
    team_structure = relationship("TeamStructure", back_populates="role", uselist=False, cascade="all, delete-orphan")
    org_position = relationship("OrgPosition", back_populates="role", uselist=False, cascade="all, delete-orphan")
    knowledge_entries = relationship("KnowledgeEntry", back_populates="role", cascade="all, delete-orphan")
    responsibilities = relationship("Responsibility", back_populates="role", cascade="all, delete-orphan")


class Accomplishment(Base):
    __tablename__ = "accomplishments"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    description = Column(Text, nullable=False)
    tech_stack = Column(String)
    key_result = Column(String)
    category = Column(Enum(AccomplishmentCategory), default=AccomplishmentCategory.RESUME_BULLET)
    sort_order = Column(Integer, default=0)

    role = relationship("Role", back_populates="accomplishments")


class Responsibility(Base):
    __tablename__ = "responsibilities"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    description = Column(Text, nullable=False)
    sort_order = Column(Integer, default=0)

    role = relationship("Role", back_populates="responsibilities")


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    skill_type = Column(Enum(SkillType), default=SkillType.TECHNICAL)


class RoleSkill(Base):
    __tablename__ = "role_skills"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    proficiency = Column(String)

    role = relationship("Role", back_populates="role_skills")
    skill = relationship("Skill")

    __table_args__ = (UniqueConstraint("role_id", "skill_id"),)


class Award(Base):
    __tablename__ = "awards"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    date = Column(Date)
    issuer = Column(String)
    resume_relevant = Column(Boolean, default=False)

    role = relationship("Role", back_populates="awards")


class Presentation(Base):
    __tablename__ = "presentations"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    title = Column(String, nullable=False)
    venue = Column(String)
    date = Column(Date)
    audience = Column(String)
    resume_relevant = Column(Boolean, default=False)

    role = relationship("Role", back_populates="presentations")


class TeamStructure(Base):
    __tablename__ = "team_structures"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, unique=True)
    direct_reports = Column(Integer, default=0)
    team_size = Column(Integer, default=0)
    responsibilities = Column(Text)

    role = relationship("Role", back_populates="team_structure")


class OrgPosition(Base):
    __tablename__ = "org_positions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, unique=True)
    reports_to = Column(String)
    department = Column(String)
    org_level = Column(String)

    role = relationship("Role", back_populates="org_position")


class Education(Base):
    __tablename__ = "education"
    id = Column(Integer, primary_key=True, index=True)
    institution = Column(String, nullable=False)
    degree = Column(String)
    field = Column(String)
    city = Column(String)
    state = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)


class Certification(Base):
    __tablename__ = "certifications"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    issuing_org = Column(String)
    issue_date = Column(Date)
    expiry_date = Column(Date)
    credential_id = Column(String)


class ApplicationStatus(enum.Enum):
    APPLIED = "applied"
    EMAIL_REJECTED = "email_rejected"
    GHOSTED = "ghosted"
    WITHDREW = "withdrew"
    REQ_PULLED = "req_pulled"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_REJECTED = "interview_rejected"
    OFFERED = "offered"
    ACCEPTED = "accepted"


class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    req_url = Column(String)
    date_applied = Column(Date, nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED)
    status_date = Column(Date)
    cover_letter_submitted = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="knowledge_entries")
