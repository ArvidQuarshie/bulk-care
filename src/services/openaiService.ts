import OpenAI from 'openai';
import { MedicalCode, ValidationResult } from '../types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof OpenAI.APIError && error.status !== 429) {
        throw error; // Don't retry non-rate-limit errors
      }
      
      await sleep(initialDelay * Math.pow(2, attempt));
    }
  }
  
  throw lastError;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function validateWithAI(entry: MedicalCode | DrugCode | PolicyData): Promise<ValidationResult> {
  try {
    const isDrug = 'drug_code' in entry;
    const isPolicy = 'policy_id' in entry;
    
    const prompt = `
      Analyze this ${isDrug ? 'drug' : isPolicy ? 'policy' : 'medical code'} entry and provide validation results:
      ${JSON.stringify(entry, null, 2)}
      
      Consider:
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
      Provide a helpful explanation in natural language.
      
      Return only a JSON object with these fields:
      {
        "status": "valid" | "warning" | "invalid",
        "issues": string[],
        "recommendations": string[],
        "explanation": string,
        "compliance_notes": string[],
        "duplicateOf": string | null
      }
    `;

    const completion = await retryWithBackoff(() => openai.chat.completions.create({
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

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    return {
      code: isDrug ? entry.drug_code : isPolicy ? entry.policy_id : entry.medical_code || '',
      status: aiResponse.status,
      coding_system: entry.coding_system || null,
      issues: aiResponse.issues,
      recommendations: aiResponse.recommendations,
      explanation: aiResponse.explanation || '',
      compliance_notes: aiResponse.compliance_notes || [],
      duplicateOf: aiResponse.duplicateOf || undefined,
      originalData: entry
    };
  } catch (error) {
    console.error('OpenAI validation error:', error);

    let errorMessage = 'An unexpected error occurred during validation.';
    let issues = ['AI validation failed'];
    
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        errorMessage = 'Rate limit reached. Please try again in a few moments.';
        issues = ['Rate limit exceeded - please wait before trying again'];
      } else if (error.status === 401) {
        errorMessage = 'API authentication failed. Please check your API key configuration.';
        issues = ['API authentication error'];
      } else {
        errorMessage = `OpenAI API error: ${error.message}`;
        issues = [`API error: ${error.message}`];
      }
    } else if (error instanceof OpenAI.APIConnectionError) {
      errorMessage = 'Unable to connect to OpenAI. Please check your internet connection.';
      issues = ['Connection error - please check your internet connection'];
    } else if (error instanceof OpenAI.APITimeoutError) {
      errorMessage = 'The request to OpenAI timed out. Please try again.';
      issues = ['Request timeout - please try again'];
    }

    // Fix the code property assignment in the error case
    const code = isDrug ? entry.drug_code : isPolicy ? entry.policy_id : entry.medical_code || '';

    return {
      code,
      status: 'invalid',
      coding_system: entry.coding_system || null,
      issues,
      recommendations: ['Try validating again or check the code manually'],
      explanation: errorMessage,
      originalData: entry
    };
  }
}