'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  id: string;
  source: string;
  target: string;
  value: number;
  type: 'research' | 'idea' | 'evaluation' | 'analysis' | 'report';
  timestamp: number;
  metadata?: any;
}

interface DataFlowProps {
  dataPoints?: DataPoint[];
  realtime?: boolean;
  animationSpeed?: number;
  className?: string;
}

/**
 * Data Flow Visualization Component
 * Shows real-time data flowing between agents
 */
export default function DataFlow({
  dataPoints = [],
  realtime = false,
  animationSpeed = 1000,
  className = ''
}: DataFlowProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentData, setCurrentData] = useState<DataPoint[]>(dataPoints);
  const [particles, setParticles] = useState<any[]>([]);
  const animationRef = useRef<number>();

  // Agent positions
  const agentPositions = {
    researcher: { x: 100, y: 200, color: '#3b82f6' },
    ideator: { x: 300, y: 200, color: '#8b5cf6' },
    critic: { x: 500, y: 200, color: '#ef4444' },
    analyst: { x: 700, y: 200, color: '#10b981' },
    writer: { x: 900, y: 200, color: '#f59e0b' }
  };

  // Generate sample data for demo
  useEffect(() => {
    if (realtime && currentData.length === 0) {
      const generateData = () => {
        const agents = Object.keys(agentPositions);
        const newData: DataPoint[] = [];
        
        for (let i = 0; i < 20; i++) {
          const sourceIdx = Math.floor(Math.random() * (agents.length - 1));
          const targetIdx = sourceIdx + 1;
          
          newData.push({
            id: `data-${Date.now()}-${i}`,
            source: agents[sourceIdx],
            target: agents[targetIdx],
            value: Math.random() * 100,
            type: agents[sourceIdx] as DataPoint['type'],
            timestamp: Date.now() + i * 500,
            metadata: {
              confidence: Math.random(),
              priority: Math.floor(Math.random() * 5) + 1
            }
          });
        }
        
        setCurrentData(newData);
      };

      generateData();
      const interval = setInterval(generateData, 10000);
      return () => clearInterval(interval);
    }
  }, [realtime, currentData.length]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 1200;
    const height = 400;

    // Clear previous content
    svg.selectAll('*').remove();

    // Set viewBox
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    // Create gradient definitions
    const defs = svg.append('defs');
    
    Object.entries(agentPositions).forEach(([agent, pos]) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${agent}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', pos.color)
        .style('stop-opacity', 0.2);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', pos.color)
        .style('stop-opacity', 0.8);
    });

    // Draw connections
    const connections = g.selectAll('.connection')
      .data(Object.keys(agentPositions).slice(0, -1))
      .enter().append('line')
      .attr('class', 'connection')
      .attr('x1', (d: string) => agentPositions[d].x)
      .attr('y1', (d: string) => agentPositions[d].y)
      .attr('x2', (d: string, i: number) => {
        const nextAgent = Object.keys(agentPositions)[i + 1];
        return agentPositions[nextAgent].x;
      })
      .attr('y2', (d: string, i: number) => {
        const nextAgent = Object.keys(agentPositions)[i + 1];
        return agentPositions[nextAgent].y;
      })
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5, 5');

    // Draw agent nodes
    const agents = g.selectAll('.agent')
      .data(Object.entries(agentPositions))
      .enter().append('g')
      .attr('class', 'agent')
      .attr('transform', ([agent, pos]) => `translate(${pos.x}, ${pos.y})`);

    // Agent circles
    agents.append('circle')
      .attr('r', 30)
      .attr('fill', ([agent, pos]) => pos.color)
      .attr('fill-opacity', 0.2)
      .attr('stroke', ([agent, pos]) => pos.color)
      .attr('stroke-width', 3)
      .attr('class', 'agent-circle');

    // Agent labels
    agents.append('text')
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b')
      .text(([agent]) => agent.charAt(0).toUpperCase() + agent.slice(1));

    // Create particle container
    const particleContainer = g.append('g').attr('class', 'particles');

    // Animate data flow
    const animateDataFlow = () => {
      currentData.forEach((dataPoint, index) => {
        setTimeout(() => {
          const sourcePos = agentPositions[dataPoint.source];
          const targetPos = agentPositions[dataPoint.target];
          
          if (!sourcePos || !targetPos) return;

          // Create particle
          const particle = particleContainer.append('g')
            .attr('class', 'particle')
            .attr('transform', `translate(${sourcePos.x}, ${sourcePos.y})`);

          // Particle circle
          particle.append('circle')
            .attr('r', Math.sqrt(dataPoint.value) * 2)
            .attr('fill', sourcePos.color)
            .attr('fill-opacity', 0.8);

          // Particle value text
          particle.append('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', '10')
            .attr('fill', 'white')
            .text(Math.round(dataPoint.value));

          // Animate particle movement
          particle.transition()
            .duration(animationSpeed)
            .ease(d3.easeCubicInOut)
            .attr('transform', `translate(${targetPos.x}, ${targetPos.y})`)
            .style('opacity', 0)
            .remove();

          // Flash target node
          d3.select(agents.nodes()[Object.keys(agentPositions).indexOf(dataPoint.target)])
            .select('.agent-circle')
            .transition()
            .duration(200)
            .attr('r', 35)
            .attr('fill-opacity', 0.5)
            .transition()
            .duration(200)
            .attr('r', 30)
            .attr('fill-opacity', 0.2);
        }, index * 200);
      });
    };

    // Start animation
    if (currentData.length > 0) {
      animateDataFlow();
      
      if (realtime) {
        const interval = setInterval(animateDataFlow, 10000);
        return () => clearInterval(interval);
      }
    }

    // Add hover effects
    agents.on('mouseenter', function() {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 35)
        .attr('fill-opacity', 0.4);
    }).on('mouseleave', function() {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('r', 30)
        .attr('fill-opacity', 0.2);
    });

    // Add CSS animations
    const style = svg.append('style');
    style.text(`
      .particle {
        pointer-events: none;
      }
      .agent {
        cursor: pointer;
      }
      .agent-circle {
        transition: all 0.3s ease;
      }
      @keyframes pulse {
        0% { r: 30; opacity: 0.2; }
        50% { r: 35; opacity: 0.4; }
        100% { r: 30; opacity: 0.2; }
      }
    `);

  }, [currentData, animationSpeed, realtime]);

  // Data statistics
  const getDataStats = () => {
    const stats = {
      total: currentData.length,
      byType: {} as Record<string, number>,
      avgValue: 0,
      maxValue: 0
    };

    currentData.forEach(d => {
      stats.byType[d.type] = (stats.byType[d.type] || 0) + 1;
      stats.avgValue += d.value;
      stats.maxValue = Math.max(stats.maxValue, d.value);
    });

    stats.avgValue = stats.total > 0 ? stats.avgValue / stats.total : 0;
    return stats;
  };

  const stats = getDataStats();

  return (
    <div className={`data-flow ${className}`}>
      <div className="flow-header mb-4">
        <h2 className="text-2xl font-bold">Data Flow Visualization</h2>
        <p className="text-gray-600">
          Real-time visualization of data flowing through the agent pipeline
        </p>
      </div>

      <div className="flow-container">
        <svg 
          ref={svgRef}
          className="w-full h-96 border border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100"
        />
      </div>

      <div className="stats-panel mt-4 grid grid-cols-4 gap-4">
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Data Points</div>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        </div>
        
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-600">Average Value</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.avgValue.toFixed(1)}
          </div>
        </div>
        
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-600">Max Value</div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.maxValue.toFixed(1)}
          </div>
        </div>
        
        <div className="stat-card p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-600">Flow Rate</div>
          <div className="text-2xl font-bold text-orange-600">
            {(stats.total / 10).toFixed(1)}/s
          </div>
        </div>
      </div>

      <div className="type-distribution mt-4 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Data Distribution by Type</h3>
        <div className="flex gap-4">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: agentPositions[type]?.color || '#gray' }}
              />
              <span className="text-sm">
                {type}: <strong>{count}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {realtime && (
        <div className="realtime-indicator mt-4 p-2 bg-green-100 rounded-lg text-center">
          <span className="text-green-700 font-semibold">
            🔴 Real-time Mode Active
          </span>
        </div>
      )}
    </div>
  );
}