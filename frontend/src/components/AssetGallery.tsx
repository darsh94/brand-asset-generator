/**
 * Asset Gallery Component
 * 
 * Displays generated brand assets in a beautiful grid layout
 * with download functionality.
 */

import { useState } from 'react';
import { Download, Eye, X, Package, Image, FileText, Mail, Megaphone, Presentation, Info, RefreshCw } from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { AssetPackage, GeneratedAsset, AssetType } from '../types';
import { OverallScoreBadge, AssetScoreCard, BatchScoreCard } from './ConsistencyScore';
import IterationHistory from './IterationHistory';

interface AssetGalleryProps {
  assetPackage: AssetPackage;
  onReset: () => void;
}

const ASSET_TYPE_ICONS: Record<AssetType, React.ReactNode> = {
  logo: <Image className="w-4 h-4" />,
  social_media: <FileText className="w-4 h-4" />,
  presentation: <Presentation className="w-4 h-4" />,
  email_template: <Mail className="w-4 h-4" />,
  marketing: <Megaphone className="w-4 h-4" />,
};

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  logo: 'Logos',
  social_media: 'Social Media',
  presentation: 'Presentation',
  email_template: 'Email Templates',
  marketing: 'Marketing',
};

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  logo: 'from-purple-500 to-pink-500',
  social_media: 'from-blue-500 to-cyan-500',
  presentation: 'from-orange-500 to-red-500',
  email_template: 'from-green-500 to-teal-500',
  marketing: 'from-yellow-500 to-orange-500',
};

