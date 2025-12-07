export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Project {
  id: number;  // Backend uses int, not string
  name: string;
  owner_id: number;
  created_at: string;
  papers?: Paper[];  // For ProjectDetail response
}

export interface Paper {
  id: number | string;
  external_paper_id: string;
  title: string;
  abstract?: string;
  year?: number;
  status: 'processing' | 'ready' | 'error';
  authors?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  citations: number;
  openAccessPdf?: {url: string};
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
  label: string;  // Changed from 'title' to match backend
  year?: number;  // Made optional to match backend
}

export interface CitationEdge {
  source: string;
  target: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}
