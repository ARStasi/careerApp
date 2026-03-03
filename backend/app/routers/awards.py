from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Award, Role
from app.schemas import AwardCreate, AwardOut

router = APIRouter()


@router.get("/roles/{role_id}/awards", response_model=list[AwardOut])
def list_awards(role_id: int, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    return db.query(Award).filter(Award.role_id == role_id).all()


@router.post("/roles/{role_id}/awards", response_model=AwardOut, status_code=201)
def create_award(role_id: int, data: AwardCreate, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    award = Award(role_id=role_id, **data.model_dump())
    db.add(award)
    db.commit()
    db.refresh(award)
    return award


@router.put("/awards/{award_id}", response_model=AwardOut)
def update_award(award_id: int, data: AwardCreate, db: Session = Depends(get_db)):
    award = db.query(Award).filter(Award.id == award_id).first()
    if not award:
        raise HTTPException(404, "Award not found")
    for key, val in data.model_dump().items():
        setattr(award, key, val)
    db.commit()
    db.refresh(award)
    return award


@router.delete("/awards/{award_id}", status_code=204)
def delete_award(award_id: int, db: Session = Depends(get_db)):
    award = db.query(Award).filter(Award.id == award_id).first()
    if not award:
        raise HTTPException(404, "Award not found")
    db.delete(award)
    db.commit()
