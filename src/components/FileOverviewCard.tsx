import React from 'react';
import { FileAnalysis } from '../types';
import { 
  FileText, 
  Users, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  FileImage,
  Eye,
  EyeOff
} from 'lucide-react';

interface FileOverviewCardProps {
  analysis: FileAnalysis;
}

const FileOverviewCard: React.FC<FileOverviewCardProps> = ({ analysis }) => {
  const getFileIcon = () => {
    switch (analysis.fileType) {
      case 'CSV':
        return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
      case 'XLSX':
        return <FileSpreadsheet className="w-8 h-8 text-blue-600" />;
      case 'PDF':
        return <FileImage className="w-8 h-8 text-red-600" />;
      case 'DOCX':
        return <FileText className="w-8 h-8 text-blue-700" />;
      default:
        return <FileText className="w-8 h-8 text-gray-600" />;
    }
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'Claims':
        return 'bg-blue-500 text-white';
      case 'Policy':
        return 'bg-green-500 text-white';
      case 'Medical Products':
        return 'bg-purple-500 text-white';
      case 'Provider':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPIIIcon = () => {
    if (!analysis.piiDetection.hasPII) {
      return <ShieldCheck className="w-6 h-6 text-green-500" />;
    }
    
    switch (analysis.piiDetection.riskLevel) {
      case 'High':
        return <ShieldAlert className="w-6 h-6 text-red-500" />;
      case 'Medium':
        return <Shield className="w-6 h-6 text-yellow-500" />;
      default:
        return <Shield className="w-6 h-6 text-blue-500" />;
    }
  };

  const getPIIStatusColor = () => {
    if (!analysis.piiDetection.hasPII) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    switch (analysis.piiDetection.riskLevel) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPIIStatusText = () => {
    if (!analysis.piiDetection.hasPII) {
      return 'No PII Detected';
    }
    return `${analysis.piiDetection.riskLevel} Risk PII`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{analysis.fileName}</h3>
              <p className="text-sm text-gray-600">{analysis.fileType} File • {analysis.fileSize}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Confidence</div>
            <div className="text-lg font-bold text-green-600">{analysis.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* File Type */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              {getFileIcon()}
            </div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">File Type</h4>
            <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
              {analysis.fileType}
            </div>
            <p className="text-xs text-gray-500 mt-1">{analysis.fileSize}</p>
          </div>

          {/* Assigned Team */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Assigned Team</h4>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getTeamColor(analysis.recommendedTeam)}`}>
              {analysis.recommendedTeam}
            </div>
            <p className="text-xs text-gray-500 mt-1">{analysis.confidence}% confidence</p>
          </div>

          {/* PII Detection */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              {getPIIIcon()}
            </div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">PII Status</h4>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPIIStatusColor()}`}>
              {getPIIStatusText()}
            </div>
            {analysis.piiDetection.hasPII && (
              <p className="text-xs text-gray-500 mt-1">
                {analysis.piiDetection.piiTypes.length} type(s) detected
              </p>
            )}
          </div>
        </div>

        {/* Content Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Content Summary</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {analysis.contentSummary}
          </p>
        </div>

        {/* PII Details */}
        {analysis.piiDetection.hasPII && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
              PII Detection Details
            </h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="mb-2">
                <span className="text-xs font-medium text-yellow-800">Detected PII Types:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.piiDetection.piiTypes.map((type, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              
              {analysis.piiDetection.detectedFields.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-yellow-800">Affected Fields:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.piiDetection.detectedFields.slice(0, 5).map((field, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                      >
                        {field}
                      </span>
                    ))}
                    {analysis.piiDetection.detectedFields.length > 5 && (
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                        +{analysis.piiDetection.detectedFields.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-yellow-700">
                <span className="font-medium">Risk Level:</span> {analysis.piiDetection.riskLevel}
              </div>
            </div>
          </div>
        )}

        {/* Team Assignment Reasoning */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Assignment Reasoning</h4>
          <p className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
            {analysis.reasoning}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-800">{analysis.headers.length}</div>
            <div className="text-xs text-gray-600">Columns</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-800">{analysis.sampleData.length}</div>
            <div className="text-xs text-gray-600">Sample Rows</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{analysis.dataQuality.completeness}%</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{analysis.dataQuality.consistency}%</div>
            <div className="text-xs text-gray-600">Consistent</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileOverviewCard;