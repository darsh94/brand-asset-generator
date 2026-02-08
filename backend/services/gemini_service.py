"""
Gemini Service for Brand Asset Generator.

This service handles all interactions with the Gemini 3 API, including:
- Brand identity analysis using Gemini 3 Pro
- Image generation using gemini-3-pro-image-preview (Nano Banana)
"""

import os
import base64
from typing import Optional
from google import genai
from google.genai import types


# Model identifiers
TEXT_MODEL = "gemini-2.0-flash"  # For text analysis
IMAGE_MODEL = "gemini-3-pro-image-preview"  # Nano Banana for image generation


class GeminiService:
    """
    Service class for Gemini 3 API interactions.
    
    Handles brand analysis and image generation using the Gemini 3 family of models.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Gemini service.
        
        Args:
            api_key: Google AI API key. If not provided, reads from GOOGLE_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Google API key is required. Set GOOGLE_API_KEY environment variable "
                "or pass api_key parameter."
            )
        
        # Initialize the client
        self.client = genai.Client(api_key=self.api_key)
    
    async def analyze_brand(self, brand_guidelines: dict) -> str:
        """
        Analyze brand guidelines to create a comprehensive brand identity profile.
        
        This analysis is used to inform all asset generation, ensuring consistency
        across all generated materials.
        
        Args:
            brand_guidelines: Dictionary containing brand guidelines data
            
        Returns:
            Detailed brand analysis as a string
        """
        prompt = f"""You are a brand identity expert. Analyze the following brand guidelines 
and create a comprehensive brand identity profile that will guide visual asset creation.

Brand Guidelines:
- Brand Name: {brand_guidelines.get('brand_name')}
- Primary Color: {brand_guidelines.get('primary_color')}
- Secondary Color: {brand_guidelines.get('secondary_color')}
- Accent Color: {brand_guidelines.get('accent_color', 'Not specified')}
- Primary Font: {brand_guidelines.get('primary_font')}
- Secondary Font: {brand_guidelines.get('secondary_font', 'Not specified')}
- Brand Tone: {brand_guidelines.get('brand_tone')}
- Target Audience: {brand_guidelines.get('target_audience')}
- Industry: {brand_guidelines.get('industry')}
- Brand Values: {brand_guidelines.get('brand_values', 'Not specified')}
- Tagline: {brand_guidelines.get('tagline', 'Not specified')}
- Additional Context: {brand_guidelines.get('additional_context', 'None')}

Provide a detailed analysis covering:
1. Visual Identity Summary - How the colors and fonts reflect the brand personality
2. Design Principles - Key principles that should guide all visual assets
3. Mood and Atmosphere - The emotional response the brand should evoke
4. Typography Guidelines - How to use the fonts effectively
5. Color Application - Best practices for applying the brand colors
6. Imagery Style - What style of imagery aligns with the brand
7. Key Design Elements - Shapes, patterns, or motifs that would suit this brand

Be specific and actionable in your recommendations."""

        response = self.client.models.generate_content(
            model=TEXT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2000,
            )
        )
        
        return response.text
    
    async def generate_image(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        style_guidance: Optional[str] = None
    ) -> tuple[bytes, str]:
        """
        Generate an image using Gemini 3 Pro Image (Nano Banana).
        
        Args:
            prompt: Detailed prompt describing the image to generate
            width: Desired image width
            height: Desired image height
            style_guidance: Additional style guidance from brand analysis
            
        Returns:
            Tuple of (image_bytes, mime_type)
        """
        # Enhance prompt with style guidance if provided
        full_prompt = prompt
        if style_guidance:
            full_prompt = f"{prompt}\n\nStyle guidance: {style_guidance}"
        
        # Add quality and rendering instructions
        full_prompt += """

