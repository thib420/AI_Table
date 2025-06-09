import { ExaResultItem } from '@/types/exa';

export interface ColumnDef {
  id: string;
  header: string;
  accessorKey?: string;
  type: 'default' | 'ai-generated';
  aiPrompt?: string;
}

export interface EnrichedExaResultItem extends ExaResultItem {
  cleanTitle?: string;
  company?: string;
  companyUrl?: string;
  cleanDescription?: string;
  profilePicture?: string;
  cleanPosition?: string;
  extractedCompany?: string;
  [key: string]: unknown; // For dynamic AI-generated columns
}

export interface AIColumnConfig {
  columnName: string;
  prompt: string;
  maxResponseLength?: number;
  temperature?: number;
  includeProfileContext?: boolean;
  customContextFields?: string[];
}

export class AIColumnGenerator {
  private static readonly DEFAULT_MAX_LENGTH = 50;
  private static readonly DEFAULT_TEMPERATURE = 0.7;
  private static readonly GEMINI_API_ENDPOINT = '/api/gemini';

  /**
   * Creates a new AI-generated column definition
   */
  static createColumnDefinition(config: AIColumnConfig): ColumnDef {
    return {
      id: `ai_${Date.now()}`,
      header: config.columnName,
      accessorKey: `ai_${config.columnName.toLowerCase().replace(/\s+/g, '_')}`,
      type: 'ai-generated',
      aiPrompt: config.prompt
    };
  }

  /**
   * Builds the context prompt for a specific profile
   */
  static buildContextPrompt(
    result: ExaResultItem, 
    userPrompt: string, 
    config: Partial<AIColumnConfig> = {}
  ): string {
    const includeContext = config.includeProfileContext !== false; // Default to true
    const maxLength = config.maxResponseLength || this.DEFAULT_MAX_LENGTH;

    if (!includeContext) {
      return `${userPrompt}\n\nProvide a concise answer (max ${maxLength} characters):`;
    }

    // Build dynamic context based on available fields
    const contextParts: string[] = [];
    
    if (result.title) {
      contextParts.push(`Position: ${result.title}`);
    }
    
    if (result.author) {
      contextParts.push(`Name: ${result.author}`);
    }
    
    if (result.text) {
      contextParts.push(`Profile Content: ${result.text.substring(0, 500)}`);
    }

    if (result.url) {
      contextParts.push(`LinkedIn URL: ${result.url}`);
    }

    // Add custom context fields if specified
    if (config.customContextFields) {
      config.customContextFields.forEach(field => {
        const value = (result as unknown as Record<string, unknown>)[field];
        if (value) {
          contextParts.push(`${field}: ${value}`);
        }
      });
    }

    const contextSection = contextParts.length > 0 
      ? `Based on this person's profile information:\n${contextParts.join('\n')}\n\n`
      : '';

    return `${contextSection}${userPrompt}\n\nProvide a concise answer (max ${maxLength} characters):`;
  }

