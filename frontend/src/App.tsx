/**
 * Brand Asset Generator - Main App Component
 * 
 * A powerful tool that generates complete brand asset packages
 * using Gemini 3 AI.
 * 
 * Built for the Gemini 3 Hackathon 2026.
 */

import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Sparkles, Github, ExternalLink } from 'lucide-react';
import { BrandForm, AssetGallery, LoadingState } from './components';
import type { TimelineStep, ProgressInfo } from './components';
import { generateCompletePackageWithProgress, checkHealth } from './services/api';
import type { BrandGuidelines, GenerationOptions, AssetPackage } from './types';

type AppState = 'form' | 'loading' | 'results';

// Map of step IDs to their labels
const STEP_LABELS: Record<string, string> = {
  analysis: 'Brand Analysis',
  logos: 'Logo Generation',
  social: 'Social Media Templates',
  presentation: 'Presentation Slides',
  email: 'Email Templates',
  marketing: 'Marketing Materials',
  scoring: 'Brand Consistency Scoring',
};

// Map progress messages to step IDs
const MESSAGE_TO_STEP_ID: Record<string, string> = {
  'Analyzing brand identity': 'analysis',
  'Creating logo variations': 'logos',
  'Generating social media templates': 'social',
  'Designing presentation slides': 'presentation',
  'Crafting email templates': 'email',
  'Building marketing materials': 'marketing',
  'Scoring brand consistency': 'scoring',
  'Finalizing assets': 'finalizing',
};

// Session storage keys
const STORAGE_KEYS = {
  APP_STATE: 'bag_app_state',
  BRAND_NAME: 'bag_brand_name',
  ASSET_PACKAGE: 'bag_asset_package',
  FORM_DATA: 'bag_form_data',
  OPTIONS: 'bag_options',
  GENERATION_START: 'bag_generation_start',
};

// Helper to save state to sessionStorage
const saveToSession = (key: string, value: unknown) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to sessionStorage:', e);
  }
};

// Helper to load state from sessionStorage
const loadFromSession = <T,>(key: string): T | null => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.warn('Failed to load from sessionStorage:', e);
    return null;
  }
};

// Helper to clear generation state
const clearGenerationState = () => {
  sessionStorage.removeItem(STORAGE_KEYS.APP_STATE);
  sessionStorage.removeItem(STORAGE_KEYS.BRAND_NAME);
  sessionStorage.removeItem(STORAGE_KEYS.ASSET_PACKAGE);
  sessionStorage.removeItem(STORAGE_KEYS.FORM_DATA);
  sessionStorage.removeItem(STORAGE_KEYS.OPTIONS);
  sessionStorage.removeItem(STORAGE_KEYS.GENERATION_START);
};

