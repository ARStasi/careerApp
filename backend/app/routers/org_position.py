from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import OrgPosition, Role
from app.schemas import OrgPositionBase, OrgPositionOut

router = APIRouter()


@router.get("/roles/{role_id}/org-position", response_model=OrgPositionOut | None)
def get_org_position(role_id: int, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    return db.query(OrgPosition).filter(OrgPosition.role_id == role_id).first()


@router.put("/roles/{role_id}/org-position", response_model=OrgPositionOut)
def upsert_org_position(role_id: int, data: OrgPositionBase, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    op = db.query(OrgPosition).filter(OrgPosition.role_id == role_id).first()
    if op:
        for key, val in data.model_dump().items():
            setattr(op, key, val)
    else:
        op = OrgPosition(role_id=role_id, **data.model_dump())
        db.add(op)
    db.commit()
    db.refresh(op)
    return op


@router.delete("/roles/{role_id}/org-position", status_code=204)
def delete_org_position(role_id: int, db: Session = Depends(get_db)):
    op = db.query(OrgPosition).filter(OrgPosition.role_id == role_id).first()
    if not op:
        raise HTTPException(404, "Org position not found")
    db.delete(op)
    db.commit()
