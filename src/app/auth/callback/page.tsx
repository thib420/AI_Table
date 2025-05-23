'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        router.replace('/table'); // Redirect to the main application table page
      } else {
        // Handle case where session is not established after callback, redirect to login with an error
        console.error('Auth callback: Session not established.');
        router.replace('/landingpage/login?error=auth_failed'); 
      }
    }
  }, [session, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Completing authentication, please wait...</p>
    </div>
  );
} 