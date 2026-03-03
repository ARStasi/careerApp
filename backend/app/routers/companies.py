from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Company
from app.schemas import CompanyCreate, CompanyOut

router = APIRouter()


@router.get("/companies", response_model=list[CompanyOut])
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).order_by(Company.start_date.desc()).all()


@router.post("/companies", response_model=CompanyOut, status_code=201)
def create_company(data: CompanyCreate, db: Session = Depends(get_db)):
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/companies/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    return company


@router.put("/companies/{company_id}", response_model=CompanyOut)
def update_company(company_id: int, data: CompanyCreate, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    for key, val in data.model_dump().items():
        setattr(company, key, val)
    db.commit()
    db.refresh(company)
    return company


@router.delete("/companies/{company_id}", status_code=204)
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    db.delete(company)
    db.commit()
