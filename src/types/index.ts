export interface MedicalCode {
  medical_code: string;
  description?: string;
  coding_system?: string;
  tag?: string;
  coverage?: string;
  [key: string]: any;
}

export interface PolicyData {
  policy_id: string;
  policy_name: string;
  payer_id: string;
  policy_type: string;
  start_date: string;
  end_date: string;
  currency: string;
  coverage_limit: number;
  status: string;
  description: string;
}

export interface DrugCode {
  drug_code: string;
  drug_name: string;
  coding_system: string;
  drug_type: string;
  strength: string;
  unit: string;
  package_size: string;
  uom: string;
  price: number;
  currency: string;
  branded_generic: string;
  chronic_indicator: string;
  atc_code: string;
  ucr_benchmark: number;
  valid_from: string;
  valid_to: string;
  remarks?: string;
}

export interface ValidationResult {
  code: string;
  status: 'valid' | 'warning' | 'invalid';
  coding_system: string | null;
  issues: string[];
  recommendations: string[];
  explanation: string;
  compliance_notes: string[];
  originalData: MedicalCode | DrugCode;
  duplicateOf?: string;
}

export type FileType = 'medical' | 'drug' | 'policy';

export interface ParsedFile {
  headers: string[];
  data: (MedicalCode | DrugCode)[];
  fileType: FileType;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  duplicateCount: number;
}