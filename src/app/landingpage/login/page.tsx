"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggleWrapper } from "@/components/theme-toggle-wrapper";
import { createSupabaseBrowserClient } from "@/lib/supabase/utils";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure', // Supabase uses 'azure' for Microsoft provider
      options: {
        redirectTo: `${location.origin}/auth/callback`, // Ensure you have an auth callback route
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // No explicit redirect here, Supabase handles it
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // For demonstration purposes - simulate login
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to dashboard
      router.push('/landingpage');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Theme toggle in top right corner */}
      <div className="self-end p-4">
        <ThemeToggleWrapper />
      </div>
      
      {/* Main content */}
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
            >
              {/* You can add a Microsoft icon here */}
              {isLoading ? 'Redirecting...' : 'Sign in with Microsoft'}
            </Button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/landingpage/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
          
          <div className="text-center mt-2">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 