import React, { useState } from 'react';
import { ValidationResult } from '../types';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import ClinicianCard from './ClinicianCard';

interface ValidationItemProps {
  result: ValidationResult;
}

const ValidationItem: React.FC<ValidationItemProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClinicianDetails, setShowClinicianDetails] = useState(false);
  
  const isPolicy = 'policy_name' in result.originalData;
  const isClinician = 'first_name' in result.originalData && 'last_name' in result.originalData;

  const getStatusIcon = () => {
    switch (result.status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (result.status) {
      case 'valid':
        return 'Valid';
      case 'warning':
        return 'Warning';
      case 'invalid':
        return 'Invalid';
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'invalid':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getDisplayName = () => {
    if (isClinician) {
      const clinician = result.originalData as any;
      return `${clinician.title || ''} ${clinician.first_name} ${clinician.last_name}`.trim();
    }
    if (isPolicy) {
      return (result.originalData as any).policy_name;
    }
    return result.code;
  };

  return (
    <div className="mb-4 border rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <span className="font-medium">{result.code}</span>
          <span className="text-sm text-gray-600">
            {getDisplayName()}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {!isPolicy && !isClinician && result.coding_system && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {result.coding_system}
            </span>
          )}
          {isClinician && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              Clinician Profile
            </span>
          )}
        </div>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t bg-gray-50">
          {/* Clinician Card for clinician data */}
          {isClinician && (
            <div className="mb-6">
              <ClinicianCard 
                clinician={result.originalData as any}
                isExpanded={showClinicianDetails}
                onToggle={() => setShowClinicianDetails(!showClinicianDetails)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Original Data</h3>
              <div className="bg-white p-3 rounded border mb-4">
                {Object.entries(result.originalData).map(([key, value]) => {
                  // Skip image_url in the original data display to avoid clutter
                  if (key === 'image_url') return null;
                  
                  return (
                    <div key={key} className="mb-1 text-sm">
                      <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || 'N/A'}
                    </div>
                  );
                })}
              </div>
              {result.duplicateOf && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                  Duplicate of entry: {result.duplicateOf}
                </div>
              )}
              {result.explanation && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">AI Analysis</h3>
                  <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-t border border-green-100">
                    {result.explanation}
                  </p>
                  {result.compliance_notes && result.compliance_notes.length > 0 && (
                    <div className="text-sm bg-yellow-50 p-3 rounded-b border-x border-b border-yellow-100">
                      <p className="font-medium text-yellow-800 mb-1">Compliance Notes:</p>
                      <ul className="list-disc pl-4 text-yellow-700">
                        {result.compliance_notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              {result.issues.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Issues</h3>
                  <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                    {result.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
                  <ul className="list-disc pl-5 text-sm text-green-700 space-y-1">
                    {result.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.issues.length === 0 && result.recommendations.length === 0 && (
                <div className="text-green-700 text-sm">
                  No issues or recommendations for this entry.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationItem;