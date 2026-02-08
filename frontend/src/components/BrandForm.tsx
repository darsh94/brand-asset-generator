/**
 * Brand Guidelines Form Component
 * 
 * A comprehensive form for inputting brand guidelines including
 * colors, fonts, tone, and target audience.
 * Supports PDF upload for auto-filling form fields.
 */

import { useForm } from 'react-hook-form';
import { Palette, Type, Users, Building2, Heart, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { BrandGuidelines, GenerationOptions } from '../types';
import { FONT_OPTIONS, INDUSTRY_OPTIONS, TONE_OPTIONS } from '../types';
import PdfUpload from './PdfUpload';

interface ExtractedBrandData {
  brand_name?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  primary_font?: string | null;
  secondary_font?: string | null;
  brand_tone?: string | null;
  target_audience?: string | null;
  industry?: string | null;
  brand_values?: string | null;
  tagline?: string | null;
  additional_context?: string | null;
}

interface BrandFormProps {
  onSubmit: (data: BrandGuidelines, options: GenerationOptions) => void;
  isLoading: boolean;
}

export default function BrandForm({ onSubmit, isLoading }: BrandFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BrandGuidelines & GenerationOptions & { custom_industry?: string }>({
    defaultValues: {
      brand_name: '',
      primary_color: '#3B82F6',
      secondary_color: '#10B981',
      accent_color: '#F59E0B',
      primary_font: 'Inter',
      secondary_font: 'Inter',
      brand_tone: 'Professional and trustworthy',
      target_audience: '',
      industry: '',
      custom_industry: '',
      brand_values: '',
      tagline: '',
      additional_context: '',
      include_logos: true,
      include_social: true,
      include_presentation: true,
      include_email: true,
      include_marketing: true,
    },
  });

  const primaryColor = watch('primary_color');
  const secondaryColor = watch('secondary_color');
  const accentColor = watch('accent_color');
  const selectedIndustry = watch('industry');

  // Handle PDF extraction data
  const handlePdfDataExtracted = (data: ExtractedBrandData) => {
    let fieldsUpdated = 0;

    // Helper to find best matching option from a list
    const findBestMatch = (value: string | null | undefined, options: readonly string[]): string | null => {
      if (!value) return null;
      const lowerValue = value.toLowerCase();
      // Exact match
      const exact = options.find(opt => opt.toLowerCase() === lowerValue);
      if (exact) return exact;
      // Partial match
      const partial = options.find(opt => 
        opt.toLowerCase().includes(lowerValue) || lowerValue.includes(opt.toLowerCase())
      );
      return partial || null;
    };

    // Set each field if it has a value
    if (data.brand_name) {
      setValue('brand_name', data.brand_name);
      fieldsUpdated++;
    }

    if (data.primary_color) {
      setValue('primary_color', data.primary_color);
      fieldsUpdated++;
    }

    if (data.secondary_color) {
      setValue('secondary_color', data.secondary_color);
      fieldsUpdated++;
    }

    if (data.accent_color) {
      setValue('accent_color', data.accent_color);
      fieldsUpdated++;
    }

    if (data.primary_font) {
      const matchedFont = findBestMatch(data.primary_font, FONT_OPTIONS);
      if (matchedFont) {
        setValue('primary_font', matchedFont);
        fieldsUpdated++;
      }
    }

    if (data.secondary_font) {
      const matchedFont = findBestMatch(data.secondary_font, FONT_OPTIONS);
      if (matchedFont) {
        setValue('secondary_font', matchedFont);
        fieldsUpdated++;
      }
    }

    if (data.brand_tone) {
      const matchedTone = findBestMatch(data.brand_tone, TONE_OPTIONS);
      if (matchedTone) {
        setValue('brand_tone', matchedTone);
        fieldsUpdated++;
      }
    }

    if (data.target_audience) {
      setValue('target_audience', data.target_audience);
      fieldsUpdated++;
    }

    if (data.industry) {
      const matchedIndustry = findBestMatch(data.industry, INDUSTRY_OPTIONS);
      if (matchedIndustry) {
        setValue('industry', matchedIndustry);
        fieldsUpdated++;
      } else {
        // Set to "Other" and fill custom field
        setValue('industry', 'Other');
        setValue('custom_industry', data.industry);
        fieldsUpdated++;
      }
    }

    if (data.brand_values) {
      setValue('brand_values', data.brand_values);
      fieldsUpdated++;
    }

    if (data.tagline) {
      setValue('tagline', data.tagline);
      fieldsUpdated++;
    }

    if (data.additional_context) {
      setValue('additional_context', data.additional_context);
      fieldsUpdated++;
    }

    toast.success(`Auto-filled ${fieldsUpdated} fields from PDF`);
  };

  const onFormSubmit = (data: BrandGuidelines & GenerationOptions & { custom_industry?: string }) => {
    const { 
      include_logos, 
      include_social, 
      include_presentation, 
      include_email, 
      include_marketing,
      custom_industry,
      ...brandGuidelines 
    } = data;
    
    // Use custom_industry if "Other" was selected
    const finalBrandGuidelines = {
      ...brandGuidelines,
      industry: brandGuidelines.industry === 'Other' && custom_industry 
        ? custom_industry 
        : brandGuidelines.industry,
    };
    
    onSubmit(finalBrandGuidelines, {
      include_logos,
      include_social,
      include_presentation,
      include_email,
      include_marketing,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* PDF Upload Section */}
      <PdfUpload onDataExtracted={handlePdfDataExtracted} />

      {/* Brand Identity Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Brand Identity</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name *
            </label>
            <input
              type="text"
              {...register('brand_name', { required: 'Brand name is required' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your brand name"
            />
            {errors.brand_name && (
              <p className="mt-1 text-sm text-red-500">{errors.brand_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Industry *
              </div>
            </label>
            <select
              {...register('industry', { required: 'Industry is required' })}
              className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="">Select an industry...</option>
              {INDUSTRY_OPTIONS.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            {selectedIndustry === 'Other' && (
              <input
                type="text"
                {...register('custom_industry', { 
                  required: selectedIndustry === 'Other' ? 'Please specify your industry' : false 
                })}
                className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Please specify your industry..."
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline (Optional)
            </label>
            <input
              type="text"
              {...register('tagline')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Your brand's tagline"
            />
          </div>
        </div>
      </section>

      {/* Colors Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Brand Colors</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register('primary_color', { required: true })}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor || ''}
                onChange={(e) => {
                  let value = e.target.value;
                  if (!value.startsWith('#')) value = '#' + value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setValue('primary_color', value);
                  }
                }}
                placeholder="#000000"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-600 font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register('secondary_color', { required: true })}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor || ''}
                onChange={(e) => {
                  let value = e.target.value;
                  if (!value.startsWith('#')) value = '#' + value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setValue('secondary_color', value);
                  }
                }}
                placeholder="#000000"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-600 font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register('accent_color')}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={accentColor || ''}
                onChange={(e) => {
                  let value = e.target.value;
                  if (!value.startsWith('#')) value = '#' + value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setValue('accent_color', value);
                  }
                }}
                placeholder="#000000"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-600 font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div className="mt-6 p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Color Preview</p>
          <div className="flex gap-2">
            <div
              className="flex-1 h-16 rounded-lg shadow-inner"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="flex-1 h-16 rounded-lg shadow-inner"
              style={{ backgroundColor: secondaryColor }}
            />
            <div
              className="flex-1 h-16 rounded-lg shadow-inner"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg">
            <Type className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Typography</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Font *
            </label>
            <select
              {...register('primary_font', { required: true })}
              className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Font
            </label>
            <select
              {...register('secondary_font')}
              className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Audience & Tone Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Audience & Tone</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <input
              type="text"
              {...register('target_audience', { required: 'Target audience is required' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="e.g., Tech-savvy millennials, Small business owners"
            />
            {errors.target_audience && (
              <p className="mt-1 text-sm text-red-500">{errors.target_audience.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Tone *
            </label>
            <select
              {...register('brand_tone', { required: true })}
              className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              {TONE_OPTIONS.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Brand Values (Optional)
              </div>
            </label>
            <textarea
              {...register('brand_values')}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              placeholder="Core values and mission (e.g., Innovation, Sustainability, Customer-first)"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              {...register('additional_context')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              placeholder="Any additional information about your brand identity, style preferences, or specific requirements..."
            />
          </div>
        </div>
      </section>

      {/* Asset Selection Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Assets to Generate</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: 'include_logos', label: 'Logos', icon: '🎨' },
            { key: 'include_social', label: 'Social Media', icon: '📱' },
            { key: 'include_presentation', label: 'Presentations', icon: '📊' },
            { key: 'include_email', label: 'Email Templates', icon: '📧' },
            { key: 'include_marketing', label: 'Marketing', icon: '📢' },
          ].map(({ key, label, icon }) => (
            <label
              key={key}
              className="flex flex-col items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-all"
            >
              <input
                type="checkbox"
                {...register(key as keyof GenerationOptions)}
                defaultChecked={true}
                className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 accent-purple-600"
              />
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating Your Brand Assets...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Brand Assets
          </span>
        )}
      </button>
    </form>
  );
}