  /**
   * Calls the Gemini API with the constructed prompt
   */
  static async callGeminiAPI(prompt: string, temperature?: number): Promise<string> {
    try {
      const response = await fetch(this.GEMINI_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          temperature: temperature || this.DEFAULT_TEMPERATURE
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.text || 'N/A';
    } catch (error) {
      console.error('Gemini API call failed:', error);
      return 'Error';
    }
  }

  /**
   * Enriches a single result with AI-generated data
   */
  static async enrichSingleResult(
    result: EnrichedExaResultItem,
    column: ColumnDef,
    config: Partial<AIColumnConfig> = {}
  ): Promise<EnrichedExaResultItem> {
    if (!column.aiPrompt || !column.accessorKey) {
      return result;
    }

    const prompt = this.buildContextPrompt(result, column.aiPrompt, config);
    const aiResponse = await this.callGeminiAPI(prompt, config.temperature);
    
    // Trim response to max length
    const maxLength = config.maxResponseLength || this.DEFAULT_MAX_LENGTH;
    const trimmedResponse = aiResponse.substring(0, maxLength);

    return {
      ...result,
      [column.accessorKey]: trimmedResponse
    };
  }

  /**
   * Enriches multiple results with AI-generated data for a new column
   */
  static async enrichResultsWithNewColumn(
    results: EnrichedExaResultItem[],
    config: AIColumnConfig,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ column: ColumnDef; enrichedResults: EnrichedExaResultItem[] }> {
    const column = this.createColumnDefinition(config);
    
    const enrichedResults = await Promise.all(
      results.map(async (result, index) => {
        const enriched = await this.enrichSingleResult(result, column, config);
        
        // Report progress if callback provided
        if (onProgress) {
          onProgress(index + 1, results.length);
        }
        
        return enriched;
      })
    );

    return { column, enrichedResults };
  }

  /**
   * Batch process multiple AI columns for better performance
   */
  static async batchEnrichResults(
    results: EnrichedExaResultItem[],
    columns: ColumnDef[],
    configs: Partial<AIColumnConfig>[] = [],
    onProgress?: (completed: number, total: number) => void
  ): Promise<EnrichedExaResultItem[]> {
    const aiColumns = columns.filter(col => col.type === 'ai-generated');
    const totalOperations = results.length * aiColumns.length;
    let completedOperations = 0;

    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        let enriched = { ...result };
        
        for (let i = 0; i < aiColumns.length; i++) {
          const column = aiColumns[i];
          const config = configs[i] || {};
          
          enriched = await this.enrichSingleResult(enriched, column, config);
          completedOperations++;
          
          if (onProgress) {
            onProgress(completedOperations, totalOperations);
          }
        }
        
        return enriched;
      })
    );

    return enrichedResults;
  }

  /**
   * Validates AI column configuration
   */
  static validateConfig(config: AIColumnConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.columnName?.trim()) {
      errors.push('Column name is required');
    }

    if (!config.prompt?.trim()) {
      errors.push('AI prompt is required');
    }

    if (config.maxResponseLength && (config.maxResponseLength < 1 || config.maxResponseLength > 500)) {
      errors.push('Max response length must be between 1 and 500 characters');
    }

    if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get suggested prompts for common use cases
   */
  static getSuggestedPrompts(): { category: string; prompts: { name: string; prompt: string }[] }[] {
    return [
      {
        category: 'Contact Information',
        prompts: [
          {
            name: 'Email',
            prompt: 'Extract or estimate their professional email address based on their name and company.'
          },
          {
            name: 'Phone',
            prompt:
              "Your goal is to find a contact phone number. Prioritize a direct or mobile number. If none, find the main company number. Format the response as 'Personal: [number]' or 'Company: [number]'. If multiple types are found, use separate lines. If no number can be found at all, respond 'N/A'."
          },
          {
            name: 'Location',
            prompt: 'What city/region are they based in?'
          },
          {
            name: 'Address',
            prompt: 'Extract or estimate their business address or location.'
          },
          {
            name: 'Time Zone',
            prompt: 'What time zone are they likely in based on their location?'
          }
        ]
      },
      {
        category: 'Company Analysis',
        prompts: [
          {
            name: 'Company Size',
            prompt: 'What is the estimated company size (startup, small, medium, large, enterprise)?'
          },
          {
            name: 'Industry',
            prompt: 'What industry does this person work in?'
          },
          {
            name: 'Company Stage',
            prompt: 'What stage is their company (seed, series A/B/C, public, established)?'
          },
          {
            name: 'Department',
            prompt: 'What department do they work in (Engineering, Sales, Marketing, etc.)?'
          }
        ]
      },
      {
        category: 'Professional Assessment',
        prompts: [
          {
            name: 'Seniority Level',
            prompt: 'What is their seniority level (junior, mid, senior, executive)?'
          },
          {
            name: 'Years of Experience',
            prompt: 'Estimate their years of professional experience (0-2, 3-5, 6-10, 10+)?'
          },
          {
            name: 'Key Skills',
            prompt: 'What are their top 3 professional skills or expertise areas?'
          },
          {
            name: 'Education',
            prompt: 'What is their educational background or degree level?'
          }
        ]
      },
      {
        category: 'Contact Potential',
        prompts: [
          {
            name: 'Decision Maker',
            prompt: 'Are they likely a decision maker for business purchases (yes/no/maybe)?'
          },
          {
            name: 'Networking Value',
            prompt: 'Rate their networking value for business development (low/medium/high)?'
          },
          {
            name: 'Contact Priority',
            prompt: 'Priority for outreach (low/medium/high) based on role and company?'
          },
          {
            name: 'Best Contact Method',
            prompt: 'What would be the best way to contact them (email, LinkedIn, phone)?'
          }
        ]
      }
    ];
  }
}

// Export types and default configurations
export const DEFAULT_AI_CONFIG: Partial<AIColumnConfig> = {
  maxResponseLength: 50,
  temperature: 0.7,
  includeProfileContext: true
};

export const QUICK_AI_CONFIGS = {
  COMPANY_INFO: {
    maxResponseLength: 30,
    temperature: 0.3,
    includeProfileContext: true
  },
  SKILLS_ANALYSIS: {
    maxResponseLength: 60,
    temperature: 0.5,
    includeProfileContext: true
  },
  CONTACT_SCORING: {
    maxResponseLength: 20,
    temperature: 0.2,
    includeProfileContext: true
  }
} as const; 