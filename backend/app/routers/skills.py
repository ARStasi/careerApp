from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Skill, RoleSkill, Role, SkillType
from app.schemas import SkillCreate, SkillOut, RoleSkillCreate, RoleSkillOut

router = APIRouter()


# Global skill catalog
@router.get("/skills", response_model=list[SkillOut])
def list_skills(db: Session = Depends(get_db)):
    return db.query(Skill).order_by(Skill.name).all()


@router.post("/skills", response_model=SkillOut, status_code=201)
def create_skill(data: SkillCreate, db: Session = Depends(get_db)):
    existing = db.query(Skill).filter(Skill.name == data.name).first()
    if existing:
        raise HTTPException(409, "Skill already exists")
    skill = Skill(name=data.name, skill_type=SkillType(data.skill_type))
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


# Role-skill associations
@router.get("/roles/{role_id}/skills", response_model=list[RoleSkillOut])
def list_role_skills(role_id: int, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    role_skills = db.query(RoleSkill).filter(RoleSkill.role_id == role_id).all()
    result = []
    for rs in role_skills:
        result.append(RoleSkillOut(
            id=rs.id,
            role_id=rs.role_id,
            skill_id=rs.skill_id,
            proficiency=rs.proficiency,
            skill_name=rs.skill.name if rs.skill else None,
        ))
    return result


@router.post("/roles/{role_id}/skills", response_model=RoleSkillOut, status_code=201)
def add_role_skill(role_id: int, data: RoleSkillCreate, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    if not db.query(Skill).filter(Skill.id == data.skill_id).first():
        raise HTTPException(404, "Skill not found")
    existing = db.query(RoleSkill).filter(
        RoleSkill.role_id == role_id, RoleSkill.skill_id == data.skill_id
    ).first()
    if existing:
        raise HTTPException(409, "Skill already associated with this role")
    rs = RoleSkill(role_id=role_id, skill_id=data.skill_id, proficiency=data.proficiency)
    db.add(rs)
    db.commit()
    db.refresh(rs)
    skill = db.query(Skill).filter(Skill.id == data.skill_id).first()
    return RoleSkillOut(
        id=rs.id, role_id=rs.role_id, skill_id=rs.skill_id,
        proficiency=rs.proficiency, skill_name=skill.name if skill else None,
    )


@router.delete("/roles/{role_id}/skills/{skill_id}", status_code=204)
def remove_role_skill(role_id: int, skill_id: int, db: Session = Depends(get_db)):
    rs = db.query(RoleSkill).filter(
        RoleSkill.role_id == role_id, RoleSkill.skill_id == skill_id
    ).first()
    if not rs:
        raise HTTPException(404, "Role-skill association not found")
    db.delete(rs)
    db.commit()
