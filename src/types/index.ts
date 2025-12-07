export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  papersCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived';
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  status: 'searching' | 'processing' | 'ready' | 'error';
  citations?: number;
  url?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  citations: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface CitationNode {
  id: string;
  title: string;
  year: number;
  type: 'source' | 'cited' | 'citing';
}

export interface CitationEdge {
  id: string;
  source: string;
  target: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}