Important rendering requirements:
- Ensure any text is crisp, legible, and properly rendered
- Use high-quality, professional design standards
- Maintain visual consistency and balance
- Apply proper spacing and alignment"""

        response = self.client.models.generate_content(
            model=IMAGE_MODEL,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["image", "text"],
                temperature=0.8,
            )
        )
        
        # Extract image from response
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                return (
                    base64.b64decode(part.inline_data.data) 
                    if isinstance(part.inline_data.data, str) 
                    else part.inline_data.data,
                    part.inline_data.mime_type
                )
        
        raise ValueError("No image was generated in the response")
    
    def create_logo_prompt(
        self,
        brand_guidelines: dict,
        variation: str,
        brand_analysis: str,
        style_preferences: Optional[str] = None
    ) -> str:
        """
        Create a detailed prompt for logo generation.
        
        Args:
            brand_guidelines: Brand guidelines dictionary
            variation: Type of logo variation to generate
            brand_analysis: Pre-computed brand analysis
            style_preferences: User's style preferences
            
        Returns:
            Detailed prompt for logo generation
        """
        base_prompt = f"""Create a professional logo for "{brand_guidelines['brand_name']}".

Brand Identity:
- Industry: {brand_guidelines['industry']}
- Brand Tone: {brand_guidelines['brand_tone']}
- Target Audience: {brand_guidelines['target_audience']}

Color Palette:
- Primary: {brand_guidelines['primary_color']}
- Secondary: {brand_guidelines['secondary_color']}
- Accent: {brand_guidelines.get('accent_color', 'use sparingly')}

Typography: {brand_guidelines['primary_font']} as the primary typeface
"""
        
        if brand_guidelines.get('tagline'):
            base_prompt += f"\nTagline (optional inclusion): {brand_guidelines['tagline']}"
        
        # Add variation-specific instructions
        variation_instructions = {
            "primary": "Create the primary/main version of the logo with the full brand name and any symbol/icon integrated harmoniously.",
            "horizontal": "Create a horizontal/landscape orientation logo suitable for website headers and letterheads.",
            "stacked": "Create a stacked/vertical version with the icon above the text, suitable for square spaces.",
            "icon_only": "Create just the icon/symbol mark without any text, suitable for favicons and app icons.",
            "monochrome": f"Create a single-color version using only {brand_guidelines['primary_color']} that works well in limited color contexts.",
            "reversed": "Create a reversed version suitable for dark backgrounds, ensuring legibility and impact."
        }
        
        base_prompt += f"\n\nVariation Type: {variation}\n{variation_instructions.get(variation, '')}"
        
        if style_preferences:
            base_prompt += f"\n\nStyle Preferences: {style_preferences}"
        
        base_prompt += f"""

Design Requirements:
- Clean, professional, and memorable design
- Scalable vector-style clarity (should look good at any size)
- Modern and timeless aesthetic
- Clear visual hierarchy
- Proper use of negative space

Based on brand analysis: {brand_analysis[:500]}..."""

        return base_prompt
    
    def create_social_media_prompt(
        self,
        brand_guidelines: dict,
        platform: str,
        brand_analysis: str,
        template_purpose: Optional[str] = None
    ) -> tuple[str, int, int]:
        """
        Create a prompt for social media template generation.
        
        Args:
            brand_guidelines: Brand guidelines dictionary
            platform: Social media platform
            brand_analysis: Pre-computed brand analysis
            template_purpose: Purpose of the template
            
        Returns:
            Tuple of (prompt, width, height)
        """
        # Platform-specific dimensions
        dimensions = {
            "instagram_post": (1080, 1080),
            "instagram_story": (1080, 1920),
            "facebook_post": (1200, 630),
            "twitter_post": (1200, 675),
            "linkedin_post": (1200, 627),
            "youtube_thumbnail": (1280, 720),
        }
        
        width, height = dimensions.get(platform, (1080, 1080))
        
        platform_names = {
            "instagram_post": "Instagram Post",
            "instagram_story": "Instagram Story",
            "facebook_post": "Facebook Post",
            "twitter_post": "Twitter/X Post",
            "linkedin_post": "LinkedIn Post",
            "youtube_thumbnail": "YouTube Thumbnail",
        }
        
        prompt = f"""Create a professional social media template for {platform_names.get(platform, platform)}.

