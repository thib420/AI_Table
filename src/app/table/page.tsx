"use client";

import React, { useState, useEffect } from 'react';
import { ThemeToggleWrapper } from "@/components/theme-toggle-wrapper";
import { ChatInput } from "@/components/ChatInput";
import { ResultsTable } from "@/components/ResultsTable";
import { ExaResultItem } from "@/types/exa";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { UserIcon, LogInIcon, LogOutIcon, SettingsIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

export default function TablePage() {
  const router = useRouter();
  const { user, session, isLoading: authIsLoading, signOut } = useAuth();

  const [results, setResults] = useState<ExaResultItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");

  useEffect(() => {
    if (!authIsLoading && !user) {
      // Optional: redirect to login or landing page if table is protected
      // router.push('/'); 
    }
  }, [user, authIsLoading, router]);

  const handleSearchSubmit = async (query: string) => {
    setIsSearchLoading(true);
    setError(null);
    setResults([]);
    setCurrentPrompt(query);

    try {
      const response = await fetch(`/api/exa?query=${encodeURIComponent(query)}`);
      const apiResponse: { data?: { results?: ExaResultItem[] }, results?: ExaResultItem[], error?: string } | ExaResultItem[] = await response.json();

      if (!response.ok) {
        let finalErrorMessage = `API Error: ${response.statusText} (Status: ${response.status})`;
        if (apiResponse && typeof apiResponse === 'object' && !Array.isArray(apiResponse)) {
          const potentialErrorObject = apiResponse as { error?: unknown };
          if (typeof potentialErrorObject.error === 'string' && potentialErrorObject.error.length > 0) {
            finalErrorMessage = potentialErrorObject.error;
          }
        }
        throw new Error(finalErrorMessage);
      }
      
      if (Array.isArray(apiResponse)) {
        setResults(apiResponse);
      } else if (apiResponse && typeof apiResponse === 'object') {
        if (apiResponse.data && Array.isArray(apiResponse.data.results)) {
          setResults(apiResponse.data.results);
        } else if (Array.isArray(apiResponse.results)) {
          setResults(apiResponse.results);
        } else {
          const errorMessage = (apiResponse as { error?: string })?.error || "Unexpected API response structure after successful HTTP request.";
          throw new Error(errorMessage);
        }
      } else {
        throw new Error("Unknown or invalid API response structure after successful HTTP request.");
      }

    } catch (err) {
      console.error("Search failed in TablePage:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleLoginWithAzure = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        // Optional: specify scopes or redirect URL if needed
        // scopes: 'email profile',
        // redirectTo: window.location.origin + '/table' // Or your specific callback page
      },
    });
    if (error) {
      console.error('Error logging in with Azure:', error.message);
      setError("Failed to login with Azure: " + error.message);
    }
    // Supabase handles the redirect
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/'); // Redirect to landing page after logout
  };

  return (
    <main className="h-screen flex flex-col p-6 bg-background relative">
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
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p>{error}</p>
              </div>
            )}
            <ResultsTable results={results} isLoading={isSearchLoading} />
          </div>
        </div>
        
        {/* Chat input at the bottom */}
        <div className="h-1/4 flex items-center justify-center">
          <div className="w-full max-w-5xl">
            <ChatInput onSearchSubmit={handleSearchSubmit} isLoading={isSearchLoading} />
          </div>
        </div>
      </div>

      {/* User dropdown menu in bottom left */}
      <div className="absolute bottom-6 left-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {authIsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {authIsLoading ? (
              <DropdownMenuItem disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </DropdownMenuItem>
            ) : user ? (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">My Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || 'User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled> {/* Disabled until implemented */}
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel>Guest</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLoginWithAzure}>
                  <LogInIcon className="mr-2 h-4 w-4" />
                  <span>Login with Azure</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </main>
  );
} 