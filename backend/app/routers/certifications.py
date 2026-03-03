from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Certification
from app.schemas import CertificationCreate, CertificationOut

router = APIRouter()


@router.get("/certifications", response_model=list[CertificationOut])
def list_certifications(db: Session = Depends(get_db)):
    return db.query(Certification).all()


@router.post("/certifications", response_model=CertificationOut, status_code=201)
def create_certification(data: CertificationCreate, db: Session = Depends(get_db)):
    cert = Certification(**data.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.put("/certifications/{cert_id}", response_model=CertificationOut)
def update_certification(cert_id: int, data: CertificationCreate, db: Session = Depends(get_db)):
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certification not found")
    for key, val in data.model_dump().items():
        setattr(cert, key, val)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete("/certifications/{cert_id}", status_code=204)
def delete_certification(cert_id: int, db: Session = Depends(get_db)):
    cert = db.query(Certification).filter(Certification.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certification not found")
    db.delete(cert)
    db.commit()
