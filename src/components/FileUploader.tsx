import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  isLoading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc') ||
      file.name.endsWith('.pdf')
    );

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only CSV, Excel (.xls, .xlsx), Word (.doc, .docx), and PDF files are supported.');
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      onFileSelect(validFiles);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${
          dragActive 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".csv,.xlsx,.xls,.docx,.doc,.pdf"
          onChange={handleChange}
          disabled={isLoading}
        />
        
        <Upload className="w-12 h-12 mb-4 text-green-500" />
        
        {selectedFiles.length > 0 ? (
          <div className="text-center">
            <p className="mb-2 text-sm font-medium text-gray-900">Selected files:</p>
            <div className="max-h-24 overflow-y-auto mb-2">
              {selectedFiles.map((file, index) => (
                <p key={index} className="text-base font-medium text-green-600">
                  {file.name}
                </p>
              ))}
            </div>
            {!isLoading && (
              <button
                className="mt-3 text-sm text-green-600 hover:text-green-800 transition-colors"
                onClick={handleButtonClick}
              >
                Change files
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium text-gray-700">
              <span className="font-semibold">Click to upload</span> or drag and drop multiple files
            </p>
            <p className="text-xs text-gray-500">CSV, Excel, Word, or PDF files</p>
            <button
              type="button"
              className="material-button-primary mt-4"
              onClick={handleButtonClick}
              disabled={isLoading}
            >
              Select Files
            </button>
          </>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
              <p className="mt-2 text-sm font-medium text-gray-700">Processing files...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;