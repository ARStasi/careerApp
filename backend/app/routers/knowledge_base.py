from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import KnowledgeEntry
from app.schemas import KnowledgeEntryCreate, KnowledgeEntryOut

router = APIRouter()


@router.get("/knowledge", response_model=list[KnowledgeEntryOut])
def list_knowledge(
    company_id: int | None = None,
    role_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(KnowledgeEntry)
    if company_id is not None:
        q = q.filter(KnowledgeEntry.company_id == company_id)
    if role_id is not None:
        q = q.filter(KnowledgeEntry.role_id == role_id)
    return q.order_by(KnowledgeEntry.created_at.desc()).all()


@router.post("/knowledge", response_model=KnowledgeEntryOut, status_code=201)
def create_knowledge(data: KnowledgeEntryCreate, db: Session = Depends(get_db)):
    entry = KnowledgeEntry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/knowledge/{entry_id}", response_model=KnowledgeEntryOut)
def update_knowledge(entry_id: int, data: KnowledgeEntryCreate, db: Session = Depends(get_db)):
    entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Knowledge entry not found")
    for key, val in data.model_dump().items():
        setattr(entry, key, val)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/knowledge/{entry_id}", status_code=204)
def delete_knowledge(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Knowledge entry not found")
    db.delete(entry)
    db.commit()
