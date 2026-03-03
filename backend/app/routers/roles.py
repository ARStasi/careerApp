from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Role, Company
from app.schemas import RoleCreate, RoleOut

router = APIRouter()


@router.get("/companies/{company_id}/roles", response_model=list[RoleOut])
def list_roles(company_id: int, db: Session = Depends(get_db)):
    if not db.query(Company).filter(Company.id == company_id).first():
        raise HTTPException(404, "Company not found")
    return db.query(Role).filter(Role.company_id == company_id).order_by(Role.start_date.desc()).all()


@router.post("/companies/{company_id}/roles", response_model=RoleOut, status_code=201)
def create_role(company_id: int, data: RoleCreate, db: Session = Depends(get_db)):
    if not db.query(Company).filter(Company.id == company_id).first():
        raise HTTPException(404, "Company not found")
    role = Role(company_id=company_id, **data.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get("/roles/{role_id}", response_model=RoleOut)
def get_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(404, "Role not found")
    return role


@router.put("/roles/{role_id}", response_model=RoleOut)
def update_role(role_id: int, data: RoleCreate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(404, "Role not found")
    for key, val in data.model_dump().items():
        setattr(role, key, val)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}", status_code=204)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(404, "Role not found")
    db.delete(role)
    db.commit()
