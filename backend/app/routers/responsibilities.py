from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Responsibility, Role
from app.schemas import ResponsibilityCreate, ResponsibilityOut, ReorderResponsibilitiesRequest

router = APIRouter()


@router.get("/roles/{role_id}/responsibilities", response_model=list[ResponsibilityOut])
def list_responsibilities(role_id: int, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    return (
        db.query(Responsibility)
        .filter(Responsibility.role_id == role_id)
        .order_by(Responsibility.sort_order)
        .all()
    )


@router.post("/roles/{role_id}/responsibilities", response_model=ResponsibilityOut, status_code=201)
def create_responsibility(role_id: int, data: ResponsibilityCreate, db: Session = Depends(get_db)):
    if not db.query(Role).filter(Role.id == role_id).first():
        raise HTTPException(404, "Role not found")
    resp = Responsibility(
        role_id=role_id,
        description=data.description,
        sort_order=data.sort_order,
    )
    db.add(resp)
    db.commit()
    db.refresh(resp)
    return resp


@router.put("/responsibilities/{resp_id}", response_model=ResponsibilityOut)
def update_responsibility(resp_id: int, data: ResponsibilityCreate, db: Session = Depends(get_db)):
    resp = db.query(Responsibility).filter(Responsibility.id == resp_id).first()
    if not resp:
        raise HTTPException(404, "Responsibility not found")
    resp.description = data.description
    resp.sort_order = data.sort_order
    db.commit()
    db.refresh(resp)
    return resp


@router.delete("/responsibilities/{resp_id}", status_code=204)
def delete_responsibility(resp_id: int, db: Session = Depends(get_db)):
    resp = db.query(Responsibility).filter(Responsibility.id == resp_id).first()
    if not resp:
        raise HTTPException(404, "Responsibility not found")
    db.delete(resp)
    db.commit()


@router.patch("/roles/{role_id}/responsibilities/reorder")
def reorder_responsibilities(role_id: int, data: ReorderResponsibilitiesRequest, db: Session = Depends(get_db)):
    for idx, resp_id in enumerate(data.responsibility_ids):
        resp = db.query(Responsibility).filter(
            Responsibility.id == resp_id, Responsibility.role_id == role_id
        ).first()
        if resp:
            resp.sort_order = idx
    db.commit()
    return {"status": "ok"}
