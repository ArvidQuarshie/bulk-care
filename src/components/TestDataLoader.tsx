import React from 'react';
import { Download, FileText, Upload } from 'lucide-react';

interface TestDataLoaderProps {
  onFileSelect: (files: File[]) => void;
}

const TestDataLoader: React.FC<TestDataLoaderProps> = ({ onFileSelect }) => {
  const testDataFiles = [
    {
      name: 'Sample Policies',
      filename: 'policies_sample.csv',
      description: '15 insurance policies with coverage details',
      icon: <FileText className="w-5 h-5 text-green-600" />,
      category: 'Policy Management'
    },
    {
      name: 'Sample Claims',
      filename: 'claims_sample.csv',
      description: '15 medical claims with billing information',
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      category: 'Claims Processing'
    },
    {
      name: 'Medical Codes',
      filename: 'medical_codes_sample.csv',
      description: '20 CPT, ICD-10, and DRG codes',
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      category: 'Medical Coding'
    },
    {
      name: 'Healthcare Providers',
      filename: 'providers_sample.csv',
      description: '15 healthcare providers and facilities',
      icon: <FileText className="w-5 h-5 text-orange-600" />,
      category: 'Provider Network'
    },
    {
      name: 'Clinicians',
      filename: 'clinicians_sample.csv',
      description: '15 healthcare professionals',
      icon: <FileText className="w-5 h-5 text-red-600" />,
      category: 'Clinical Staff'
    },
    {
      name: 'Drug Codes',
      filename: 'drug_codes_sample.csv',
      description: '20 pharmaceutical products with NDC codes',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      category: 'Pharmacy'
    }
  ];

  const handleTestFileLoad = async (filename: string) => {
    try {
      const response = await fetch(`/test_data/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }
      
      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], filename, { type: 'text/csv' });
      
      onFileSelect([file]);
    } catch (error) {
      console.error('Error loading test file:', error);
      alert(`Error loading test file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadTestFile = async (filename: string) => {
    try {
      const response = await fetch(`/test_data/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to download ${filename}`);
      }
      
      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading test file:', error);
      alert(`Error downloading test file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Test Data Files
        </h3>
        <span className="text-sm text-blue-600">
          {testDataFiles.length} sample files available
        </span>
      </div>
      
      <p className="text-sm text-blue-700 mb-4">
        Load sample healthcare data to test the system's analysis and validation capabilities.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {testDataFiles.map((file, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-blue-100 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {file.icon}
                <h4 className="font-medium text-gray-800 text-sm">{file.name}</h4>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mb-2">{file.description}</p>
            <p className="text-xs text-blue-600 font-medium mb-3">{file.category}</p>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleTestFileLoad(file.filename)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
              >
                <Upload className="w-3 h-3" />
                <span>Load & Analyze</span>
              </button>
              <button
                onClick={() => handleDownloadTestFile(file.filename)}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                title="Download file"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Quick Test:</strong> Click "Load & Analyze" on any file to see the system automatically detect file type, 
          assign to appropriate teams, perform AI validation, and generate visual insights.
        </p>
      </div>
    </div>
  );
};

export default TestDataLoader;