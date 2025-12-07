import { Project, Paper, SearchResult, ChatMessage, CitationNode, CitationEdge } from '@/types';

// Simulated delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Projects Data
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'AI Alignment Research',
    description: 'Exploring safety and alignment techniques for large language models',
    papersCount: 12,
    createdAt: '2024-01-15',
    updatedAt: '2024-03-10',
    status: 'active'
  },
  {
    id: '2',
    name: 'Quantum Computing History',
    description: 'A comprehensive survey of quantum computing milestones',
    papersCount: 8,
    createdAt: '2024-02-20',
    updatedAt: '2024-03-08',
    status: 'active'
  },
  {
    id: '3',
    name: 'Climate Change Meta-Analysis',
    description: 'Synthesizing research on climate change impacts and mitigation',
    papersCount: 24,
    createdAt: '2023-11-05',
    updatedAt: '2024-03-01',
    status: 'active'
  },
  {
    id: '4',
    name: 'Neural Architecture Search',
    description: 'Automated methods for discovering optimal neural network architectures',
    papersCount: 6,
    createdAt: '2024-03-01',
    updatedAt: '2024-03-12',
    status: 'active'
  }
];

// Mock Search Results
const mockSearchResults: SearchResult[] = [
  {
    id: 'sr1',
    title: 'Attention Is All You Need',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.'],
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
    year: 2017,
    citations: 89432
  },
  {
    id: 'sr2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Devlin, J.', 'Chang, M.', 'Lee, K.'],
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations.',
    year: 2018,
    citations: 67891
  },
  {
    id: 'sr3',
    title: 'Language Models are Few-Shot Learners',
    authors: ['Brown, T.', 'Mann, B.', 'Ryder, N.'],
    abstract: 'We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches.',
    year: 2020,
    citations: 12543
  },
  {
    id: 'sr4',
    title: 'Constitutional AI: Harmlessness from AI Feedback',
    authors: ['Bai, Y.', 'Kadavath, S.', 'Kundu, S.'],
    abstract: 'We propose Constitutional AI, a method for training AI assistants that are helpful, harmless, and honest, using a small set of principles to guide AI behavior.',
    year: 2022,
    citations: 2341
  }
];

// Mock Papers in Project
const mockPapers: Paper[] = [
  {
    id: 'p1',
    title: 'Attention Is All You Need',
    authors: ['Vaswani, A.', 'Shazeer, N.'],
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',
    year: 2017,
    status: 'ready',
    citations: 89432
  },
  {
    id: 'p2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Devlin, J.', 'Chang, M.'],
    abstract: 'We introduce a new language representation model called BERT.',
    year: 2018,
    status: 'ready',
    citations: 67891
  }
];

// Mock Citation Graph
const mockNodes: CitationNode[] = [
  { id: 'n1', title: 'Attention Is All You Need', year: 2017, type: 'source' },
  { id: 'n2', title: 'BERT', year: 2018, type: 'citing' },
  { id: 'n3', title: 'GPT-2', year: 2019, type: 'citing' },
  { id: 'n4', title: 'Sequence to Sequence Learning', year: 2014, type: 'cited' },
  { id: 'n5', title: 'Neural Machine Translation', year: 2015, type: 'cited' },
  { id: 'n6', title: 'GPT-3', year: 2020, type: 'citing' }
];

const mockEdges: CitationEdge[] = [
  { id: 'e1', source: 'n4', target: 'n1' },
  { id: 'e2', source: 'n5', target: 'n1' },
  { id: 'e3', source: 'n1', target: 'n2' },
  { id: 'e4', source: 'n1', target: 'n3' },
  { id: 'e5', source: 'n3', target: 'n6' }
];

// API Functions
export async function fetchProjects(): Promise<Project[]> {
  await delay(800);
  return [...mockProjects];
}

export async function createProject(name: string, description: string): Promise<Project> {
  await delay(500);
  const newProject: Project = {
    id: Date.now().toString(),
    name,
    description,
    papersCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    status: 'active'
  };
  mockProjects.push(newProject);
  return newProject;
}

export async function fetchProject(id: string): Promise<Project | undefined> {
  await delay(300);
  return mockProjects.find(p => p.id === id);
}

export async function searchPapers(query: string): Promise<SearchResult[]> {
  await delay(1000);
  return mockSearchResults.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.abstract.toLowerCase().includes(query.toLowerCase())
  );
}

export async function fetchProjectPapers(projectId: string): Promise<Paper[]> {
  await delay(500);
  return [...mockPapers];
}

export async function addPaperToProject(projectId: string, searchResult: SearchResult): Promise<Paper> {
  await delay(300);
  const paper: Paper = {
    id: Date.now().toString(),
    title: searchResult.title,
    authors: searchResult.authors,
    abstract: searchResult.abstract,
    year: searchResult.year,
    status: 'processing',
    citations: searchResult.citations
  };
  mockPapers.push(paper);
  return paper;
}

export async function processPaper(paperId: string): Promise<Paper> {
  await delay(3000);
  const paper = mockPapers.find(p => p.id === paperId);
  if (paper) {
    paper.status = 'ready';
  }
  return paper!;
}

export async function sendChatMessage(projectId: string, message: string): Promise<ChatMessage> {
  await delay(1500);
  
  const responses = [
    "Based on the paper 'Attention Is All You Need', the Transformer architecture uses self-attention mechanisms to process input sequences in parallel, rather than sequentially like RNNs. This enables much faster training and better capture of long-range dependencies.",
    "According to the research papers in this project, the key innovation was replacing recurrence with attention mechanisms. The multi-head attention allows the model to jointly attend to information from different representation subspaces.",
    "The papers suggest that pre-training on large corpora followed by fine-tuning on specific tasks has become the dominant paradigm in NLP. BERT's bidirectional training was particularly influential.",
    "From the collected research, Constitutional AI proposes using a set of principles to guide AI behavior, making systems more helpful while reducing harmful outputs through iterative feedback."
  ];
  
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: responses[Math.floor(Math.random() * responses.length)],
    timestamp: new Date().toISOString(),
    sources: ['Attention Is All You Need (2017)', 'BERT (2018)']
  };
}

export async function fetchCitationGraph(projectId: string): Promise<{ nodes: CitationNode[]; edges: CitationEdge[] }> {
  await delay(600);
  return { nodes: mockNodes, edges: mockEdges };
}
