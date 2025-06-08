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

export interface ClinicianData {
  clinician_id: string;
  first_name: string;
  last_name: string;
  title: string;
  specialty: string;
  subspecialty?: string;
  license_number: string;
  npi: string;
  dea_number?: string;
  board_certification: string;
  medical_school: string;
  residency_program: string;
  fellowship?: string;
  years_experience: number;
  employment_status: string;
  department: string;
  image_url?: string;
}

export interface ValidationResult {
  code: string;
  status: 'valid' | 'warning' | 'invalid';
  coding_system: string | null;
  issues: string[];
  recommendations: string[];
  explanation: string;
  compliance_notes: string[];
  originalData: MedicalCode | DrugCode | ClinicianData;
  duplicateOf?: string;
}

export type FileType = 'medical' | 'drug' | 'policy' | 'clinician' | 'provider' | 'intermediary';

export interface DocumentValidationFlow {
  name: 'claims' | 'policy_member' | 'billing' | 'provider_details' | 'user_uploads' | 'medical_codes';
  description: string;
  requiredFields: string[];
}

export interface DocumentValidationResult {
  flow: string;
  summary: string;
  validations: {
    field: string;
    status: '✅ Valid' | '⚠️ Warning' | '❌ Invalid';
    reason?: string;
  }[];
  recommendations: string[];
}

export interface FileAnalysis {
  fileName: string;
  fileType: 'CSV' | 'XLSX' | 'PDF' | 'DOCX' | 'Unknown';
  fileSize: string;
  headers: string[];
  sampleData: Record<string, any>[];
  contentSummary: string;
  recommendedTeam: 'Claims' | 'Policy' | 'Medical Products' | 'Provider' | 'General';
  confidence: number;
  reasoning: string;
  suggestedWorkflows: string[];
  dataQuality: {
    completeness: number;
    consistency: number;
    issues: string[];
  };
  piiDetection: {
    hasPII: boolean;
    piiTypes: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
    detectedFields: string[];
    recommendations: string[];
  };
}

export interface ParsedFile {
  headers: string[];
  data: (MedicalCode | DrugCode | ClinicianData | Record<string, any>)[];
  fileType: FileType;
  rawText?: string;
  analysis?: FileAnalysis;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  duplicateCount: number;
}