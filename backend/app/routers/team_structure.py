from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import TeamStructure, Role
from app.schemas import TeamStructureBase, TeamStructureOut

router = APIRouter()


@router.get("/roles/{role_id}/team-structure", response_model=TeamStructureOut | None)
def get_team_structure(role_id: int, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    return db.query(TeamStructure).filter(TeamStructure.role_id == role_id).first()


@router.put("/roles/{role_id}/team-structure", response_model=TeamStructureOut)
def upsert_team_structure(role_id: int, data: TeamStructureBase, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    ts = db.query(TeamStructure).filter(TeamStructure.role_id == role_id).first()
    if ts:
        for key, val in data.model_dump().items():
            setattr(ts, key, val)
    else:
        ts = TeamStructure(role_id=role_id, **data.model_dump())
        db.add(ts)
    db.commit()
    db.refresh(ts)
    return ts


@router.delete("/roles/{role_id}/team-structure", status_code=204)
def delete_team_structure(role_id: int, db: Session = Depends(get_db)):
    ts = db.query(TeamStructure).filter(TeamStructure.role_id == role_id).first()
    if not ts:
        raise HTTPException(404, "Team structure not found")
    db.delete(ts)
    db.commit()
