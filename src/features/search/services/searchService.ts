import { ExaResultItem } from '@/types/exa';
import { EnrichedExaResultItem } from '@/features/search/services/ai-column-generator';

export class SearchService {
  static async performSearch(query: string, numResults: number = 10): Promise<ExaResultItem[]> {
    if (!query.trim()) {
      throw new Error('Query cannot be empty');
    }

    const response = await fetch(`/api/exa?query=${encodeURIComponent(query.trim())}&numResults=${numResults}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Search failed');
    }

    // Handle different response formats
    const results = data.results || data.data?.results || [];
    
    // Filter out results without a score (not actual profiles)
    const profileResults = results.filter((result: ExaResultItem) => {
      const hasValidScore = result.score && result.score > 0;
      if (!hasValidScore) {
        console.log(`Filtering out result without valid score:`, {
          title: result.title,
          url: result.url,
          score: result.score
        });
      }
      return hasValidScore;
    });

    console.log(`Filtered ${results.length} results to ${profileResults.length} profiles with valid scores`);
    
    return profileResults;
  }

  static processLinkedInData(result: ExaResultItem): EnrichedExaResultItem {
    // Use the image from Exa API if available, otherwise generate profile picture URL from name
    const profilePicture = result.image || SearchService.generateProfilePictureUrl(result.author || 'Unknown');
    
    // Initial processing - will be enhanced by Gemini
    return {
      ...result,
      cleanTitle: 'Processing...', // Will be filled by Gemini
      company: 'Processing...', // Will be filled by Gemini
      cleanDescription: 'Processing...', // Will be filled by Gemini
      profilePicture, // Profile picture URL (prefer Exa API image)
      cleanPosition: result.title || 'N/A', // Fallback
      extractedCompany: 'N/A' // Fallback
    };
  }

  static generateProfilePictureUrl(name: string): string {
    if (!name || name === 'Unknown') {
      return `https://ui-avatars.com/api/?name=User&size=40&background=6366f1&color=fff&bold=true&format=png`;
    }
    
    // Create a nice avatar based on the person's name
    const cleanName = name.trim().replace(/\s+/g, '+');
    const colors = ['6366f1', '8b5cf6', '10b981', 'f59e0b', 'ef4444', '14b8a6', 'f97316', '3b82f6'];
    const colorIndex = name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&size=40&background=${backgroundColor}&color=fff&bold=true&format=png`;
  }

  // Enhanced function to try to get actual LinkedIn profile picture
  static async getLinkedInProfilePicture(linkedInUrl: string, name: string): Promise<string> {
    try {
      // For now, we'll use the generated avatar
      // In the future, this could be enhanced to use LinkedIn's API or scraping services
      return SearchService.generateProfilePictureUrl(name);
    } catch (error) {
      console.error('Failed to get LinkedIn profile picture:', error);
      return SearchService.generateProfilePictureUrl(name);
    }
  }



  static async enhanceWithGemini(results: EnrichedExaResultItem[]): Promise<EnrichedExaResultItem[]> {
    try {
      console.log('🤖 Starting Gemini enhancement for', results.length, 'profiles');
      
      // Prepare data for Gemini analysis
      const dataForAnalysis = results.map((item, index) => ({
        index,
        author: item.author,
        title: item.title,
        text: item.text?.substring(0, 1000), // Limit text for better processing
        url: item.url
      }));

      const prompt = `You are an expert LinkedIn profile analyzer. Extract clean, structured information from these LinkedIn profiles.

For each profile, extract:
1. cleanTitle: ONLY the job title (e.g., "Senior Product Manager", "Software Engineer", "Marketing Director")
   - Remove company names, "at [Company]", "| LinkedIn", etc.
   - Keep it professional and concise
   - Convert French titles to English when appropriate

2. company: ONLY the current company name (e.g., "Google", "Microsoft", "Doctolib")
   - Extract from current job or most recent position
   - No extra words like "at" or descriptors

3. cleanDescription: A 1-2 sentence professional summary (max 150 characters)
   - Focus on expertise, role, or key achievements
   - Make it scannable and relevant
   - Extract from bio or current job description

Rules:
- If any field cannot be determined, use "N/A"
- Keep descriptions concise and professional
- Return ONLY valid JSON, no markdown or explanations

Input profiles:
${JSON.stringify(dataForAnalysis, null, 2)}

Return this exact JSON format:
[{"index":0,"cleanTitle":"Job Title","company":"Company Name","cleanDescription":"Brief professional summary"}]`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Gemini response');
      }

      const { text } = await response.json();
      
      // Clean the response text - remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Parse the JSON response from Gemini
      let enhancedData;
      try {
        enhancedData = JSON.parse(cleanText);
        console.log('✅ Successfully parsed Gemini response:', enhancedData);
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini response:', cleanText);
        console.error('Parse error:', parseError);
        throw new Error('Invalid JSON response from Gemini');
      }
      
      // Validate the response structure
      if (!Array.isArray(enhancedData)) {
        console.error('❌ Gemini response is not an array:', enhancedData);
        throw new Error('Invalid response format from Gemini');
      }
      
      // Apply the enhanced data to the results
      const enhancedResults = results.map((result, index) => {
        const enhancement = enhancedData.find((item: any) => item.index === index);
        if (enhancement) {
          return {
            ...result,
            cleanTitle: enhancement.cleanTitle || 'N/A',
            company: enhancement.company || 'N/A',
            cleanDescription: enhancement.cleanDescription || 'No description available',
            // Keep the profile picture from initial processing (prefers Exa image)
            profilePicture: result.profilePicture,
            // Keep legacy fields for backward compatibility
            cleanPosition: enhancement.cleanTitle || 'N/A',
            extractedCompany: enhancement.company || 'N/A'
          };
        }
        return {
          ...result,
          cleanTitle: 'N/A',
          company: 'N/A',
          cleanDescription: 'No description available',
          profilePicture: result.profilePicture,
          cleanPosition: 'N/A',
          extractedCompany: 'N/A'
        };
      });

      console.log('🎯 Enhanced results with clean data:', enhancedResults.slice(0, 2));
      return enhancedResults;
    } catch (error) {
      console.error('❌ Error enhancing data with Gemini:', error);
      
      // Return fallback data if enhancement fails
      return results.map(result => ({
        ...result,
        cleanTitle: result.title || 'N/A',
        company: 'N/A',
        cleanDescription: 'Processing failed',
        profilePicture: result.profilePicture, // Already processed to prefer Exa image
        cleanPosition: result.title || 'N/A',
        extractedCompany: 'N/A'
      }));
    }
  }
} 