import { Project, Paper, SearchResult, ChatMessage, ChatSource, CitationNode, CitationEdge, ComparisonResponse, Annotation, ChatSession, GapAnalysis } from '@/types';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to get auth token from Supabase
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!response.ok) {
    throw new ApiError(response.status, await response.text().catch(() => response.statusText));
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

// Fetch all projects
export async function fetchProjects(): Promise<Project[]> {
  return apiFetch('/projects/');
}

// Create a project
export async function createProject(name: string): Promise<Project> {
  return apiFetch('/projects/', { method: 'POST', body: JSON.stringify({ name }) });
}

// Delete a project
export async function deleteProject(id: string): Promise<void> {
  return apiFetch(`/projects/${id}`, { method: 'DELETE' });
}

// Get project details
export async function fetchProject(id: string): Promise<Project> {
  return apiFetch(`/projects/${id}`);
}

// Add paper to project
export async function addPaperToProject(
  projectId: string,
  paper: { external_id: string; title: string; abstract?: string; year?: number; pdf_url?: string; arxiv_id?: string }
): Promise<void> {
  return apiFetch(`/papers/projects/${projectId}/add-paper`, { method: 'POST', body: JSON.stringify(paper) });
}

// Chat with RAG — streaming. Returns raw Response for caller to read as a stream.
export async function streamChatMessage(projectId: string, message: string, deep = false): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}/rag/stream`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ project_id: parseInt(projectId), query: message, deep }),
  });
  if (!response.ok) throw Object.assign(new Error('Failed to stream message'), { status: response.status });
  return response;
}

// Chat with RAG (non-streaming fallback)
export async function sendChatMessage(projectId: string, message: string, deep = false): Promise<ChatMessage> {
  const data = await apiFetch<{ answer: string; sources: ChatSource[]; follow_ups: string[] }>('/rag/chat', {
    method: 'POST',
    body: JSON.stringify({ project_id: parseInt(projectId), query: message, deep }),
  });
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: data.answer,
    timestamp: new Date().toISOString(),
    sources: data.sources ?? [],
    follow_ups: data.follow_ups ?? [],
  };
}

// Discover related papers for a project
export async function fetchRelatedPapers(projectId: string): Promise<SearchResult[]> {
  return apiFetch(`/projects/${projectId}/discover`);
}

// Search papers (Semantic Scholar)
export async function searchPapers(query: string): Promise<SearchResult[]> {
  return apiFetch(`/search/?q=${encodeURIComponent(query)}&limit=20`);
}

// Fetch papers in a project
export async function fetchProjectPapers(projectId: string): Promise<Paper[]> {
  const project = await apiFetch<{ papers?: Paper[] }>(`/projects/${projectId}`);
  return project.papers || [];
}

// Fetch citation graph for a project
export async function fetchCitationGraph(projectId: string): Promise<{ nodes: CitationNode[]; edges: CitationEdge[] }> {
  return apiFetch(`/analysis/projects/${projectId}/analysis`);
}

// Fetch comparison table for a project
export async function fetchComparisonTable(projectId: string): Promise<ComparisonResponse> {
  return apiFetch(`/analysis/projects/${projectId}/comparison`);
}

// Annotations
export async function fetchAnnotations(projectId: string): Promise<Annotation[]> {
  return apiFetch(`/projects/${projectId}/annotations`);
}

export async function pinAnnotation(projectId: string, paperTitle: string, chunkText: string): Promise<Annotation> {
  return apiFetch(`/projects/${projectId}/annotations`, {
    method: 'POST',
    body: JSON.stringify({ paper_title: paperTitle, chunk_text: chunkText }),
  });
}

export async function updateAnnotation(annotationId: number, userNote: string): Promise<Annotation> {
  return apiFetch(`/annotations/${annotationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ user_note: userNote }),
  });
}

export async function deleteAnnotation(annotationId: number): Promise<void> {
  return apiFetch(`/annotations/${annotationId}`, { method: 'DELETE' });
}

// Literature Review
export async function litReviewSearch(projectId: string, question: string): Promise<{ paper_ids: number[]; message: string }> {
  return apiFetch(`/projects/${projectId}/lit-review/search`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

export async function litReviewGenerate(projectId: string, question: string): Promise<{ review: string }> {
  return apiFetch(`/projects/${projectId}/lit-review/generate`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

// Chat sessions
export async function fetchChatSessions(projectId: string): Promise<ChatSession[]> {
  return apiFetch(`/projects/${projectId}/chat-sessions`);
}

export async function createChatSession(projectId: string, name = 'New Chat'): Promise<ChatSession> {
  return apiFetch(`/projects/${projectId}/chat-sessions`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateChatSession(
  sessionId: number,
  data: { name?: string; messages?: object[] }
): Promise<ChatSession> {
  return apiFetch(`/chat-sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteChatSession(sessionId: number): Promise<void> {
  return apiFetch(`/chat-sessions/${sessionId}`, { method: 'DELETE' });
}

// Gap analysis
export async function runGapAnalysis(projectId: string, focus?: string): Promise<GapAnalysis> {
  return apiFetch(`/projects/${projectId}/gap-analysis`, {
    method: 'POST',
    body: JSON.stringify({ focus: focus || null }),
  });
}

// Remove paper from project
export async function removePaperFromProject(projectId: string, paperId: string): Promise<void> {
  return apiFetch(`/papers/projects/${projectId}/papers/${paperId}`, { method: 'DELETE' });
}

