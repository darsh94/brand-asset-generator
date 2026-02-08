/**
 * Loading State Component
 * 
 * Displays a beautiful loading animation while assets are being generated.
 */

import { Sparkles, Palette, Layout, Mail, Megaphone, Image } from 'lucide-react';

interface LoadingStateProps {
  brandName: string;
}

const GENERATION_STEPS = [
  { icon: Sparkles, label: 'Analyzing brand identity', color: 'from-purple-500 to-pink-500' },
  { icon: Image, label: 'Creating logo variations', color: 'from-blue-500 to-cyan-500' },
  { icon: Palette, label: 'Generating social media templates', color: 'from-green-500 to-teal-500' },
  { icon: Layout, label: 'Designing presentation slides', color: 'from-orange-500 to-red-500' },
  { icon: Mail, label: 'Crafting email templates', color: 'from-yellow-500 to-orange-500' },
  { icon: Megaphone, label: 'Building marketing materials', color: 'from-pink-500 to-rose-500' },
];

export default function LoadingState({ brandName }: LoadingStateProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      {/* Main Loading Animation */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
        
        {/* Inner icon */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-10 h-10 text-white animate-pulse" />
        </div>
        
        {/* Floating particles */}
        <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 animate-bounce opacity-60" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-2 -left-4 w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 animate-bounce opacity-60" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-1/2 -right-6 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 animate-bounce opacity-60" style={{ animationDelay: '0.6s' }} />
      </div>

      {/* Text */}
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Creating <span className="gradient-text">{brandName}</span> Brand Assets
      </h2>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        Our AI is analyzing your brand guidelines and generating beautiful, consistent assets. This may take a few minutes.
      </p>

      {/* Progress Steps */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl w-full">
        {GENERATION_STEPS.map((step, index) => (
          <div
            key={step.label}
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md animate-pulse-slow"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <div className={`p-2 rounded-lg bg-gradient-to-br ${step.color}`}>
              <step.icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-600">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Fun facts or tips */}
      <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl max-w-lg text-center">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-purple-600">Did you know?</span> Consistent branding across all platforms can increase revenue by up to 23%.
        </p>
      </div>
    </div>
  );
}
