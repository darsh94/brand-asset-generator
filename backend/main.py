"""
Brand Asset Generator API

A FastAPI application that generates complete brand asset packages
using Gemini 3 for brand understanding and image generation.

Built for the Gemini 3 Hackathon 2026.
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from models import (
    BrandGuidelines,
    LogoRequest,
    SocialMediaRequest,
    PresentationRequest,
    EmailTemplateRequest,
    MarketingRequest,
    AssetPackage,
    HealthResponse,
)
from services import AssetGenerator


# Load environment variables
load_dotenv()


# Application state
class AppState:
    """Application state container."""
    asset_generator: Optional[AssetGenerator] = None


app_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Initializes services on startup and cleans up on shutdown.
    """
    # Startup
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        app_state.asset_generator = AssetGenerator(api_key=api_key)
        print("Asset Generator initialized successfully")
    else:
        print("Warning: GOOGLE_API_KEY not set. API calls will fail.")
    
    yield
    
    # Shutdown
    app_state.asset_generator = None
    print("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Brand Asset Generator API",
    description="""
    Generate complete brand asset packages using Gemini 3 AI.
    
    This API leverages Gemini 3 Pro for brand understanding and 
    gemini-3-pro-image-preview (Nano Banana) for high-quality image generation
    with legible text rendering.
    
    ## Features
    - Logo generation with multiple variations
    - Social media templates for all major platforms
    - Presentation deck slides
    - Email templates
    - Marketing materials (banners, flyers, business cards)
    
    ## Built for Gemini 3 Hackathon 2026
    """,
    version="1.0.0",
    lifespan=lifespan,
)


# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_asset_generator() -> AssetGenerator:
    """
    Dependency to get the asset generator instance.
    
    Raises:
        HTTPException: If the asset generator is not initialized
    """
    if app_state.asset_generator is None:
        raise HTTPException(
            status_code=503,
            detail="Asset generator not initialized. Please set GOOGLE_API_KEY environment variable."
        )
    return app_state.asset_generator


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/", response_model=HealthResponse, tags=["Health"])
async def root():
    """Root endpoint - returns API health status."""
    return HealthResponse(status="healthy", version="1.0.0")


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return HealthResponse(status="healthy", version="1.0.0")


# ============================================================================
# Brand Analysis Endpoint
# ============================================================================

@app.post("/api/analyze-brand", response_model=dict, tags=["Brand Analysis"])
async def analyze_brand(
    brand_guidelines: BrandGuidelines,
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Analyze brand guidelines and return a comprehensive brand identity profile.
    
    This analysis is used internally for asset generation but can also be
    called directly to get brand recommendations.
    """
    try:
        analysis = await generator._get_brand_analysis(brand_guidelines)
        return {
            "brand_name": brand_guidelines.brand_name,
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Asset Generation Endpoints
# ============================================================================

@app.post("/api/generate/logos", response_model=AssetPackage, tags=["Asset Generation"])
async def generate_logos(
    request: LogoRequest,
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Generate logo variations based on brand guidelines.
    
    Supports multiple logo variations:
    - Primary: Full logo with brand name and icon
    - Horizontal: Landscape orientation for headers
    - Stacked: Vertical orientation for square spaces
    - Icon Only: Just the symbol/mark
    - Monochrome: Single-color version
    - Reversed: For dark backgrounds
    """
    try:
        return await generator.generate_logos(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate/social-media", response_model=AssetPackage, tags=["Asset Generation"])
async def generate_social_media(
    request: SocialMediaRequest,
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Generate social media templates for specified platforms.
    
    Supported platforms:
    - Instagram Post (1080x1080)
    - Instagram Story (1080x1920)
    - Facebook Post (1200x630)
    - Twitter/X Post (1200x675)
    - LinkedIn Post (1200x627)
    - YouTube Thumbnail (1280x720)
    """
    try:
        return await generator.generate_social_media_templates(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate/presentation", response_model=AssetPackage, tags=["Asset Generation"])
async def generate_presentation(
    request: PresentationRequest,
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Generate presentation slides based on brand guidelines.
    
    Creates a cohesive presentation deck with:
    - Title slide
    - Content slides
    - Section dividers
    - Closing slide
    
    All slides maintain brand consistency in colors, fonts, and style.
    """
    try:
        return await generator.generate_presentation_deck(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate/email-templates", response_model=AssetPackage, tags=["Asset Generation"])
async def generate_email_templates(
    request: EmailTemplateRequest,
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Generate email templates based on brand guidelines.
    
    Supported template types:
    - Welcome: For new subscribers/customers
    - Newsletter: For regular updates
    - Promotional: For sales and offers
    - Transactional: For order confirmations, etc.
    - Announcement: For news and launches
    """
    try:
        return await generator.generate_email_templates(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate/marketing", response_model=AssetPackage, tags=["Asset Generation"])
async def generate_marketing_materials(
    request: MarketingRequest,
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Generate marketing materials based on brand guidelines.
    
    Supported material types:
    - Banner: Web banners for ads and headers
    - Flyer: Print/digital flyers
    - Business Card: Professional business cards
    - Poster: Large format posters
    - Brochure Cover: Cover designs for brochures
    """
    try:
        return await generator.generate_marketing_materials(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Complete Package Endpoint
# ============================================================================

@app.post("/api/generate/complete-package", response_model=AssetPackage, tags=["Asset Generation"])
async def generate_complete_package(
    brand_guidelines: BrandGuidelines,
    include_logos: bool = True,
    include_social: bool = True,
    include_presentation: bool = True,
    include_email: bool = True,
    include_marketing: bool = True,
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Generate a complete brand asset package.
    
    This endpoint generates all asset types in a single request,
    running generation tasks concurrently for maximum efficiency.
    
    Use the include_* parameters to customize which asset types to generate.
    """
    try:
        return await generator.generate_complete_package(
            brand_guidelines=brand_guidelines,
            include_logos=include_logos,
            include_social=include_social,
            include_presentation=include_presentation,
            include_email=include_email,
            include_marketing=include_marketing
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "error": str(exc)
        }
    )


# ============================================================================
# Run Application
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
