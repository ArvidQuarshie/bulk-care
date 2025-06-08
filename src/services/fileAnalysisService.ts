import OpenAI from 'openai';
import { FileAnalysis } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface TeamTriageRules {
  team: string;
  keywords: string[];
  headers: string[];
  patterns: RegExp[];
}

const triageRules: TeamTriageRules[] = [
  {
    team: 'Claims',
    keywords: ['claim', 'billing', 'invoice', 'payment', 'reimbursement', 'copay', 'deductible', 'procedure', 'diagnosis'],
    headers: ['claim_id', 'member_id', 'billed_amount', 'diagnosis_code', 'procedure_code', 'service_date', 'provider_id'],
    patterns: [/claim/i, /bill/i, /invoice/i, /icd/i, /cpt/i, /drg/i]
  },
  {
    team: 'Policy',
    keywords: ['policy', 'member', 'enrollment', 'coverage', 'benefit', 'premium', 'plan', 'subscriber'],
    headers: ['policy_id', 'member_id', 'policy_number', 'enrollment_status', 'plan_type', 'coverage_limit', 'premium'],
    patterns: [/policy/i, /member/i, /enrollment/i, /coverage/i, /benefit/i, /plan/i]
  },
  {
    team: 'Medical Products',
    keywords: ['drug', 'medication', 'pharmaceutical', 'prescription', 'dosage', 'strength', 'formulary', 'ndc'],
    headers: ['drug_code', 'drug_name', 'ndc', 'strength', 'dosage', 'atc_code', 'formulary', 'price'],
    patterns: [/drug/i, /medication/i, /pharma/i, /prescription/i, /ndc/i, /atc/i]
  },
  {
    team: 'Provider',
    keywords: ['provider', 'doctor', 'physician', 'hospital', 'clinic', 'facility', 'license', 'specialty'],
    headers: ['provider_id', 'provider_name', 'npi', 'license_number', 'specialty', 'facility', 'address'],
    patterns: [/provider/i, /doctor/i, /physician/i, /hospital/i, /clinic/i, /npi/i, /license/i]
  }
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function detectFileType(fileName: string): FileAnalysis['fileType'] {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'csv': return 'CSV';
    case 'xlsx':
    case 'xls': return 'XLSX';
    case 'pdf': return 'PDF';
    case 'docx':
    case 'doc': return 'DOCX';
    default: return 'Unknown';
  }
}

function calculateTeamScore(content: string, headers: string[], rule: TeamTriageRules): number {
  let score = 0;
  const contentLower = content.toLowerCase();
  const headersLower = headers.map(h => h.toLowerCase());

  // Check keywords in content
  rule.keywords.forEach(keyword => {
    if (contentLower.includes(keyword)) {
      score += 2;
    }
  });

  // Check header matches
  rule.headers.forEach(expectedHeader => {
    if (headersLower.some(h => h.includes(expectedHeader.toLowerCase()))) {
      score += 5;
    }
  });

  // Check patterns
  rule.patterns.forEach(pattern => {
    if (pattern.test(contentLower)) {
      score += 3;
    }
  });

  return score;
}

function recommendTeam(content: string, headers: string[]): { team: string; confidence: number; reasoning: string } {
  const scores = triageRules.map(rule => ({
    team: rule.team,
    score: calculateTeamScore(content, headers, rule)
  }));

  scores.sort((a, b) => b.score - a.score);
  
  const topTeam = scores[0];
  const maxPossibleScore = 50; // Rough estimate based on scoring system
  const confidence = Math.min((topTeam.score / maxPossibleScore) * 100, 95);

  let reasoning = `Recommended ${topTeam.team} team based on `;
  const reasons = [];

  if (headers.length > 0) {
    const matchingHeaders = triageRules
      .find(r => r.team === topTeam.team)?.headers
      .filter(h => headers.some(header => header.toLowerCase().includes(h.toLowerCase())));
    
    if (matchingHeaders && matchingHeaders.length > 0) {
      reasons.push(`matching headers (${matchingHeaders.slice(0, 3).join(', ')})`);
    }
  }

  const matchingKeywords = triageRules
    .find(r => r.team === topTeam.team)?.keywords
    .filter(k => content.toLowerCase().includes(k));
  
  if (matchingKeywords && matchingKeywords.length > 0) {
    reasons.push(`content keywords (${matchingKeywords.slice(0, 3).join(', ')})`);
  }

  reasoning += reasons.join(' and ');

  return {
    team: topTeam.team,
    confidence,
    reasoning: reasoning || `${topTeam.team} team appears most suitable for this content type`
  };
}

