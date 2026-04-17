from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from contextlib import asynccontextmanager

from app.config import settings
from app.db.mongodb import MongoDB
from app.routes.api import api_router
from app.core.logger import setup_logging

# Configure logging
setup_logging()
logger = logging.getLogger(__name__)

# Rate Limiting
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for the application."""
    try:
        # Startup
        await MongoDB.connect()
        # Admin initialization removed based on user request
        
        # Create Indexes
        await MongoDB.create_indexes()

        # Load dynamic BOM templates from DB
        from app.services.bom_strategies import BomStrategyFactory
        await BomStrategyFactory.load_templates_from_db()
        
        collection = MongoDB.get_collection("inventory")
        count = await collection.count_documents({})
        logger.info(f"✅ MongoDB connected successfully. Total items: {count}")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        raise
    finally:
        # Shutdown
        await MongoDB.disconnect()

app = FastAPI(
    title="מערכת ניהול מלאי",
    description="מערכת מתקדמת לניהול מלאי מחסן עם אפשרויות חיפוש, עריכה ויבוא מאקסל",
    version="2.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": "An unexpected error occurred. Please try again later."}
    )

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression Middleware - compress responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def add_private_network_header(request: Request, call_next):
    """Add PNA header for localhost access."""
    response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add response time header for monitoring and log request details."""
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
        return response
    except BaseException as exc:
        process_time = time.time() - start_time
        logger.error(f"{request.method} {request.url.path} - FAILED - {process_time:.3f}s")
        raise


# Include API routes
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Inventory Management System API",
        "version": "2.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        Health status of MongoDB connection
    """
    mongo_healthy = await MongoDB.health_check()
    
    status = "healthy" if mongo_healthy else "unhealthy"
    
    return JSONResponse(
        status_code=200 if mongo_healthy else 503,
        content={
            "status": status,
            "mongodb": "connected" if mongo_healthy else "disconnected",
            "version": "2.0.0"
        }
    )
