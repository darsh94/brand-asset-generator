/**
 * Consistency Score Display Component
 * 
 * Shows brand consistency scores with visual indicators and explanations.
 */

import { TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import type { ConsistencyScore as ConsistencyScoreType, BatchConsistencyScore } from '../types';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

function ScoreGauge({ score, label, size = 'md' }: ScoreGaugeProps) {
  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-green-600';
    if (s >= 70) return 'text-blue-600';
    if (s >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarColor = (s: number) => {
    if (s >= 85) return 'bg-green-500';
    if (s >= 70) return 'bg-blue-500';
    if (s >= 55) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className={`${sizeClasses[size]} text-gray-600`}>{label}</span>
        <span className={`${sizeClasses[size]} font-semibold ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

interface OverallScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function OverallScoreBadge({ score, size = 'md' }: OverallScoreBadgeProps) {
  const getScoreStyle = (s: number) => {
    if (s >= 85) return 'from-green-500 to-emerald-600 text-white';
    if (s >= 70) return 'from-blue-500 to-indigo-600 text-white';
    if (s >= 55) return 'from-yellow-500 to-orange-500 text-white';
    return 'from-red-500 to-rose-600 text-white';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 85) return 'Excellent';
    if (s >= 70) return 'Good';
    if (s >= 55) return 'Fair';
    return 'Needs Work';
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getScoreStyle(score)} flex items-center justify-center font-bold shadow-lg`}
      >
        {score}
      </div>
      <span className="text-xs text-gray-500 font-medium">{getScoreLabel(score)}</span>
    </div>
  );
}

interface AssetScoreCardProps {
  score: ConsistencyScoreType;
  compact?: boolean;
}

export function AssetScoreCard({ score, compact = false }: AssetScoreCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
        <OverallScoreBadge score={score.overall_score} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 truncate">{score.explanation}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-start gap-4">
        <OverallScoreBadge score={score.overall_score} />
        <div className="flex-1">
          <p className="text-sm text-gray-700">{score.explanation}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ScoreGauge score={score.color_adherence} label="Color" size="sm" />
        <ScoreGauge score={score.typography_compliance} label="Typography" size="sm" />
        <ScoreGauge score={score.tone_alignment} label="Tone" size="sm" />
        <ScoreGauge score={score.layout_quality} label="Layout" size="sm" />
        <ScoreGauge score={score.brand_recognition} label="Recognition" size="sm" />
      </div>

      {(score.strengths.length > 0 || score.improvements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          {score.strengths.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm font-medium text-green-700 flex items-center gap-1 mb-2">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5">
                {score.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {score.improvements.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-700 flex items-center gap-1 mb-2">
                <AlertCircle className="w-4 h-4" />
                Areas to Improve
              </p>
              <ul className="text-sm text-gray-700 space-y-1.5">
                {score.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BatchScoreCardProps {
  score: BatchConsistencyScore;
  assetCount: number;
}

export function BatchScoreCard({ score, assetCount }: BatchScoreCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
      <div className="flex items-start gap-6">
        <div className="flex flex-col items-center">
          <OverallScoreBadge score={score.overall_score} size="lg" />
          <p className="text-xs text-gray-500 mt-2">{assetCount} assets</p>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Brand Consistency Score
          </h3>
          <p className="text-sm text-gray-600 mb-4">{score.summary}</p>

          <div className="grid grid-cols-5 gap-2">
            <ScoreGauge score={score.color_adherence} label="Color" size="sm" />
            <ScoreGauge score={score.typography_compliance} label="Type" size="sm" />
            <ScoreGauge score={score.tone_alignment} label="Tone" size="sm" />
            <ScoreGauge score={score.layout_quality} label="Layout" size="sm" />
            <ScoreGauge score={score.brand_recognition} label="Brand" size="sm" />
          </div>
        </div>
      </div>

      {(score.top_performers.length > 0 || score.needs_attention.length > 0) && (
        <div className="mt-4 pt-4 border-t border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          {score.top_performers.length > 0 && (
            <div className="flex items-start gap-3 bg-green-50/50 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 mb-1">Top Performers</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {score.top_performers.map((name, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500">•</span>
                      <span>{name.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {score.needs_attention.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50/50 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700 mb-1">Needs Attention</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {score.needs_attention.map((name, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-amber-500">•</span>
                      <span>{name.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default { OverallScoreBadge, AssetScoreCard, BatchScoreCard };
