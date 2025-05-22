"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogInIcon } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLoginWithAzure = async () => {
    setIsLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // Or your preferred callback URL
      },
    });
    if (signInError) {
      console.error('Error logging in with Azure:', signInError.message);
      setError("Failed to login with Azure: " + signInError.message);
      setIsLoading(false);
    }
    // Supabase handles the redirect. If it fails before redirect, error will be set.
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Login to AI Table</h1>
          <p className="text-muted-foreground">
            Access your intelligent data assistant.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        <Button 
          onClick={handleLoginWithAzure} 
          className="w-full" 
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LogInIcon className="mr-2 h-5 w-5" />
          )}
          Login with Azure
        </Button>
        
        <div className="pt-4">
          <Button variant="link" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Minimal Loader2 component if not already globally available
// If you have a shared Loader2 component, import it instead.
const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
); 