function assessDataQuality(data: Record<string, any>[], headers: string[]): FileAnalysis['dataQuality'] {
  if (data.length === 0) {
    return {
      completeness: 0,
      consistency: 0,
      issues: ['No data found in file']
    };
  }

  const issues: string[] = [];
  let totalFields = 0;
  let filledFields = 0;
  let consistentFields = 0;

  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
    const filledCount = values.length;
    const uniqueTypes = new Set(values.map(v => typeof v));

    totalFields += data.length;
    filledFields += filledCount;

    if (uniqueTypes.size <= 1) {
      consistentFields += data.length;
    } else {
      issues.push(`Inconsistent data types in column: ${header}`);
    }

    if (filledCount < data.length * 0.8) {
      issues.push(`High missing data rate in column: ${header} (${Math.round((1 - filledCount/data.length) * 100)}% missing)`);
    }
  });

  const completeness = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  const consistency = totalFields > 0 ? (consistentFields / totalFields) * 100 : 0;

  return {
    completeness: Math.round(completeness),
    consistency: Math.round(consistency),
    issues
  };
}

export async function analyzeFile(
  file: File,
  headers: string[],
  sampleData: Record<string, any>[],
  rawText?: string
): Promise<FileAnalysis> {
  const fileType = detectFileType(file.name);
  const content = rawText || JSON.stringify(sampleData);
  
  // Basic analysis
  const teamRecommendation = recommendTeam(content, headers);
  const dataQuality = assessDataQuality(sampleData, headers);

  // AI-powered content analysis
  let contentSummary = '';
  let suggestedWorkflows: string[] = [];

  try {
    const prompt = `
      Analyze this healthcare data file and provide insights:
      
      File: ${file.name}
      Type: ${fileType}
      Headers: ${headers.join(', ')}
      Sample data: ${JSON.stringify(sampleData.slice(0, 3), null, 2)}
      
      Provide:
      1. A brief summary of the file contents (2-3 sentences)
      2. Suggested validation workflows from: Claims, Policy & Member, Billing, Provider Details, User Uploads, Medical Codes
      
      Return JSON format:
      {
        "summary": "Brief description of file contents",
        "workflows": ["workflow1", "workflow2"]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a healthcare data analysis expert. Analyze file contents and suggest appropriate validation workflows."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    contentSummary = aiResponse.summary || 'Healthcare data file requiring validation';
    suggestedWorkflows = aiResponse.workflows || [];
  } catch (error) {
    console.error('AI analysis error:', error);
    contentSummary = `${fileType} file containing ${headers.length} columns and ${sampleData.length} rows of healthcare data`;
    suggestedWorkflows = [teamRecommendation.team.replace(' ', '_').toLowerCase()];
  }

  return {
    fileName: file.name,
    fileType,
    fileSize: formatFileSize(file.size),
    headers,
    sampleData: sampleData.slice(0, 5), // First 5 rows for preview
    contentSummary,
    recommendedTeam: teamRecommendation.team as FileAnalysis['recommendedTeam'],
    confidence: teamRecommendation.confidence,
    reasoning: teamRecommendation.reasoning,
    suggestedWorkflows,
    dataQuality
  };
}