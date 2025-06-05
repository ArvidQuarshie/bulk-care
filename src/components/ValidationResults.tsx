import React, { useState } from 'react';
import { ValidationResult, ValidationSummary as ValidationSummaryType } from '../types';
import ValidationItem from './ValidationItem';
import ValidationSummary from './ValidationSummary';
import { sendValidationResults } from '../services/slackService';
import { validateDocument } from '../utils/documentValidator';
import { MessageSquare } from 'lucide-react';

interface ValidationResultsProps {
  results: ValidationResult[];
  onExport: () => void;
  rawText?: string;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ results, onExport, rawText }) => {
  const [slackChannel, setSlackChannel] = useState('');
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [slackError, setSlackError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [documentResults, setDocumentResults] = useState<any[]>([]);
  
  useEffect(() => {
    if (rawText) {
      validateDocument(rawText, ['claims', 'medical_codes'])
        .then(setDocumentResults)
        .catch(console.error);
    }
  }, [rawText]);

  if (results.length === 0) {
    return null;
  }

  const summary: ValidationSummaryType = {
    totalRows: results.length,
    validRows: results.filter(r => r.status === 'valid').length,
    warningRows: results.filter(r => r.status === 'warning').length,
    invalidRows: results.filter(r => r.status === 'invalid').length,
    duplicateCount: results.filter(r => r.duplicateOf !== undefined).length
  };

  const handleSlackShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlackError(null);
    setIsSending(true);

    try {
      await sendValidationResults(results, slackChannel);
      setIsSlackModalOpen(false);
      setSlackChannel('');
    } catch (error) {
      setSlackError(error instanceof Error ? error.message : 'Failed to send to Slack');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-8">
      <ValidationSummary 
        summary={summary} 
        onExport={onExport}
        onShareSlack={() => setIsSlackModalOpen(true)}
      />
      
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Validation Results</h2>
        <p className="text-sm text-gray-600">
          Showing the first {results.length} entries from your pricelist
        </p>
      </div>
      
      <div className="space-y-2">
        {results.map((result, index) => (
          <ValidationItem key={index} result={result} />
        ))}
      </div>
      
      {isSlackModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share to Slack</h3>
              <button
                onClick={() => setIsSlackModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSlackShare}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                  placeholder="e.g. #validation-results"
                  className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              {slackError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {slackError}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSlackModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationResults;