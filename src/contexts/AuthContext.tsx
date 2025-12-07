import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'research_nexus_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  useEffect(() => {
    // Check localStorage for existing auth
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored) as User;
      setState({
        isAuthenticated: true,
        user,
        isLoading: false
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      avatar: undefined
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setState({
      isAuthenticated: true,
      user,
      isLoading: false
    });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      isAuthenticated: false,
      user: null,
      isLoading: false
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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
