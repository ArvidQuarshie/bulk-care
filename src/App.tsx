import React, { useState } from 'react';
import { MessageCircle, FileSearch } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FileOverviewCard from './components/FileOverviewCard';
import FileAnalysisCard from './components/FileAnalysisCard';
import TestDataLoader from './components/TestDataLoader';
import ValidationResults from './components/ValidationResults';
import DataVisualization from './components/DataVisualization';
import ChatWindow from './components/ChatWindow';
import { parseFile } from './utils/fileParser';
import { validateEntries } from './utils/validator';
import { MedicalCode, ValidationResult, FileAnalysis } from './types';
import { exportToJson } from './services/exportService';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [fileAnalyses, setFileAnalyses] = useState<FileAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      
      const allResults: ValidationResult[] = [];
      const allAnalyses: FileAnalysis[] = [];
      
      for (const file of files) {
        const { data } = await parseFile(file);
        
        // Add file analysis if available
        if (data.analysis) {
          allAnalyses.push(data.analysis);
        }
        
        const validationResults = await validateEntries(data, data.fileType);
        allResults.push(...validationResults);
      }
      
      setResults(allResults);
      setFileAnalyses(allAnalyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setResults([]);
      setFileAnalyses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (results.length > 0) {
      exportToJson(results);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-green-50 text-gray-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileSearch className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">
                Bulk-Care
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex -mb-px">
            <button
              className="tab-button tab-button-active"
            >
              <FileSearch className="w-4 h-4 mr-2 inline-block" />
              File Inspector
            </button>
          </nav>
        </div>

        <section className="material-card p-8 mb-8">
          <div className="text-gray-600 mb-6 space-y-2">
            <p>
              Upload one or more files for intelligent inspection and validation. The system analyzes
              content, structure, and compliance across multiple healthcare data formats.
            </p>
            <p className="text-sm text-green-600 font-medium">
              Supported formats: Medical codes (CPT, ICD-10, DRG), Insurance policies, Claims data,
              Patient records, Provider information, and more
            </p>
          </div>
          
          <FileUploader 
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
          />
          
          <TestDataLoader onFileSelect={handleFileSelect} />
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border-l-4 border-red-500 animate-pulse">
              {error}
            </div>
          )}
        </section>

        {fileAnalyses.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">File Overview</h2>
            {fileAnalyses.map((analysis, index) => (
              <FileOverviewCard key={index} analysis={analysis} />
            ))}
          </section>
        )}

        {fileAnalyses.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Detailed Analysis</h2>
            {fileAnalyses.map((analysis, index) => (
              <FileAnalysisCard key={`detail-${index}`} analysis={analysis} />
            ))}
          </section>
        )}

        {showChat && (
          <ChatWindow 
            onClose={() => setShowChat(false)} 
            validationResults={results}
            fileAnalyses={fileAnalyses}
          />
        )}

        {results.length > 0 && (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Data Visualization & Insights</h2>
              <DataVisualization results={results} fileAnalyses={fileAnalyses} />
            </section>

          <ValidationResults
            results={results}
            rawText={results[0]?.originalData?.rawText}
            onExport={handleExport}
          />
          </>
        )}
      </main>

      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 pulse"
        aria-label="Chat with AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <footer className="bg-white shadow-inner mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            © 2025 Bulk-Care - Enterprise Data Validation Tool
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;