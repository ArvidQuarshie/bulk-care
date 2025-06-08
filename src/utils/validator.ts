import { MedicalCode, DrugCode, ValidationResult, FileType } from '../types';
import { validateBatchWithAI } from '../services/openaiService';
import { transformMedicalCode, transformDrugCode, transformPolicyData } from './transformer';

const findDuplicates = (entries: (MedicalCode | DrugCode)[], fileType: FileType): Map<string, string[]> => {
  const duplicates = new Map<string, string[]>();
  const seen = new Map<string, string>();

  entries.forEach((entry) => {
    if (!entry) return; // Skip undefined entries
    
    let key = '';
    switch (fileType) {
      case 'drug':
        key = (entry as DrugCode).drug_code || '';
        break;
      case 'policy':
        key = (entry as any).policy_id || '';
        break;
      default:
        key = (entry as MedicalCode).medical_code || '';
    }
    
    if (!key) return; // Skip entries without a key
    
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
  }).filter(Boolean); // Remove any null/undefined entries
  
  if (transformedEntries.length === 0) {
    return [];
  }

  // Process entries in batches to avoid overwhelming the API
  const BATCH_SIZE = 10; // Process 10 entries at a time
  const results: ValidationResult[] = [];
  
  for (let i = 0; i < transformedEntries.length; i += BATCH_SIZE) {
    const batch = transformedEntries.slice(i, i + BATCH_SIZE);
    
    try {
      const batchResults = await validateBatchWithAI(batch);
      
      // Apply duplicate detection to the batch results
      const enhancedResults = batchResults.map((result, batchIndex) => {
        const entry = batch[batchIndex];
        let code = '';
        switch (fileType) {
          case 'drug':
            code = (entry as DrugCode).drug_code || '';
            break;
          case 'policy':
            code = (entry as any).policy_id || '';
            break;
          default:
            code = (entry as MedicalCode).medical_code || '';
        }
        
        let duplicateOf: string | undefined;
        
        // Check if this entry is a duplicate
        for (const [original, duplicates] of duplicatesMap.entries()) {
          if (duplicates.includes(code)) {
            duplicateOf = original;
            break;
          }
        }
        
        return {
          ...result,
          duplicateOf,
          status: duplicateOf ? 'warning' as const : result.status
        };
      });
      
      results.push(...enhancedResults);
    } catch (error) {
      console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
      
      // Create error results for this batch
      const errorResults = batch.map(entry => {
        let code = '';
        switch (fileType) {
          case 'drug':
            code = (entry as DrugCode).drug_code || '';
            break;
          case 'policy':
            code = (entry as any).policy_id || '';
            break;
          default:
            code = (entry as MedicalCode).medical_code || '';
        }
        
        return {
          code,
          status: 'invalid' as const,
          coding_system: (entry as any).coding_system || null,
          issues: ['Batch validation failed'],
          recommendations: ['Please try again or check the code manually'],
          explanation: 'Validation failed due to a batch processing error.',
          compliance_notes: [],
          originalData: entry
        };
      });
      
      results.push(...errorResults);
    }
  }

  return results;
};