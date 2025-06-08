import React from 'react';
import { ValidationResult, FileAnalysis } from '../types';
import { 
  PieChart, 
  BarChart3, 
  Users, 
  FileText, 
  Shield, 
  Stethoscope,
  CreditCard,
  Building2,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface DataVisualizationProps {
  results: ValidationResult[];
  fileAnalyses: FileAnalysis[];
}

interface BusinessArea {
  name: string;
  icon: React.ReactNode;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  description: string;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ results, fileAnalyses }) => {
  // Calculate business area distribution
  const getBusinessAreas = (): BusinessArea[] => {
    const areas = new Map<string, number>();
    
    // Count from file analyses
    fileAnalyses.forEach(analysis => {
      const team = analysis.recommendedTeam;
      areas.set(team, (areas.get(team) || 0) + 1);
    });
    
    // Count from validation results based on coding systems
    results.forEach(result => {
      if (result.coding_system) {
        const system = result.coding_system.toLowerCase();
        if (system.includes('icd') || system.includes('cpt') || system.includes('drg')) {
          areas.set('Medical Codes', (areas.get('Medical Codes') || 0) + 1);
        }
      }
      
      // Check for policy-related data
      if ('policy_id' in result.originalData) {
        areas.set('Policy', (areas.get('Policy') || 0) + 1);
      }
      
      // Check for claims-related data
      if ('claim_id' in result.originalData || result.coding_system) {
        areas.set('Claims', (areas.get('Claims') || 0) + 1);
      }
    });
    
    const total = Array.from(areas.values()).reduce((sum, count) => sum + count, 0) || 1;
    
    const businessAreaConfig = {
      'Claims': { 
        icon: <FileText className="w-6 h-6" />, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100',
        description: 'Claims processing and billing data'
      },
      'Policy': { 
        icon: <Shield className="w-6 h-6" />, 
        color: 'text-green-600', 
        bgColor: 'bg-green-100',
        description: 'Insurance policies and coverage'
      },
      'Medical Products': { 
        icon: <Stethoscope className="w-6 h-6" />, 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-100',
        description: 'Pharmaceutical and medical devices'
      },
      'Provider': { 
        icon: <Building2 className="w-6 h-6" />, 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100',
        description: 'Healthcare providers and facilities'
      },
      'Medical Codes': { 
        icon: <Activity className="w-6 h-6" />, 
        color: 'text-red-600', 
        bgColor: 'bg-red-100',
        description: 'ICD, CPT, and DRG codes'
      },
      'General': { 
        icon: <Users className="w-6 h-6" />, 
        color: 'text-gray-600', 
        bgColor: 'bg-gray-100',
        description: 'General healthcare data'
      }
    };
    
    return Array.from(areas.entries()).map(([name, count]) => ({
      name,
      icon: businessAreaConfig[name as keyof typeof businessAreaConfig]?.icon || <Users className="w-6 h-6" />,
      count,
      percentage: Math.round((count / total) * 100),
      color: businessAreaConfig[name as keyof typeof businessAreaConfig]?.color || 'text-gray-600',
      bgColor: businessAreaConfig[name as keyof typeof businessAreaConfig]?.bgColor || 'bg-gray-100',
      description: businessAreaConfig[name as keyof typeof businessAreaConfig]?.description || 'Healthcare data'
    })).sort((a, b) => b.count - a.count);
  };

  const businessAreas = getBusinessAreas();
  
  // Calculate validation status distribution
  const validationStats = {
    valid: results.filter(r => r.status === 'valid').length,
    warning: results.filter(r => r.status === 'warning').length,
    invalid: results.filter(r => r.status === 'invalid').length
  };
  
  const totalValidations = results.length || 1;
  
  // Calculate PII risk distribution
  const piiStats = fileAnalyses.reduce((acc, analysis) => {
    if (analysis.piiDetection.hasPII) {
      acc[analysis.piiDetection.riskLevel] = (acc[analysis.piiDetection.riskLevel] || 0) + 1;
    } else {
      acc['None'] = (acc['None'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  if (results.length === 0 && fileAnalyses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Business Areas Distribution */}
      <div className="material-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <PieChart className="w-6 h-6 mr-2 text-blue-600" />
            Business Areas Involved
          </h3>
          <span className="text-sm text-gray-500">
            {businessAreas.length} area{businessAreas.length !== 1 ? 's' : ''} detected
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {businessAreas.map((area, index) => (
            <div key={area.name} className={`${area.bgColor} rounded-lg p-4 border-l-4 border-current ${area.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={area.color}>
                    {area.icon}
                  </div>
                  <h4 className="font-semibold text-gray-800">{area.name}</h4>
                </div>
                <span className="text-lg font-bold text-gray-800">{area.percentage}%</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{area.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{area.count} files/entries</span>
                <div className="w-16 h-2 bg-white rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-current opacity-60" 
                    style={{ width: `${area.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Visual Distribution Bar */}
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
          {businessAreas.map((area, index) => (
            <div
              key={area.name}
              className={`h-full ${area.bgColor.replace('bg-', 'bg-').replace('-100', '-400')}`}
              style={{ width: `${area.percentage}%` }}
              title={`${area.name}: ${area.percentage}%`}
            ></div>
          ))}
        </div>
      </div>

      {/* Validation Quality Overview */}
      {results.length > 0 && (
        <div className="material-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-green-600" />
              Data Quality Assessment
            </h3>
            <span className="text-sm text-gray-500">
              {totalValidations} entries validated
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-800">Valid</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {Math.round((validationStats.valid / totalValidations) * 100)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">{validationStats.valid} entries passed validation</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-gray-800">Warnings</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {Math.round((validationStats.warning / totalValidations) * 100)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">{validationStats.warning} entries need attention</p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-800">Invalid</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {Math.round((validationStats.invalid / totalValidations) * 100)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">{validationStats.invalid} entries require correction</p>
            </div>
          </div>
          
          {/* Quality Progress Bar */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${(validationStats.valid / totalValidations) * 100}%` }}
            ></div>
            <div 
              className="h-full bg-yellow-500" 
              style={{ width: `${(validationStats.warning / totalValidations) * 100}%` }}
            ></div>
            <div 
              className="h-full bg-red-500" 
              style={{ width: `${(validationStats.invalid / totalValidations) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* PII Risk Assessment */}
      {fileAnalyses.length > 0 && (
        <div className="material-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-purple-600" />
              Privacy & Security Assessment
            </h3>
            <span className="text-sm text-gray-500">
              {fileAnalyses.length} file{fileAnalyses.length !== 1 ? 's' : ''} analyzed
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(piiStats).map(([riskLevel, count]) => {
              const config = {
                'High': { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
                'Medium': { color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500' },
                'Low': { color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
                'None': { color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' }
              };
              
              const { color, bgColor, borderColor } = config[riskLevel as keyof typeof config] || config['None'];
              
              return (
                <div key={riskLevel} className={`${bgColor} rounded-lg p-4 border-l-4 ${borderColor}`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${color} mb-1`}>{count}</div>
                    <div className="text-sm font-medium text-gray-700">{riskLevel} Risk</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((count / fileAnalyses.length) * 100)}% of files
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="material-card p-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
          <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />
          Key Insights
        </h3>
        
        <div className="space-y-3">
          {businessAreas.length > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Primary business area: <span className="text-blue-600">{businessAreas[0].name}</span>
                </p>
                <p className="text-xs text-gray-600">
                  {businessAreas[0].percentage}% of your data belongs to {businessAreas[0].name} operations
                </p>
              </div>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Data quality score: <span className="text-green-600">
                    {Math.round((validationStats.valid / totalValidations) * 100)}%
                  </span>
                </p>
                <p className="text-xs text-gray-600">
                  {validationStats.valid} out of {totalValidations} entries passed validation
                </p>
              </div>
            </div>
          )}
          
          {Object.keys(piiStats).some(key => key !== 'None') && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  PII detected in {Object.entries(piiStats).filter(([key]) => key !== 'None').reduce((sum, [, count]) => sum + count, 0)} files
                </p>
                <p className="text-xs text-gray-600">
                  Review security recommendations for sensitive data handling
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;