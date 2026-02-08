/**
 * Loading State Component
 * 
 * Displays a beautiful loading animation while assets are being generated.
 * Shows real-time progress with a timeline showing elapsed time for each step.
 */

import { Sparkles } from 'lucide-react';
import ProgressTimeline from './ProgressTimeline';
import type { TimelineStep } from './ProgressTimeline';

export interface ProgressInfo {
  percentage: number;
  currentMessage: string;
  steps: TimelineStep[];
  startTime: number;
}

interface LoadingStateProps {
  brandName: string;
  progress?: ProgressInfo;
}

export default function LoadingState({ brandName, progress }: LoadingStateProps) {
  // Default steps if no progress provided
  const defaultSteps: TimelineStep[] = [
    { id: 'analysis', label: 'Brand Analysis', status: 'pending' },
    { id: 'logos', label: 'Logo Generation', status: 'pending' },
    { id: 'social', label: 'Social Media Templates', status: 'pending' },
    { id: 'presentation', label: 'Presentation Slides', status: 'pending' },
    { id: 'email', label: 'Email Templates', status: 'pending' },
    { id: 'marketing', label: 'Marketing Materials', status: 'pending' },
    { id: 'scoring', label: 'Brand Consistency Scoring', status: 'pending' },
  ];

  const currentProgress = progress || {
    percentage: 0,
    currentMessage: 'Initializing...',
    steps: defaultSteps,
    startTime: Date.now(),
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      {/* Main Loading Animation */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
        
        {/* Inner icon with percentage */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
          {currentProgress.percentage > 0 ? (
            <span className="text-xl font-bold text-white">{currentProgress.percentage}%</span>
          ) : (
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          )}
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
        Our AI is analyzing your brand guidelines and generating beautiful, consistent assets.
      </p>

      {/* Progress Timeline */}
      <ProgressTimeline
        steps={currentProgress.steps}
        startTime={currentProgress.startTime}
      />

      {/* Fun facts or tips */}
      <div className="mt-8 p-4 bg-white/80 backdrop-blur rounded-xl max-w-xl mx-auto text-center shadow-sm">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-purple-600">Pro tip:</span> The more detailed your brand guidelines, the more consistent your generated assets will be.
        </p>
      </div>
    </div>
  );
}
