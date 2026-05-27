import os
import uuid
import logging
from fastapi import APIRouter, Depends, Header, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..config import settings
from ..models import SyncLog, Paper, Author, Thesis, User, Role
from ..services.sync import SyncService
from ..services.auth import AuthService
from ..schemas.admin import SyncStatus, AdminStats, ThesisRead
from ..schemas.user import UserRead, UserCreate
from .auth import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter()

# --- User Management Endpoints ---

@router.get("/users", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = select(User).order_by(User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/users", response_model=UserRead)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Check if user already exists
    query = select(User).where(User.email == user_in.email)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create user
    user = User(
        id=uuid.uuid4(),
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=AuthService.get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Prevent self-deletion
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrative account")
    
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return {"status": "success", "message": "User deleted successfully"}

@router.post("/sync")
async def trigger_sync(
    background_tasks: BackgroundTasks,
    mode: str = "incremental",
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # 1. Create a running log entry
    log = SyncLog(mode=mode, status="running")
    db.add(log)
    await db.commit()
    await db.refresh(log)
    
    # 2. Define background task
    async def run_sync_task(log_id: uuid.UUID):
        sync_service = SyncService()
        if mode == "full":
            await sync_service.run_full_sync(log_id=log_id)
        else:
            await sync_service.run_incremental_sync(log_id=log_id)

    background_tasks.add_task(run_sync_task, log.id)
    return {"status": "started", "log_id": log.id}

@router.post("/thesis", response_model=ThesisRead)
async def create_thesis(
    title: str = Form(...),
    abstract: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    author_name: str = Form(...),
    supervisor_name: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    degree_type: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
    # Max 20MB
    # file.file.seek(0, os.SEEK_END)
    # if file.file.tell() > 20 * 1024 * 1024:
    #     raise HTTPException(status_code=400, detail="File too large (max 20MB)")
    # file.file.seek(0)
    
    # Save file
    os.makedirs("data/uploads", exist_ok=True)
    file_uuid = uuid.uuid4()
    file_path = f"data/uploads/{file_uuid}.pdf"
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    # Create record
    thesis = Thesis(
        id=uuid.uuid4(),
        title=title,
        abstract=abstract,
        year=year,
        author_name=author_name,
        supervisor_name=supervisor_name,
        department=department,
        degree_type=degree_type,
        file_url=file_path
    )
    db.add(thesis)
    await db.commit()
    await db.refresh(thesis)
    
    return thesis

@router.get("/sync/status", response_model=SyncStatus)
async def get_sync_status(db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    query = select(SyncLog).order_by(desc(SyncLog.started_at)).limit(1)
    result = await db.execute(query)
    log = result.scalar_one_or_none()
    
    if not log:
        return {
            "last_sync_at": None,
            "papers_added": 0,
            "papers_updated": 0,
            "authors_created": 0,
            "status": "idle",
            "error_message": None
        }
        
    return {
        "last_sync_at": log.completed_at or log.started_at,
        "papers_added": log.papers_added,
        "papers_updated": log.papers_updated,
        "authors_created": log.authors_created,
        "status": log.status,
        "error_message": log.error_message
    }

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    papers = await db.scalar(select(func.count()).select_from(Paper))
    authors = await db.scalar(select(func.count()).select_from(Author))
    theses = await db.scalar(select(func.count()).select_from(Thesis))
    
    return {
        "papers": papers or 0,
        "authors": authors or 0,
        "theses": theses or 0
    }
