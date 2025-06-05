import { MedicalCode, DrugCode, PolicyData } from '../types';

interface TransformationRule {
  pattern: RegExp;
  tag: string;
  description: string;
}

const medicalCodeRules: TransformationRule[] = [
  {
    pattern: /^[A-Z]\d{2}(\.\d+)?$/,
    tag: 'ICD-10',
    description: 'International Classification of Diseases, 10th Revision'
  },
  {
    pattern: /^\d{5}$/,
    tag: 'CPT',
    description: 'Current Procedural Terminology'
  },
  {
    pattern: /^\d{3}$/,
    tag: 'DRG',
    description: 'Diagnosis Related Group'
  }
];

const drugCodeRules: TransformationRule[] = [
  {
    pattern: /^[A-Z]\d{2}[A-Z]{2}\d{2}$/,
    tag: 'ATC',
    description: 'Anatomical Therapeutic Chemical Classification'
  },
  {
    pattern: /^[A-Z]{2}\d{6}$/,
    tag: 'NDC',
    description: 'National Drug Code'
  }
];

export function transformMedicalCode(code: MedicalCode): MedicalCode {
  const transformedCode = { ...code };
  
  // Auto-detect coding system if not specified
  if (!transformedCode.coding_system) {
    for (const rule of medicalCodeRules) {
      if (rule.pattern.test(transformedCode.medical_code)) {
        transformedCode.coding_system = rule.tag;
        transformedCode.tag = transformedCode.tag || rule.description;
        break;
      }
    }
  }
  
  // Add coverage tags based on description keywords
  const description = transformedCode.description?.toLowerCase() || '';
  if (description.includes('emergency') || description.includes('urgent')) {
    transformedCode.coverage = 'Emergency';
  } else if (description.includes('preventive') || description.includes('screening')) {
    transformedCode.coverage = 'Preventive';
  } else if (description.includes('chronic') || description.includes('ongoing')) {
    transformedCode.coverage = 'Chronic Care';
  }
  
  return transformedCode;
}

export function transformDrugCode(code: DrugCode): DrugCode {
  const transformedCode = { ...code };
  
  // Auto-detect drug classification
  if (!transformedCode.atc_code) {
    for (const rule of drugCodeRules) {
      if (rule.pattern.test(transformedCode.drug_code)) {
        transformedCode.coding_system = rule.tag;
        break;
      }
    }
  }
  
  // Set chronic indicator based on drug name and type
  const drugName = transformedCode.drug_name.toLowerCase();
  if (
    drugName.includes('chronic') ||
    drugName.includes('maintenance') ||
    transformedCode.drug_type.toLowerCase().includes('chronic')
  ) {
    transformedCode.chronic_indicator = 'Y';
  }
  
  // Calculate UCR benchmark if not set
  if (!transformedCode.ucr_benchmark && transformedCode.price) {
    transformedCode.ucr_benchmark = transformedCode.price * 1.2; // 20% markup as benchmark
  }
  
  return transformedCode;
}

export function transformPolicyData(policy: PolicyData): PolicyData {
  const transformedPolicy = { ...policy };
  
  // Standardize policy type
  const policyType = transformedPolicy.policy_type.toLowerCase();
  if (policyType.includes('individual') || policyType === 'single') {
    transformedPolicy.policy_type = 'Individual';
  } else if (policyType.includes('family') || policyType.includes('group')) {
    transformedPolicy.policy_type = 'Family';
  } else if (policyType.includes('corporate') || policyType.includes('business')) {
    transformedPolicy.policy_type = 'Corporate';
  }
  
  // Standardize status
  const status = transformedPolicy.status.toLowerCase();
  if (status.includes('active') || status === 'current') {
    transformedPolicy.status = 'Active';
  } else if (status.includes('pending') || status === 'wait') {
    transformedPolicy.status = 'Pending';
  } else if (status.includes('expired') || status === 'terminated') {
    transformedPolicy.status = 'Expired';
  }
  
  return transformedPolicy;
}