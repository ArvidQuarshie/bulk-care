import * as XLSX from 'xlsx';
import { MedicalCode, ParsedFile } from '../types';

/**
 * Normalize column headers to standardized format
 */
const normalizeHeader = (header: string): string => {
  const headerMap: Record<string, string> = {
    // Medical code mappings
    'medical code': 'medical_code',
    'code': 'medical_code',
    'description': 'description',
    'desc': 'description',
    'coding system': 'coding_system',
    'system': 'coding_system',
    'tag': 'tag',
    'category': 'tag',
    'coverage': 'coverage',
    'covered': 'coverage',
    
    // Policy mappings
    'policy id': 'policy_id',
    'policy name': 'policy_name',
    'payer id': 'payer_id',
    'policy type': 'policy_type',
    'start date': 'start_date',
    'end date': 'end_date',
    'coverage limit': 'coverage_limit',
    
    // Drug code mappings
    'drug code': 'drug_code',
    'drug name': 'drug_name',
    'drug type': 'drug_type',
    'package size': 'package_size',
    'uom': 'uom',
    'unit of measure': 'uom',
    'branded / generic': 'branded_generic',
    'chronic indicator': 'chronic_indicator',
    'atc code': 'atc_code',
    'ucr benchmark': 'ucr_benchmark',
    'valid from': 'valid_from',
    'valid to': 'valid_to'
  };

  const normalized = header.toLowerCase().trim();
  return headerMap[normalized] || normalized;
}

const isDrugList = (headers: string[]): boolean => {
  const drugSpecificFields = ['drug_code', 'drug_name', 'strength', 'atc_code'];
  return drugSpecificFields.some(field => headers.includes(field));
};

const isPolicyList = (headers: string[]): boolean => {
  const policySpecificFields = ['policy_id', 'payer_id', 'policy_type'];
  return policySpecificFields.some(field => headers.includes(field));
};

/**
 * Parse CSV text content
 */
const parseCSV = (content: string): ParsedFile => {
  const rows = content.split('\n');
  const headers = rows[0].split(',').map(h => normalizeHeader(h.trim()));
  
  const fileType = isDrugList(headers) ? 'drug' : isPolicyList(headers) ? 'policy' : 'medical';
  
  const data = rows.slice(1)
    .filter(row => row.trim())
    .map(row => {
      const values = row.split(',').map(v => v.trim());
      const entry: any = fileType === 'drug' 
        ? { drug_code: '' } 
        : fileType === 'policy'
        ? { policy_id: '' }
        : { medical_code: '' };
      
      headers.forEach((header, index) => {
        let value = values[index] || null;
        
        // Convert numeric fields
        if (['price', 'ucr_benchmark', 'coverage_limit'].includes(header) && value) {
          value = parseFloat(value);
        }
        
        entry[header] = value;
      });
      
      return entry;
    });
  
  return { headers, data };
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
  const headers = originalHeaders.map(h => normalizeHeader(h));
  const fileType = isDrugList(headers) ? 'drug' : isPolicyList(headers) ? 'policy' : 'medical';
  
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
      if (['price', 'ucr_benchmark', 'coverage_limit'].includes(normalizedHeader) && value) {
        value = parseFloat(value);
      }
      
      entry[normalizedHeader] = value;
    });
    
    return entry;
  });
  
  return { headers, data };
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