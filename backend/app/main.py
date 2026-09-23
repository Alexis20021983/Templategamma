from io import BytesIO
from pathlib import Path
from uuid import uuid4
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from .config import settings
from .database import Base, engine, get_db
from .models import Case, Step, Evidence
from .report import build_report
from .schemas import CaseCreate, CaseOut, StepCreate

Base.metadata.create_all(bind=engine)
app = FastAPI(title="QA Evidence API", version="1.0.0")
UPLOAD_DIR = Path(settings.upload_dir); UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins.split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_case(db: Session, case_id: int):
    case = db.execute(select(Case).options(joinedload(Case.steps).joinedload(Step.evidences)).where(Case.id == case_id)).unique().scalars().first()
    if not case:
        raise HTTPException(404, "Case not found")
    return case

@app.get("/health")
def health(): return {"status": "ok"}

@app.get("/api/cases", response_model=list[CaseOut])
def list_cases(db: Session = Depends(get_db)):
    return db.execute(select(Case).options(joinedload(Case.steps).joinedload(Step.evidences)).order_by(Case.updated_at.desc())).unique().scalars().all()

@app.post("/api/cases", response_model=CaseOut, status_code=201)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    case = Case(**payload.model_dump(exclude={"steps"}))
    for step_data in payload.steps:
        step = Step(title=step_data.title, expected_result=step_data.expected_result, actual_result=step_data.actual_result, status=step_data.status, position=step_data.position)
        step.evidences = [Evidence(**e.model_dump()) for e in step_data.evidences]
        case.steps.append(step)
    db.add(case); db.commit(); db.refresh(case)
    return get_case(db, case.id)

@app.get("/api/cases/{case_id}", response_model=CaseOut)
def read_case(case_id: int, db: Session = Depends(get_db)): return get_case(db, case_id)

@app.put("/api/cases/{case_id}", response_model=CaseOut)
def update_case(case_id: int, payload: CaseCreate, db: Session = Depends(get_db)):
    case = get_case(db, case_id)
    for key, value in payload.model_dump(exclude={"steps"}).items(): setattr(case, key, value)
    case.steps = []
    for step_data in payload.steps:
        step = Step(title=step_data.title, expected_result=step_data.expected_result, actual_result=step_data.actual_result, status=step_data.status, position=step_data.position)
        step.evidences = [Evidence(**e.model_dump()) for e in step_data.evidences]
        case.steps.append(step)
    db.commit()
    return get_case(db, case_id)

@app.delete("/api/cases/{case_id}", status_code=204)
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case = get_case(db, case_id); db.delete(case); db.commit()

@app.post("/api/cases/{case_id}/clone", response_model=CaseOut, status_code=201)
def clone_case(case_id: int, db: Session = Depends(get_db)):
    source = get_case(db, case_id)
    clone = Case(**{k: getattr(source, k) for k in ("description","status","owner","requirement","objective","preconditions","test_data","tester","reviewer")}, title=f"{source.title} (Copy)")
    for old in source.steps:
        step = Step(title=old.title, expected_result=old.expected_result, actual_result=old.actual_result, status=old.status, position=old.position)
        step.evidences = [Evidence(name=e.name, url=e.url, notes=e.notes) for e in old.evidences]
        clone.steps.append(step)
    db.add(clone); db.commit(); db.refresh(clone)
    return get_case(db, clone.id)

@app.post("/api/cases/{case_id}/steps", response_model=CaseOut)
def add_step(case_id: int, payload: StepCreate, db: Session = Depends(get_db)):
    case = get_case(db, case_id)
    step = Step(title=payload.title, expected_result=payload.expected_result, actual_result=payload.actual_result, status=payload.status, position=payload.position)
    step.evidences = [Evidence(**e.model_dump()) for e in payload.evidences]
    case.steps.append(step); db.commit()
    return get_case(db, case_id)

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    cases = db.query(Case).all()
    return {"total": len(cases), "by_status": {s: sum(c.status == s for c in cases) for s in ("Draft", "In progress", "Passed", "Failed")}, "steps": sum(len(c.steps) for c in cases), "evidence": sum(len(s.evidences) for c in cases for s in c.steps)}

@app.post("/api/evidence/upload")
async def upload_evidence(file: UploadFile = File(...)):
    if not (file.content_type or "").startswith("image/"): raise HTTPException(400, "Only image files are supported")
    data = await file.read()
    try:
        image = Image.open(BytesIO(data)); image.verify()
    except Exception: raise HTTPException(400, "Invalid image")
    suffix = Path(file.filename or ".png").suffix.lower() or ".png"
    name = f"{uuid4().hex}{suffix}"; destination = UPLOAD_DIR / name
    destination.write_bytes(data)
    return {"file_name": file.filename or name, "content_type": file.content_type, "file_size": len(data), "file_path": str(destination), "url": f"/uploads/{name}"}

@app.get("/api/cases/{case_id}/report")
def download_report(case_id: int, db: Session = Depends(get_db)):
    case = get_case(db, case_id)
    report = build_report(case)
    return StreamingResponse(report, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": f'attachment; filename="qa-case-{case.id}.docx"'})
