import { ExaResultItem } from "@/types/exa";
import { ColumnDef } from './types';

// Helper function for generating prompts for custom data columns
export const getCustomColumnPrompt = (columnDef: ColumnDef, itemForPrompt: ExaResultItem): string => {
  const titleInfo = itemForPrompt.title ? `Title: ${itemForPrompt.title}` : '';
  const authorInfo = itemForPrompt.author ? `Author: ${itemForPrompt.author}` : '';
  // Shorter snippet for conciseness
  const snippetInfo = itemForPrompt.text ? `Snippet: ${itemForPrompt.text.substring(0, 150)}...` : '';
  const urlInfo = itemForPrompt.url ? `URL: ${itemForPrompt.url}` : '';

  const contextParts = [titleInfo, authorInfo, snippetInfo, urlInfo].filter(Boolean);
  // Provide a fallback if all context parts are empty
  const contextString = contextParts.length > 0 ? `Context:\n${contextParts.join('\n')}` : 'Context: Limited information provided.';

  const entityIdentifier = itemForPrompt.author || itemForPrompt.title || 'the subject';
  // Standardized instruction for the AI
  const instruction = `Based on the provided context, what is the "${columnDef.header}" for "${entityIdentifier}"? Respond with only the value for "${columnDef.header}". If this information cannot be determined or is not applicable, respond with "N/A".`;

  // --- Prompt Strategies ---

  // Strategy for 'company'
  if (columnDef.id === 'company') {
    return `What is the current or most relevant company associated with "${entityIdentifier}"?\n${contextString}\n\n${instruction}`;
  }

  // Strategy for 'workEmail'
  if (columnDef.id === 'workEmail') {
    return `Attempt to identify a potential work email for "${entityIdentifier}". Prioritize emails from the domain related to their primary work or company if known.\n${contextString}\n\n${instruction} Try to find the most probable email adress, if it's not probable, respond with "N/A".`;
  }

  // Strategy for 'totalExperience'
  if (columnDef.id === 'totalExperience') {
    return `Estimate the total years of professional experience for "${entityIdentifier}" in their field.\n${contextString}\n\n${instruction} Provide a numerical estimate (e.g., "5 years", "10+ years") or a concise range.`;
  }

  // Strategy for 'aiInsight' - more analytical
  if (columnDef.id === 'aiInsight') {
    return `Provide a concise AI-related insight, skill, or project associated with "${entityIdentifier}" or their work.\n${contextString}\n\n${instruction} Focus on unique or non-obvious AI-related aspects.`;
  }
  
  // Default/Generic Strategy for other custom columns (user-added or other predefined)
  // This aims for a balance of clarity and conciseness.
  return `What is the "${columnDef.header}" for "${entityIdentifier}"?\n${contextString}\n\n${instruction}`;
}; 