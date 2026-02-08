/**
 * Progress Timeline Component
 * 
 * Shows generation progress as a vertical timeline with elapsed times.
 */

import { Check, Loader2, Clock } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
  startTime?: number; // timestamp when step started
  endTime?: number;   // timestamp when step completed
}

interface ProgressTimelineProps {
  steps: TimelineStep[];
  startTime: number; // timestamp when generation started
}

function formatElapsedTime(startTime: number, timestamp?: number): string {
  const now = timestamp || Date.now();
  const elapsed = Math.floor((now - startTime) / 1000);
  
  if (elapsed < 60) {
    return `T+${elapsed}s`;
  }
  
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  if (seconds === 0) {
    return `T+${minutes}min`;
  }
  
  return `T+${minutes}m ${seconds}s`;
}

function formatDuration(startTime: number, endTime: number): string {
  const duration = Math.floor((endTime - startTime) / 1000);
  
  if (duration < 60) {
    return `${duration}s`;
  }
  
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}min`;
}

export default function ProgressTimeline({ steps, startTime }: ProgressTimelineProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Steps */}
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in_progress';
            const isPending = step.status === 'pending';
            
            return (
              <div
                key={step.id}
                className={`relative flex items-start gap-4 py-4 ${
                  index === 0 ? 'pt-0' : ''
                } ${index === steps.length - 1 ? 'pb-0' : ''}`}
              >
                {/* Icon/Status indicator */}
                <div
                  className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                    isCompleted
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : isInProgress
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse'
                      : 'bg-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : isInProgress ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4
                        className={`font-medium ${
                          isCompleted
                            ? 'text-gray-800'
                            : isInProgress
                            ? 'text-purple-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      {isInProgress && (
                        <p className="text-sm text-purple-500 mt-0.5">
                          In progress...
                        </p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-right">
                      {isCompleted && step.startTime && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formatElapsedTime(startTime, step.endTime || step.startTime)}
                        </span>
                      )}
                      {isInProgress && step.startTime && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          {formatElapsedTime(startTime)}
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-sm">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Duration badge for completed steps */}
                  {isCompleted && step.startTime && step.endTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completed in {formatDuration(step.startTime, step.endTime)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary bar */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Total Elapsed</span>
          </div>
          <span className="text-lg font-bold text-purple-600">
            {formatElapsedTime(startTime)}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                (steps.filter(s => s.status === 'completed').length / steps.length) * 100,
                100
              )}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
        </p>
      </div>
    </div>
  );
}
