"""
Asset Generator Service for Brand Asset Generator.

This service orchestrates the generation of different asset types,
managing the workflow from brand analysis to final asset creation.
"""

import asyncio
import base64
from typing import Optional

from services.gemini_service import GeminiService
from models.schemas import (
    BrandGuidelines,
    LogoRequest,
    LogoVariation,
    SocialMediaRequest,
    SocialPlatform,
    PresentationRequest,
    EmailTemplateRequest,
    MarketingRequest,
    GeneratedAsset,
    AssetPackage,
    AssetType,
)


class AssetGenerator:
    """
    Main asset generator that orchestrates all asset creation.
    
    Uses GeminiService for AI operations and manages the complete
    workflow from brand analysis to asset generation.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the asset generator.
        
        Args:
            api_key: Optional Google AI API key
        """
        self.gemini = GeminiService(api_key=api_key)
        self._brand_analysis_cache: dict[str, str] = {}
    
    async def _get_brand_analysis(self, brand_guidelines: BrandGuidelines) -> str:
        """
        Get or generate brand analysis, using cache if available.
        
        Args:
            brand_guidelines: Brand guidelines to analyze
            
        Returns:
            Brand analysis string
        """
        cache_key = brand_guidelines.brand_name
        
        if cache_key not in self._brand_analysis_cache:
            analysis = await self.gemini.analyze_brand(brand_guidelines.model_dump())
            self._brand_analysis_cache[cache_key] = analysis
        
        return self._brand_analysis_cache[cache_key]
    
    async def generate_logos(self, request: LogoRequest) -> AssetPackage:
        """
        Generate logo variations based on brand guidelines.
        
        Args:
            request: Logo generation request with brand guidelines and variations
            
        Returns:
            AssetPackage containing all generated logo variations
        """
        brand_analysis = await self._get_brand_analysis(request.brand_guidelines)
        guidelines_dict = request.brand_guidelines.model_dump()
        
        assets: list[GeneratedAsset] = []
        
        # Generate each logo variation
        for variation in request.variations:
            prompt = self.gemini.create_logo_prompt(
                brand_guidelines=guidelines_dict,
                variation=variation.value,
                brand_analysis=brand_analysis,
                style_preferences=request.style_preferences
            )
            
            try:
                image_bytes, mime_type = await self.gemini.generate_image(
                    prompt=prompt,
                    width=1024,
                    height=1024,
                    style_guidance=f"Logo design for {request.brand_guidelines.industry} brand"
                )
                
                asset = GeneratedAsset(
                    asset_type=AssetType.LOGO,
                    asset_name=f"logo_{variation.value}",
                    image_data=base64.b64encode(image_bytes).decode('utf-8'),
                    mime_type=mime_type,
                    width=1024,
                    height=1024,
                    description=f"{variation.value.replace('_', ' ').title()} logo variation for {request.brand_guidelines.brand_name}"
                )
                assets.append(asset)
                
            except Exception as e:
                print(f"Error generating logo variation {variation}: {e}")
                continue
        
        return AssetPackage(
            brand_name=request.brand_guidelines.brand_name,
            assets=assets,
            brand_analysis=brand_analysis,
            generation_notes=f"Generated {len(assets)} logo variations with style: {request.style_preferences or 'default'}"
        )
    
    async def generate_social_media_templates(
        self, 
        request: SocialMediaRequest
    ) -> AssetPackage:
        """
        Generate social media templates for specified platforms.
        
        Args:
            request: Social media template request
            
        Returns:
            AssetPackage containing all generated templates
        """
        brand_analysis = await self._get_brand_analysis(request.brand_guidelines)
        guidelines_dict = request.brand_guidelines.model_dump()
        
        assets: list[GeneratedAsset] = []
        
        for platform in request.platforms:
            prompt, width, height = self.gemini.create_social_media_prompt(
                brand_guidelines=guidelines_dict,
                platform=platform.value,
                brand_analysis=brand_analysis,
                template_purpose=request.template_purpose
            )
            
            try:
                image_bytes, mime_type = await self.gemini.generate_image(
                    prompt=prompt,
                    width=width,
                    height=height,
                    style_guidance=f"Social media template for {request.brand_guidelines.brand_tone} brand"
                )
                
                asset = GeneratedAsset(
                    asset_type=AssetType.SOCIAL_MEDIA,
                    asset_name=f"social_{platform.value}",
                    image_data=base64.b64encode(image_bytes).decode('utf-8'),
                    mime_type=mime_type,
                    width=width,
                    height=height,
                    description=f"{platform.value.replace('_', ' ').title()} template for {request.brand_guidelines.brand_name}"
                )
                assets.append(asset)
                
            except Exception as e:
                print(f"Error generating template for {platform}: {e}")
                continue
        
        return AssetPackage(
            brand_name=request.brand_guidelines.brand_name,
            assets=assets,
            brand_analysis=brand_analysis,
            generation_notes=f"Generated {len(assets)} social media templates for platforms: {[p.value for p in request.platforms]}"
        )
    
    async def generate_presentation_deck(
        self, 
        request: PresentationRequest
    ) -> AssetPackage:
        """
        Generate presentation slides based on brand guidelines.
        
        Args:
            request: Presentation generation request
            
        Returns:
            AssetPackage containing all generated slides
        """
        brand_analysis = await self._get_brand_analysis(request.brand_guidelines)
        guidelines_dict = request.brand_guidelines.model_dump()
        
        # Define slide types based on requested count
        slide_types = self._get_slide_sequence(request.slide_count)
        
        assets: list[GeneratedAsset] = []
        
        for i, slide_type in enumerate(slide_types):
            prompt = self.gemini.create_presentation_prompt(
                brand_guidelines=guidelines_dict,
                slide_type=slide_type,
                brand_analysis=brand_analysis,
                presentation_type=request.presentation_type
            )
            
            try:
                image_bytes, mime_type = await self.gemini.generate_image(
                    prompt=prompt,
                    width=1920,
                    height=1080,
                    style_guidance=f"Professional presentation slide for {request.brand_guidelines.industry}"
                )
                
                asset = GeneratedAsset(
                    asset_type=AssetType.PRESENTATION,
                    asset_name=f"slide_{i+1:02d}_{slide_type}",
                    image_data=base64.b64encode(image_bytes).decode('utf-8'),
                    mime_type=mime_type,
                    width=1920,
                    height=1080,
                    description=f"Slide {i+1}: {slide_type.replace('_', ' ').title()}"
                )
                assets.append(asset)
                
            except Exception as e:
                print(f"Error generating slide {i+1} ({slide_type}): {e}")
                continue
        
        return AssetPackage(
            brand_name=request.brand_guidelines.brand_name,
            assets=assets,
            brand_analysis=brand_analysis,
            generation_notes=f"Generated {len(assets)} presentation slides for {request.presentation_type}"
        )
    
    def _get_slide_sequence(self, count: int) -> list[str]:
        """
        Generate a logical sequence of slide types based on count.
        
        Args:
            count: Number of slides requested
            
        Returns:
            List of slide type strings
        """
        if count <= 3:
            return ["title", "content", "closing"][:count]
        
        # For more slides, create a varied sequence
        slides = ["title"]
        
        content_types = ["content", "two_column", "image_focus", "section"]
        remaining = count - 2  # Reserve for title and closing
        
        for i in range(remaining):
            if i % 4 == 0 and i > 0:
                slides.append("section")
            else:
                slides.append(content_types[i % len(content_types)])
        
        slides.append("closing")
        return slides[:count]
    
    async def generate_email_templates(
        self, 
        request: EmailTemplateRequest
    ) -> AssetPackage:
        """
        Generate email templates based on brand guidelines.
        
        Args:
            request: Email template generation request
            
        Returns:
            AssetPackage containing all generated email templates
        """
        brand_analysis = await self._get_brand_analysis(request.brand_guidelines)
        guidelines_dict = request.brand_guidelines.model_dump()
        
        assets: list[GeneratedAsset] = []
        
        for template_type in request.template_types:
            prompt = self.gemini.create_email_template_prompt(
                brand_guidelines=guidelines_dict,
                template_type=template_type,
                brand_analysis=brand_analysis
            )
            
            try:
                image_bytes, mime_type = await self.gemini.generate_image(
                    prompt=prompt,
                    width=600,
                    height=1000,
                    style_guidance=f"Professional email template for {request.brand_guidelines.brand_tone} brand"
                )
                
                asset = GeneratedAsset(
                    asset_type=AssetType.EMAIL_TEMPLATE,
                    asset_name=f"email_{template_type}",
                    image_data=base64.b64encode(image_bytes).decode('utf-8'),
                    mime_type=mime_type,
                    width=600,
                    height=1000,
                    description=f"{template_type.replace('_', ' ').title()} email template for {request.brand_guidelines.brand_name}"
                )
                assets.append(asset)
                
            except Exception as e:
                print(f"Error generating email template {template_type}: {e}")
                continue
        
        return AssetPackage(
            brand_name=request.brand_guidelines.brand_name,
            assets=assets,
            brand_analysis=brand_analysis,
            generation_notes=f"Generated {len(assets)} email templates: {request.template_types}"
        )
    
    async def generate_marketing_materials(
        self, 
        request: MarketingRequest
    ) -> AssetPackage:
        """
        Generate marketing materials based on brand guidelines.
        
        Args:
            request: Marketing material generation request
            
        Returns:
            AssetPackage containing all generated marketing materials
        """
        brand_analysis = await self._get_brand_analysis(request.brand_guidelines)
        guidelines_dict = request.brand_guidelines.model_dump()
        
        assets: list[GeneratedAsset] = []
        
        for material_type in request.material_types:
            prompt, width, height = self.gemini.create_marketing_material_prompt(
                brand_guidelines=guidelines_dict,
                material_type=material_type,
                brand_analysis=brand_analysis
            )
            
            try:
                image_bytes, mime_type = await self.gemini.generate_image(
                    prompt=prompt,
                    width=width,
                    height=height,
                    style_guidance=f"Professional marketing material for {request.brand_guidelines.industry}"
                )
                
                asset = GeneratedAsset(
                    asset_type=AssetType.MARKETING,
                    asset_name=f"marketing_{material_type}",
                    image_data=base64.b64encode(image_bytes).decode('utf-8'),
                    mime_type=mime_type,
                    width=width,
                    height=height,
                    description=f"{material_type.replace('_', ' ').title()} for {request.brand_guidelines.brand_name}"
                )
                assets.append(asset)
                
            except Exception as e:
                print(f"Error generating marketing material {material_type}: {e}")
                continue
        
        return AssetPackage(
            brand_name=request.brand_guidelines.brand_name,
            assets=assets,
            brand_analysis=brand_analysis,
            generation_notes=f"Generated {len(assets)} marketing materials: {request.material_types}"
        )
    
    async def generate_complete_package(
        self,
        brand_guidelines: BrandGuidelines,
        include_logos: bool = True,
        include_social: bool = True,
        include_presentation: bool = True,
        include_email: bool = True,
        include_marketing: bool = True
    ) -> AssetPackage:
        """
        Generate a complete brand asset package.
        
        This method generates all requested asset types concurrently
        for maximum efficiency.
        
        Args:
            brand_guidelines: Brand guidelines for generation
            include_logos: Whether to include logo variations
            include_social: Whether to include social media templates
            include_presentation: Whether to include presentation slides
            include_email: Whether to include email templates
            include_marketing: Whether to include marketing materials
            
        Returns:
            Complete AssetPackage with all generated assets
        """
        # Pre-compute brand analysis
        brand_analysis = await self._get_brand_analysis(brand_guidelines)
        
        # Prepare all generation tasks
        tasks = []
        
        if include_logos:
            logo_request = LogoRequest(
                brand_guidelines=brand_guidelines,
                variations=[
                    LogoVariation.PRIMARY,
                    LogoVariation.ICON_ONLY,
                    LogoVariation.HORIZONTAL
                ]
            )
            tasks.append(self.generate_logos(logo_request))
        
        if include_social:
            social_request = SocialMediaRequest(
                brand_guidelines=brand_guidelines,
                platforms=[
                    SocialPlatform.INSTAGRAM_POST,
                    SocialPlatform.TWITTER_POST,
                    SocialPlatform.LINKEDIN_POST
                ]
            )
            tasks.append(self.generate_social_media_templates(social_request))
        
        if include_presentation:
            presentation_request = PresentationRequest(
                brand_guidelines=brand_guidelines,
                slide_count=5,
                presentation_type="company overview"
            )
            tasks.append(self.generate_presentation_deck(presentation_request))
        
        if include_email:
            email_request = EmailTemplateRequest(
                brand_guidelines=brand_guidelines,
                template_types=["welcome", "newsletter"]
            )
            tasks.append(self.generate_email_templates(email_request))
        
        if include_marketing:
            marketing_request = MarketingRequest(
                brand_guidelines=brand_guidelines,
                material_types=["banner", "flyer", "business_card"]
            )
            tasks.append(self.generate_marketing_materials(marketing_request))
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Collect all assets
        all_assets: list[GeneratedAsset] = []
        generation_notes = []
        
        for result in results:
            if isinstance(result, Exception):
                generation_notes.append(f"Error: {str(result)}")
            elif isinstance(result, AssetPackage):
                all_assets.extend(result.assets)
                if result.generation_notes:
                    generation_notes.append(result.generation_notes)
        
        return AssetPackage(
            brand_name=brand_guidelines.brand_name,
            assets=all_assets,
            brand_analysis=brand_analysis,
            generation_notes=" | ".join(generation_notes)
        )
