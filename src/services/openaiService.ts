import OpenAI from 'openai';
import { MedicalCode, ValidationResult } from '../types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<RetryResult<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry non-rate-limit API errors
      if (error instanceof OpenAI.APIError && error.status !== 429) {
        return { success: false, error: lastError };
      }
      
      // For connection errors and rate limits, continue retrying
      if (attempt < maxRetries - 1) {
        await sleep(initialDelay * Math.pow(2, attempt));
      }
    }
  }
  
  return { success: false, error: lastError };
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function validateWithAI(entry: MedicalCode | DrugCode | PolicyData): Promise<ValidationResult> {
  // This function is kept for backward compatibility but now calls batch validation
  const results = await validateBatchWithAI([entry]);
  return results[0];
}

export async function validateBatchWithAI(entries: (MedicalCode | DrugCode | PolicyData)[]): Promise<ValidationResult[]> {
  if (entries.length === 0) return [];

  // Determine the type of entries
  const firstEntry = entries[0];
  const isDrug = 'drug_code' in firstEntry;
  const isPolicy = 'policy_id' in firstEntry;

  const entriesData = entries.map((entry, index) => ({
    index,
    data: entry
  }));

  const prompt = `
    Analyze these ${entries.length} ${isDrug ? 'drug' : isPolicy ? 'policy' : 'medical code'} entries and provide validation results for each:
    
    ${entriesData.map(({ index, data }) => `
    Entry ${index}:
    ${JSON.stringify(data, null, 2)}
    `).join('\n')}
    
    For each entry, consider:
    ${isDrug ? `
    1. Is the drug code format valid?
    2. Are strength and unit specifications correct?
    3. Is pricing reasonable compared to UCR benchmark?
    4. Check for valid ATC code format
    5. Verify date formats and ranges
    6. Look for duplicate entries
    ` : isPolicy ? `
    1. Verify policy ID format and uniqueness
    2. Check date ranges for validity
    3. Validate coverage limits and currency
    4. Verify policy type matches standards
    5. Check status values are valid
    6. Look for duplicate payer/policy combinations
    ` : `
    1. Is the coding system standard and correctly formatted?
    2. Are required fields missing?
    3. Are there any potential billing or compliance issues?
    4. What recommendations would improve this entry?
    `}
    
    Return only a JSON object with a "results" array containing validation results for each entry in order:
    {
      "results": [
        {
          "index": 0,
          "status": "valid" | "warning" | "invalid",
          "issues": string[],
          "recommendations": string[],
          "explanation": string,
          "compliance_notes": string[],
          "duplicateOf": string | null
        },
        // ... more results for each entry
      ]
    }
  `;

  const result = await retryWithBackoff(() => openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: isDrug 
          ? "You are a pharmaceutical coding and pricing expert. Analyze drug codes, validate specifications, and check for pricing compliance."
          : isPolicy
          ? "You are an insurance policy expert. Analyze policy data for validity, coverage limits, and compliance with standards."
          : "You are a medical coding expert assistant. Analyze medical codes and provide validation results with helpful explanations."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  }));

  if (!result.success) {
    const error = result.error!;
    console.error('OpenAI API error:', error);

    // Return error results for all entries
    return entries.map((entry) => {
      const code = isDrug ? (entry as any).drug_code : isPolicy ? (entry as any).policy_id : (entry as any).medical_code || '';
      
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          return {
            code,
            status: 'invalid' as const,
            coding_system: (entry as any).coding_system || null,
            issues: ['OpenAI rate limit reached'],
            recommendations: ['Please wait a few moments before trying again'],
            explanation: 'OpenAI rate limit reached. Please wait a few moments before trying again.',
            compliance_notes: [],
            originalData: entry
          };
        } else if (error.status === 401) {
          return {
            code,
            status: 'invalid' as const,
            coding_system: (entry as any).coding_system || null,
            issues: ['OpenAI API authentication failed'],
            recommendations: ['Please check your API key configuration'],
            explanation: 'OpenAI API authentication failed. Please check your API key configuration.',
            compliance_notes: [],
            originalData: entry
          };
        } else {
          return {
            code,
            status: 'invalid' as const,
            coding_system: (entry as any).coding_system || null,
            issues: [`OpenAI API error: ${error.message}`],
            recommendations: ['Please try again or check the code manually'],
            explanation: `OpenAI API error: ${error.message}`,
            compliance_notes: [],
            originalData: entry
          };
        }
      } else if (error instanceof OpenAI.APIConnectionError) {
        return {
          code,
          status: 'invalid' as const,
          coding_system: (entry as any).coding_system || null,
          issues: ['Unable to connect to OpenAI API'],
          recommendations: ['Please check your internet connection and try again'],
          explanation: 'Unable to connect to OpenAI API. Please check your internet connection.',
          compliance_notes: [],
          originalData: entry
        };
      } else if (error instanceof OpenAI.APITimeoutError) {
        return {
          code,
          status: 'invalid' as const,
          coding_system: (entry as any).coding_system || null,
          issues: ['OpenAI API request timed out'],
          recommendations: ['Please try again'],
          explanation: 'OpenAI API request timed out. Please try again.',
          compliance_notes: [],
          originalData: entry
        };
      }

      // For any other unexpected errors
      return {
        code,
        status: 'invalid' as const,
        coding_system: (entry as any).coding_system || null,
        issues: ['Validation failed due to an unexpected error'],
        recommendations: ['Try validating again or check the code manually'],
        explanation: error.message || 'An unexpected error occurred',
        compliance_notes: [],
        originalData: entry
      };
    });
  }

  try {
    const aiResponse = JSON.parse(result.data!.choices[0].message.content);
    
    if (!aiResponse.results || !Array.isArray(aiResponse.results)) {
      throw new Error('Invalid response format: missing results array');
    }

    return entries.map((entry, index) => {
      const code = isDrug ? (entry as any).drug_code : isPolicy ? (entry as any).policy_id : (entry as any).medical_code || '';
      const aiResult = aiResponse.results.find((r: any) => r.index === index) || aiResponse.results[index];
      
      if (!aiResult) {
        return {
          code,
          status: 'invalid' as const,
          coding_system: (entry as any).coding_system || null,
          issues: ['No validation result returned for this entry'],
          recommendations: ['Please try again or check the code manually'],
          explanation: 'No validation result was returned for this entry.',
          compliance_notes: [],
          originalData: entry
        };
      }

      return {
        code,
        status: aiResult.status,
        coding_system: (entry as any).coding_system || null,
        issues: aiResult.issues || [],
        recommendations: aiResult.recommendations || [],
        explanation: aiResult.explanation || '',
        compliance_notes: aiResult.compliance_notes || [],
        duplicateOf: aiResult.duplicateOf || undefined,
        originalData: entry
      };
    });
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError);
    return entries.map((entry) => {
      const code = isDrug ? (entry as any).drug_code : isPolicy ? (entry as any).policy_id : (entry as any).medical_code || '';
      return {
        code,
        status: 'invalid' as const,
        coding_system: (entry as any).coding_system || null,
        issues: ['Failed to parse AI validation response'],
        recommendations: ['Please try again or check the code manually'],
        explanation: 'The AI validation service returned an invalid response format.',
        compliance_notes: [],
        originalData: entry
      };
    });
  }
}