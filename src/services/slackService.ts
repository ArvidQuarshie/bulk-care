import { ValidationResult } from '../types';

function formatValidationResults(results: ValidationResult[]): string {
  const summary = {
    total: results.length,
    valid: results.filter(r => r.status === 'valid').length,
    warnings: results.filter(r => r.status === 'warning').length,
    invalid: results.filter(r => r.status === 'invalid').length,
    duplicates: results.filter(r => r.duplicateOf).length
  };

  const statusEmoji = {
    valid: ':white_check_mark:',
    warning: ':warning:',
    invalid: ':x:'
  };

  let message = '*Validation Results Summary*\n';
  message += `Total Entries: ${summary.total}\n`;
  message += `Valid: ${summary.valid}\n`;
  message += `Warnings: ${summary.warnings}\n`;
  message += `Invalid: ${summary.invalid}\n`;
  
  if (summary.duplicates > 0) {
    message += `Duplicates: ${summary.duplicates}\n`;
  }

  message += '\n*Detailed Results*\n';
  
  const detailedResults = results.slice(0, 10).map(result => {
    const emoji = statusEmoji[result.status];
    return `${emoji} *${result.code}* (${result.coding_system || 'N/A'})\n` +
           `Status: ${result.status}\n` +
           (result.issues.length > 0 ? `Issues: ${result.issues.join(', ')}\n` : '') +
           (result.duplicateOf ? `Duplicate of: ${result.duplicateOf}\n` : '') +
           '---';
  }).join('\n');

  message += detailedResults;

  if (results.length > 10) {
    message += '\n_Showing first 10 results..._';
  }

  return message;
}

export async function sendValidationResults(
  results: ValidationResult[],
  channel: string
): Promise<void> {
  try {
    const formattedMessage = formatValidationResults(results);
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slack-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        channel,
        message: formattedMessage
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw new Error(
      error instanceof Error 
        ? `Error sending Slack message: ${error.message}`
        : 'Failed to send Slack message'
    );
  }
}