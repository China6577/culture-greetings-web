import asyncio
import hashlib
import json
import secrets
from contextlib import asynccontextmanager, suppress
from pathlib import Path
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy import select, func, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import Session
from app.config import settings
from app.db import get_db
from app.models import CardComposition, GenerationJob
from app.schemas import GenerationRequest, GeneratedCard, CompositionList, JobView, BatchDeleteRequest
from app.services.orchestrator import worker

@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(worker())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError): await task

app = FastAPI(title='Kinship Multi-agent Card Studio',version='3.0.0',docs_url='/api/docs',openapi_url='/api/openapi.json',redoc_url=None,lifespan=lifespan)
DB = Annotated[Session,Depends(get_db)]

def missing():
    raise HTTPException(404,detail={'code':'card_not_found','message':'Card not found.'})

@app.middleware('http')
async def body_limit(request: Request, call_next):
    try: length = int(request.headers.get('content-length','0') or '0')
    except ValueError: return JSONResponse({'error':{'code':'invalid_content_length'}},status_code=400)
    if length > 65536: return JSONResponse({'error':{'code':'payload_too_large'}},status_code=413)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Cache-Control'] = 'no-store'
    return response

@app.exception_handler(HTTPException)
async def http_error(request,error):
    return JSONResponse({'error':error.detail if isinstance(error.detail,dict) else {'code':'request_failed'}},status_code=error.status_code)

@app.exception_handler(RequestValidationError)
async def invalid_input(request,error):
    return JSONResponse({'error':{'code':'validation_error','message':'Check the request fields.'}},status_code=422)

@app.exception_handler(SQLAlchemyError)
async def database_error(request,error):
    return JSONResponse({'error':{'code':'database_unavailable'}},status_code=503)

@app.exception_handler(Exception)
async def unknown_error(request,error):
    return JSONResponse({'error':{'code':'internal_error'}},status_code=500)

@app.get('/api/health')
def health(db: DB):
    db.execute(text('SELECT 1'))
    return {'status':'ok','database':'ready','provider':'agnes','configured':bool(settings.agnes_api_key),
        'image_model':settings.image_model,'text_model':settings.text_model}

@app.post('/api/generations',response_model=JobView,status_code=202)
def create_generation(payload: GenerationRequest,db: DB):
    if not settings.agnes_api_key: raise HTTPException(503,detail={'code':'agnes_not_configured'})
    fingerprint = hashlib.sha256(json.dumps(payload.model_dump(exclude={'request_id'}),sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    existing = db.scalar(select(GenerationJob).where(GenerationJob.request_id==payload.request_id))
    if existing:
        if existing.fingerprint != fingerprint: raise HTTPException(409,detail={'code':'idempotency_conflict'})
        return job_view(existing,db)
    if db.scalar(select(func.count()).select_from(GenerationJob).where(GenerationJob.status.in_(['queued','running']))) >= 20:
        raise HTTPException(429,detail={'code':'generation_queue_full'})
    job = GenerationJob(id=secrets.token_urlsafe(24),request_id=payload.request_id,fingerprint=fingerprint,
        input_json=payload.model_dump(),status='queued',events=[],artifacts={})
    db.add(job)
    try: db.commit()
    except IntegrityError:
        db.rollback()
        job = db.scalar(select(GenerationJob).where(GenerationJob.request_id==payload.request_id))
        if not job or job.fingerprint != fingerprint: raise HTTPException(409,detail={'code':'idempotency_conflict'})
    return job_view(job,db)

def job_view(job,db):
    card = db.get(CardComposition,job.result_id) if job.result_id else None
    if job.status == 'complete' and not card: missing()
    return JobView(id=job.id,status=job.status,events=job.events,error_code=job.error_code,
        card=GeneratedCard.model_validate(card.composition_json) if card else None)

@app.get('/api/generations/{job_id}',response_model=JobView)
def read_generation(job_id: str,db: DB):
    job = db.get(GenerationJob,job_id) if len(job_id) <= 64 else None
    if not job: missing()
    return job_view(job,db)

@app.get('/api/cards',response_model=CompositionList)
def list_cards(db: DB,page: int=Query(1,ge=1),page_size: int=Query(12,ge=1,le=50)):
    total = db.scalar(select(func.count()).select_from(CardComposition))
    rows = db.scalars(select(CardComposition).order_by(CardComposition.created_at.desc(),CardComposition.id.desc())
        .offset((page-1)*page_size).limit(page_size)).all()
    return CompositionList(items=[GeneratedCard.model_validate(row.composition_json) for row in rows],total=total,page=page,page_size=page_size)

@app.get('/api/cards/{card_id}',response_model=GeneratedCard)
def read_card(card_id: str,db: DB):
    row = db.get(CardComposition,card_id) if len(card_id)<=64 else None
    if not row: missing()
    return GeneratedCard.model_validate(row.composition_json)

@app.post('/api/cards/bulk-delete',status_code=204)
def delete_cards(payload: BatchDeleteRequest,db: DB):
    # Database changes share one transaction. Missing cards make retries idempotent.
    for job in db.scalars(select(GenerationJob).where(GenerationJob.result_id.in_(payload.ids))).all():
        db.delete(job)
    for row in db.scalars(select(CardComposition).where(CardComposition.id.in_(payload.ids))).all():
        db.delete(row)
    db.commit()
    for identifier in payload.ids:
        (Path(settings.assets_dir) / (identifier + '.png')).unlink(missing_ok=True)

@app.get('/api/assets/{filename}')
def image_asset(filename: str,db: DB):
    import re
    if not re.fullmatch(r'[A-Za-z0-9_-]{20,64}\.png',filename): missing()
    if not db.get(CardComposition,filename[:-4]): missing()
    asset = Path(settings.assets_dir) / filename
    if not asset.is_file(): missing()
    return FileResponse(asset,media_type='image/png',headers={'Content-Security-Policy':"default-src 'none'"})

@app.delete('/api/cards/{card_id}',status_code=204)
def delete_card(card_id: str,db: DB):
    row = db.get(CardComposition,card_id) if len(card_id)<=64 else None
    if not row: missing()
    for job in db.scalars(select(GenerationJob).where(GenerationJob.result_id==card_id)).all(): db.delete(job)
    db.delete(row)
    db.commit()
    (Path(settings.assets_dir) / (card_id + '.png')).unlink(missing_ok=True)
