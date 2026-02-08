/**
 * Asset Gallery Component
 * 
 * Displays generated brand assets in a beautiful grid layout
 * with download functionality.
 */

import { useState } from 'react';
import { Download, Eye, X, Package, Image, FileText, Mail, Megaphone, Presentation } from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { AssetPackage, GeneratedAsset, AssetType } from '../types';

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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeFilter === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          All ({assetPackage.assets.length})
        </button>
        {Object.entries(assetsByType).map(([type, assets]) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type as AssetType)}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeFilter === type
                ? `bg-gradient-to-r ${ASSET_TYPE_COLORS[type as AssetType]} text-white`
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {ASSET_TYPE_ICONS[type as AssetType]}
            {ASSET_TYPE_LABELS[type as AssetType]} ({assets.length})
          </button>
        ))}
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
            </div>

            {/* Asset Info */}
            <div className="p-4">
              <h3 className="font-medium text-gray-800 truncate">
                {asset.asset_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {asset.width} × {asset.height}px
              </p>
              {asset.description && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                  {asset.description}
                </p>
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
              <button
                onClick={() => downloadAsset(selectedAsset)}
                className="mt-3 px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
