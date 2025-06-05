import { DocumentValidationFlow, DocumentValidationResult } from '../types';
import OpenAI from 'openai';

const validationFlows: Record<string, DocumentValidationFlow> = {
  claims: {
    name: 'claims',
    description: 'Validate claims data including IDs, amounts, and codes',
    requiredFields: ['claim_id', 'member_id', 'billed_amount', 'diagnosis_code']
  },
  policy_member: {
    name: 'policy_member',
    description: 'Validate member and policy information',
    requiredFields: ['member_id', 'policy_number', 'enrollment_status', 'plan_type']
  },
  billing: {
    name: 'billing',
    description: 'Validate billing information and payment terms',
    requiredFields: ['invoice_number', 'services', 'total_cost', 'payment_terms']
  },
  provider_details: {
    name: 'provider_details',
    description: 'Validate provider credentials and facility information',
    requiredFields: ['provider_name', 'license_number', 'specialties', 'facility_info']
  },
  user_uploads: {
    name: 'user_uploads',
    description: 'Validate user-uploaded documents against member records',
    requiredFields: ['document_type', 'member_id', 'document_date']
  },
  medical_codes: {
    name: 'medical_codes',
    description: 'Validate medical coding accuracy and compliance',
    requiredFields: ['code', 'code_type', 'description']
  }
};

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function validateDocument(
  text: string,
  selectedFlows: string[]
): Promise<DocumentValidationResult[]> {
  const results: DocumentValidationResult[] = [];

  for (const flowName of selectedFlows) {
    const flow = validationFlows[flowName];
    if (!flow) continue;

    try {
      const prompt = `
        Analyze this healthcare document text for ${flow.name} validation:
        ${text}

        Required fields: ${flow.requiredFields.join(', ')}

        Validate for:
        1. Required fields presence and format
        2. Data accuracy and consistency
        3. Compliance with healthcare standards
        4. Cross-references with other fields
        5. Common errors or issues

        Return a JSON object with:
        {
          "flow": "${flow.name}",
          "summary": "Brief summary of findings",
          "validations": [
            {
              "field": "Field name",
              "status": "✅ Valid" | "⚠️ Warning" | "❌ Invalid",
              "reason": "Optional explanation"
            }
          ],
          "recommendations": ["List of recommendations"]
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a healthcare document validation expert. Analyze documents for accuracy, completeness, and compliance."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const result = JSON.parse(completion.choices[0].message.content);
      results.push(result);
    } catch (error) {
      console.error(`Error validating ${flow.name}:`, error);
      results.push({
        flow: flow.name,
        summary: "Validation failed",
        validations: [{
          field: "Process",
          status: "❌ Invalid",
          reason: error instanceof Error ? error.message : "Unknown error"
        }],
        recommendations: ["Try validating again"]
      });
    }
  }

  return results;
}

export function getAvailableFlows(): DocumentValidationFlow[] {
  return Object.values(validationFlows);
}