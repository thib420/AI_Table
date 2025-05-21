"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggleWrapper } from "@/components/theme-toggle-wrapper";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Theme toggle in top right corner */}
      <div className="self-end p-4">
        <ThemeToggleWrapper />
      </div>
      
      {/* Main content */}
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">AI Table</h1>
            <p className="text-xl text-muted-foreground">
              Your intelligent data assistant
            </p>
          </div>
          
          <div className="space-y-4 pt-6">
            <Button 
              className="w-full" 
              size="lg"
              asChild
            >
              <Link href="/landingpage/login">Login</Link>
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline" 
              size="lg"
              asChild
            >
              <Link href="/landingpage/register">Register</Link>
            </Button>
            
            {/* Link to dashboard for development purposes */}
            <div className="pt-4">
              <Button 
                variant="ghost" 
                className="text-sm"
                asChild
              >
                <Link href="/landingpage">Continue as Guest</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} AI Table. All rights reserved.
      </footer>
    </div>
  );
}
