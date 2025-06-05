import { MedicalCode, DrugCode, ValidationResult } from '../types';
import { validateWithAI } from '../services/openaiService';
import { transformMedicalCode, transformDrugCode, transformPolicyData } from './transformer';

const findDuplicates = (entries: (MedicalCode | DrugCode)[]): Map<string, string[]> => {
  const duplicates = new Map<string, string[]>();
  const seen = new Map<string, string>();

  entries.forEach((entry) => {
    const key = 'drug_code' in entry ? entry.drug_code : entry.medical_code;
    
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

export const validateEntries = async (entries: (MedicalCode | DrugCode)[]): Promise<ValidationResult[]> => {
  const duplicatesMap = findDuplicates(entries);
  
  const transformedEntries = entries.map(entry => {
    if ('drug_code' in entry) {
      return transformDrugCode(entry);
    } else if ('policy_id' in entry) {
      return transformPolicyData(entry as any);
    } else {
      return transformMedicalCode(entry);
    }
  });
  
  const results = await Promise.all(transformedEntries.map(async (entry) => {
    const code = 'drug_code' in entry ? entry.drug_code : entry.medical_code;
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