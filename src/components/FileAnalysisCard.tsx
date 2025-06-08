import React from 'react';
import { FileAnalysis } from '../types';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  Target,
  FileSpreadsheet,
  FileImage
} from 'lucide-react';

interface FileAnalysisCardProps {
  analysis: FileAnalysis;
}

const FileAnalysisCard: React.FC<FileAnalysisCardProps> = ({ analysis }) => {
  const getFileIcon = () => {
    switch (analysis.fileType) {
      case 'CSV':
        return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
      case 'XLSX':
        return <FileSpreadsheet className="w-6 h-6 text-blue-600" />;
      case 'PDF':
        return <FileImage className="w-6 h-6 text-red-600" />;
      case 'DOCX':
        return <FileText className="w-6 h-6 text-blue-700" />;
      default:
        return <FileText className="w-6 h-6 text-gray-600" />;
    }
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'Claims':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Policy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medical Products':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Provider':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="material-card p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getFileIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{analysis.fileName}</h3>
            <p className="text-sm text-gray-600">{analysis.fileType} • {analysis.fileSize}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-gray-500" />
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getTeamColor(analysis.recommendedTeam)}`}>
            {analysis.recommendedTeam} Team
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Content Summary</h4>
          <p className="text-sm text-gray-600 mb-4">{analysis.contentSummary}</p>

          <h4 className="text-sm font-medium text-gray-700 mb-2">Team Recommendation</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800">{analysis.recommendedTeam}</span>
              <span className={`text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
                {analysis.confidence}% confidence
              </span>
            </div>
            <p className="text-xs text-gray-600">{analysis.reasoning}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Data Quality Assessment</h4>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completeness</span>
              <div className="flex items-center space-x-2">
                {getQualityIcon(analysis.dataQuality.completeness)}
                <span className="text-sm font-medium">{analysis.dataQuality.completeness}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Consistency</span>
              <div className="flex items-center space-x-2">
                {getQualityIcon(analysis.dataQuality.consistency)}
                <span className="text-sm font-medium">{analysis.dataQuality.consistency}%</span>
              </div>
            </div>
          </div>

          {analysis.suggestedWorkflows.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Workflows</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.suggestedWorkflows.map((workflow, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {workflow}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {analysis.headers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Detected Columns ({analysis.headers.length})
          </h4>
          <div className="flex flex-wrap gap-1">
            {analysis.headers.slice(0, 10).map((header, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {header}
              </span>
            ))}
            {analysis.headers.length > 10 && (
              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                +{analysis.headers.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {analysis.dataQuality.issues.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Data Quality Issues</h4>
          <ul className="text-xs text-red-600 space-y-1">
            {analysis.dataQuality.issues.slice(0, 3).map((issue, index) => (
              <li key={index} className="flex items-center space-x-1">
                <XCircle className="w-3 h-3" />
                <span>{issue}</span>
              </li>
            ))}
            {analysis.dataQuality.issues.length > 3 && (
              <li className="text-gray-500">
                +{analysis.dataQuality.issues.length - 3} more issues
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileAnalysisCard;