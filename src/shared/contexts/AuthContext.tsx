'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session with timeout protection
    const getInitialSession = async () => {
      console.log('🔍 Getting initial session...');
      try {
        // Set a race condition with timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Supabase session timeout')), 3000)
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
    }, 5000);

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 