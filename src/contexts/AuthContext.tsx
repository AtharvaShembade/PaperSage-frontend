import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  useEffect(() => {
    // Check for existing Supabase session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState({
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.email!.split('@')[0],
          },
          isLoading: false
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes (login/logout from other tabs, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState({
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.email!.split('@')[0],
          },
          isLoading: false
        });
      } else {
        setState({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up NEW users
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Note: Supabase may require email confirmation depending on your settings
    // The onAuthStateChange listener will update the state automatically
  };

  // Login EXISTING users
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    // The onAuthStateChange listener will update the state automatically
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will update the state automatically
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Helper to get token for API calls
export const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};
