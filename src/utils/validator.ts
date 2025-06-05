import { MedicalCode, DrugCode, ValidationResult, FileType } from '../types';
import { validateWithAI } from '../services/openaiService';
import { transformMedicalCode, transformDrugCode, transformPolicyData } from './transformer';

const findDuplicates = (entries: (MedicalCode | DrugCode)[], fileType: FileType): Map<string, string[]> => {
  const duplicates = new Map<string, string[]>();
  const seen = new Map<string, string>();

  entries.forEach((entry) => {
    let key: string;
    switch (fileType) {
      case 'drug':
        key = (entry as DrugCode).drug_code;
        break;
      case 'policy':
        key = (entry as any).policy_id;
        break;
      default:
        key = (entry as MedicalCode).medical_code;
    }
    
    if (seen.has(key)) {
      const originalId = seen.get(key)!;
      if (!duplicates.has(originalId)) {
        duplicates.set(originalId, [key]);
      } else {
        duplicates.get(originalId)!.push(key);
      }
    } else {
      seen.set(key, key);
    }
  });

  return duplicates;
};

export const validateEntries = async (entries: (MedicalCode | DrugCode)[], fileType: FileType): Promise<ValidationResult[]> => {
  const duplicatesMap = findDuplicates(entries, fileType);
  
  const transformedEntries = entries.map(entry => {
    if (fileType === 'drug') {
      return transformDrugCode(entry);
    } else if (fileType === 'policy') {
      return transformPolicyData(entry as any);
    } else {
      return transformMedicalCode(entry);
    }
  });
  
  const results = await Promise.all(transformedEntries.map(async (entry) => {
    let code: string;
    switch (fileType) {
      case 'drug':
        code = (entry as DrugCode).drug_code;
        break;
      case 'policy':
        code = (entry as any).policy_id;
        break;
      default:
        code = (entry as MedicalCode).medical_code;
    }
    const system = entry.coding_system || '';
    let duplicateOf: string | undefined;
    
    // Check if this entry is a duplicate
    for (const [original, duplicates] of duplicatesMap.entries()) {
      if (duplicates.includes(code)) {
        duplicateOf = original;
        break;
      }
    }
    
    const result = await validateWithAI(entry);
    return {
      ...result,
      duplicateOf,
      status: duplicateOf ? 'warning' : result.status
    };
  }));

  return results;
};