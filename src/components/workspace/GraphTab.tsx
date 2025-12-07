import { useState, useEffect, useCallback } from 'react';
import { fetchCitationGraph } from '@/services/api';
import { CitationNode, CitationEdge } from '@/types';
import { Loader2 } from 'lucide-react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface GraphTabProps {
  projectId: string;
}

const nodeColors = {
  source: 'hsl(262, 83%, 58%)',
  cited: 'hsl(190, 95%, 45%)',
  citing: 'hsl(160, 84%, 39%)'
};

export function GraphTab({ projectId }: GraphTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadGraph();
  }, [projectId]);

  const loadGraph = async () => {
    setIsLoading(true);
    const { nodes: citationNodes, edges: citationEdges } = await fetchCitationGraph(projectId);
    
    // Convert to React Flow format
    const flowNodes: Node[] = citationNodes.map((node, index) => ({
      id: node.id,
      position: calculatePosition(index, citationNodes.length, node.type),
      data: { 
        label: (
          <div className="text-center">
            <div className="font-medium text-xs text-foreground line-clamp-2">{node.title}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{node.year}</div>
          </div>
        )
      },
      style: {
        background: `${nodeColors[node.type]}20`,
        border: `2px solid ${nodeColors[node.type]}`,
        borderRadius: '12px',
        padding: '12px',
        width: 150,
        fontSize: '12px',
        color: 'hsl(var(--foreground))'
      }
    }));

    const flowEdges: Edge[] = citationEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: 'hsl(262, 83%, 58%)', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(262, 83%, 58%)'
      }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
    setIsLoading(false);
  };

  const calculatePosition = (index: number, total: number, type: string) => {
    const centerX = 400;
    const centerY = 250;
    
    if (type === 'source') {
      return { x: centerX, y: centerY };
    }
    
    if (type === 'cited') {
      const angle = (Math.PI / 4) + (index * (Math.PI / 6));
      return {
        x: centerX - 200 * Math.cos(angle),
        y: centerY - 150 * Math.sin(angle)
      };
    }
    
    const angle = -(Math.PI / 4) + (index * (Math.PI / 6));
    return {
      x: centerX + 200 * Math.cos(angle),
      y: centerY + 150 * Math.sin(angle)
    };
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl h-[600px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Citation Network</h2>
          <p className="text-sm text-muted-foreground">Explore relationships between papers</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.source }} />
            <span className="text-muted-foreground">Source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.cited }} />
            <span className="text-muted-foreground">Cited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.citing }} />
            <span className="text-muted-foreground">Citing</span>
          </div>
        </div>
      </div>
      
      <div className="h-[550px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls className="bg-card border border-border rounded-lg" />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            color="hsl(var(--muted-foreground))"
            style={{ opacity: 0.3 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
