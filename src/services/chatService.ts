import OpenAI from 'openai';
import { ValidationResult, FileAnalysis } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  context?: {
    type: 'validation_results' | 'file_analysis';
    data: ValidationResult[];
  };
}

export async function sendMessage(
  message: string,
  history: ChatMessage[],
  validationResults?: ValidationResult[],
  fileAnalyses?: FileAnalysis[]
): Promise<string> {
  try {
    const systemPrompt = `You are an expert healthcare file analysis assistant. Help users understand file contents, data structures, validation results, and team triage recommendations. ${
      validationResults?.length || fileAnalyses?.length
        ? 'Use the provided file analysis and validation results to give informed recommendations.' 
        : 'Provide clear, concise answers about healthcare data files and validation processes.'
    }`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    if (validationResults) {
      messages.push({
        role: "system",
        content: `Current validation results:\n${JSON.stringify(validationResults, null, 2)}`
      });
    }

    if (fileAnalyses && fileAnalyses.length > 0) {
      messages.push({
        role: "system",
        content: `File analysis results:\n${JSON.stringify(fileAnalyses, null, 2)}`
      });
    }

    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages
    });

    return completion.choices[0].message.content || "I couldn't process that request.";
  } catch (error) {
    console.error('Chat error:', error);
    
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new Error('Rate limit reached. Please try again in a few moments.');
      } else if (error.status === 401) {
        throw new Error('API authentication failed. Please check your API key configuration.');
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    } else if (error instanceof OpenAI.APIConnectionError) {
      throw new Error('Unable to connect to OpenAI. Please check your internet connection.');
    } else if (error instanceof OpenAI.APITimeoutError) {
      throw new Error('The request to OpenAI timed out. Please try again.');
    }
    
    throw new Error('Failed to get response from AI assistant. Please try again.');
  }
}