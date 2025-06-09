# 🔍 Exa + Gemini Integration Complete Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [File Structure Analysis](#file-structure-analysis)
3. [Technical Process Flow](#technical-process-flow)
4. [API Integration Details](#api-integration-details)
5. [Implementation Examples](#implementation-examples)
6. [Error Handling & Fallbacks](#error-handling--fallbacks)
7. [Configuration & Setup](#configuration--setup)

---

## 🎯 Overview

This guide documents the complete integration between **Exa API** (LinkedIn profile search) and **Google Gemini AI** (data enhancement) in the AI Table application. The system searches for LinkedIn profiles and uses AI to clean and structure the raw data for better usability.

### System Architecture
```
User Query → Exa API → Raw LinkedIn Data → Gemini AI → Enhanced Data → UI Display
```

### Key Components
- **`searchService.ts`**: Core service orchestrating the entire workflow
- **`/api/exa`**: LinkedIn profile search endpoint
- **`/api/gemini`**: AI data enhancement endpoint
- **`useSearchState.ts`**: React hook managing search state and UI updates

---

## 📁 File Structure Analysis

### Location & Purpose
**File**: `src/shared/services/searchService.ts`  
**Role**: Central service handling LinkedIn profile searches and AI enhancement

### Dependencies
```typescript
import { ExaResultItem } from '@/shared/types/exa';
import { EnrichedExaResultItem } from '@/modules/search/services/ai-column-generator';
```

### Class Methods Overview

#### 1. `performSearch()` - Main Search Engine
```typescript
static async performSearch(query: string, numResults: number = 10): Promise<ExaResultItem[]>
```

**Responsibilities:**
- ✅ Input validation (empty query check)
- 🌐 API communication with Exa endpoint
- 🔄 Response format handling
- 🎯 Quality filtering (score-based)
- 📊 Debug logging

**Implementation Details:**
```typescript
// API call with proper encoding
const response = await fetch(`/api/exa?query=${encodeURIComponent(query.trim())}&numResults=${numResults}`);

// Flexible response parsing
const results = data.results || data.data?.results || [];

// Quality filtering
const profileResults = results.filter((result: ExaResultItem) => {
  const hasValidScore = result.score && result.score > 0;
  return hasValidScore;
});
```

#### 2. `processLinkedInData()` - Initial Data Transformation
```typescript
static processLinkedInData(result: ExaResultItem): EnrichedExaResultItem
```

**Responsibilities:**
- 🖼️ Profile picture handling (Exa image or generated avatar)
- 🔄 Data structure transformation
- ⏳ AI enhancement placeholder setup
- 🛡️ Fallback value assignment

**Key Features:**
```typescript
return {
  ...result,
  cleanTitle: 'Processing...', // Gemini will fill this
  company: 'Processing...',    // Gemini will fill this
  cleanDescription: 'Processing...', // Gemini will fill this
  profilePicture: result.image || generateProfilePictureUrl(result.author),
  cleanPosition: result.title || 'N/A',
  extractedCompany: 'N/A'
};
```

#### 3. `generateProfilePictureUrl()` - Avatar Generation
```typescript
static generateProfilePictureUrl(name: string): string
```

**Features:**
- 🎨 Dynamic color selection (8 colors based on name length)
- 🔤 Name processing and URL encoding
- 🛡️ Default handling for unknown users
- 📱 Responsive 40px avatars

**Implementation:**
```typescript
const colors = ['6366f1', '8b5cf6', '10b981', 'f59e0b', 'ef4444', '14b8a6', 'f97316', '3b82f6'];
const colorIndex = name.length % colors.length;
const backgroundColor = colors[colorIndex];

return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&size=40&background=${backgroundColor}&color=fff&bold=true&format=png`;
```

#### 4. `enhanceWithGemini()` - AI Enhancement Core ⭐

**The most critical method** - transforms raw Exa data using Gemini AI:

##### Phase 1: Data Preparation
```typescript
const dataForAnalysis = results.map((item, index) => ({
  index,                                    // For accurate result mapping
  author: item.author,                     // Person's name
  title: item.title,                       // Raw LinkedIn title
  text: item.text?.substring(0, 1000),     // Truncated content for efficiency
  url: item.url                            // LinkedIn profile URL
}));
```

##### Phase 2: Prompt Engineering
```typescript
const prompt = `You are an expert LinkedIn profile analyzer. Extract clean, structured information from these LinkedIn profiles.

For each profile, extract:
1. cleanTitle: ONLY the job title (e.g., "Senior Product Manager", "Software Engineer")
   - Remove company names, "at [Company]", "| LinkedIn", etc.
   - Keep it professional and concise
   - Convert French titles to English when appropriate

2. company: ONLY the current company name (e.g., "Google", "Microsoft", "Doctolib")
   - Extract from current job or most recent position
   - No extra words like "at" or descriptors

3. cleanDescription: A 1-2 sentence professional summary (max 150 characters)
   - Focus on expertise, role, or key achievements
   - Make it scannable and relevant

Rules:
- If any field cannot be determined, use "N/A"
- Keep descriptions concise and professional
- Return ONLY valid JSON, no markdown or explanations

Input profiles: ${JSON.stringify(dataForAnalysis, null, 2)}

Return format: [{"index":0,"cleanTitle":"Job Title","company":"Company Name","cleanDescription":"Brief summary"}]`;
```

##### Phase 3: API Communication
```typescript
const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt })
});
```

##### Phase 4: Response Processing
```typescript
// Clean markdown formatting
let cleanText = text.trim();
if (cleanText.startsWith('```json')) {
  cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
}

// Parse and validate JSON
const enhancedData = JSON.parse(cleanText);
if (!Array.isArray(enhancedData)) {
  throw new Error('Invalid response format from Gemini');
}
```

##### Phase 5: Data Integration
```typescript
const enhancedResults = results.map((result, index) => {
  const enhancement = enhancedData.find((item: any) => item.index === index);
  if (enhancement) {
    return {
      ...result,
      cleanTitle: enhancement.cleanTitle || 'N/A',
      company: enhancement.company || 'N/A',
      cleanDescription: enhancement.cleanDescription || 'No description available',
      profilePicture: result.profilePicture, // Preserved from initial processing
      cleanPosition: enhancement.cleanTitle || 'N/A', // Legacy compatibility
      extractedCompany: enhancement.company || 'N/A'   // Legacy compatibility
    };
  }
  // Fallback for missing enhancements
  return { ...result, cleanTitle: 'N/A', company: 'N/A', cleanDescription: 'No description available' };
});
```

---

## 🔄 Technical Process Flow

### Complete Data Transformation Pipeline

#### Step 1: User Search Initiation
```typescript
// User triggers search in UI
const results = await SearchService.performSearch("Marketing director in Paris", 10);
```

#### Step 2: Exa API Call
```typescript
// Internal API request
fetch(`/api/exa?query=${encodeURIComponent(query)}&numResults=${numResults}`)

// Expected response structure
{
  results: [
    {
      title: "Marie Dubois - Senior Marketing Director at Doctolib | LinkedIn",
      author: "Marie Dubois",
      text: "Experienced marketing professional with 8 years in healthcare technology...",
      url: "https://linkedin.com/in/marie-dubois-marketing",
      score: 0.85,
      image: "https://profile-image-url.jpg"
    }
  ]
}
```

#### Step 3: Quality Filtering & Initial Processing
```typescript
// Filter by score
const qualityResults = results.filter(r => r.score > 0);

// Transform to enriched structure
const enrichedData = qualityResults.map(SearchService.processLinkedInData);

// Result after initial processing
{
  title: "Marie Dubois - Senior Marketing Director at Doctolib | LinkedIn",
  author: "Marie Dubois",
  text: "Experienced marketing professional...",
  cleanTitle: "Processing...",      // 🤖 Will be enhanced by AI
  company: "Processing...",         // 🤖 Will be enhanced by AI
  cleanDescription: "Processing...", // 🤖 Will be enhanced by AI
  profilePicture: "https://ui-avatars.com/api/?name=Marie+Dubois&...",
  cleanPosition: "Marie Dubois - Senior Marketing Director at Doctolib | LinkedIn",
  extractedCompany: "N/A"
}
```

#### Step 4: Background AI Enhancement
```typescript
// Triggered asynchronously after initial results display
SearchService.enhanceWithGemini(enrichedData).then(enhancedResults => {
  // Update UI with clean data
  setSearchState(prev => ({
    ...prev,
    enrichedResults: enhancedResults,
    filteredResults: enhancedResults,
    sortedResults: enhancedResults,
    isEnhancingWithAI: false
  }));
});
```

#### Step 5: Final Enhanced Result
```typescript
// After AI processing
{
  title: "Marie Dubois - Senior Marketing Director at Doctolib | LinkedIn",
  author: "Marie Dubois",
  text: "Experienced marketing professional...",
  cleanTitle: "Senior Marketing Director",     // ✅ Cleaned by AI
  company: "Doctolib",                        // ✅ Extracted by AI
  cleanDescription: "Experienced marketing leader specializing in healthcare technology solutions", // ✅ Generated by AI
  profilePicture: "https://ui-avatars.com/api/?name=Marie+Dubois&...",
  cleanPosition: "Senior Marketing Director",  // Legacy field
  extractedCompany: "Doctolib"                // Legacy field
}
```

---

## 📡 API Integration Details

### Exa API Endpoint (`/api/exa`)
```typescript
// Request
GET /api/exa?query=marketing%20director%20paris&numResults=10

// Headers
Content-Type: application/json

// Response
{
  "results": [
    {
      "title": "LinkedIn profile title with company info",
      "author": "Person Name",
      "text": "Full profile content...",
      "url": "https://linkedin.com/in/profile",
      "score": 0.85,
      "image": "https://profile-image.jpg"
    }
  ]
}

// Error Response
{
  "error": "API key not configured" | "Query parameter is missing" | "Search failed"
}
```

### Gemini API Endpoint (`/api/gemini`)
```typescript
// Request
POST /api/gemini

// Headers
Content-Type: application/json

// Body
{
  "prompt": "You are an expert LinkedIn profile analyzer..."
}

// Response
{
  "text": "[{\"index\":0,\"cleanTitle\":\"Senior Marketing Director\",\"company\":\"Doctolib\",\"cleanDescription\":\"Experienced marketing leader...\"}]"
}

// Error Response
{
  "error": "Prompt is required" | "Gemini API key not configured" | "Failed to generate content"
}
```

---

## 💻 Implementation Examples

### Frontend Integration (React)
```typescript
import { useSearchState } from '@/shared/hooks/useSearchState';

function SearchComponent() {
  const { searchState, performSearch } = useSearchState();
  
  const handleSearch = async () => {
    // Triggers complete Exa + Gemini pipeline
    await performSearch("Product Manager in Berlin", 15);
  };
  
  return (
    <div>
      {searchState.isEnhancingWithAI && <div>AI is enhancing results...</div>}
      
      {searchState.enrichedResults.map(result => (
        <div key={result.url}>
          <h3>{result.cleanTitle}</h3>        {/* AI-enhanced */}
          <p>{result.company}</p>             {/* AI-enhanced */}
          <p>{result.cleanDescription}</p>    {/* AI-enhanced */}
          <img src={result.profilePicture} /> {/* Generated or from Exa */}
        </div>
      ))}
    </div>
  );
}
```

### Backend Integration (Direct Service Usage)
```typescript
import { SearchService } from '@/shared/services/searchService';

async function searchProfiles(query: string, count: number) {
  try {
    // Step 1: Get raw data from Exa
    const rawResults = await SearchService.performSearch(query, count);
    
    // Step 2: Initial processing
    const enrichedData = rawResults.map(SearchService.processLinkedInData);
    
    // Step 3: AI enhancement
    const finalResults = await SearchService.enhanceWithGemini(enrichedData);
    
    return finalResults;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}
```

### Custom Enhancement Pipeline
```typescript
// Extend the enhancement process
async function customEnhancement(query: string) {
  const results = await SearchService.performSearch(query, 10);
  const enriched = results.map(SearchService.processLinkedInData);
  
  // Standard AI enhancement
  const aiEnhanced = await SearchService.enhanceWithGemini(enriched);
  
  // Add custom processing
  const finalResults = aiEnhanced.map(result => ({
    ...result,
    customField: processCustomData(result),
    enrichmentTimestamp: new Date().toISOString()
  }));
  
  return finalResults;
}
```

---

## 🛡️ Error Handling & Fallbacks

### API Level Error Handling
```typescript
// Exa API failures
try {
  const response = await fetch('/api/exa?...');
  if (!response.ok) {
    throw new Error(data.error || 'Search failed');
  }
} catch (error) {
  // User sees: "Search failed, please try again"
  console.error('Exa API error:', error);
}

// Gemini API failures  
try {
  const response = await fetch('/api/gemini', { ... });
  if (!response.ok) {
    throw new Error('Failed to get Gemini response');
  }
} catch (error) {
  // Falls back to basic data without AI enhancement
  console.error('Gemini enhancement failed:', error);
}
```

### Data Processing Resilience
```typescript
// JSON parsing protection
try {
  enhancedData = JSON.parse(cleanText);
} catch (parseError) {
  console.error('Invalid Gemini response:', cleanText);
  // Returns data with fallback values
}

// Complete failure fallback
catch (error) {
  console.error('Enhancement failed:', error);
  return results.map(result => ({
    ...result,
    cleanTitle: result.title || 'N/A',        // Use original title
    company: 'N/A',                           // No company data
    cleanDescription: 'Processing failed',    // Error indicator
    profilePicture: result.profilePicture     // Keep generated avatar
  }));
}
```

### UI State Management
```typescript
// Loading states
setSearchState(prev => ({ 
  ...prev, 
  isLoading: true,           // Initial search
  isEnhancingWithAI: true    // Background AI processing
}));

// Error states
setSearchState(prev => ({
  ...prev,
  error: 'Search failed, please try again',
  isLoading: false,
  isEnhancingWithAI: false
}));

// Success states with fallbacks
setSearchState(prev => ({
  ...prev,
  enrichedResults: enhancedResults,  // AI-enhanced data
  isEnhancingWithAI: false,
  error: null
}));
```

---

## ⚙️ Configuration & Setup

### Environment Variables
```env
# Required API Keys
EXA_API_KEY=your_exa_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Enable persistent caching
NEXT_PUBLIC_USE_PERSISTENT_CACHE=true

# Database (for saved searches)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Package Dependencies
```json
{
  "dependencies": {
    "exa-js": "^1.x.x",
    "@google/generative-ai": "^0.x.x",
    "@supabase/supabase-js": "^2.x.x"
  }
}
```

### Performance Optimization Settings
```typescript
// Text truncation for efficiency
const MAX_TEXT_LENGTH = 1000;

// Batch processing limits
const MAX_RESULTS_PER_SEARCH = 100;
const DEFAULT_RESULTS = 10;

// AI prompt optimization
const MAX_DESCRIPTION_LENGTH = 150;
```

### Rate Limiting Considerations
- **Exa API**: Billed per search request
- **Gemini API**: Billed per token (input + output)
- **Optimization**: Batch multiple profiles in single Gemini call
- **Caching**: Consider caching enhanced results for repeated queries

---

## 📊 Data Structure Reference

### ExaResultItem (Raw)
```typescript
interface ExaResultItem {
  title: string;        // "John Doe - Senior Dev at TechCorp | LinkedIn"
  author: string;       // "John Doe"
  text: string;         // Full profile content
  url: string;          // "https://linkedin.com/in/johndoe"
  score: number;        // 0.0 - 1.0 relevance score
  image?: string;       // Profile picture URL (optional)
}
```

### EnrichedExaResultItem (Enhanced)
```typescript
interface EnrichedExaResultItem extends ExaResultItem {
  cleanTitle: string;           // "Senior Developer"
  company: string;              // "TechCorp"
  cleanDescription: string;     // "Experienced developer specializing in..."
  profilePicture: string;       // Generated or from Exa
  cleanPosition: string;        // Legacy field
  extractedCompany: string;     // Legacy field
  [key: string]: unknown;      // For dynamic AI columns
}
```

### Gemini Response Format
```typescript
// Expected AI response
[
  {
    "index": 0,
    "cleanTitle": "Senior Developer",
    "company": "TechCorp", 
    "cleanDescription": "Experienced developer specializing in full-stack web applications"
  }
]
```

---

## 🚀 Usage Examples

### Basic Search
```typescript
const results = await SearchService.performSearch("UX Designer in London", 10);
// Returns: EnrichedExaResultItem[] with AI-enhanced data
```

### Advanced Search with State Management
```typescript
const { searchState, performSearch } = useSearchState();

await performSearch("Data Scientist remote", 20);

// Access results
console.log(searchState.enrichedResults);   // AI-enhanced data
console.log(searchState.isEnhancingWithAI); // Loading state
console.log(searchState.error);             // Error handling
```

### Custom Processing Pipeline
```typescript
// Get raw data
const raw = await SearchService.performSearch(query, 10);

// Custom initial processing
const custom = raw.map(result => ({
  ...SearchService.processLinkedInData(result),
  customField: extractCustomData(result)
}));

// AI enhancement
const enhanced = await SearchService.enhanceWithGemini(custom);
```

This integration provides a robust, scalable solution for LinkedIn profile search with AI enhancement, complete with error handling, fallbacks, and optimization strategies. 