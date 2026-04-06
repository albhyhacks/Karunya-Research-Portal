import logging
import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .routers import papers, authors, analytics, admin, auth
from .database import engine
from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="College Research Portal",
    description="API for aggregating and displaying research publications and theses.",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
cors_origins_raw = getattr(settings, "CORS_ORIGINS", "http://localhost:5173")
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        f"Method: {request.method} Path: {request.url.path} "
        f"Status: {response.status_code} Duration: {duration:.4f}s"
    )
    return response

# Register routers
app.include_router(papers.router, prefix="/api/papers", tags=["Papers"])
app.include_router(authors.router, prefix="/api/authors", tags=["Authors"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": str(exc) if not isinstance(exc, RuntimeError) else "An unexpected error occurred."
        }
    )

@app.get("/api/health")
async def health_check():
    health_status = {"status": "healthy", "database": "unknown", "scopus_config": False}
    
    # Check Database
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        logger.error(f"Health check: Database connection failed: {e}")
        health_status["database"] = "disconnected"
        health_status["status"] = "degraded"
        
    # Check Scopus Config 
    if settings.SCOPUS_API_KEY and settings.SCOPUS_API_KEY != "your_scopus_api_key_here":
        health_status["scopus_config"] = True
        
    return health_status

@app.get("/")
async def root():
    return {
        "message": "Welcome to the College Research Portal API",
        "docs": "/docs",
        "health": "/api/health"
    }
