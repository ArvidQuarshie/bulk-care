import { ValidationResult } from '../types';

/**
 * Export validation results to JSON
 */
export const exportToJson = (results: ValidationResult[]): void => {
  const dataStr = JSON.stringify(results, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  
  const exportFileName = `validation-results-${new Date().toISOString().slice(0, 10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileName);
  linkElement.click();
};

/**
 * Export validation results to CSV
 */
export const exportToCsv = (results: ValidationResult[]): void => {
  // Create headers
  const headers = [
    'Code',
    'Status',
    'Coding System',
    'Issues',
    'Recommendations'
  ];
  
  // Create rows
  const rows = results.map(result => [
    result.code,
    result.status,
    result.coding_system || 'N/A',
    result.issues.join('; '),
    result.recommendations.join('; ')
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  const exportFileName = `validation-results-${new Date().toISOString().slice(0, 10)}.csv`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileName);
  linkElement.click();
};