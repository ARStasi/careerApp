from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Accomplishment, Role, AccomplishmentCategory
from app.schemas import AccomplishmentCreate, AccomplishmentOut, ReorderRequest

router = APIRouter()


@router.get("/roles/{role_id}/accomplishments", response_model=list[AccomplishmentOut])
def list_accomplishments(role_id: int, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    return (
        db.query(Accomplishment)
        .filter(Accomplishment.role_id == role_id)
        .order_by(Accomplishment.sort_order)
        .all()
    )


@router.post("/roles/{role_id}/accomplishments", response_model=AccomplishmentOut, status_code=201)
def create_accomplishment(role_id: int, data: AccomplishmentCreate, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    acc = Accomplishment(
        role_id=role_id,
        description=data.description,
        tech_stack=data.tech_stack,
        key_result=data.key_result,
        category=AccomplishmentCategory(data.category),
        sort_order=data.sort_order,
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc


@router.put("/accomplishments/{acc_id}", response_model=AccomplishmentOut)
def update_accomplishment(acc_id: int, data: AccomplishmentCreate, db: Session = Depends(get_db)):
    acc = db.query(Accomplishment).filter(Accomplishment.id == acc_id).first()
    if not acc:
        raise HTTPException(404, "Accomplishment not found")
    acc.description = data.description
    acc.tech_stack = data.tech_stack
    acc.key_result = data.key_result
    acc.category = AccomplishmentCategory(data.category)
    acc.sort_order = data.sort_order
    db.commit()
    db.refresh(acc)
    return acc


@router.delete("/accomplishments/{acc_id}", status_code=204)
def delete_accomplishment(acc_id: int, db: Session = Depends(get_db)):
    acc = db.query(Accomplishment).filter(Accomplishment.id == acc_id).first()
    if not acc:
        raise HTTPException(404, "Accomplishment not found")
    db.delete(acc)
    db.commit()


@router.patch("/roles/{role_id}/accomplishments/reorder")
def reorder_accomplishments(role_id: int, data: ReorderRequest, db: Session = Depends(get_db)):
    for idx, acc_id in enumerate(data.accomplishment_ids):
        acc = db.query(Accomplishment).filter(
            Accomplishment.id == acc_id, Accomplishment.role_id == role_id
        ).first()
        if acc:
            acc.sort_order = idx
    db.commit()
    return {"status": "ok"}
