import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AuthAction = 'signIn' | 'signUp';

interface AuthModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAuth: (action: AuthAction, credentials: { email: string; password?: string }) => void;
  isLoading: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, setIsOpen, onAuth, isLoading }) => {
  const [authMode, setAuthMode] = useState<AuthAction>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleEmailAuth = () => {
    if (authMode === 'signUp' && password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordError('');

    if (email && password) {
      onAuth(authMode, { email, password });
    }
  };

  const toggleMode = () => {
    setAuthMode(prevMode => (prevMode === 'signIn' ? 'signUp' : 'signIn'));
    setEmail('');
    setPassword('');
    setPasswordError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{authMode === 'signIn' ? 'Sign In' : 'Sign Up'}</DialogTitle>
          <DialogDescription>
            {authMode === 'signIn' 
              ? "Enter your credentials to sign in." 
              : "Create an account to get started."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                disabled={isLoading}
              />
              {passwordError && <p className="text-xs text-red-500 pt-1">{passwordError}</p>}
            </div>
            <Button onClick={handleEmailAuth} disabled={!email || !password || isLoading} className="w-full">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                authMode === 'signIn' ? 'Sign In' : 'Sign Up'
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="link" onClick={toggleMode} className="w-full text-sm">
            {authMode === 'signIn'
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 