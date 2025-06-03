'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useMicrosoftAuth } from '@/modules/mailbox/services/MicrosoftAuthContext';

interface UnifiedAuthContextType {
  // Supabase auth
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  
  // Microsoft auth integration
  microsoftAccount: any;
  isMicrosoftSignedIn: boolean;
  isMicrosoftLoading: boolean;
  signInToMicrosoft: () => Promise<void>;
  signOutFromMicrosoft: () => Promise<void>;
  
  // Unified states
  hasAnyAuth: boolean;
  needsMicrosoftForEmail: boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

interface UnifiedAuthProviderProps {
  children: ReactNode;
}

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get Microsoft auth from the existing context
  const {
    account: microsoftAccount,
    isSignedIn: isMicrosoftSignedIn,
    isLoading: isMicrosoftLoading,
    signIn: microsoftSignIn,
    signOut: microsoftSignOut
  } = useMicrosoftAuth();

  useEffect(() => {
    // Get initial session with timeout protection
    const getInitialSession = async () => {
      console.log('🔍 Getting initial session...');
      try {
        // Set a race condition with timeout to prevent hanging  
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Supabase session timeout')), 1000) // Reduced from 3000ms to 1000ms
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        console.log('📦 Session response:', { session: !!session, error });
        
        if (error) {
          console.error('❌ Error getting session:', error);
        } else {
          console.log('✅ Session retrieved successfully:', { user: session?.user?.email || 'none' });
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('💥 Exception getting session (likely Supabase connection issue):', err);
        // On connection issues, proceed with no user (show landing page)
        setSession(null);
        setUser(null);
      } finally {
        console.log('🏁 Setting loading to false');
        setIsLoading(false);
      }
    };

    // Additional backup timeout to ensure loading always resolves
    const backupTimeout = setTimeout(() => {
      console.log('⏰ Backup timeout: forcing loading to false');
      setIsLoading(false);
    }, 2000); // Reduced from 5000ms to 2000ms

    getInitialSession().finally(() => {
      clearTimeout(backupTimeout);
    });

    // Listen for auth changes with error handling
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state change:', { event, user: session?.user?.email || 'none' });
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
        clearTimeout(backupTimeout);
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      clearTimeout(backupTimeout);
      return () => {};
    }
  }, []);

  const signOut = async () => {
    // Sign out from both services
    try {
      await supabase.auth.signOut();
      await microsoftSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signInToMicrosoft = async () => {
    try {
      await microsoftSignIn();
    } catch (error) {
      console.error('Error signing in to Microsoft:', error);
      throw error;
    }
  };

  const signOutFromMicrosoft = async () => {
    try {
      await microsoftSignOut();
    } catch (error) {
      console.error('Error signing out from Microsoft:', error);
      throw error;
    }
  };

  // Computed states
  const hasAnyAuth = !!user || isMicrosoftSignedIn;
  const needsMicrosoftForEmail = !isMicrosoftSignedIn; // Show prompt when Microsoft not connected

  return (
    <UnifiedAuthContext.Provider value={{
      // Supabase auth
      session,
      user,
      isLoading,
      signOut,
      
      // Microsoft auth
      microsoftAccount,
      isMicrosoftSignedIn,
      isMicrosoftLoading,
      signInToMicrosoft,
      signOutFromMicrosoft,
      
      // Unified states
      hasAnyAuth,
      needsMicrosoftForEmail,
    }}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
}; 