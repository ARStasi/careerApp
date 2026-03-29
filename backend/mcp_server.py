#!/usr/bin/env python3
import sys
import os
from contextlib import contextmanager
from datetime import date
from typing import Optional

sys.path.insert(0, os.path.dirname(__file__))  # makes `app` importable

from mcp.server.fastmcp import FastMCP
from app.database import SessionLocal
from app.models import (
    Profile, Company, Role, Skill, SkillType,
    Education, Certification, JobApplication, ApplicationStatus,
    Accomplishment, RoleSkill, Award, Presentation, TeamStructure, OrgPosition,
    Responsibility, AccomplishmentCategory,
)
from app.services.export_service import generate_export_document

mcp = FastMCP("career-manager")


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _date_str(d) -> Optional[str]:
    return d.isoformat() if d else None


def _profile_dict(p) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "email": p.email,
        "phone": p.phone,
        "city": p.city,
        "state": p.state,
        "portfolio_url": p.portfolio_url,
        "github_url": p.github_url,
        "linkedin_url": p.linkedin_url,
    }


def _company_dict(c) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "industry": c.industry,
        "start_date": _date_str(c.start_date),
        "end_date": _date_str(c.end_date),
        "city": c.city,
        "state": c.state,
    }


def _role_summary_dict(r, company_name: str = None) -> dict:
    return {
        "id": r.id,
        "company_id": r.company_id,
        "company_name": company_name or (r.company.name if r.company else None),
        "title": r.title,
        "level": r.level,
        "start_date": _date_str(r.start_date),
        "end_date": _date_str(r.end_date),
        "city": r.city,
        "state": r.state,
        "is_remote": r.is_remote,
        "summary": r.summary,
    }


def _role_detail_dict(r) -> dict:
    d = _role_summary_dict(r)
    d["accomplishments"] = [
        {
            "id": a.id,
            "description": a.description,
            "tech_stack": a.tech_stack,
            "key_result": a.key_result,
            "category": a.category.value if a.category else None,
            "sort_order": a.sort_order,
        }
        for a in sorted(r.accomplishments, key=lambda x: x.sort_order or 0)
    ]
    d["responsibilities"] = [
        {
            "id": resp.id,
            "description": resp.description,
            "sort_order": resp.sort_order,
        }
        for resp in sorted(r.responsibilities, key=lambda x: x.sort_order or 0)
    ]
    d["skills"] = [
        {
            "skill_id": rs.skill_id,
            "name": rs.skill.name if rs.skill else None,
            "skill_type": rs.skill.skill_type.value if rs.skill and rs.skill.skill_type else None,
            "proficiency": rs.proficiency,
        }
        for rs in r.role_skills
    ]
    d["awards"] = [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "date": _date_str(a.date),
            "issuer": a.issuer,
            "resume_relevant": a.resume_relevant,
        }
        for a in r.awards
    ]
    d["presentations"] = [
        {
            "id": p.id,
            "title": p.title,
            "venue": p.venue,
            "date": _date_str(p.date),
            "audience": p.audience,
            "resume_relevant": p.resume_relevant,
        }
        for p in r.presentations
    ]
    d["team_structure"] = (
        {
            "direct_reports": r.team_structure.direct_reports,
            "team_size": r.team_structure.team_size,
            "responsibilities": r.team_structure.responsibilities,
        }
        if r.team_structure
        else None
    )
    d["org_position"] = (
        {
            "reports_to": r.org_position.reports_to,
            "department": r.org_position.department,
            "org_level": r.org_position.org_level,
        }
        if r.org_position
        else None
    )
    return d


def _application_dict(app) -> dict:
    return {
        "id": app.id,
        "company_name": app.company_name,
        "job_title": app.job_title,
        "req_url": app.req_url,
        "date_applied": _date_str(app.date_applied),
        "status": app.status.value if app.status else None,
        "status_date": _date_str(app.status_date),
        "cover_letter_submitted": app.cover_letter_submitted,
        "notes": app.notes,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None,
    }


# ─── Read Tools ────────────────────────────────────────────────────────────────

@mcp.tool()
def get_profile() -> dict:
    """Get the user's contact info, LinkedIn, GitHub, and portfolio URL."""
    with get_db() as db:
        profile = db.query(Profile).first()
        if not profile:
            return {"error": "No profile found"}
        return _profile_dict(profile)


@mcp.tool()
def list_companies() -> list[dict]:
    """List all employers with their IDs, dates, and industry."""
    with get_db() as db:
        companies = db.query(Company).order_by(Company.start_date.desc()).all()
        return [_company_dict(c) for c in companies]


@mcp.tool()
def list_all_roles() -> list[dict]:
    """List every role across all companies, newest first. Includes company_name."""
    with get_db() as db:
        roles = (
            db.query(Role)
            .join(Company, Role.company_id == Company.id)
            .order_by(Role.start_date.desc())
            .all()
        )
        return [_role_summary_dict(r) for r in roles]


@mcp.tool()
def list_roles_for_company(company_id: int) -> list[dict]:
    """List all roles at a specific company by company_id."""
    with get_db() as db:
        roles = (
            db.query(Role)
            .filter(Role.company_id == company_id)
            .order_by(Role.start_date.desc())
            .all()
        )
        return [_role_summary_dict(r) for r in roles]


