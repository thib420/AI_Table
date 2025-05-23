'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const fragment = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for errors first
        const error = urlParams.get('error') || fragment.get('error');
        if (error) {
          console.error('Authentication error:', error);
          const errorDescription = urlParams.get('error_description') || fragment.get('error_description');
          setStatus(`Authentication failed: ${errorDescription || error}`);
          
          setTimeout(() => {
            router.replace('/?error=auth_failed');
          }, 3000);
          return;
        }

        // Check for successful auth (either code or access_token)
        const code = urlParams.get('code');
        const accessToken = fragment.get('access_token');
        
        if (code || accessToken) {
          setStatus('Authentication successful! Redirecting...');
          console.log('Auth callback: Authentication successful');
          
          // Let MSAL handle the response by redirecting back to main app
          // MSAL will process the callback automatically
          setTimeout(() => {
            router.replace('/');
          }, 1000);
        } else {
          // No error but no success parameters either
          console.log('Auth callback: No auth parameters found, redirecting to home');
          setStatus('No authentication data found. Redirecting...');
          
          setTimeout(() => {
            router.replace('/');
          }, 2000);
        }
      } catch (error) {
        console.error('Error processing auth callback:', error);
        setStatus('Error processing authentication. Redirecting...');
        
        setTimeout(() => {
          router.replace('/?error=callback_error');
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">{status}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        If this takes too long, you will be redirected automatically.
      </p>
    </div>
  );
} 