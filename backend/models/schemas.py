"""
Pydantic models for Brand Asset Generator API.

These schemas define the structure of requests and responses for the API,
ensuring type safety and validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class AssetType(str, Enum):
    """Enumeration of supported asset types."""
    LOGO = "logo"
    SOCIAL_MEDIA = "social_media"
    PRESENTATION = "presentation"
    EMAIL_TEMPLATE = "email_template"
    MARKETING = "marketing"


class SocialPlatform(str, Enum):
    """Supported social media platforms for template generation."""
    INSTAGRAM_POST = "instagram_post"
    INSTAGRAM_STORY = "instagram_story"
    FACEBOOK_POST = "facebook_post"
    TWITTER_POST = "twitter_post"
    LINKEDIN_POST = "linkedin_post"
    YOUTUBE_THUMBNAIL = "youtube_thumbnail"


class BrandGuidelines(BaseModel):
    """
    Input model for brand guidelines.
    
    Contains all the information needed to understand a brand's visual
    and tonal identity for consistent asset generation.
    """
    brand_name: str = Field(..., description="The name of the brand")
    primary_color: str = Field(..., description="Primary brand color in hex format (e.g., #FF5733)")
    secondary_color: str = Field(..., description="Secondary brand color in hex format")
    accent_color: Optional[str] = Field(None, description="Optional accent color in hex format")
    
    primary_font: str = Field(..., description="Primary font family name (e.g., 'Inter', 'Roboto')")
    secondary_font: Optional[str] = Field(None, description="Secondary font family for body text")
    
    brand_tone: str = Field(
        ..., 
        description="Brand voice/tone (e.g., 'Professional and trustworthy', 'Fun and playful')"
    )
    target_audience: str = Field(
        ..., 
        description="Description of target audience (e.g., 'Tech-savvy millennials')"
    )
    
    industry: str = Field(..., description="Industry/sector the brand operates in")
    brand_values: Optional[str] = Field(None, description="Core brand values and mission")
    tagline: Optional[str] = Field(None, description="Brand tagline or slogan")
    
    additional_context: Optional[str] = Field(
        None, 
        description="Any additional context about the brand identity"
    )


class LogoVariation(str, Enum):
    """Types of logo variations to generate."""
    PRIMARY = "primary"
    HORIZONTAL = "horizontal"
    STACKED = "stacked"
    ICON_ONLY = "icon_only"
    MONOCHROME = "monochrome"
    REVERSED = "reversed"  # For dark backgrounds


class LogoRequest(BaseModel):
    """Request model for logo generation."""
    brand_guidelines: BrandGuidelines
    variations: list[LogoVariation] = Field(
        default=[LogoVariation.PRIMARY, LogoVariation.ICON_ONLY],
        description="List of logo variations to generate"
    )
    style_preferences: Optional[str] = Field(
        None,
        description="Additional style preferences (e.g., 'minimalist', 'geometric', 'hand-drawn')"
    )


class SocialMediaRequest(BaseModel):
    """Request model for social media template generation."""
    brand_guidelines: BrandGuidelines
    platforms: list[SocialPlatform] = Field(
        default=[SocialPlatform.INSTAGRAM_POST, SocialPlatform.TWITTER_POST],
        description="List of platforms to generate templates for"
    )
    template_purpose: Optional[str] = Field(
        None,
        description="Purpose of templates (e.g., 'product announcement', 'quote posts')"
    )


class PresentationRequest(BaseModel):
    """Request model for presentation deck generation."""
    brand_guidelines: BrandGuidelines
    slide_count: int = Field(default=5, ge=1, le=20, description="Number of slides to generate")
    presentation_type: str = Field(
        default="general",
        description="Type of presentation (e.g., 'pitch deck', 'company overview', 'product demo')"
    )


class EmailTemplateRequest(BaseModel):
    """Request model for email template generation."""
    brand_guidelines: BrandGuidelines
    template_types: list[str] = Field(
        default=["welcome", "newsletter"],
        description="Types of email templates to generate"
    )


class MarketingRequest(BaseModel):
    """Request model for marketing material generation."""
    brand_guidelines: BrandGuidelines
    material_types: list[str] = Field(
        default=["banner", "flyer"],
        description="Types of marketing materials to generate"
    )


class ValidationResult(BaseModel):
    """Result of asset validation against brand guidelines."""
    passed: bool = Field(..., description="Whether the asset passed validation")
    score: int = Field(..., ge=0, le=100, description="Validation score 0-100")
    issues: list[str] = Field(default=[], description="List of issues found")
    critique: str = Field(..., description="Detailed critique of the asset")
    regeneration_guidance: Optional[str] = Field(
        None, 
        description="Specific guidance for regeneration if failed"
    )


class AssetIteration(BaseModel):
    """Record of a single iteration in the self-correcting loop."""
    iteration_number: int = Field(..., ge=1, le=3, description="Iteration number (1-3)")
    image_data: str = Field(..., description="Base64 encoded image data for this iteration")
    mime_type: str = Field(default="image/png", description="MIME type of the image")
    validation: ValidationResult = Field(..., description="Validation result for this iteration")
    status: str = Field(..., description="Status: 'failed', 'passed', or 'final'")


class ConsistencyScore(BaseModel):
    """Brand consistency score breakdown for an asset."""
    overall_score: int = Field(..., ge=0, le=100, description="Overall consistency score 0-100")
    color_adherence: int = Field(..., ge=0, le=100, description="How well colors match brand palette")
    typography_compliance: int = Field(..., ge=0, le=100, description="Typography alignment with brand")
    tone_alignment: int = Field(..., ge=0, le=100, description="Visual tone matches brand voice")
    layout_quality: int = Field(..., ge=0, le=100, description="Layout completeness and balance")
    brand_recognition: int = Field(..., ge=0, le=100, description="Brand is clearly identifiable")
    explanation: str = Field(..., description="Brief explanation of the score")
    strengths: list[str] = Field(default=[], description="Key strengths of the asset")
    improvements: list[str] = Field(default=[], description="Suggested improvements")


class GeneratedAsset(BaseModel):
    """Response model for a generated asset."""
    asset_type: AssetType
    asset_name: str = Field(..., description="Descriptive name of the asset")
    image_data: str = Field(..., description="Base64 encoded image data")
    mime_type: str = Field(default="image/png", description="MIME type of the image")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    description: Optional[str] = Field(None, description="AI-generated description of the asset")
    consistency_score: Optional[ConsistencyScore] = Field(None, description="Brand consistency evaluation")
    
    # Self-correcting loop fields
    iteration_count: int = Field(default=1, description="Number of iterations taken (1-3)")
    iteration_history: list[AssetIteration] = Field(
        default=[], 
        description="History of all iterations showing the self-correction process"
    )
    self_corrected: bool = Field(
        default=False, 
        description="Whether the asset went through self-correction"
    )


class BatchConsistencyScore(BaseModel):
    """Aggregate consistency score for the entire asset package."""
    overall_score: int = Field(..., ge=0, le=100, description="Average consistency across all assets")
    color_adherence: int = Field(..., ge=0, le=100, description="Average color adherence")
    typography_compliance: int = Field(..., ge=0, le=100, description="Average typography compliance")
    tone_alignment: int = Field(..., ge=0, le=100, description="Average tone alignment")
    layout_quality: int = Field(..., ge=0, le=100, description="Average layout quality")
    brand_recognition: int = Field(..., ge=0, le=100, description="Average brand recognition")
    summary: str = Field(..., description="Executive summary of brand consistency")
    top_performers: list[str] = Field(default=[], description="Best performing asset names")
    needs_attention: list[str] = Field(default=[], description="Assets that may need revision")


class AssetPackage(BaseModel):
    """Response model for a complete asset package."""
    brand_name: str
    assets: list[GeneratedAsset]
    brand_analysis: str = Field(
        ..., 
        description="AI analysis of the brand identity used to guide generation"
    )
    generation_notes: Optional[str] = Field(
        None,
        description="Notes about the generation process and design decisions"
    )
    batch_score: Optional[BatchConsistencyScore] = Field(
        None,
        description="Aggregate consistency score for all assets"
    )


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "1.0.0"
