from sqlalchemy.orm import Session
from app.models import (
    Role, Company, Accomplishment, AccomplishmentCategory,
    Award, Presentation, Profile, Education, Certification,
    Skill, RoleSkill, TeamStructure, Responsibility,
)


def generate_export_document(
    db: Session,
    role_ids: list[int],
    include_supporting: bool = True,
    include_awards: bool = True,
    include_presentations: bool = True,
    include_responsibilities: bool = True,
) -> str:
    sections = []

    # Profile
    profile = db.query(Profile).first()
    if profile:
        sections.append("# Profile")
        sections.append(f"**Name:** {profile.name}")
        if profile.email:
            sections.append(f"**Email:** {profile.email}")
        if profile.phone:
            sections.append(f"**Phone:** {profile.phone}")
        if profile.city and profile.state:
            sections.append(f"**Location:** {profile.city}, {profile.state}")
        if profile.portfolio_url:
            sections.append(f"**Portfolio:** {profile.portfolio_url}")
        if profile.linkedin_url:
            sections.append(f"**LinkedIn:** {profile.linkedin_url}")
        sections.append("")

    # Roles grouped by company
    roles = db.query(Role).filter(Role.id.in_(role_ids)).order_by(Role.start_date.desc()).all()
    company_roles: dict[int, list[Role]] = {}
    for role in roles:
        company_roles.setdefault(role.company_id, []).append(role)

    sections.append("# Work Experience")
    sections.append("")

    for company_id, company_role_list in company_roles.items():
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            continue

        date_range = _format_date_range(company.start_date, company.end_date)
        sections.append(f"## {company.name} ({date_range})")
        if company.description:
            sections.append(f"*{company.description}*")
        if company.industry:
            sections.append(f"Industry: {company.industry}")
        sections.append("")

        for role in company_role_list:
            role_date_range = _format_date_range(role.start_date, role.end_date)
            location = _format_location(role.city, role.state, role.is_remote)
            sections.append(f"### {role.title} ({role_date_range}) — {location}")
            if role.summary:
                sections.append(f"\n{role.summary}")
            sections.append("")

            # Team structure context
            if role.team_structure:
                ts = role.team_structure
                team_info = []
                if ts.direct_reports:
                    team_info.append(f"{ts.direct_reports} direct reports")
                if ts.team_size:
                    team_info.append(f"team of {ts.team_size}")
                if ts.responsibilities:
                    team_info.append(ts.responsibilities)
                if team_info:
                    sections.append(f"**Team Context:** {'; '.join(team_info)}")
                    sections.append("")

            # Responsibilities
            if include_responsibilities:
                responsibilities = (
                    db.query(Responsibility)
                    .filter(Responsibility.role_id == role.id)
                    .order_by(Responsibility.sort_order)
                    .all()
                )
                if responsibilities:
                    sections.append("**Key Responsibilities:**")
                    for resp in responsibilities:
                        sections.append(f"- {resp.description}")
                    sections.append("")

            # Accomplishments - resume bullets
            resume_bullets = (
                db.query(Accomplishment)
                .filter(
                    Accomplishment.role_id == role.id,
                    Accomplishment.category == AccomplishmentCategory.RESUME_BULLET,
                )
                .order_by(Accomplishment.sort_order)
                .all()
            )
            if resume_bullets:
                sections.append("**Key Accomplishments:**")
                for acc in resume_bullets:
                    sections.append(f"- {acc.description}")
                    if acc.tech_stack:
                        sections.append(f"  - Tech Stack: {acc.tech_stack}")
                    if acc.key_result:
                        sections.append(f"  - Key Result: {acc.key_result}")
                sections.append("")

            # Supporting details
            if include_supporting:
                supporting = (
                    db.query(Accomplishment)
                    .filter(
                        Accomplishment.role_id == role.id,
                        Accomplishment.category == AccomplishmentCategory.SUPPORTING_DETAIL,
                    )
                    .order_by(Accomplishment.sort_order)
                    .all()
                )
                if supporting:
                    sections.append("**Supporting Details (additional context for AI):**")
                    for acc in supporting:
                        sections.append(f"- {acc.description}")
                        if acc.tech_stack:
                            sections.append(f"  - Tech Stack: {acc.tech_stack}")
                        if acc.key_result:
                            sections.append(f"  - Key Result: {acc.key_result}")
                    sections.append("")

            # Skills for this role
            role_skills = db.query(RoleSkill).filter(RoleSkill.role_id == role.id).all()
            if role_skills:
                skill_names = []
                for rs in role_skills:
                    skill = db.query(Skill).filter(Skill.id == rs.skill_id).first()
                    if skill:
                        entry = skill.name
                        if rs.proficiency:
                            entry += f" ({rs.proficiency})"
                        skill_names.append(entry)
                sections.append(f"**Skills:** {', '.join(skill_names)}")
                sections.append("")

            # Awards
            if include_awards:
                awards = (
                    db.query(Award)
                    .filter(Award.role_id == role.id, Award.resume_relevant.is_(True))
                    .all()
                )
                if awards:
                    sections.append("**Awards:**")
                    for award in awards:
                        line = f"- {award.title}"
                        if award.issuer:
                            line += f" ({award.issuer})"
                        if award.date:
                            line += f" — {award.date.strftime('%b %Y')}"
                        sections.append(line)
                        if award.description:
                            sections.append(f"  {award.description}")
                    sections.append("")

            # Presentations
            if include_presentations:
                presentations = (
                    db.query(Presentation)
                    .filter(Presentation.role_id == role.id, Presentation.resume_relevant.is_(True))
                    .all()
                )
                if presentations:
                    sections.append("**Presentations:**")
                    for pres in presentations:
                        line = f"- {pres.title}"
                        if pres.venue:
                            line += f" at {pres.venue}"
                        if pres.date:
                            line += f" ({pres.date.strftime('%b %Y')})"
                        if pres.audience:
                            line += f" — Audience: {pres.audience}"
                        sections.append(line)
                    sections.append("")

    # Education
    education_list = db.query(Education).all()
    if education_list:
        sections.append("# Education")
        for edu in education_list:
            line = f"**{edu.institution}**"
            if edu.degree and edu.field:
                line += f" — {edu.degree} in {edu.field}"
            elif edu.degree:
                line += f" — {edu.degree}"
            if edu.city and edu.state:
                line += f" ({edu.city}, {edu.state})"
            sections.append(line)
        sections.append("")

    # Certifications
    certs = db.query(Certification).all()
    if certs:
        sections.append("# Certifications")
        for cert in certs:
            line = f"- **{cert.name}**"
            if cert.issuing_org:
                line += f" — {cert.issuing_org}"
            if cert.issue_date:
                line += f" ({cert.issue_date.strftime('%b %Y')})"
            sections.append(line)
        sections.append("")

    return "\n".join(sections)


def _format_date_range(start, end) -> str:
    parts = []
    if start:
        parts.append(start.strftime("%b %Y"))
    if end:
        parts.append(end.strftime("%b %Y"))
    else:
        parts.append("Present")
    return " - ".join(parts) if parts else "N/A"


def _format_location(city, state, is_remote) -> str:
    location = ""
    if city and state:
        location = f"{city}, {state}"
    if is_remote:
        location = f"Remote ({location})" if location else "Remote"
    return location or "N/A"
