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
    ConsistencyScore,
    BatchConsistencyScore,
    ValidationResult,
    AssetIteration,
    CampaignContext,
)

# Configuration for self-correcting loop
MAX_ITERATIONS = 3
VALIDATION_THRESHOLD = 70  # Score required to pass validation


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
    
    async def _score_asset(
        self, 
        asset: GeneratedAsset, 
        brand_guidelines: BrandGuidelines
    ) -> ConsistencyScore:
        """
        Score a single asset for brand consistency.
        
        Args:
            asset: The generated asset to score
            brand_guidelines: Brand guidelines used for generation
            
        Returns:
            ConsistencyScore object
        """
        try:
            score_data = await self.gemini.score_asset_consistency(
                brand_guidelines=brand_guidelines.model_dump(),
                asset_name=asset.asset_name,
                asset_type=asset.asset_type.value,
                asset_description=asset.description or f"{asset.asset_type.value} asset"
            )
            return ConsistencyScore(**score_data)
        except Exception as e:
            print(f"Error scoring asset {asset.asset_name}: {e}")
            return ConsistencyScore(
                overall_score=75,
                color_adherence=75,
                typography_compliance=75,
                tone_alignment=75,
                layout_quality=75,
                brand_recognition=75,
                explanation="Asset scored with default values due to evaluation error.",
                strengths=["Generated successfully"],
                improvements=["Manual review recommended"]
            )
    
    async def _compute_batch_score(
        self, 
        assets: list[GeneratedAsset]
    ) -> BatchConsistencyScore:
        """
        Compute aggregate consistency score for all assets.
        
        Args:
            assets: List of generated assets with individual scores
            
        Returns:
            BatchConsistencyScore with aggregated metrics
        """
        if not assets:
            return BatchConsistencyScore(
                overall_score=0,
                color_adherence=0,
                typography_compliance=0,
                tone_alignment=0,
                layout_quality=0,
                brand_recognition=0,
                summary="No assets generated.",
                top_performers=[],
                needs_attention=[]
            )
        
        # Calculate averages
        scored_assets = [a for a in assets if a.consistency_score]
        if not scored_assets:
            return BatchConsistencyScore(
                overall_score=75,
                color_adherence=75,
                typography_compliance=75,
                tone_alignment=75,
                layout_quality=75,
                brand_recognition=75,
                summary="Assets generated successfully.",
                top_performers=[],
                needs_attention=[]
            )
        
        n = len(scored_assets)
        avg_overall = sum(a.consistency_score.overall_score for a in scored_assets) // n
        avg_color = sum(a.consistency_score.color_adherence for a in scored_assets) // n
        avg_typo = sum(a.consistency_score.typography_compliance for a in scored_assets) // n
        avg_tone = sum(a.consistency_score.tone_alignment for a in scored_assets) // n
        avg_layout = sum(a.consistency_score.layout_quality for a in scored_assets) // n
        avg_brand = sum(a.consistency_score.brand_recognition for a in scored_assets) // n
        
        # Find top performers (score >= 85) and needs attention (score < 70)
        top_performers = [
            a.asset_name for a in scored_assets 
            if a.consistency_score.overall_score >= 85
        ][:3]
        needs_attention = [
            a.asset_name for a in scored_assets 
            if a.consistency_score.overall_score < 70
        ][:3]
        
        # Generate summary
        if avg_overall >= 85:
            summary = f"Excellent brand consistency across {n} assets. The visual identity is strong and cohesive."
        elif avg_overall >= 75:
            summary = f"Good brand consistency across {n} assets. Minor refinements could enhance cohesion."
        elif avg_overall >= 65:
            summary = f"Moderate brand consistency across {n} assets. Some assets may benefit from revision."
        else:
            summary = f"Brand consistency needs improvement across {n} assets. Review recommended."
        
        return BatchConsistencyScore(
            overall_score=avg_overall,
            color_adherence=avg_color,
            typography_compliance=avg_typo,
            tone_alignment=avg_tone,
            layout_quality=avg_layout,
            brand_recognition=avg_brand,
            summary=summary,
            top_performers=top_performers,
            needs_attention=needs_attention
        )
    
    async def _generate_with_self_correction(
        self,
        prompt: str,
        brand_guidelines: BrandGuidelines,
        asset_type: AssetType,
        asset_name: str,
        description: str,
        width: int,
        height: int,
        style_guidance: str = ""
    ) -> GeneratedAsset:
        """
        Generate an asset with self-correcting loop.
        
        This method implements the core self-correction logic:
        1. Generate the asset
        2. Validate it against brand guidelines
        3. If validation fails, regenerate with critique feedback
        4. Repeat up to MAX_ITERATIONS times
        
        Args:
            prompt: The generation prompt
            brand_guidelines: Brand guidelines to validate against
            asset_type: Type of asset being generated
            asset_name: Name for the asset
            description: Description of what's being generated
            width: Expected image width
            height: Expected image height
            style_guidance: Additional style guidance
            
        Returns:
            GeneratedAsset with iteration history
        """
        guidelines_dict = brand_guidelines.model_dump()
        iteration_history: list[AssetIteration] = []
        previous_issues: list[str] = []
        
        final_image_data: bytes = b''
        final_mime_type: str = 'image/png'
        
        current_prompt = prompt
        current_style = style_guidance
        
        for iteration_num in range(1, MAX_ITERATIONS + 1):
            print(f"  [Iteration {iteration_num}/{MAX_ITERATIONS}] Generating {asset_name}...")
            
            # Add regeneration guidance to the style if we have previous issues
            if previous_issues and iteration_num > 1:
                issue_text = chr(10).join(f'- {issue}' for issue in previous_issues)
                current_style = f"""{style_guidance}

CRITICAL - Previous version had these issues that MUST be fixed:
{issue_text}

Apply these specific corrections in this version."""
            
            try:
                image_bytes, mime_type = await self.gemini.generate_image(
                    prompt=current_prompt,
                    width=width,
                    height=height,
                    style_guidance=current_style
                )
                final_image_data = image_bytes
                final_mime_type = mime_type
                
            except Exception as e:
                print(f"  [Iteration {iteration_num}] Generation error: {e}")
                # Record failed generation attempt
                iteration_history.append(AssetIteration(
                    iteration_number=iteration_num,
                    image_data="",  # No image generated
                    mime_type="image/png",
                    validation=ValidationResult(
                        passed=False,
                        score=0,
                        issues=[f"Generation failed: {str(e)}"],
                        critique="Asset generation failed.",
                        regeneration_guidance="Retry generation with adjusted parameters."
                    ),
                    status="failed"
                ))
                continue
            
            # Validate the generated image
            print(f"  [Iteration {iteration_num}] Validating asset...")
            validation_result = await self.gemini.validate_and_critique(
                image_data=image_bytes,
                mime_type=mime_type,
                brand_guidelines=guidelines_dict,
                asset_type=asset_type.value,
                asset_description=description,
                previous_issues=previous_issues if iteration_num > 1 else None
            )
            
            passed = validation_result.get('passed', True)
            score = validation_result.get('score', 75)
            issues = validation_result.get('issues', [])
            critique = validation_result.get('critique', 'Asset validated.')
            regen_guidance = validation_result.get('regeneration_guidance')
            
            # Determine status for this iteration
            if passed or iteration_num == MAX_ITERATIONS:
                status = "final" if passed else "passed"  # Accept last iteration even if not perfect
            else:
                status = "failed"
            
            # Record this iteration
            iteration_history.append(AssetIteration(
                iteration_number=iteration_num,
                image_data=base64.b64encode(image_bytes).decode('utf-8'),
                mime_type=mime_type,
                validation=ValidationResult(
                    passed=passed,
                    score=score,
                    issues=issues,
                    critique=critique,
                    regeneration_guidance=regen_guidance
                ),
                status=status
            ))
            
            print(f"  [Iteration {iteration_num}] Score: {score}/100 - {'PASSED' if passed else 'NEEDS IMPROVEMENT'}")
            
            # If passed, we're done
            if passed:
                break
            
            # Store issues for next iteration
            previous_issues = issues
            
            # Add regeneration guidance to issues for next iteration
            if regen_guidance:
                previous_issues.append(f"Guidance: {regen_guidance}")
        
        # Determine if self-correction was applied
        self_corrected = len(iteration_history) > 1
        
        return GeneratedAsset(
            asset_type=asset_type,
            asset_name=asset_name,
            image_data=base64.b64encode(final_image_data).decode('utf-8'),
            mime_type=final_mime_type,
            width=width,
            height=height,
            description=description,
            iteration_count=len(iteration_history),
            iteration_history=iteration_history,
            self_corrected=self_corrected
        )
    
    async def generate_logos(self, request: LogoRequest) -> AssetPackage:
        """
        Generate logo variations based on brand guidelines with self-correction.
        
        Args:
            request: Logo generation request with brand guidelines and variations
            
        Returns:
            AssetPackage containing all generated logo variations
        """
        brand_analysis = await self._get_brand_analysis(request.brand_guidelines)
        guidelines_dict = request.brand_guidelines.model_dump()
        
        assets: list[GeneratedAsset] = []
        
        # Generate each logo variation with self-correction
        for variation in request.variations:
            prompt = self.gemini.create_logo_prompt(
                brand_guidelines=guidelines_dict,
                variation=variation.value,
                brand_analysis=brand_analysis,
                style_preferences=request.style_preferences
            )
            
            try:
                print(f"\n[Logo] Starting self-correcting generation for {variation.value}...")
                
                asset = await self._generate_with_self_correction(
                    prompt=prompt,
                    brand_guidelines=request.brand_guidelines,
                    asset_type=AssetType.LOGO,
                    asset_name=f"logo_{variation.value}",
                    description=f"{variation.value.replace('_', ' ').title()} logo variation for {request.brand_guidelines.brand_name}",
                    width=1024,
                    height=1024,
                    style_guidance=f"Logo design for {request.brand_guidelines.industry} brand"
                )
                
                assets.append(asset)
                
                if asset.self_corrected:
                    print(f"[Logo] {variation.value} required {asset.iteration_count} iterations")
                else:
                    print(f"[Logo] {variation.value} passed on first try!")
                
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
        Generate social media templates for specified platforms with self-correction.
        
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
                print(f"\n[Social] Starting self-correcting generation for {platform.value}...")
                
                asset = await self._generate_with_self_correction(
                    prompt=prompt,
                    brand_guidelines=request.brand_guidelines,
                    asset_type=AssetType.SOCIAL_MEDIA,
                    asset_name=f"social_{platform.value}",
                    description=f"{platform.value.replace('_', ' ').title()} template for {request.brand_guidelines.brand_name}",
                    width=width,
                    height=height,
                    style_guidance=f"Social media template for {request.brand_guidelines.brand_tone} brand"
                )
                
                assets.append(asset)
                
                if asset.self_corrected:
                    print(f"[Social] {platform.value} required {asset.iteration_count} iterations")
                
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
                print(f"\n[Presentation] Starting self-correcting generation for slide {i+1} ({slide_type})...")
                
                asset = await self._generate_with_self_correction(
                    prompt=prompt,
                    brand_guidelines=request.brand_guidelines,
                    asset_type=AssetType.PRESENTATION,
                    asset_name=f"slide_{i+1:02d}_{slide_type}",
                    description=f"Slide {i+1}: {slide_type.replace('_', ' ').title()}",
                    width=1920,
                    height=1080,
                    style_guidance=f"Professional presentation slide for {request.brand_guidelines.industry}"
                )
                
                assets.append(asset)
                
                if asset.self_corrected:
                    print(f"[Presentation] Slide {i+1} required {asset.iteration_count} iterations")
                
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
                print(f"\n[Email] Starting self-correcting generation for {template_type}...")
                
                asset = await self._generate_with_self_correction(
                    prompt=prompt,
                    brand_guidelines=request.brand_guidelines,
                    asset_type=AssetType.EMAIL_TEMPLATE,
                    asset_name=f"email_{template_type}",
                    description=f"{template_type.replace('_', ' ').title()} email template for {request.brand_guidelines.brand_name}",
                    width=600,
                    height=1000,
                    style_guidance=f"Professional email template for {request.brand_guidelines.brand_tone} brand"
                )
                
                assets.append(asset)
                
                if asset.self_corrected:
                    print(f"[Email] {template_type} required {asset.iteration_count} iterations")
                
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
                print(f"\n[Marketing] Starting self-correcting generation for {material_type}...")
                
                asset = await self._generate_with_self_correction(
                    prompt=prompt,
                    brand_guidelines=request.brand_guidelines,
                    asset_type=AssetType.MARKETING,
                    asset_name=f"marketing_{material_type}",
                    description=f"{material_type.replace('_', ' ').title()} for {request.brand_guidelines.brand_name}",
                    width=width,
                    height=height,
                    style_guidance=f"Professional marketing material for {request.brand_guidelines.industry}"
                )
                
                assets.append(asset)
                
                if asset.self_corrected:
                    print(f"[Marketing] {material_type} required {asset.iteration_count} iterations")
                
            except Exception as e:
                print(f"Error generating marketing material {material_type}: {e}")
                continue
        
        return AssetPackage(
            brand_name=request.brand_guidelines.brand_name,
            assets=assets,
            brand_analysis=brand_analysis,
            generation_notes=f"Generated {len(assets)} marketing materials: {request.material_types}"
        )
    
    async def generate_category(
        self,
        brand_guidelines: BrandGuidelines,
        category: str
    ) -> AssetPackage:
        """
        Generate assets for a single category.
        
        Args:
            brand_guidelines: Brand guidelines for generation
            category: One of 'logos', 'social', 'presentation', 'email', 'marketing'
            
        Returns:
            AssetPackage for the specified category
        """
        if category == "logos":
            request = LogoRequest(
                brand_guidelines=brand_guidelines,
                variations=[
                    LogoVariation.PRIMARY,
                    LogoVariation.ICON_ONLY,
                    LogoVariation.HORIZONTAL
                ]
            )
            return await self.generate_logos(request)
        
        elif category == "social":
            request = SocialMediaRequest(
                brand_guidelines=brand_guidelines,
                platforms=[
                    SocialPlatform.INSTAGRAM_POST,
                    SocialPlatform.TWITTER_POST,
                    SocialPlatform.LINKEDIN_POST
                ]
            )
            return await self.generate_social_media_templates(request)
        
        elif category == "presentation":
            request = PresentationRequest(
                brand_guidelines=brand_guidelines,
                slide_count=5,
                presentation_type="company overview"
            )
            return await self.generate_presentation_deck(request)
        
        elif category == "email":
            request = EmailTemplateRequest(
                brand_guidelines=brand_guidelines,
                template_types=["welcome", "newsletter"]
            )
            return await self.generate_email_templates(request)
        
        elif category == "marketing":
            request = MarketingRequest(
                brand_guidelines=brand_guidelines,
                material_types=["banner", "flyer", "business_card"]
            )
            return await self.generate_marketing_materials(request)
        
        else:
            raise ValueError(f"Unknown category: {category}")
    
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
        
        # Score each asset for brand consistency
        scored_assets = []
        for asset in all_assets:
            score = await self._score_asset(asset, brand_guidelines)
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
        batch_score = await self._compute_batch_score(scored_assets)
        
        # Build campaign context if campaign fields are provided
        campaign_context = None
        if brand_guidelines.campaign_name or brand_guidelines.campaign_goal or brand_guidelines.campaign_message:
            campaign_context = await self._build_campaign_context(
                brand_guidelines=brand_guidelines,
                assets=scored_assets
            )
        
        return AssetPackage(
            brand_name=brand_guidelines.brand_name,
            assets=scored_assets,
            brand_analysis=brand_analysis,
            generation_notes=" | ".join(generation_notes),
            batch_score=batch_score,
            campaign=campaign_context
        )
    
    async def _build_campaign_context(
        self,
        brand_guidelines: BrandGuidelines,
        assets: list[GeneratedAsset]
    ) -> CampaignContext:
        """
        Build campaign context with deployment checklist.
        
        Args:
            brand_guidelines: Brand guidelines with campaign info
            assets: Generated assets to include in the campaign
            
        Returns:
            CampaignContext with unified theme and deployment checklist
        """
        campaign_name = brand_guidelines.campaign_name or "Brand Campaign"
        campaign_goal = brand_guidelines.campaign_goal or "Brand awareness"
        campaign_message = brand_guidelines.campaign_message or brand_guidelines.tagline or ""
        
        # Generate unified theme description
        unified_theme = await self._generate_campaign_theme(
            brand_guidelines=brand_guidelines,
            asset_count=len(assets)
        )
        
        # Build deployment checklist based on generated assets
        deployment_checklist = []
        asset_type_map = {
            AssetType.LOGO: "Upload logo to website header, favicon, and social profiles",
            AssetType.SOCIAL_MEDIA: "Schedule social media posts across platforms",
            AssetType.PRESENTATION: "Use presentation deck for investor/client meetings",
            AssetType.EMAIL_TEMPLATE: "Import email templates into email marketing platform",
            AssetType.MARKETING: "Deploy marketing materials to digital ad platforms and print"
        }
        
        # Group assets by type and create checklist items
        asset_types_present = set(asset.asset_type for asset in assets)
        for asset_type in asset_types_present:
            if asset_type in asset_type_map:
                deployment_checklist.append(asset_type_map[asset_type])
        
        # Add campaign-specific items
        deployment_checklist.extend([
            f"Ensure all assets prominently feature: '{campaign_message}'",
            "Review all assets for brand consistency before launch",
            "Set up tracking/analytics for campaign performance",
        ])
        
        return CampaignContext(
            campaign_name=campaign_name,
            campaign_goal=campaign_goal,
            campaign_message=campaign_message,
            unified_theme=unified_theme,
            deployment_checklist=deployment_checklist
        )
    
    async def _generate_campaign_theme(
        self,
        brand_guidelines: BrandGuidelines,
        asset_count: int
    ) -> str:
        """
        Generate a unified theme description for the campaign.
        
        Args:
            brand_guidelines: Brand guidelines with campaign info
            asset_count: Number of assets generated
            
        Returns:
            Unified theme description
        """
        prompt = f"""Write a brief (2-3 sentences) unified campaign theme for:

Brand: {brand_guidelines.brand_name}
Campaign: {brand_guidelines.campaign_name or 'Brand Launch'}
Goal: {brand_guidelines.campaign_goal or 'Brand awareness'}
Key Message: {brand_guidelines.campaign_message or 'None specified'}
Assets Generated: {asset_count} coordinated assets
Brand Tone: {brand_guidelines.brand_tone}

Describe how all assets work together as a cohesive campaign. Be specific about the visual and messaging thread that ties them together. Write in plain prose, no formatting."""

        try:
            from services.gemini_service import TEXT_MODEL
            from google.genai import types
            
            response = self.gemini.client.models.generate_content(
                model=TEXT_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=300,
                )
            )
            return response.text.strip().replace('**', '').replace('*', '')
        except Exception as e:
            return f"A cohesive {brand_guidelines.brand_tone.lower()} campaign featuring {asset_count} coordinated assets designed to {brand_guidelines.campaign_goal or 'build brand awareness'}."
