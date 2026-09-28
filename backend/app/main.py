from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api import (
    auth,
    students,
    curriculum,
    lessons,
    assessments,
    progress,
    sync,
    ai,
    sms_webhook,
    analytics,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on startup
    await init_db()
    # Note: Seed data can be initialized via seed_data.py
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Rehber Offline-First Rural Education Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for web teacher platform and mobile client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular API routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(students.router, prefix=settings.API_PREFIX)
app.include_router(curriculum.router, prefix=settings.API_PREFIX)
app.include_router(lessons.router, prefix=settings.API_PREFIX)
app.include_router(assessments.router, prefix=settings.API_PREFIX)
app.include_router(progress.router, prefix=settings.API_PREFIX)
app.include_router(sync.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)
app.include_router(sms_webhook.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    return {
        "message": "Welcome to Rehber API - AI Personalized Learning Platform for Rural Communities",
        "docs_url": "/docs",
        "health": "/health"
    }
