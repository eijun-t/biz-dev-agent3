'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getFlowEngine, AgentNode, FlowEdge, getNodeColor, getEdgeColor } from '@/lib/visualization/flow-engine';

interface AgentPipelineProps {
  className?: string;
  autoPlay?: boolean;
  showMetrics?: boolean;
  interactive?: boolean;
}

/**
 * Agent Pipeline Visualization Component
 * Displays the flow of data through different AI agents
 */
export default function AgentPipeline({ 
  className = '',
  autoPlay = false,
  showMetrics = true,
  interactive = true
}: AgentPipelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [flowEngine] = useState(() => getFlowEngine());
  const [flowState, setFlowState] = useState(flowEngine.getState());
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [metrics, setMetrics] = useState(flowEngine.getMetrics());

  useEffect(() => {
    // Subscribe to flow engine state changes
    const unsubscribe = flowEngine.subscribe((state) => {
      setFlowState(state);
      setMetrics(flowEngine.getMetrics());
    });

    return unsubscribe;
  }, [flowEngine]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 1200;
    const height = 400;

    // Clear previous content
    svg.selectAll('*').remove();

    // Set viewBox for responsiveness
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Create container groups
    const g = svg.append('g')
      .attr('transform', `translate(${flowState.pan.x}, ${flowState.pan.y}) scale(${flowState.zoom})`);

    // Define arrow markers
    svg.append('defs').selectAll('marker')
      .data(['pending', 'active', 'completed'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => getEdgeColor(d as FlowEdge['status']));

    // Draw edges
    const edges = g.selectAll('.edge')
      .data(flowState.edges)
      .enter().append('g')
      .attr('class', 'edge');

    edges.append('path')
      .attr('d', (d: FlowEdge) => {
        const sourceNode = flowState.nodes.find(n => n.id === d.source);
        const targetNode = flowState.nodes.find(n => n.id === d.target);
        if (!sourceNode || !targetNode) return '';

        const sx = sourceNode.position.x + 80;
        const sy = sourceNode.position.y;
        const tx = targetNode.position.x - 80;
        const ty = targetNode.position.y;

        return `M${sx},${sy} L${tx},${ty}`;
      })
      .attr('stroke', (d: FlowEdge) => getEdgeColor(d.status))
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', (d: FlowEdge) => `url(#arrow-${d.status})`)
      .attr('stroke-dasharray', (d: FlowEdge) => d.animated ? '5, 5' : 'none')
      .attr('class', (d: FlowEdge) => d.animated ? 'animated-edge' : '');

    // Draw nodes
    const nodes = g.selectAll('.node')
      .data(flowState.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', (d: AgentNode) => `translate(${d.position.x}, ${d.position.y})`);

    // Node background
    nodes.append('rect')
      .attr('x', -80)
      .attr('y', -40)
      .attr('width', 160)
      .attr('height', 80)
      .attr('rx', 8)
      .attr('fill', (d: AgentNode) => getNodeColor(d.status))
      .attr('stroke', '#475569')
      .attr('stroke-width', 2)
      .attr('class', 'node-bg');

    // Node icon based on type
    const icons = {
      researcher: '🔍',
      ideator: '💡',
      critic: '🎯',
      analyst: '📊',
      writer: '✍️'
    };

    nodes.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '24')
      .text((d: AgentNode) => icons[d.type]);

    // Node name
    nodes.append('text')
      .attr('x', 0)
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b')
      .text((d: AgentNode) => d.name);

    // Progress bar
    nodes.append('rect')
      .attr('x', -60)
      .attr('y', 20)
      .attr('width', 120)
      .attr('height', 8)
      .attr('rx', 4)
      .attr('fill', '#e2e8f0');

    nodes.append('rect')
      .attr('x', -60)
      .attr('y', 20)
      .attr('width', (d: AgentNode) => (120 * d.progress) / 100)
      .attr('height', 8)
      .attr('rx', 4)
      .attr('fill', '#3b82f6')
      .attr('class', 'progress-bar');

    // Progress text
    nodes.append('text')
      .attr('x', 65)
      .attr('y', 27)
      .attr('font-size', '12')
      .attr('fill', '#64748b')
      .text((d: AgentNode) => `${d.progress}%`);

    // Add interactivity
    if (interactive) {
      nodes.on('click', function(event, d: AgentNode) {
        console.log('Agent clicked:', d);
        // Simulate agent execution
        flowEngine.updateAgentStatus(d.id, 'running', 0);
        
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          flowEngine.updateAgentStatus(d.id, 'running', progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            flowEngine.updateAgentStatus(d.id, 'completed', 100);
          }
        }, 200);
      });

      nodes.style('cursor', 'pointer');
    }

    // Add CSS animations
    const style = svg.append('style');
    style.text(`
      .animated-edge {
        animation: dash 1s linear infinite;
      }
      @keyframes dash {
        to {
          stroke-dashoffset: -10;
        }
      }
      .node-bg {
        transition: fill 0.3s ease;
      }
      .progress-bar {
        transition: width 0.3s ease;
      }
      .node:hover .node-bg {
        filter: brightness(1.1);
      }
    `);

  }, [flowState, interactive]);

  const handlePlay = async () => {
    setIsPlaying(true);
    await flowEngine.simulateFlow();
    setIsPlaying(false);
  };

  const handleReset = () => {
    flowEngine.reset();
    setIsPlaying(false);
  };

  const handleAutoLayout = () => {
    flowEngine.autoLayout();
  };

  const handleZoomIn = () => {
    flowEngine.setZoom(flowState.zoom * 1.2);
  };

  const handleZoomOut = () => {
    flowEngine.setZoom(flowState.zoom / 1.2);
  };

  return (
    <div className={`agent-pipeline ${className}`}>
      <div className="pipeline-header">
        <h2 className="text-2xl font-bold mb-4">Agent Pipeline Visualization</h2>
        
        <div className="controls flex gap-2 mb-4">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isPlaying ? '⏸ Running...' : '▶ Play'}
          </button>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🔄 Reset
          </button>
          
          <button
            onClick={handleAutoLayout}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            📐 Auto Layout
          </button>
          
          <div className="zoom-controls flex gap-1">
            <button
              onClick={handleZoomIn}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              🔍+
            </button>
            <button
              onClick={handleZoomOut}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              🔍-
            </button>
          </div>
        </div>
      </div>

      <div className="pipeline-container">
        <svg 
          ref={svgRef}
          className="w-full h-96 border border-gray-300 rounded-lg bg-gray-50"
        />
      </div>

      {showMetrics && (
        <div className="metrics-panel mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Pipeline Metrics</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="metric">
              <span className="text-sm text-gray-600">Total Agents</span>
              <div className="text-2xl font-bold">{metrics.totalNodes}</div>
            </div>
            <div className="metric">
              <span className="text-sm text-gray-600">Completed</span>
              <div className="text-2xl font-bold text-green-600">{metrics.completedNodes}</div>
            </div>
            <div className="metric">
              <span className="text-sm text-gray-600">Progress</span>
              <div className="text-2xl font-bold text-blue-600">{metrics.progress.toFixed(1)}%</div>
            </div>
            <div className="metric">
              <span className="text-sm text-gray-600">Total Duration</span>
              <div className="text-2xl font-bold">{(metrics.totalDuration / 1000).toFixed(1)}s</div>
            </div>
            <div className="metric">
              <span className="text-sm text-gray-600">Avg Duration</span>
              <div className="text-2xl font-bold">{(metrics.avgDuration / 1000).toFixed(1)}s</div>
            </div>
          </div>
        </div>
      )}

      <div className="info-panel mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">How it works</h3>
        <p className="text-sm text-gray-700">
          This visualization shows the flow of data through our AI agent pipeline:
        </p>
        <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
          <li><strong>Researcher</strong>: Gathers information from web sources</li>
          <li><strong>Ideator</strong>: Generates business ideas based on research</li>
          <li><strong>Critic</strong>: Evaluates and filters ideas</li>
          <li><strong>Analyst</strong>: Performs detailed market analysis</li>
          <li><strong>Writer</strong>: Creates structured reports</li>
        </ul>
        {interactive && (
          <p className="mt-2 text-sm text-gray-600 italic">
            💡 Click on any agent to see it in action!
          </p>
        )}
      </div>
    </div>
  );
}