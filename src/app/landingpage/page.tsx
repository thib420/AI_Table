"use client";

import React, { useState } from 'react';
// import Image from "next/image"; // Removed unused import
// import DataTable from "@/components/DataTable"; // Will be replaced by ResultsTable
import { ThemeToggleWrapper } from "@/components/theme-toggle-wrapper";
import { ChatInput } from "@/components/ChatInput";
import { ResultsTable } from "@/components/ResultsTable"; // We will create this component
import { ExaResultItem } from "@/types/exa"; // Removed unused FullExaApiResponse import

export default function Dashboard() {
  const [results, setResults] = useState<ExaResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");

  const handleSearchSubmit = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results
    setCurrentPrompt(query); // Store the current prompt

    try {
      const response = await fetch(`/api/exa?query=${encodeURIComponent(query)}`);
      // Use a union type for apiResponse to flexibly check its structure
      const apiResponse: { data?: { results?: ExaResultItem[] }, results?: ExaResultItem[], error?: string } | ExaResultItem[] = await response.json();

      if (!response.ok) {
        // If API returned an error status (4xx, 5xx)
        // The body (apiResponse) might contain an error message from our API route
        let finalErrorMessage = `API Error: ${response.statusText} (Status: ${response.status})`;
        // Check if apiResponse is an object (not an array) and has a string 'error' property
        if (apiResponse && typeof apiResponse === 'object' && !Array.isArray(apiResponse)) {
          const potentialErrorObject = apiResponse as { error?: unknown };
          if (typeof potentialErrorObject.error === 'string' && potentialErrorObject.error.length > 0) {
            finalErrorMessage = potentialErrorObject.error;
          }
        }
        throw new Error(finalErrorMessage);
      }
      
      // Response is OK (2xx), now check the structure of apiResponse
      if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data.results)) {
        // Case 1: Matches FullExaApiResponse { data: { results: [...] } }
        setResults(apiResponse.data.results);
      } else if (apiResponse && Array.isArray(apiResponse.results)) {
        // Case 2: Matches if API returns { results: [...] } directly
        setResults(apiResponse.results);
      } else if (Array.isArray(apiResponse)) {
        // Case 3: API directly returns ExaResultItem[] (less common for this type of API but good to check)
        setResults(apiResponse);
      } else {
        // If none of the expected successful structures match
        console.warn("Unexpected API success response structure in page.tsx:", apiResponse);
        // Check if the 2xx response body itself is an error object (e.g. from Exa API but not caught as HTTP error by our route)
        const errorMessage = apiResponse?.error || "Unexpected API response structure after successful HTTP request.";
        throw new Error(errorMessage);
      }

    } catch (err) {
      console.error("Search failed in page.tsx:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen flex flex-col p-6 bg-background">
      {/* Theme toggle in top right corner */}
      <div className="self-end mb-4">
        <ThemeToggleWrapper />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Prompt display header */}
        {currentPrompt && (
          <div className="mb-6 px-28">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-primary border-l-4 border-primary pl-3 py-1">
                {currentPrompt}
              </h1>
            </div>
          </div>
        )}
      
        {/* Table container */}
        <div className={`${currentPrompt ? 'h-[70%]' : 'h-3/4'} overflow-y-auto`}>
          <div className="w-full h-full px-28">
            {/* Display error message if any */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p>Error: {error}</p>
              </div>
            )}
            <ResultsTable results={results} isLoading={isLoading} />
          </div>
        </div>
        
        {/* Chat input at the bottom */}
        <div className="h-1/4 flex items-center justify-center">
          <div className="w-full max-w-5xl">
            <ChatInput onSearchSubmit={handleSearchSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </main>
  );
} 