Brand: {brand_guidelines['brand_name']}
Platform: {platform_names.get(platform, platform)}
Dimensions: {width}x{height} pixels

Brand Colors:
- Primary: {brand_guidelines['primary_color']}
- Secondary: {brand_guidelines['secondary_color']}
- Accent: {brand_guidelines.get('accent_color', 'optional')}

Typography: {brand_guidelines['primary_font']}
Brand Tone: {brand_guidelines['brand_tone']}
"""
        
        if template_purpose:
            prompt += f"\nTemplate Purpose: {template_purpose}"
        
        prompt += f"""

Design Requirements:
- Include placeholder areas for text/content with clear visual hierarchy
- Include space for the brand logo (typically corner placement)
- Maintain safe zones for platform UI elements
- Use brand colors consistently
- Create visual interest while leaving room for customization
- Add subtle brand elements (patterns, shapes, or motifs) that reinforce brand identity
- Ensure text placeholder areas have sufficient contrast for readability

The template should be versatile enough to be used for various content while maintaining brand consistency.

Brand context: {brand_analysis[:400]}"""

        return prompt, width, height
    
    def create_presentation_prompt(
        self,
        brand_guidelines: dict,
        slide_type: str,
        brand_analysis: str,
        presentation_type: str
    ) -> str:
        """
        Create a prompt for presentation slide generation.
        
        Args:
            brand_guidelines: Brand guidelines dictionary
            slide_type: Type of slide (title, content, section, etc.)
            brand_analysis: Pre-computed brand analysis
            presentation_type: Overall presentation purpose
            
        Returns:
            Prompt for slide generation
        """
        slide_instructions = {
            "title": "Create a title slide with prominent space for the presentation title and subtitle. Include the brand logo and any relevant imagery.",
            "section": "Create a section divider slide that introduces new topics. Bold, impactful design with minimal text placeholders.",
            "content": "Create a content slide with areas for a heading, bullet points or paragraphs, and optional imagery/graphics.",
            "two_column": "Create a two-column layout slide for comparing information or showing text alongside images.",
            "image_focus": "Create an image-focused slide with a large image area and minimal text overlay capability.",
            "closing": "Create a closing/thank you slide with contact information placeholders and brand logo."
        }
        
        prompt = f"""Create a professional presentation slide design for {brand_guidelines['brand_name']}.

Slide Type: {slide_type.replace('_', ' ').title()}
Presentation Purpose: {presentation_type}
Dimensions: 1920x1080 pixels (16:9 aspect ratio)

Brand Colors:
- Primary: {brand_guidelines['primary_color']}
- Secondary: {brand_guidelines['secondary_color']}
- Background: Use appropriate light or dark theme based on brand tone

Typography: 
- Headings: {brand_guidelines['primary_font']}
- Body: {brand_guidelines.get('secondary_font', brand_guidelines['primary_font'])}

{slide_instructions.get(slide_type, slide_instructions['content'])}

Design Requirements:
- Clean, professional layout with clear visual hierarchy
- Consistent brand elements (logo placement, color accents)
- Proper margins and safe areas
- Subtle design elements that enhance without distracting
- Text placeholders should have clear visual distinction
- Ensure accessibility with sufficient color contrast

Target audience: {brand_guidelines['target_audience']}
Brand tone: {brand_guidelines['brand_tone']}

Brand analysis context: {brand_analysis[:400]}"""

        return prompt
    
    def create_email_template_prompt(
        self,
        brand_guidelines: dict,
        template_type: str,
        brand_analysis: str
    ) -> str:
        """
        Create a prompt for email template generation.
        
        Args:
            brand_guidelines: Brand guidelines dictionary
            template_type: Type of email template
            brand_analysis: Pre-computed brand analysis
            
        Returns:
            Prompt for email template generation
        """
        template_instructions = {
            "welcome": "Create a welcome email template that makes new subscribers/customers feel valued. Include brand logo, warm greeting area, key benefits/features, and clear CTA.",
            "newsletter": "Create a newsletter template with sections for featured content, multiple articles/updates, and consistent branding throughout.",
            "promotional": "Create a promotional email template with eye-catching header, product/offer showcase area, urgency elements, and prominent CTA buttons.",
            "transactional": "Create a transactional email template (order confirmation, etc.) with clear information hierarchy, order details section, and professional formatting.",
            "announcement": "Create an announcement email template for company news or product launches with impactful header and clear message area."
        }
        
        prompt = f"""Create a professional email template design for {brand_guidelines['brand_name']}.

Email Type: {template_type.replace('_', ' ').title()}
Width: 600 pixels (standard email width)
Height: Create appropriate height for the template type (typically 800-1200 pixels)

Brand Colors:
- Primary: {brand_guidelines['primary_color']}
- Secondary: {brand_guidelines['secondary_color']}
- Background: Light, clean background with brand color accents

Typography: {brand_guidelines['primary_font']} (or web-safe fallback representation)

{template_instructions.get(template_type, template_instructions['newsletter'])}

Design Requirements:
- Mobile-responsive design principles (single column, appropriate sizing)
- Clear visual hierarchy with header, body, and footer sections
- Branded header with logo
- Well-defined CTA buttons using brand colors
- Footer with social links placeholders and unsubscribe area
- Consistent padding and spacing
- Professional, clean aesthetic matching brand tone

Brand tone: {brand_guidelines['brand_tone']}
Target audience: {brand_guidelines['target_audience']}

Brand context: {brand_analysis[:400]}"""

        return prompt
    
    def create_marketing_material_prompt(
        self,
        brand_guidelines: dict,
        material_type: str,
        brand_analysis: str
    ) -> tuple[str, int, int]:
        """
        Create a prompt for marketing material generation.
        
        Args:
            brand_guidelines: Brand guidelines dictionary
            material_type: Type of marketing material
            brand_analysis: Pre-computed brand analysis
            
        Returns:
            Tuple of (prompt, width, height)
        """
        material_specs = {
            "banner": {
                "dimensions": (1200, 400),
                "instructions": "Create a web banner with impactful visuals, brand messaging area, and CTA button. Horizontal format suitable for website headers or ad placements."
            },
            "flyer": {
                "dimensions": (1080, 1400),
                "instructions": "Create a flyer design with eye-catching header, key information sections, contact details, and brand elements. Suitable for print or digital distribution."
            },
            "business_card": {
                "dimensions": (1050, 600),
                "instructions": "Create a business card design with name/title placeholder, contact information areas, logo placement, and brand accents. Professional and memorable."
            },
            "poster": {
                "dimensions": (1080, 1620),
                "instructions": "Create a poster design with bold headline area, supporting imagery, key messages, and brand identity. High-impact visual design."
            },
            "brochure_cover": {
                "dimensions": (1080, 1400),
                "instructions": "Create a brochure cover design with compelling imagery, brand name, tagline area, and professional aesthetic suitable for printed materials."
            }
        }
        
        specs = material_specs.get(material_type, material_specs['banner'])
        width, height = specs['dimensions']
        
        prompt = f"""Create a professional {material_type.replace('_', ' ')} design for {brand_guidelines['brand_name']}.

Material Type: {material_type.replace('_', ' ').title()}
Dimensions: {width}x{height} pixels

Brand Colors:
- Primary: {brand_guidelines['primary_color']}
- Secondary: {brand_guidelines['secondary_color']}
- Accent: {brand_guidelines.get('accent_color', 'optional')}

Typography: {brand_guidelines['primary_font']}
Industry: {brand_guidelines['industry']}

{specs['instructions']}

Design Requirements:
- Professional, polished appearance
- Clear brand identity throughout
- Appropriate for {brand_guidelines['target_audience']}
- Matches brand tone: {brand_guidelines['brand_tone']}
- High-quality, print-ready aesthetic
- Proper use of white space and visual balance

{f"Tagline: {brand_guidelines['tagline']}" if brand_guidelines.get('tagline') else ""}

Brand context: {brand_analysis[:400]}"""

        return prompt, width, height
