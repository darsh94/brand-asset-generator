/**
 * IterationHistory Component
 * 
 * Displays the self-correcting loop iteration history for an asset,
 * showing the visual progression from v1 → v2 → v3 with pass/fail indicators.
 */

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Star } from 'lucide-react';
import type { AssetIteration } from '../types';

interface IterationHistoryProps {
  iterations: AssetIteration[];
  assetName: string;
  onClose: () => void;
}

export function IterationHistory({ iterations, assetName, onClose }: IterationHistoryProps) {
  const [selectedIteration, setSelectedIteration] = useState(iterations.length - 1);
  
  const currentIteration = iterations[selectedIteration];
  
  if (!currentIteration) return null;
  
  const getStatusIcon = (status: string, score: number) => {
    if (status === 'final') {
      return <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
    }
    if (status === 'passed' || score >= 70) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };
  
  const getStatusLabel = (status: string, score: number) => {
    if (status === 'final') return 'Final';
    if (status === 'passed' || score >= 70) return 'Passed';
    return 'Failed';
  };
  
  const getStatusColor = (status: string, score: number) => {
    if (status === 'final') return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    if (status === 'passed' || score >= 70) return 'bg-green-100 border-green-300 text-green-800';
    return 'bg-red-100 border-red-300 text-red-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Self-Correction History</h2>
            <p className="text-sm text-gray-500">{assetName} - {iterations.length} iteration{iterations.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Timeline Navigation */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-center gap-2">
            {iterations.map((iter, idx) => (
              <button
                key={iter.iteration_number}
                onClick={() => setSelectedIteration(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  selectedIteration === idx
                    ? 'bg-white shadow-md border-purple-300'
                    : 'bg-transparent border-transparent hover:bg-white/50'
                }`}
              >
                {getStatusIcon(iter.status, iter.validation.score)}
                <span className="font-medium">v{iter.iteration_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(iter.status, iter.validation.score)}`}>
                  {iter.validation.score}
                </span>
              </button>
            ))}
          </div>
          
          {/* Arrow progression */}
          <div className="flex items-center justify-center gap-1 mt-3 text-sm text-gray-500">
            {iterations.map((iter, idx) => (
              <div key={iter.iteration_number} className="flex items-center gap-1">
                <span className={`font-mono ${
                  iter.status === 'final' ? 'text-yellow-600' :
                  iter.status === 'passed' || iter.validation.score >= 70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  v{iter.iteration_number} {iter.status === 'final' ? '⭐' : iter.validation.score >= 70 ? '✓' : '✗'}
                </span>
                {idx < iterations.length - 1 && (
                  <span className="text-gray-400 mx-1">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">Version {currentIteration.iteration_number}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedIteration(Math.max(0, selectedIteration - 1))}
                    disabled={selectedIteration === 0}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedIteration(Math.min(iterations.length - 1, selectedIteration + 1))}
                    disabled={selectedIteration === iterations.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {currentIteration.image_data ? (
                <img
                  src={`data:${currentIteration.mime_type};base64,${currentIteration.image_data}`}
                  alt={`Version ${currentIteration.iteration_number}`}
                  className="w-full rounded-lg shadow-md"
                />
              ) : (
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  Generation failed
                </div>
              )}
            </div>
            
            {/* Validation Details */}
            <div className="space-y-4">
              {/* Score Badge */}
              <div className={`p-4 rounded-xl border ${getStatusColor(currentIteration.status, currentIteration.validation.score)}`}>
                <div className="flex items-center gap-3">
                  {getStatusIcon(currentIteration.status, currentIteration.validation.score)}
                  <div>
                    <div className="font-bold text-lg">
                      Score: {currentIteration.validation.score}/100
                    </div>
                    <div className="text-sm opacity-80">
                      {getStatusLabel(currentIteration.status, currentIteration.validation.score)}
                      {currentIteration.status === 'final' && ' - Best version selected'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Critique */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-2">AI Critique</h4>
                <p className="text-gray-600 text-sm">{currentIteration.validation.critique}</p>
              </div>
              
              {/* Issues (if any) */}
              {currentIteration.validation.issues.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Issues Found
                  </h4>
                  <ul className="space-y-1">
                    {currentIteration.validation.issues.map((issue, idx) => (
                      <li key={idx} className="text-red-600 text-sm flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Regeneration Guidance */}
              {currentIteration.validation.regeneration_guidance && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h4 className="font-semibold text-amber-700 mb-2">Regeneration Guidance</h4>
                  <p className="text-amber-600 text-sm">{currentIteration.validation.regeneration_guidance}</p>
                </div>
              )}
              
              {/* Success message for final/passed */}
              {(currentIteration.status === 'final' || currentIteration.validation.score >= 70) && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {currentIteration.status === 'final' ? 'Final Version Selected' : 'Validation Passed'}
                  </h4>
                  <p className="text-green-600 text-sm">
                    {currentIteration.status === 'final' 
                      ? 'This version met all brand guidelines and was selected as the final asset.'
                      : 'This version passed the brand consistency check.'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Iteration Comparison (if more than 1 iteration) */}
          {iterations.length > 1 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-4">All Versions Comparison</h3>
              <div className="grid grid-cols-3 gap-4">
                {iterations.map((iter, idx) => (
                  <button
                    key={iter.iteration_number}
                    onClick={() => setSelectedIteration(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedIteration === idx ? 'border-purple-500 shadow-lg' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {iter.image_data ? (
                      <img
                        src={`data:${iter.mime_type};base64,${iter.image_data}`}
                        alt={`Version ${iter.iteration_number}`}
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        Failed
                      </div>
                    )}
                    
                    {/* Version badge */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      iter.status === 'final' ? 'bg-yellow-500 text-white' :
                      iter.validation.score >= 70 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      v{iter.iteration_number}
                      {iter.status === 'final' ? ' ⭐' : iter.validation.score >= 70 ? ' ✓' : ' ✗'}
                    </div>
                    
                    {/* Score badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white rounded text-xs font-mono">
                      {iter.validation.score}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IterationHistory;
