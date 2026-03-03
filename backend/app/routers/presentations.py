from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Presentation, Role
from app.schemas import PresentationCreate, PresentationOut

router = APIRouter()


@router.get("/roles/{role_id}/presentations", response_model=list[PresentationOut])
def list_presentations(role_id: int, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    return db.query(Presentation).filter(Presentation.role_id == role_id).all()


@router.post("/roles/{role_id}/presentations", response_model=PresentationOut, status_code=201)
def create_presentation(role_id: int, data: PresentationCreate, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    pres = Presentation(role_id=role_id, **data.model_dump())
    db.add(pres)
    db.commit()
    db.refresh(pres)
    return pres


@router.put("/presentations/{pres_id}", response_model=PresentationOut)
def update_presentation(pres_id: int, data: PresentationCreate, db: Session = Depends(get_db)):
    pres = db.query(Presentation).filter(Presentation.id == pres_id).first()
    if not pres:
        raise HTTPException(404, "Presentation not found")
    for key, val in data.model_dump().items():
        setattr(pres, key, val)
    db.commit()
    db.refresh(pres)
    return pres


@router.delete("/presentations/{pres_id}", status_code=204)
def delete_presentation(pres_id: int, db: Session = Depends(get_db)):
    pres = db.query(Presentation).filter(Presentation.id == pres_id).first()
    if not pres:
        raise HTTPException(404, "Presentation not found")
    db.delete(pres)
    db.commit()
