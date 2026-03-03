from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Profile
from app.schemas import ProfileBase, ProfileOut

router = APIRouter()


@router.get("/profile", response_model=ProfileOut | None)
def get_profile(db: Session = Depends(get_db)):
    return db.query(Profile).first()


@router.put("/profile", response_model=ProfileOut)
def upsert_profile(data: ProfileBase, db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if profile:
        for key, val in data.model_dump().items():
            setattr(profile, key, val)
    else:
        profile = Profile(**data.model_dump())
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
