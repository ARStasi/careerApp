from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    profile, companies, roles, accomplishments, responsibilities, skills,
    awards, presentations, team_structure, org_position, education,
    certifications, knowledge_base, resume_workflow, job_applications,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Career Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Resume-Output-Path"],
)

app.include_router(profile.router, prefix="/api", tags=["Profile"])
app.include_router(companies.router, prefix="/api", tags=["Companies"])
app.include_router(roles.router, prefix="/api", tags=["Roles"])
app.include_router(accomplishments.router, prefix="/api", tags=["Accomplishments"])
app.include_router(responsibilities.router, prefix="/api", tags=["Responsibilities"])
app.include_router(skills.router, prefix="/api", tags=["Skills"])
app.include_router(awards.router, prefix="/api", tags=["Awards"])
app.include_router(presentations.router, prefix="/api", tags=["Presentations"])
app.include_router(team_structure.router, prefix="/api", tags=["Team Structure"])
app.include_router(org_position.router, prefix="/api", tags=["Org Position"])
app.include_router(education.router, prefix="/api", tags=["Education"])
app.include_router(certifications.router, prefix="/api", tags=["Certifications"])
app.include_router(knowledge_base.router, prefix="/api", tags=["Knowledge Base"])
app.include_router(resume_workflow.router, prefix="/api", tags=["Resume Workflow"])
app.include_router(job_applications.router, prefix="/api", tags=["Job Applications"])
