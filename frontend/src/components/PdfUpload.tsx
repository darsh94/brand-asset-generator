/**
 * PDF Upload Component
 * 
 * Allows users to upload a PDF containing brand guidelines,
 * which is then parsed to auto-fill the form.
 */

import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ExtractedBrandData {
  brand_name?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  primary_font?: string | null;
  secondary_font?: string | null;
  brand_tone?: string | null;
  target_audience?: string | null;
  industry?: string | null;
  brand_values?: string | null;
  tagline?: string | null;
  additional_context?: string | null;
}

interface PdfUploadProps {
  onDataExtracted: (data: ExtractedBrandData) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function PdfUpload({ onDataExtracted }: PdfUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error');
      setErrorMessage('Please upload a PDF file');
      return;
    }

    setFileName(file.name);
    setStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process PDF');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setStatus('success');
        onDataExtracted(result.data);
      } else {
        throw new Error('No data extracted from PDF');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process PDF');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setStatus('idle');
    setFileName('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={status === 'idle' ? handleClick : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300
          ${status === 'idle' ? 'cursor-pointer hover:border-purple-400 hover:bg-purple-50/50' : ''}
          ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}
          ${status === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${status === 'error' ? 'border-red-400 bg-red-50' : ''}
          ${status === 'uploading' ? 'border-purple-400 bg-purple-50/50' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          {status === 'idle' && (
            <>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">
                  Upload Brand Guidelines PDF
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  We'll extract brand information to auto-fill the form
                </p>
              </div>
            </>
          )}

          {status === 'uploading' && (
            <>
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">
                  Processing PDF...
                </p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 justify-center">
                  <FileText className="w-4 h-4" />
                  {fileName}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Extracting brand information with AI
                </p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-10 h-10 text-green-600" />
              <div className="text-center">
                <p className="text-lg font-medium text-green-700">
                  Brand Information Extracted!
                </p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2 justify-center">
                  <FileText className="w-4 h-4" />
                  {fileName}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Form fields have been auto-filled. Review and adjust as needed.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Upload different file
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-10 h-10 text-red-600" />
              <div className="text-center">
                <p className="text-lg font-medium text-red-700">
                  Upload Failed
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Try again
              </button>
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      {status === 'idle' && (
        <div className="flex items-center gap-4 mt-6 mb-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or fill in manually</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}
    </div>
  );
}