@mcp.tool()
def get_role_detail(role_id: int) -> dict:
    """Get full detail for a role: accomplishments, responsibilities, skills, awards, presentations, team structure."""
    with get_db() as db:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return {"error": f"Role {role_id} not found"}
        return _role_detail_dict(role)


@mcp.tool()
def export_career_context(
    role_ids: list[int],
    include_supporting: bool = True,
    include_awards: bool = True,
    include_presentations: bool = True,
    include_responsibilities: bool = True,
) -> str:
    """Export full career context as a markdown document for the given role IDs.

    Pass role_ids from list_all_roles(). Set include_supporting=True to include
    additional context bullets beyond resume bullets.
    """
    with get_db() as db:
        return generate_export_document(
            db=db,
            role_ids=role_ids,
            include_supporting=include_supporting,
            include_awards=include_awards,
            include_presentations=include_presentations,
            include_responsibilities=include_responsibilities,
        )


@mcp.tool()
def list_skills(skill_type: Optional[str] = None) -> list[dict]:
    """List all skills. Optionally filter by skill_type: 'technical' or 'soft'."""
    with get_db() as db:
        query = db.query(Skill)
        if skill_type:
            try:
                st = SkillType(skill_type.lower())
                query = query.filter(Skill.skill_type == st)
            except ValueError:
                return [{"error": f"Invalid skill_type '{skill_type}'. Use 'technical' or 'soft'."}]
        skills = query.order_by(Skill.name).all()
        return [
            {"id": s.id, "name": s.name, "skill_type": s.skill_type.value if s.skill_type else None}
            for s in skills
        ]


@mcp.tool()
def list_education() -> list[dict]:
    """List all education records."""
    with get_db() as db:
        education = db.query(Education).order_by(Education.start_date.desc()).all()
        return [
            {
                "id": e.id,
                "institution": e.institution,
                "degree": e.degree,
                "field": e.field,
                "city": e.city,
                "state": e.state,
                "start_date": _date_str(e.start_date),
                "end_date": _date_str(e.end_date),
            }
            for e in education
        ]


@mcp.tool()
def list_certifications() -> list[dict]:
    """List all certification records."""
    with get_db() as db:
        certs = db.query(Certification).order_by(Certification.issue_date.desc()).all()
        return [
            {
                "id": c.id,
                "name": c.name,
                "issuing_org": c.issuing_org,
                "issue_date": _date_str(c.issue_date),
                "expiry_date": _date_str(c.expiry_date),
                "credential_id": c.credential_id,
            }
            for c in certs
        ]


# ─── Write Tools ───────────────────────────────────────────────────────────────

@mcp.tool()
def create_job_application(
    company_name: str,
    job_title: str,
    date_applied: str,
    req_url: Optional[str] = None,
    cover_letter_submitted: bool = False,
    notes: Optional[str] = None,
) -> dict:
    """Log a new job application.

    date_applied must be in ISO format: YYYY-MM-DD.
    """
    with get_db() as db:
        app = JobApplication(
            company_name=company_name,
            job_title=job_title,
            date_applied=date.fromisoformat(date_applied),
            req_url=req_url,
            status=ApplicationStatus.APPLIED,
            cover_letter_submitted=cover_letter_submitted,
            notes=notes,
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        return _application_dict(app)


@mcp.tool()
def list_job_applications(status_filter: Optional[str] = None) -> list[dict]:
    """List job applications, optionally filtered by status.

    Valid statuses: applied, email_rejected, ghosted, withdrew, req_pulled,
    interview_scheduled, interview_rejected, offered, accepted.
    """
    with get_db() as db:
        query = db.query(JobApplication)
        if status_filter:
            try:
                st = ApplicationStatus(status_filter.lower())
                query = query.filter(JobApplication.status == st)
            except ValueError:
                return [{"error": f"Invalid status '{status_filter}'."}]
        apps = query.order_by(JobApplication.date_applied.desc()).all()
        return [_application_dict(a) for a in apps]


@mcp.tool()
def get_job_application(application_id: int) -> dict:
    """Get a single job application by ID."""
    with get_db() as db:
        app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
        if not app:
            return {"error": f"Application {application_id} not found"}
        return _application_dict(app)


@mcp.tool()
def update_application_status(
    application_id: int,
    status: str,
    status_date: Optional[str] = None,
) -> dict:
    """Update the status of a job application.

    Valid statuses: applied, email_rejected, ghosted, withdrew, req_pulled,
    interview_scheduled, interview_rejected, offered, accepted.
    status_date must be ISO format YYYY-MM-DD if provided, otherwise today's date is used.
    """
    with get_db() as db:
        app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
        if not app:
            return {"error": f"Application {application_id} not found"}
        try:
            new_status = ApplicationStatus(status.lower())
        except ValueError:
            return {"error": f"Invalid status '{status}'."}
        app.status = new_status
        app.status_date = date.fromisoformat(status_date) if status_date else date.today()
        db.commit()
        db.refresh(app)
        return _application_dict(app)


@mcp.tool()
def update_application_notes(application_id: int, notes: str) -> dict:
    """Update the notes field on a job application (recruiter info, salary, feedback, etc.)."""
    with get_db() as db:
        app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
        if not app:
            return {"error": f"Application {application_id} not found"}
        app.notes = notes
        db.commit()
        db.refresh(app)
        return _application_dict(app)


if __name__ == "__main__":
    mcp.run()  # stdio transport
