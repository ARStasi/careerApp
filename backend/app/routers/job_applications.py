from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import JobApplication, ApplicationStatus
from app.schemas import (
    JobApplicationCreate, JobApplicationUpdate,
    JobApplicationStatusUpdate, JobApplicationOut,
)

router = APIRouter()


@router.get("/job-applications", response_model=list[JobApplicationOut])
def list_job_applications(db: Session = Depends(get_db)):
    return (
        db.query(JobApplication)
        .order_by(JobApplication.date_applied.desc())
        .all()
    )


@router.post("/job-applications", response_model=JobApplicationOut, status_code=201)
def create_job_application(data: JobApplicationCreate, db: Session = Depends(get_db)):
    dump = data.model_dump()
    dump["status"] = ApplicationStatus(dump["status"])
    app = JobApplication(**dump)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.put("/job-applications/{app_id}", response_model=JobApplicationOut)
def update_job_application(app_id: int, data: JobApplicationUpdate, db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Job application not found")
    dump = data.model_dump()
    dump["status"] = ApplicationStatus(dump["status"])
    for key, val in dump.items():
        setattr(app, key, val)
    db.commit()
    db.refresh(app)
    return app


@router.patch("/job-applications/{app_id}/status", response_model=JobApplicationOut)
def update_job_application_status(
    app_id: int, data: JobApplicationStatusUpdate, db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Job application not found")
    app.status = ApplicationStatus(data.status)
    app.status_date = data.status_date or date.today()
    db.commit()
    db.refresh(app)
    return app


@router.delete("/job-applications/{app_id}", status_code=204)
def delete_job_application(app_id: int, db: Session = Depends(get_db)):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Job application not found")
    db.delete(app)
    db.commit()
