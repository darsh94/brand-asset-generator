"""
Brand Asset Generator API

A FastAPI application that generates complete brand asset packages
using Gemini 3 for brand understanding and image generation.

Built for the Gemini 3 Hackathon 2026.
"""

import os
import json
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, AsyncGenerator

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
import fitz  # PyMuPDF

from models import (
    BrandGuidelines,
    LogoRequest,
    SocialMediaRequest,
    PresentationRequest,
    EmailTemplateRequest,
    MarketingRequest,
    AssetPackage,
    HealthResponse,
    GeneratedAsset,
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
# Get allowed origins from environment or use defaults
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []
DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
# Combine default and environment origins
ALL_ORIGINS = DEFAULT_ORIGINS + [origin.strip() for origin in CORS_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALL_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deployments
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
# PDF Upload Endpoint
# ============================================================================

@app.post("/api/upload-pdf", tags=["PDF Upload"])
async def upload_pdf(
    file: UploadFile = File(...),
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Upload a PDF file containing brand guidelines and extract brand information.
    
    The PDF is parsed and analyzed using AI to extract:
    - Brand name
    - Colors (primary, secondary, accent)
    - Typography (fonts)
    - Brand tone and values
    - Target audience
    - Industry
    - Tagline
    - Additional context
    
    Returns extracted data that can be used to auto-fill the brand form.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Extract text from PDF using PyMuPDF
        pdf_document = fitz.open(stream=content, filetype="pdf")
        text_content = []
        
        for page_num in range(pdf_document.page_count):
            page = pdf_document[page_num]
            text_content.append(page.get_text())
        
        pdf_document.close()
        
        # Combine all text
        full_text = "\n\n".join(text_content)
        
        if not full_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from PDF. The PDF might be image-based or empty."
            )
        
        # Use Gemini to extract brand information
        extracted_data = await generator.gemini.extract_brand_from_pdf(full_text)
        
        return {
            "success": True,
            "message": "Brand information extracted successfully",
            "data": extracted_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing PDF: {str(e)}"
        )


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


@app.post("/api/generate/complete-package-stream", tags=["Asset Generation"])
async def generate_complete_package_stream(
    brand_guidelines: BrandGuidelines,
    include_logos: bool = True,
    include_social: bool = True,
    include_presentation: bool = True,
    include_email: bool = True,
    include_marketing: bool = True,
    generator: AssetGenerator = Depends(get_asset_generator)
):
    """
    Generate a complete brand asset package with progress streaming.
    
    This endpoint uses Server-Sent Events (SSE) to stream progress updates
    as each asset category is generated.
    
    Events:
    - progress: Contains current step, total steps, percentage, and message
    - complete: Contains the final AssetPackage
    - error: Contains error details if something fails
    """
    
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Determine which categories are enabled
            categories = []
            if include_logos:
                categories.append(("logos", "Creating logo variations"))
            if include_social:
                categories.append(("social", "Generating social media templates"))
            if include_presentation:
                categories.append(("presentation", "Designing presentation slides"))
            if include_email:
                categories.append(("email", "Crafting email templates"))
            if include_marketing:
                categories.append(("marketing", "Building marketing materials"))
            
            total_steps = len(categories) + 1  # +1 for brand analysis
            completed_steps = 0
            
            # Step 1: Brand Analysis - send "starting" message first
            yield f"data: {json.dumps({'type': 'progress', 'step': 1, 'total': total_steps, 'percentage': 0, 'message': 'Analyzing brand identity'})}\n\n"
            
            brand_analysis = await generator._get_brand_analysis(brand_guidelines)
            
            # Brand analysis complete
            completed_steps = 1
            
            # Generate each category sequentially for progress tracking
            all_assets = []
            generation_notes = []
            
            for idx, (category_key, category_message) in enumerate(categories):
                current_step = idx + 2  # +2 because step 1 is brand analysis
                
                # Calculate percentage based on COMPLETED steps (before this one starts)
                percentage = int((completed_steps / total_steps) * 100)
                yield f"data: {json.dumps({'type': 'progress', 'step': current_step, 'total': total_steps, 'percentage': percentage, 'message': category_message})}\n\n"
                
                try:
                    result = await generator.generate_category(
                        brand_guidelines=brand_guidelines,
                        category=category_key
                    )
                    if result:
                        all_assets.extend(result.assets)
                        if result.generation_notes:
                            generation_notes.append(result.generation_notes)
                except Exception as e:
                    generation_notes.append(f"Error generating {category_key}: {str(e)}")
                
                # Mark this step as completed
                completed_steps += 1
            
            # Scoring step
            yield f"data: {json.dumps({'type': 'progress', 'step': total_steps, 'total': total_steps + 1, 'percentage': 90, 'message': 'Scoring brand consistency'})}\n\n"
            
            # Score each asset
            from models.schemas import ConsistencyScore
            scored_assets = []
            for asset in all_assets:
                score = await generator._score_asset(asset, brand_guidelines)
                scored_asset = GeneratedAsset(
                    asset_type=asset.asset_type,
                    asset_name=asset.asset_name,
                    image_data=asset.image_data,
                    mime_type=asset.mime_type,
                    width=asset.width,
                    height=asset.height,
                    description=asset.description,
                    consistency_score=score
                )
                scored_assets.append(scored_asset)
            
            # Compute batch score
            batch_score = await generator._compute_batch_score(scored_assets)
            
            # Build campaign context if campaign fields are provided
            campaign_context = None
            if brand_guidelines.campaign_name or brand_guidelines.campaign_goal or brand_guidelines.campaign_message:
                campaign_context = await generator._build_campaign_context(
                    brand_guidelines=brand_guidelines,
                    assets=scored_assets
                )
            
            # Finalize
            yield f"data: {json.dumps({'type': 'progress', 'step': total_steps + 1, 'total': total_steps + 1, 'percentage': 100, 'message': 'Finalizing assets'})}\n\n"
            
            # Create final package
            final_package = AssetPackage(
                brand_name=brand_guidelines.brand_name,
                assets=scored_assets,
                brand_analysis=brand_analysis,
                generation_notes=" | ".join(generation_notes),
                batch_score=batch_score,
                campaign=campaign_context
            )
            
            # Send complete event with the final data
            yield f"data: {json.dumps({'type': 'complete', 'data': final_package.model_dump()})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


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
