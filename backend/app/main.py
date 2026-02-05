from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from app.config import settings
from app.db.mongodb import MongoDB
from app.routes.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="מערכת ניהול מלאי",
    description="מערכת מתקדמת לניהול מלאי מחסן עם אפשרויות חיפוש, עריכה ויבוא מאקסל",
    version="2.0.0"
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
    """Add response time header for monitoring."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.debug(f"{request.method} {request.url.path} - {process_time:.3f}s")
    return response


# Startup Event
@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection."""
    try:
        # Connect to MongoDB
        await MongoDB.connect()
        
        # Initialize first admin from env vars
        from app.db.init_admin import init_admin
        await init_admin()
        
        # Verify MongoDB connection
        collection = MongoDB.get_collection("inventory")
        count = await collection.count_documents({})
        logger.info(f"✅ MongoDB connected successfully. Total items: {count}")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        raise


# Shutdown Event
@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection."""
    await MongoDB.disconnect()


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
