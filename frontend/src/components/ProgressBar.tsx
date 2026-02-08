/**
 * Progress Bar Component
 * 
 * A beautiful animated progress bar that shows the percentage of assets generated.
 */

import { Check, Loader2 } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ProgressBarProps {
  percentage: number;
  currentMessage: string;
  steps: ProgressStep[];
}

export default function ProgressBar({ percentage, currentMessage, steps }: ProgressBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{currentMessage}</span>
          <span className="text-sm font-bold text-purple-600">{percentage}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-300 ${
              step.status === 'completed'
                ? 'bg-green-50 border-green-200'
                : step.status === 'in_progress'
                ? 'bg-purple-50 border-purple-300 shadow-md'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {step.status === 'completed' ? (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : step.status === 'in_progress' ? (
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
            <span
              className={`text-sm ${
                step.status === 'completed'
                  ? 'text-green-700 font-medium'
                  : step.status === 'in_progress'
                  ? 'text-purple-700 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
