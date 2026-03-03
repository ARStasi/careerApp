from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Education
from app.schemas import EducationCreate, EducationOut

router = APIRouter()


@router.get("/education", response_model=list[EducationOut])
def list_education(db: Session = Depends(get_db)):
    return db.query(Education).all()


@router.post("/education", response_model=EducationOut, status_code=201)
def create_education(data: EducationCreate, db: Session = Depends(get_db)):
    edu = Education(**data.model_dump())
    db.add(edu)
    db.commit()
    db.refresh(edu)
    return edu


@router.put("/education/{edu_id}", response_model=EducationOut)
def update_education(edu_id: int, data: EducationCreate, db: Session = Depends(get_db)):
    edu = db.query(Education).filter(Education.id == edu_id).first()
    if not edu:
        raise HTTPException(404, "Education not found")
    for key, val in data.model_dump().items():
        setattr(edu, key, val)
    db.commit()
    db.refresh(edu)
    return edu


@router.delete("/education/{edu_id}", status_code=204)
def delete_education(edu_id: int, db: Session = Depends(get_db)):
    edu = db.query(Education).filter(Education.id == edu_id).first()
    if not edu:
        raise HTTPException(404, "Education not found")
    db.delete(edu)
    db.commit()
