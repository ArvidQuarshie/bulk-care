import { FileAnalysis } from '../types';

interface PIIPattern {
  type: string;
  patterns: RegExp[];
  riskLevel: 'Low' | 'Medium' | 'High';
  description: string;
}

const piiPatterns: PIIPattern[] = [
  {
    type: 'Social Security Number',
    patterns: [
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /\b\d{9}\b/g,
      /\bSSN\b/gi,
      /social.?security/gi
    ],
    riskLevel: 'High',
    description: 'Social Security Numbers detected'
  },
  {
    type: 'Phone Number',
    patterns: [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      /\(\d{3}\)\s?\d{3}[-.]?\d{4}/g,
      /phone/gi,
      /mobile/gi,
      /contact.?number/gi
    ],
    riskLevel: 'Medium',
    description: 'Phone numbers detected'
  },
  {
    type: 'Email Address',
    patterns: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /email/gi,
      /e.?mail/gi
    ],
    riskLevel: 'Medium',
    description: 'Email addresses detected'
  },
  {
    type: 'Date of Birth',
    patterns: [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /birth.?date/gi,
      /dob/gi,
      /date.?of.?birth/gi
    ],
    riskLevel: 'High',
    description: 'Date of birth information detected'
  },
  {
    type: 'Medical Record Number',
    patterns: [
      /mrn/gi,
      /medical.?record/gi,
      /patient.?id/gi,
      /chart.?number/gi
    ],
    riskLevel: 'High',
    description: 'Medical record numbers detected'
  },
  {
    type: 'Insurance ID',
    patterns: [
      /insurance.?id/gi,
      /policy.?number/gi,
      /member.?id/gi,
      /subscriber.?id/gi,
      /group.?number/gi
    ],
    riskLevel: 'Medium',
    description: 'Insurance identification numbers detected'
  },
  {
    type: 'Credit Card',
    patterns: [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      /credit.?card/gi,
      /card.?number/gi
    ],
    riskLevel: 'High',
    description: 'Credit card numbers detected'
  },
  {
    type: 'Driver License',
    patterns: [
      /driver.?license/gi,
      /dl.?number/gi,
      /license.?number/gi
    ],
    riskLevel: 'Medium',
    description: 'Driver license information detected'
  },
  {
    type: 'Address',
    patterns: [
      /address/gi,
      /street/gi,
      /\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/gi,
      /zip.?code/gi,
      /postal.?code/gi
    ],
    riskLevel: 'Medium',
    description: 'Address information detected'
  },
  {
    type: 'Full Name',
    patterns: [
      /first.?name/gi,
      /last.?name/gi,
      /full.?name/gi,
      /patient.?name/gi,
      /subscriber.?name/gi
    ],
    riskLevel: 'Medium',
    description: 'Personal names detected'
  }
];

export function detectPII(
  headers: string[],
  sampleData: Record<string, any>[],
  rawText?: string
): FileAnalysis['piiDetection'] {
  const detectedPII: Set<string> = new Set();
  const detectedFields: Set<string> = new Set();
  const recommendations: Set<string> = new Set();
  let highestRiskLevel: 'Low' | 'Medium' | 'High' = 'Low';

  // Combine all text content for analysis
  const allContent = [
    ...headers,
    ...(rawText ? [rawText] : []),
    ...sampleData.flatMap(row => Object.values(row).map(v => String(v || '')))
  ].join(' ').toLowerCase();

  // Check headers for PII indicators
  headers.forEach(header => {
    const headerLower = header.toLowerCase();
    
    piiPatterns.forEach(pattern => {
      const isMatch = pattern.patterns.some(regex => {
        // Reset regex lastIndex to ensure proper matching
        regex.lastIndex = 0;
        return regex.test(headerLower);
      });
      
      if (isMatch) {
        detectedPII.add(pattern.type);
        detectedFields.add(header);
        
        // Update risk level
        if (pattern.riskLevel === 'High' || 
           (pattern.riskLevel === 'Medium' && highestRiskLevel === 'Low')) {
          highestRiskLevel = pattern.riskLevel;
        }
        
        // Add recommendations based on PII type
        if (pattern.riskLevel === 'High') {
          recommendations.add('Implement data encryption for sensitive fields');
          recommendations.add('Restrict access to authorized personnel only');
          recommendations.add('Consider data masking for non-production environments');
        } else if (pattern.riskLevel === 'Medium') {
          recommendations.add('Apply appropriate access controls');
          recommendations.add('Monitor data access and usage');
        }
      }
    });
  });

  // Check sample data content for PII patterns
  piiPatterns.forEach(pattern => {
    pattern.patterns.forEach(regex => {
      // Reset regex lastIndex
      regex.lastIndex = 0;
      if (regex.test(allContent)) {
        detectedPII.add(pattern.type);
        
        if (pattern.riskLevel === 'High' || 
           (pattern.riskLevel === 'Medium' && highestRiskLevel === 'Low')) {
          highestRiskLevel = pattern.riskLevel;
        }
      }
    });
  });

  // Add general recommendations
  if (detectedPII.size > 0) {
    recommendations.add('Ensure HIPAA compliance for healthcare data');
    recommendations.add('Implement audit logging for data access');
    recommendations.add('Regular security assessments recommended');
  }

  // If no PII detected but healthcare context, still provide recommendations
  if (detectedPII.size === 0 && (
    allContent.includes('medical') || 
    allContent.includes('patient') || 
    allContent.includes('health')
  )) {
    recommendations.add('Verify no PII exists in actual data');
    recommendations.add('Maintain data security best practices');
  }

  return {
    hasPII: detectedPII.size > 0,
    piiTypes: Array.from(detectedPII),
    riskLevel: detectedPII.size > 0 ? highestRiskLevel : 'Low',
    detectedFields: Array.from(detectedFields),
    recommendations: Array.from(recommendations)
  };
}