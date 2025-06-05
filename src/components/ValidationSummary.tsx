import React from 'react';
import { ValidationSummary as ValidationSummaryType } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Share2 } from 'lucide-react';

interface ValidationSummaryProps {
  summary: ValidationSummaryType;
  onExport: () => void;
  onShareSlack: () => void;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ summary, onExport, onShareSlack }) => {
  const { totalRows, validRows, warningRows, invalidRows, duplicateCount } = summary;
  
  const validPercentage = Math.round((validRows / totalRows) * 100) || 0;
  const warningPercentage = Math.round((warningRows / totalRows) * 100) || 0;
  const invalidPercentage = Math.round((invalidRows / totalRows) * 100) || 0;
  const duplicatePercentage = Math.round((duplicateCount / totalRows) * 100) || 0;

  return (
    <div className="material-card p-8 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Validation Summary</h2>
        <div className="flex gap-2">
          <button
            onClick={onShareSlack}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors duration-200 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share to Slack
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            Export Results
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center p-4 bg-green-50 rounded-lg transform hover:scale-[1.02] transition-all duration-300">
          <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Valid</p>
            <p className="text-lg font-bold text-gray-800">
              {validRows} <span className="text-sm font-normal text-gray-500">({validPercentage}%)</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center p-4 bg-yellow-50 rounded-lg transform hover:scale-[1.02] transition-all duration-300">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Warnings</p>
            <p className="text-lg font-bold text-gray-800">
              {warningRows} <span className="text-sm font-normal text-gray-500">({warningPercentage}%)</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center p-4 bg-red-50 rounded-lg transform hover:scale-[1.02] transition-all duration-300">
          <XCircle className="w-6 h-6 text-red-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Invalid</p>
            <p className="text-lg font-bold text-gray-800">
              {invalidRows} <span className="text-sm font-normal text-gray-500">({invalidPercentage}%)</span>
            </p>
          </div>
        </div>
      </div>
      
      {duplicateCount > 0 && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-orange-800">
              Duplicate Entries
            </p>
            <span className="text-sm text-orange-600">
              {duplicateCount} entries ({duplicatePercentage}%)
            </span>
          </div>
          <p className="text-sm text-orange-700">
            These entries have been marked as warnings. Consider reviewing and removing duplicates to maintain data integrity.
          </p>
        </div>
      )}

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="flex h-full">
          <div 
            className="bg-green-500 h-full" 
            style={{ width: `${validPercentage}%` }}
          ></div>
          <div 
            className="bg-yellow-500 h-full" 
            style={{ width: `${warningPercentage}%` }}
          ></div>
          <div 
            className="bg-red-500 h-full" 
            style={{ width: `${invalidPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mt-2">
        Total Rows: {totalRows}
      </div>
    </div>
  );
};

export default ValidationSummary;