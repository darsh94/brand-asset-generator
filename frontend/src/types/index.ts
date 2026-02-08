/**
 * TypeScript types for Brand Asset Generator frontend.
 * These mirror the backend Pydantic models.
 */

export type AssetType = 'logo' | 'social_media' | 'presentation' | 'email_template' | 'marketing';

export type SocialPlatform = 
  | 'instagram_post' 
  | 'instagram_story' 
  | 'facebook_post' 
  | 'twitter_post' 
  | 'linkedin_post' 
  | 'youtube_thumbnail';

export type LogoVariation = 
  | 'primary' 
  | 'horizontal' 
  | 'stacked' 
  | 'icon_only' 
  | 'monochrome' 
  | 'reversed';

export interface BrandGuidelines {
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  primary_font: string;
  secondary_font?: string;
  brand_tone: string;
  target_audience: string;
  industry: string;
  brand_values?: string;
  tagline?: string;
  additional_context?: string;
  // Competitive differentiation
  competitors?: string;
  differentiation?: string;
  // Campaign bundling
  campaign_name?: string;
  campaign_goal?: string;
  campaign_message?: string;
}

export interface LogoRequest {
  brand_guidelines: BrandGuidelines;
  variations: LogoVariation[];
  style_preferences?: string;
}

export interface SocialMediaRequest {
  brand_guidelines: BrandGuidelines;
  platforms: SocialPlatform[];
  template_purpose?: string;
}

export interface PresentationRequest {
  brand_guidelines: BrandGuidelines;
  slide_count: number;
  presentation_type: string;
}

export interface EmailTemplateRequest {
  brand_guidelines: BrandGuidelines;
  template_types: string[];
}

export interface MarketingRequest {
  brand_guidelines: BrandGuidelines;
  material_types: string[];
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  issues: string[];
  critique: string;
  regeneration_guidance?: string;
}

export interface AssetIteration {
  iteration_number: number;
  image_data: string;
  mime_type: string;
  validation: ValidationResult;
  status: 'failed' | 'passed' | 'final';
}

export interface ConsistencyScore {
  overall_score: number;
  color_adherence: number;
  typography_compliance: number;
  tone_alignment: number;
  layout_quality: number;
  brand_recognition: number;
  explanation: string;
  strengths: string[];
  improvements: string[];
}

export interface BatchConsistencyScore {
  overall_score: number;
  color_adherence: number;
  typography_compliance: number;
  tone_alignment: number;
  layout_quality: number;
  brand_recognition: number;
  summary: string;
  top_performers: string[];
  needs_attention: string[];
}

export interface GeneratedAsset {
  asset_type: AssetType;
  asset_name: string;
  image_data: string;
  mime_type: string;
  width: number;
  height: number;
  description?: string;
  consistency_score?: ConsistencyScore;
  // Self-correcting loop fields
  iteration_count: number;
  iteration_history: AssetIteration[];
  self_corrected: boolean;
}

export interface CampaignContext {
  campaign_name: string;
  campaign_goal: string;
  campaign_message: string;
  unified_theme: string;
  deployment_checklist: string[];
}

export interface AssetPackage {
  brand_name: string;
  assets: GeneratedAsset[];
  brand_analysis: string;
  generation_notes?: string;
  batch_score?: BatchConsistencyScore;
  campaign?: CampaignContext;
}

export interface GenerationOptions {
  include_logos: boolean;
  include_social: boolean;
  include_presentation: boolean;
  include_email: boolean;
  include_marketing: boolean;
}

// Form field options
export const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Raleway',
  'Source Sans Pro',
  'Nunito',
  'Work Sans',
  'DM Sans',
  'Space Grotesk',
  'Outfit',
];

export const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Food & Beverage',
  'Fashion',
  'Real Estate',
  'Travel & Hospitality',
  'Entertainment',
  'Non-profit',
  'Professional Services',
  'Manufacturing',
  'Automotive',
  'Sports & Fitness',
  'Beauty & Wellness',
  'Media & Publishing',
  'Legal',
  'Construction',
  'Other',
];

export const TONE_OPTIONS = [
  'Professional and trustworthy',
  'Fun and playful',
  'Sophisticated and elegant',
  'Bold and innovative',
  'Warm and friendly',
  'Minimalist and modern',
  'Energetic and dynamic',
  'Calm and serene',
  'Luxurious and premium',
  'Eco-friendly and natural',
  'Tech-forward and cutting-edge',
  'Traditional and established',
];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram_post: 'Instagram Post',
  instagram_story: 'Instagram Story',
  facebook_post: 'Facebook Post',
  twitter_post: 'Twitter/X Post',
  linkedin_post: 'LinkedIn Post',
  youtube_thumbnail: 'YouTube Thumbnail',
};

export const LOGO_VARIATION_LABELS: Record<LogoVariation, string> = {
  primary: 'Primary Logo',
  horizontal: 'Horizontal',
  stacked: 'Stacked/Vertical',
  icon_only: 'Icon Only',
  monochrome: 'Monochrome',
  reversed: 'Reversed (Dark BG)',
};
