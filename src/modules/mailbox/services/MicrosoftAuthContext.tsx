"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { microsoftGraphService } from './microsoft-graph';

interface UserProfile {
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}

interface MicrosoftAuthContextType {
  account: AccountInfo | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: () => Promise<AuthenticationResult | null>;
  signOut: () => Promise<void>;
  userProfile: UserProfile | null;
}

const MicrosoftAuthContext = createContext<MicrosoftAuthContextType | undefined>(undefined);

interface MicrosoftAuthProviderProps {
  children: ReactNode;
}

export function MicrosoftAuthProvider({ children }: MicrosoftAuthProviderProps) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const initializeMicrosoft = async () => {
      try {
        await microsoftGraphService.initialize();
        
        // Check for redirect result first (returning from Microsoft auth)
        try {
          const redirectResult = await microsoftGraphService.msalInstance.handleRedirectPromise();
          if (redirectResult) {
            console.log('Redirect result received:', redirectResult);
            setAccount(redirectResult.account);
            // Set up the graph client with the new token
            microsoftGraphService.setupGraphClient(redirectResult.accessToken);
            
            // Get user profile
            try {
              const profile = await microsoftGraphService.getUserProfile();
              setUserProfile(profile);
            } catch (error) {
              console.error('Error fetching user profile after redirect:', error);
            }
          } else {
            // No redirect result, check for existing account
            const currentAccount = microsoftGraphService.getCurrentAccount();
            setAccount(currentAccount);

            // If user is signed in, get their profile
            if (currentAccount) {
              try {
                const profile = await microsoftGraphService.getUserProfile();
                setUserProfile(profile);
              } catch (error) {
                console.error('Error fetching user profile:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error handling redirect promise:', error);
          // Fallback to checking current account
          const currentAccount = microsoftGraphService.getCurrentAccount();
          setAccount(currentAccount);
        }
      } catch (error) {
        console.error('Error initializing Microsoft Graph:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMicrosoft();
  }, []);

  const signIn = async (): Promise<AuthenticationResult | null> => {
    setIsLoading(true);
    try {
      // For redirect flow, this will navigate away and not return
      await microsoftGraphService.signIn();
      return null; // Won't reach here due to redirect
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await microsoftGraphService.signOut();
      setAccount(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: MicrosoftAuthContextType = {
    account,
    isSignedIn: !!account,
    isLoading,
    signIn,
    signOut,
    userProfile,
  };

  return (
    <MicrosoftAuthContext.Provider value={value}>
      {children}
    </MicrosoftAuthContext.Provider>
  );
}

export function useMicrosoftAuth(): MicrosoftAuthContextType {
  const context = useContext(MicrosoftAuthContext);
  if (context === undefined) {
    throw new Error('useMicrosoftAuth must be used within a MicrosoftAuthProvider');
  }
  return context;
} 