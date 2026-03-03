import os
import re
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_OUTPUT_DIR = _PROJECT_ROOT / "tailored-resumes"
OUTPUT_DIR = Path(os.getenv("TAILORED_RESUMES_DIR", _DEFAULT_OUTPUT_DIR)).resolve()

_INVALID_FILENAME_CHARS = re.compile(r"[^A-Za-z0-9.\-_ ()]+")


def _sanitize_filename(filename: str) -> str:
    cleaned = filename.replace("/", "-").replace("\\", "-").strip()
    cleaned = _INVALID_FILENAME_CHARS.sub("", cleaned)
    if not cleaned:
        cleaned = "Resume.docx"
    if not cleaned.lower().endswith(".docx"):
        cleaned = f"{cleaned}.docx"
    return cleaned


def _next_available_path(base_dir: Path, filename: str) -> Path:
    candidate = base_dir / filename
    if not candidate.exists():
        return candidate

    stem = candidate.stem
    suffix = candidate.suffix
    idx = 1
    while True:
        retry_candidate = base_dir / f"{stem}-{idx}{suffix}"
        if not retry_candidate.exists():
            return retry_candidate
        idx += 1


def persist_resume_output(doc_bytes: bytes, suggested_filename: str) -> tuple[Path, str]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    safe_filename = _sanitize_filename(suggested_filename)
    target_path = _next_available_path(OUTPUT_DIR, safe_filename)
    target_path.write_bytes(doc_bytes)

    try:
        relative_output_path = str(target_path.relative_to(_PROJECT_ROOT))
    except ValueError:
        relative_output_path = str(target_path)

    return target_path, relative_output_path
