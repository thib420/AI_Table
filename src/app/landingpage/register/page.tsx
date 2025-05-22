"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/landingpage/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p>Redirecting to login...</p>
      {/* You can add a spinner here if desired */}
    </div>
  );
} 