export default function App() {
  // Initialize state from sessionStorage if available
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = loadFromSession<AppState>(STORAGE_KEYS.APP_STATE);
    // If we were loading, stay in loading state (will show interrupted message)
    if (saved === 'loading') return 'loading';
    if (saved === 'results') return 'results';
    return 'form';
  });
  
  const [assetPackage, setAssetPackage] = useState<AssetPackage | null>(() => 
    loadFromSession<AssetPackage>(STORAGE_KEYS.ASSET_PACKAGE)
  );
  
  const [currentBrandName, setCurrentBrandName] = useState<string>(() => 
    loadFromSession<string>(STORAGE_KEYS.BRAND_NAME) || ''
  );
  
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [activeOptions, setActiveOptions] = useState<GenerationOptions | null>(() =>
    loadFromSession<GenerationOptions>(STORAGE_KEYS.OPTIONS)
  );
  
  const [shouldAutoResume, setShouldAutoResume] = useState<boolean>(() => {
    // Check if we were in the middle of generation and should auto-resume
    const savedState = loadFromSession<AppState>(STORAGE_KEYS.APP_STATE);
    const generationStart = loadFromSession<number>(STORAGE_KEYS.GENERATION_START);
    return savedState === 'loading' && generationStart !== null;
  });
  
  const [savedFormData] = useState<BrandGuidelines | null>(() =>
    loadFromSession<BrandGuidelines>(STORAGE_KEYS.FORM_DATA)
  );

  // Check API health on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      const healthy = await checkHealth();
      setIsApiHealthy(healthy);
      if (!healthy) {
        toast.error('API is not available. Please ensure the backend is running.', {
          duration: 5000,
        });
      }
    };
    checkApiHealth();
  }, []);

  // Build the initial steps array based on selected options
  const buildInitialSteps = useCallback((options: GenerationOptions): TimelineStep[] => {
    const steps: TimelineStep[] = [
      { id: 'analysis', label: STEP_LABELS.analysis, status: 'pending' },
    ];
    
    if (options.include_logos) {
      steps.push({ id: 'logos', label: STEP_LABELS.logos, status: 'pending' });
    }
    if (options.include_social) {
      steps.push({ id: 'social', label: STEP_LABELS.social, status: 'pending' });
    }
    if (options.include_presentation) {
      steps.push({ id: 'presentation', label: STEP_LABELS.presentation, status: 'pending' });
    }
    if (options.include_email) {
      steps.push({ id: 'email', label: STEP_LABELS.email, status: 'pending' });
    }
    if (options.include_marketing) {
      steps.push({ id: 'marketing', label: STEP_LABELS.marketing, status: 'pending' });
    }
    
    // Always add scoring at the end
    steps.push({ id: 'scoring', label: STEP_LABELS.scoring, status: 'pending' });
    
    return steps;
  }, []);

  // Internal submit handler - used by both form submission and auto-resume
  const handleSubmitInternal = async (brandGuidelines: BrandGuidelines, options: GenerationOptions) => {
    setCurrentBrandName(brandGuidelines.brand_name);
    setActiveOptions(options);
    setAppState('loading');
    
    // Save state to sessionStorage for persistence across refresh
    saveToSession(STORAGE_KEYS.APP_STATE, 'loading');
    saveToSession(STORAGE_KEYS.BRAND_NAME, brandGuidelines.brand_name);
    saveToSession(STORAGE_KEYS.FORM_DATA, brandGuidelines);
    saveToSession(STORAGE_KEYS.OPTIONS, options);
    saveToSession(STORAGE_KEYS.GENERATION_START, Date.now());
    
    // Track generation start time and step timestamps
    const generationStartTime = Date.now();
    const stepTimestamps: Record<string, { start: number; end?: number }> = {};
    
    // Initialize progress with timeline steps
    const initialSteps = buildInitialSteps(options);
    setProgress({
      percentage: 0,
      currentMessage: 'Initializing...',
      steps: initialSteps,
      startTime: generationStartTime,
    });
    
    // Track the last step ID we were working on
    let lastStepId: string | null = null;

    await generateCompletePackageWithProgress(
      brandGuidelines,
      options,
      // onProgress
      (event) => {
        const currentStepId = MESSAGE_TO_STEP_ID[event.message];
        const now = Date.now();
        
        // If we're "Finalizing assets", mark all steps as complete
        if (currentStepId === 'finalizing') {
          // Complete the last step
          if (lastStepId && stepTimestamps[lastStepId] && !stepTimestamps[lastStepId].end) {
            stepTimestamps[lastStepId].end = now;
          }
          
          // Build final steps with all timestamps
          const finalSteps = buildInitialSteps(options).map(step => ({
            ...step,
            status: 'completed' as const,
            startTime: stepTimestamps[step.id]?.start,
            endTime: stepTimestamps[step.id]?.end || now,
          }));
          
          setProgress({
            percentage: 100,
            currentMessage: 'Finalizing assets...',
            steps: finalSteps,
            startTime: generationStartTime,
          });
          return;
        }
        
        // When we move to a new step, mark the previous step as completed
        if (lastStepId && lastStepId !== currentStepId) {
          if (stepTimestamps[lastStepId] && !stepTimestamps[lastStepId].end) {
            stepTimestamps[lastStepId].end = now;
          }
        }
        
        // Record start time for current step
        if (currentStepId && !stepTimestamps[currentStepId]) {
          stepTimestamps[currentStepId] = { start: now };
        }
        
        lastStepId = currentStepId;
        
        // Build updated steps with timestamps
        const updatedSteps = buildInitialSteps(options).map(step => {
          const timestamps = stepTimestamps[step.id];
          let status: 'pending' | 'in_progress' | 'completed' = 'pending';
          
          if (timestamps?.end) {
            status = 'completed';
          } else if (step.id === currentStepId) {
            status = 'in_progress';
          }
          
          return {
            ...step,
            status,
            startTime: timestamps?.start,
            endTime: timestamps?.end,
          };
        });
        
        setProgress({
          percentage: event.percentage,
          currentMessage: event.message,
          steps: updatedSteps,
          startTime: generationStartTime,
        });
      },
      // onComplete
      (result) => {
        setAssetPackage(result);
        setAppState('results');
        setProgress(null);
        
        // Save results to sessionStorage
        saveToSession(STORAGE_KEYS.APP_STATE, 'results');
        saveToSession(STORAGE_KEYS.ASSET_PACKAGE, result);
        // Clear generation start time since we're done
        sessionStorage.removeItem(STORAGE_KEYS.GENERATION_START);
        
        toast.success(`Successfully generated ${result.assets.length} brand assets!`);
      },
      // onError
      (error) => {
        console.error('Generation error:', error);
        toast.error(error || 'Failed to generate assets');
        setAppState('form');
        setProgress(null);
        
        // Clear generation state on error
        clearGenerationState();
      }
    );
  };

  // Public submit handler - called from form
  const handleSubmit = (brandGuidelines: BrandGuidelines, options: GenerationOptions) => {
    handleSubmitInternal(brandGuidelines, options);
  };

  const handleReset = () => {
    setAssetPackage(null);
    setCurrentBrandName('');
    setAppState('form');
    setProgress(null);
    setActiveOptions(null);
    
    // Clear all session storage
    clearGenerationState();
  };

  // Auto-resume generation if we were in the middle of it (page was refreshed)
  useEffect(() => {
    if (shouldAutoResume && isApiHealthy && savedFormData && activeOptions) {
      // Prevent multiple auto-resumes
      setShouldAutoResume(false);
      
      toast.loading(`Resuming generation for "${currentBrandName}"...`, {
        duration: 2000,
      });
      
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleSubmitInternal(savedFormData, activeOptions);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutoResume, isApiHealthy, savedFormData, activeOptions, currentBrandName, handleSubmitInternal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Brand Asset Generator</h1>
                <p className="text-xs text-gray-500">Powered by Gemini 3</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* API Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isApiHealthy === null
                      ? 'bg-yellow-400 animate-pulse'
                      : isApiHealthy
                      ? 'bg-green-400'
                      : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-gray-500">
                  {isApiHealthy === null ? 'Checking...' : isApiHealthy ? 'API Connected' : 'API Offline'}
                </span>
              </div>

              {/* GitHub Link */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Only show on form state */}
      {appState === 'form' && (
        <section className="relative overflow-hidden py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Gemini 3 Hackathon 2026
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Generate Complete{' '}
              <span className="gradient-text">Brand Assets</span>
              {' '}in Minutes
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Input your brand guidelines and let AI create a complete asset package: 
              logos, social media templates, presentations, email templates, and marketing materials.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {[
                'Logo Variations',
                'Social Media Templates',
                'Presentation Decks',
                'Email Templates',
                'Marketing Materials',
              ].map((feature) => (
                <span
                  key={feature}
                  className="px-4 py-2 bg-white rounded-full shadow-sm text-gray-600"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {appState === 'form' && (
          <BrandForm onSubmit={handleSubmit} isLoading={false} />
        )}
        
        {appState === 'loading' && (
          <LoadingState brandName={currentBrandName} progress={progress || undefined} />
        )}
        
        {appState === 'results' && assetPackage && (
          <AssetGallery assetPackage={assetPackage} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Built with Gemini 3 Pro & gemini-3-pro-image-preview</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a
                href="https://gemini3.devpost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                Gemini 3 Hackathon
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://ai.google.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                Google AI
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