export default function AssetGallery({ assetPackage, onReset }: AssetGalleryProps) {
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
  const [activeFilter, setActiveFilter] = useState<AssetType | 'all'>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState<string | null>(null);
  const [showIterationHistory, setShowIterationHistory] = useState<GeneratedAsset | null>(null);

  // Count self-corrected assets
  const selfCorrectedCount = assetPackage.assets.filter(a => a.self_corrected).length;

  // Group assets by type
  const assetsByType = assetPackage.assets.reduce((acc, asset) => {
    if (!acc[asset.asset_type]) {
      acc[asset.asset_type] = [];
    }
    acc[asset.asset_type].push(asset);
    return acc;
  }, {} as Record<AssetType, GeneratedAsset[]>);

  // Filter assets
  const filteredAssets = activeFilter === 'all'
    ? assetPackage.assets
    : assetPackage.assets.filter(a => a.asset_type === activeFilter);

  // Download single asset
  const downloadAsset = (asset: GeneratedAsset) => {
    const byteCharacters = atob(asset.image_data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: asset.mime_type });
    
    const extension = asset.mime_type.split('/')[1] || 'png';
    const filename = `${assetPackage.brand_name.toLowerCase().replace(/\s+/g, '-')}_${asset.asset_name}.${extension}`;
    
    saveAs(blob, filename);
  };

  // Download all assets as ZIP
  const downloadAll = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const brandFolder = zip.folder(assetPackage.brand_name.replace(/\s+/g, '-'));

      if (!brandFolder) return;

      // Create folders for each asset type
      for (const [type, assets] of Object.entries(assetsByType)) {
        const typeFolder = brandFolder.folder(type);
        if (!typeFolder) continue;

        for (const asset of assets) {
          const extension = asset.mime_type.split('/')[1] || 'png';
          const filename = `${asset.asset_name}.${extension}`;
          typeFolder.file(filename, asset.image_data, { base64: true });
        }
      }

      // Add brand analysis as a text file
      brandFolder.file('brand_analysis.txt', assetPackage.brand_analysis);

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${assetPackage.brand_name.replace(/\s+/g, '-')}_brand_assets.zip`);
    } catch (error) {
      console.error('Error creating ZIP:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download assets by category as ZIP
  const downloadCategory = async (type: AssetType) => {
    const assets = assetsByType[type];
    if (!assets || assets.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder(`${assetPackage.brand_name.replace(/\s+/g, '-')}_${type}`);

    if (!folder) return;

    for (const asset of assets) {
      const extension = asset.mime_type.split('/')[1] || 'png';
      const filename = `${asset.asset_name}.${extension}`;
      folder.file(filename, asset.image_data, { base64: true });
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${assetPackage.brand_name.replace(/\s+/g, '-')}_${type}.zip`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {assetPackage.brand_name} Brand Assets
            </h2>
            <p className="text-gray-500 mt-1">
              {assetPackage.assets.length} assets generated successfully
              {selfCorrectedCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  <RefreshCw className="w-3 h-3" />
                  {selfCorrectedCount} self-corrected
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
            >
              Generate New
            </button>
            <button
              onClick={downloadAll}
              disabled={isDownloading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDownloading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Package className="w-4 h-4" />
              )}
              Download All
            </button>
          </div>
        </div>
      </div>

      {/* Batch Consistency Score */}
      {assetPackage.batch_score && (
        <BatchScoreCard 
          score={assetPackage.batch_score} 
          assetCount={assetPackage.assets.length} 
        />
      )}

      {/* Filter Tabs with Download Options */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 mr-2">Filter:</span>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({assetPackage.assets.length})
          </button>
          {Object.entries(assetsByType).map(([type, assets]) => (
            <div key={type} className="flex items-center">
              <button
                onClick={() => setActiveFilter(type as AssetType)}
                className={`px-4 py-2 rounded-l-xl font-medium transition-all flex items-center gap-2 ${
                  activeFilter === type
                    ? `bg-gradient-to-r ${ASSET_TYPE_COLORS[type as AssetType]} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ASSET_TYPE_ICONS[type as AssetType]}
                {ASSET_TYPE_LABELS[type as AssetType]} ({assets.length})
              </button>
              <button
                onClick={() => downloadCategory(type as AssetType)}
                className={`px-2 py-2 rounded-r-xl border-l transition-all ${
                  activeFilter === type
                    ? `bg-gradient-to-r ${ASSET_TYPE_COLORS[type as AssetType]} text-white border-white/20`
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200'
                }`}
                title={`Download ${ASSET_TYPE_LABELS[type as AssetType]}`}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset, index) => (
          <div
            key={`${asset.asset_name}-${index}`}
            className="bg-white rounded-2xl shadow-lg overflow-hidden group animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Image Container */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src={`data:${asset.mime_type};base64,${asset.image_data}`}
                alt={asset.asset_name}
                className="w-full h-full object-contain"
              />
              
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => setSelectedAsset(asset)}
                  className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Preview"
                >
                  <Eye className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={() => downloadAsset(asset)}
                  className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-gray-700" />
                </button>
              </div>
              
              {/* Asset Type Badge */}
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r ${ASSET_TYPE_COLORS[asset.asset_type]} text-white text-xs font-medium flex items-center gap-1.5`}>
                {ASSET_TYPE_ICONS[asset.asset_type]}
                {ASSET_TYPE_LABELS[asset.asset_type]}
              </div>

              {/* Quick Download Button - Always Visible */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadAsset(asset);
                }}
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all hover:scale-110"
                title="Download"
              >
                <Download className="w-4 h-4 text-gray-700" />
              </button>

              {/* Self-Correction Badge - Show if asset went through iterations */}
              {asset.self_corrected && asset.iteration_history && asset.iteration_history.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowIterationHistory(asset);
                  }}
                  className="absolute top-12 right-3 flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-md transition-all text-xs font-medium"
                  title="View self-correction history"
                >
                  <RefreshCw className="w-3 h-3" />
                  {asset.iteration_count}x
                </button>
              )}

              {/* Score Badge */}
              {asset.consistency_score && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowScoreDetails(showScoreDetails === asset.asset_name ? null : asset.asset_name);
                  }}
                  className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-white rounded-full shadow-md transition-all text-xs font-medium"
                  title="View consistency score"
                >
                  <span className={`${
                    asset.consistency_score.overall_score >= 85 ? 'text-green-600' :
                    asset.consistency_score.overall_score >= 70 ? 'text-blue-600' :
                    asset.consistency_score.overall_score >= 55 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {asset.consistency_score.overall_score}
                  </span>
                  <Info className="w-3 h-3 text-gray-500" />
                </button>
              )}
            </div>

            {/* Asset Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">
                    {asset.asset_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {asset.width} × {asset.height}px
                  </p>
                </div>
                {asset.consistency_score && (
                  <OverallScoreBadge score={asset.consistency_score.overall_score} size="sm" />
                )}
              </div>
              {asset.description && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                  {asset.description}
                </p>
              )}

              {/* Expanded Score Details */}
              {showScoreDetails === asset.asset_name && asset.consistency_score && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <AssetScoreCard score={asset.consistency_score} compact={false} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Brand Analysis Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand Analysis</h3>
        <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
          {assetPackage.brand_analysis}
        </div>
        {assetPackage.generation_notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              <span className="font-medium">Generation Notes:</span> {assetPackage.generation_notes}
            </p>
          </div>
        )}
      </div>

      {/* Full Screen Preview Modal */}
      {selectedAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedAsset(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={`data:${selectedAsset.mime_type};base64,${selectedAsset.image_data}`}
              alt={selectedAsset.asset_name}
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white rounded-b-lg">
              <h4 className="font-medium">
                {selectedAsset.asset_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </h4>
              <p className="text-sm text-white/70">
                {selectedAsset.width} × {selectedAsset.height}px • {selectedAsset.description}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => downloadAsset(selectedAsset)}
                  className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                {selectedAsset.self_corrected && selectedAsset.iteration_history && selectedAsset.iteration_history.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAsset(null);
                      setShowIterationHistory(selectedAsset);
                    }}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    View {selectedAsset.iteration_count} Iterations
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Iteration History Modal */}
      {showIterationHistory && showIterationHistory.iteration_history && (
        <IterationHistory
          iterations={showIterationHistory.iteration_history}
          assetName={showIterationHistory.asset_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          onClose={() => setShowIterationHistory(null)}
        />
      )}
    </div>
  );
}
