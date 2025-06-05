import * as XLSX from 'xlsx';
import { MedicalCode, ParsedFile, FileType } from '../types';

interface ColumnPattern {
  name: string;
  patterns: RegExp[];
  required?: boolean;
}

const filePatterns: Record<FileType, ColumnPattern[]> = {
  medical: [
    { name: 'medical_code', patterns: [/code/i, /medical.*code/i], required: true },
    { name: 'description', patterns: [/desc/i, /description/i] },
    { name: 'coding_system', patterns: [/system/i, /coding.*system/i] }
  ],
  drug: [
    { name: 'drug_code', patterns: [/drug.*code/i], required: true },
    { name: 'drug_name', patterns: [/drug.*name/i], required: true },
    { name: 'strength', patterns: [/strength/i] },
    { name: 'atc_code', patterns: [/atc/i] }
  ],
  policy: [
    { name: 'policy_id', patterns: [/policy.*id/i], required: true },
    { name: 'policy_name', patterns: [/policy.*name/i], required: true },
    { name: 'payer_id', patterns: [/payer.*id/i] },
    { name: 'coverage_limit', patterns: [/coverage.*limit/i, /limit/i] }
  ],
  clinician: [
    { name: 'clinician_id', patterns: [/clinician.*id/i, /doctor.*id/i], required: true },
    { name: 'name', patterns: [/name/i, /doctor.*name/i], required: true },
    { name: 'specialization', patterns: [/special/i, /expertise/i] },
    { name: 'license_number', patterns: [/license/i, /registration/i] }
  ],
  provider: [
    { name: 'provider_id', patterns: [/provider.*id/i, /facility.*id/i], required: true },
    { name: 'provider_name', patterns: [/provider.*name/i, /facility.*name/i], required: true },
    { name: 'provider_type', patterns: [/type/i, /category/i] },
    { name: 'location', patterns: [/location/i, /address/i] }
  ],
  intermediary: [
    { name: 'intermediary_id', patterns: [/intermediary.*id/i, /broker.*id/i], required: true },
    { name: 'intermediary_name', patterns: [/intermediary.*name/i, /broker.*name/i], required: true },
    { name: 'commission_rate', patterns: [/commission/i, /rate/i] },
    { name: 'license_number', patterns: [/license/i, /registration/i] }
  ]
};

/**
 * Normalize column headers to standardized format
 */
const normalizeHeader = (header: string, fileType: FileType): string => {
  const patterns = filePatterns[fileType];
  const normalizedHeader = header.toLowerCase().trim();

  for (const pattern of patterns) {
    if (pattern.patterns.some(p => p.test(normalizedHeader))) {
      return pattern.name;
    }
  }

  return normalizedHeader;
};

/**
 * Detect file type based on headers
 */
const detectFileType = (headers: string[]): FileType => {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));
  
  for (const [type, patterns] of Object.entries(filePatterns)) {
    // Count matching required patterns
    const requiredPatterns = patterns.filter(p => p.required);
    const matchCount = requiredPatterns.filter(pattern => 
      pattern.patterns.some(p => 
        Array.from(headerSet).some(h => p.test(h))
      )
    ).length;
    
    // If all required patterns match, return this type
    if (matchCount === requiredPatterns.length) {
      return type as FileType;
    }
  }
  
  // Default to medical if no specific type is detected
  return 'medical';
};

/**
 * Parse CSV text content
 */
const parseCSV = (content: string): ParsedFile => {
  const rows = content.split('\n');
  const rawHeaders = rows[0].split(',').map(h => h.trim());
  const fileType = detectFileType(rawHeaders);
  const headers = rawHeaders.map(h => normalizeHeader(h, fileType));
  
  // Log file type detection
  console.log(`Detected file type: ${fileType.charAt(0).toUpperCase() + fileType.slice(1)}`);
  
  const data = rows.slice(1)
    .filter(row => row.trim())
    .map(row => {
      const values = row.split(',').map(v => v.trim());
      const entry: any = {};
      
      // Initialize ID field based on file type
      switch (fileType) {
        case 'drug':
          entry.drug_code = '';
          break;
        case 'policy':
          entry.policy_id = '';
          break;
        case 'clinician':
          entry.clinician_id = '';
          break;
        case 'provider':
          entry.provider_id = '';
          break;
        case 'intermediary':
          entry.intermediary_id = '';
          break;
        default:
          entry.medical_code = '';
      }
      
      headers.forEach((header, index) => {
        let value = values[index]?.trim() || null;
        
        // Convert numeric fields
        if (value && ['price', 'ucr_benchmark', 'coverage_limit', 'strength'].includes(header)) {
          value = parseFloat(value);
        } else if (value && ['start_date', 'end_date', 'valid_from', 'valid_to'].includes(header)) {
          value = new Date(value).toISOString();
        }
        
        entry[header] = value;
      });
      
      return entry;
    });
  
  return { headers, data, fileType };
};

/**
 * Parse XLSX file content
 */
const parseXLSX = (buffer: ArrayBuffer): ParsedFile => {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
  const originalHeaders = Object.keys(rawData[0] || {});
  const fileType = detectFileType(originalHeaders);
  const headers = originalHeaders.map(h => normalizeHeader(h, fileType));
  
  const data = rawData.map(row => {
    const entry: any = fileType === 'drug' 
      ? { drug_code: '' } 
      : fileType === 'policy'
      ? { policy_id: '' }
      : { medical_code: '' };
    
    originalHeaders.forEach((header, index) => {
      const normalizedHeader = headers[index];
      let value = row[header] || null;
      
      // Convert numeric fields
      if (value && ['price', 'ucr_benchmark', 'coverage_limit', 'strength'].includes(normalizedHeader)) {
        value = parseFloat(value);
      } else if (value && ['start_date', 'end_date', 'valid_from', 'valid_to'].includes(normalizedHeader)) {
        value = new Date(value).toISOString();
      }
      
      entry[normalizedHeader] = value;
    });
    
    return entry;
  });
  
  return { headers, data, fileType };
};

/**
 * Parse uploaded file (CSV or XLSX)
 */
export const parseFile = (file: File): Promise<ParsedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('Failed to read file');
        }
        
        if (file.name.endsWith('.csv')) {
          const content = event.target.result as string;
          resolve(parseCSV(content));
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const buffer = event.target.result as ArrayBuffer;
          resolve(parseXLSX(buffer));
        } else {
          reject(new Error('Unsupported file format. Please upload CSV or XLSX files.'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};