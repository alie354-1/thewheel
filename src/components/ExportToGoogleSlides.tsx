import React, { useState } from 'react';
import { Presentation, AlertCircle } from 'lucide-react';
import { createGoogleSlides } from '../lib/slides';

interface ExportToGoogleSlidesProps {
  title: string;
  slides: any[];
  onExportStart?: () => void;
  onExportComplete?: (presentationId: string) => void;
  onExportError?: (error: Error) => void;
}

export default function ExportToGoogleSlides({
  title,
  slides,
  onExportStart,
  onExportComplete,
  onExportError
}: ExportToGoogleSlidesProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    onExportStart?.();

    try {
      const presentationId = await createGoogleSlides(title, slides);
      onExportComplete?.(presentationId);
      window.open(`https://docs.google.com/presentation/d/${presentationId}/edit`, '_blank');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export to Google Slides';
      setError(errorMessage);
      onExportError?.(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        <Presentation className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export to Google Slides'}
      </button>
    </div>
  );
}