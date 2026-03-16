from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ExportRequest, YamlConvertRequest, YamlValidateRequest
from app.services.export_service import generate_export_document
from app.services.yaml_to_word import convert_yaml_to_word_bytes
from app.services.instructions_service import get_instructions, save_instructions
from app.services.output_persistence_service import persist_resume_output
import io
import yaml


class InstructionsUpdateRequest(BaseModel):
    content: str

router = APIRouter()


@router.post("/workflow/export-document")
def export_document(data: ExportRequest, db: Session = Depends(get_db)):
    markdown = generate_export_document(
        db=db,
        role_ids=data.role_ids,
        include_supporting=data.include_supporting,
        include_awards=data.include_awards,
        include_presentations=data.include_presentations,
        include_responsibilities=data.include_responsibilities,
    )
    return {"content": markdown}


@router.get("/workflow/instructions")
def get_instructions_endpoint():
    return {"content": get_instructions()}


@router.put("/workflow/instructions")
def update_instructions_endpoint(data: InstructionsUpdateRequest):
    save_instructions(data.content)
    return {"content": data.content}


@router.post("/workflow/convert-yaml")
def convert_yaml(data: YamlConvertRequest):
    doc_bytes, filename = convert_yaml_to_word_bytes(data.yaml_content, data.company_name)
    _, relative_output_path = persist_resume_output(doc_bytes, filename)
    return StreamingResponse(
        io.BytesIO(doc_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Resume-Output-Path": relative_output_path,
        },
    )


@router.post("/workflow/validate-yaml")
def validate_yaml(data: YamlValidateRequest):
    try:
        parsed = yaml.safe_load(data.yaml_content)
    except yaml.YAMLError as e:
        return {"valid": False, "error": f"YAML parse error: {e}"}

    if not isinstance(parsed, dict):
        return {"valid": False, "error": "YAML must be a mapping/object"}

    if "resumeStructure" not in parsed:
        return {"valid": False, "error": "Missing top-level 'resumeStructure' key"}

    rs = parsed["resumeStructure"]
    errors = []
    for required_key in ["header", "workExperience", "education", "certificationsSkills"]:
        if required_key not in rs:
            errors.append(f"Missing 'resumeStructure.{required_key}'")

    if "header" in rs:
        header = rs["header"]
        if "line1" not in header:
            errors.append("Missing 'header.line1'")
        if "line2" not in header:
            errors.append("Missing 'header.line2'")

    if "workExperience" in rs:
        we = rs["workExperience"]
        if "companies" not in we:
            errors.append("Missing 'workExperience.companies'")
        elif not isinstance(we["companies"], list):
            errors.append("'workExperience.companies' must be a list")

    if errors:
        return {"valid": False, "errors": errors}

    return {"valid": True}
