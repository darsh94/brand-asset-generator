/**
 * Brand Asset Generator - Main App Component
 * 
 * A powerful tool that generates complete brand asset packages
 * using Gemini 3 AI.
 * 
 * Built for the Gemini 3 Hackathon 2026.
 */

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Sparkles, Github, ExternalLink } from 'lucide-react';
import { BrandForm, AssetGallery, LoadingState } from './components';
import { generateCompletePackage, checkHealth } from './services/api';
import type { BrandGuidelines, GenerationOptions, AssetPackage } from './types';

type AppState = 'form' | 'loading' | 'results';

export default function App() {
  const [appState, setAppState] = useState<AppState>('form');
  const [assetPackage, setAssetPackage] = useState<AssetPackage | null>(null);
  const [currentBrandName, setCurrentBrandName] = useState<string>('');
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);

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

  const handleSubmit = async (brandGuidelines: BrandGuidelines, options: GenerationOptions) => {
    setCurrentBrandName(brandGuidelines.brand_name);
    setAppState('loading');

    try {
      const result = await generateCompletePackage(brandGuidelines, options);
      setAssetPackage(result);
      setAppState('results');
      toast.success(`Successfully generated ${result.assets.length} brand assets!`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate assets');
      setAppState('form');
    }
  };

  const handleReset = () => {
    setAssetPackage(null);
    setCurrentBrandName('');
    setAppState('form');
  };

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
          <LoadingState brandName={currentBrandName} />
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
