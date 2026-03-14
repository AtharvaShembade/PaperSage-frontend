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
  external_id: string;
  title: string;
  abstract?: string;
  year?: number;
  status: 'processing' | 'ready' | 'error' | 'no_pdf';
  authors?: string[];
  tldr?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number | null;
  citations: number | null;
  arxiv_id: string;
  pdf_url: string;
}

export interface ChatSource {
  title: string;
  chunk: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: ChatSource[];
  follow_ups?: string[];
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

export interface ComparisonRow {
  paper_id: number;
  title: string;
  year?: number;
  problem: string;
  method: string;
  dataset: string;
  result: string;
  limitation: string;
}

export interface ComparisonResponse {
  rows: ComparisonRow[];
  skipped: string[];
}

export interface Annotation {
  id: number;
  project_id: number;
  paper_title: string;
  chunk_text: string;
  user_note?: string;
  created_at: string;
}

export interface ChatSession {
  id: number;
  project_id: number;
  name: string;
  created_at: string;
  messages: ChatMessage[];
}

export interface GapEntry {
  claim: string;
  evidence: string;
  paper_title: string;
  paper_year?: number;
}

export interface GapSection {
  type: string;
  title: string;
  entries: GapEntry[];
}

export interface GapAnalysis {
  sections: GapSection[];
  focus?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}
