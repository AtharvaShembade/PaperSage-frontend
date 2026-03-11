import { Project, Paper, SearchResult, ChatMessage, ChatSource, CitationNode, CitationEdge, ComparisonResponse, Annotation } from '@/types';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

// Helper to get auth token from Supabase
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Fetch all projects
export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects/`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
}

// Create a project
export async function createProject(name: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects/`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to create project');
  return response.json();
}

// Delete a project
export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete project');
}

// Get project details
export async function fetchProject(id: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch project');
  return response.json();
}

// Add paper to project
export async function addPaperToProject(
  projectId: string,
  paper: { external_id: string; title: string; abstract?: string; year?: number; pdf_url?: string; arxiv_id?: string }
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/papers/projects/${projectId}/add-paper`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(paper),
  });
  if (!response.ok) throw new Error('Failed to add paper');
}

// Chat with RAG
export async function sendChatMessage(projectId: string, message: string, deep = false): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE_URL}/rag/chat`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ project_id: parseInt(projectId), query: message, deep }),
  });
  if (!response.ok) throw Object.assign(new Error('Failed to send message'), { status: response.status });
  const data = await response.json();
  
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: data.answer,
    timestamp: new Date().toISOString(),
    sources: data.sources ?? [],
    follow_ups: data.follow_ups ?? [],
  };
}

// Search papers (Semantic Scholar)
export async function searchPapers(query: string): Promise<SearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/search/?q=${encodeURIComponent(query)}&limit=20`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to search papers');
  return response.json();
}

// Fetch papers in a project
export async function fetchProjectPapers(projectId: string): Promise<Paper[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch project papers');
  const project = await response.json();
  return project.papers || [];
}

// Fetch citation graph for a project
export async function fetchCitationGraph(projectId: string): Promise<{ nodes: CitationNode[]; edges: CitationEdge[] }> {
  const response = await fetch(`${API_BASE_URL}/analysis/projects/${projectId}/analysis`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch citation graph');
  return response.json();
}

// Fetch comparison table for a project
export async function fetchComparisonTable(projectId: string): Promise<ComparisonResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/projects/${projectId}/comparison`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch comparison table');
  return response.json();
}

// Annotations
export async function fetchAnnotations(projectId: string): Promise<Annotation[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/annotations`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch annotations');
  return response.json();
}

export async function pinAnnotation(projectId: string, paperTitle: string, chunkText: string): Promise<Annotation> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/annotations`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ paper_title: paperTitle, chunk_text: chunkText }),
  });
  if (!response.ok) throw new Error('Failed to pin annotation');
  return response.json();
}

export async function updateAnnotation(annotationId: number, userNote: string): Promise<Annotation> {
  const response = await fetch(`${API_BASE_URL}/annotations/${annotationId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ user_note: userNote }),
  });
  if (!response.ok) throw new Error('Failed to update annotation');
  return response.json();
}

export async function deleteAnnotation(annotationId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/annotations/${annotationId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete annotation');
}

// Remove paper from project
export async function removePaperFromProject(projectId: string, paperId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/papers/projects/${projectId}/papers/${paperId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to remove paper');
}

