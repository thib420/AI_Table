export interface ExaResultItem {
  id: string;
  title: string;
  url: string;
  publishedDate?: string; // Marked as optional if it might be missing
  author?: string;        // Marked as optional
  score: number;
  text: string; // Consider if you want to display the full text or a snippet
  image?: string; // Profile image URL from LinkedIn (when available)
  // Add any other fields you might need from the 'results' objects
}

export interface ExaApiResponse {
  // Based on your example, the results are nested under 'data'
  // If the API route directly returns the content of 'data.results', adjust accordingly
  // For now, assuming the structure from /api/exa returns the 'results' array directly or similar
  // Let's assume our /api/exa endpoint returns an array of ExaResultItem or an object containing it.
  // If it returns the full structure you showed, the type would be:
  // data: {
  //   requestId: string;
  //   autopromptString: string;
  //   resolvedSearchType: string;
  //   results: ExaResultItem[];
  //   costDollars: any; // You can define a more specific type for costDollars if needed
  // };

  // For now, let's assume our /api/exa route directly returns the ExaResultItem[] or an object { results: ExaResultItem[] }
  // Let's make it flexible, it could be an array or an object with a results property
  results?: ExaResultItem[]; // If the API returns an object like { results: [...] }
  error?: string; // For error responses
  // If the API directly returns ExaResultItem[] upon success:
  // (This means the ChatInput component would receive ExaResultItem[] directly)
}

// If your /api/exa route returns the exact structure you showed:
export interface FullExaApiResponse {
  data: {
    requestId: string;
    autopromptString: string;
    resolvedSearchType: string;
    results: ExaResultItem[];
    costDollars: {
      total: number;
      search: { [key: string]: number }; // e.g., neural: 0.005
      contents: { [key: string]: number }; // e.g., text: 0.01
    };
  };
} 