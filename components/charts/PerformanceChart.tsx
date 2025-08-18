'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface PerformanceMetric {
  timestamp: Date;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface PerformanceChartProps {
  metrics?: PerformanceMetric[];
  timeRange?: '1h' | '6h' | '24h' | '7d';
  metricType?: 'latency' | 'throughput' | 'resources' | 'errors';
  realtime?: boolean;
  className?: string;
}

/**
 * Performance Chart Component
 * Displays system performance metrics over time
 */
export default function PerformanceChart({
  metrics = [],
  timeRange = '1h',
  metricType = 'latency',
  realtime = false,
  className = ''
}: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetric[]>(metrics);
  const [selectedMetric, setSelectedMetric] = useState(metricType);
  const [selectedRange, setSelectedRange] = useState(timeRange);

  // Generate sample data if none provided
  useEffect(() => {
    if (currentMetrics.length === 0) {
      const now = Date.now();
      const dataPoints = 60; // 60 data points
      const interval = 60000; // 1 minute intervals
      
      const sampleData: PerformanceMetric[] = [];
      for (let i = 0; i < dataPoints; i++) {
        sampleData.push({
          timestamp: new Date(now - (dataPoints - i) * interval),
          p50: 40 + Math.random() * 20,
          p95: 80 + Math.random() * 40,
          p99: 120 + Math.random() * 60,
          throughput: 1200 + Math.random() * 400,
          errorRate: Math.random() * 0.02,
          cpuUsage: 30 + Math.random() * 40,
          memoryUsage: 40 + Math.random() * 30
        });
      }
      setCurrentMetrics(sampleData);
    }
  }, [currentMetrics.length]);

  // Simulate real-time updates
  useEffect(() => {
    if (!realtime) return;

    const interval = setInterval(() => {
      setCurrentMetrics(prev => {
        const newMetric: PerformanceMetric = {
          timestamp: new Date(),
          p50: 40 + Math.random() * 20,
          p95: 80 + Math.random() * 40,
          p99: 120 + Math.random() * 60,
          throughput: 1200 + Math.random() * 400,
          errorRate: Math.random() * 0.02,
          cpuUsage: 30 + Math.random() * 40,
          memoryUsage: 40 + Math.random() * 30
        };
        
        const updated = [...prev.slice(-59), newMetric];
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [realtime]);

  useEffect(() => {
    if (!svgRef.current || currentMetrics.length === 0) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    svg.selectAll('*').remove();

    // Set viewBox
    svg.attr('viewBox', `0 0 800 400`);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data based on selected metric
    let data: Array<{ date: Date; value: number; series: string }> = [];
    
    switch (selectedMetric) {
      case 'latency':
        data = [
          ...currentMetrics.map(d => ({ date: d.timestamp, value: d.p50, series: 'P50' })),
          ...currentMetrics.map(d => ({ date: d.timestamp, value: d.p95, series: 'P95' })),
          ...currentMetrics.map(d => ({ date: d.timestamp, value: d.p99, series: 'P99' }))
        ];
        break;
      case 'throughput':
        data = currentMetrics.map(d => ({ 
          date: d.timestamp, 
          value: d.throughput, 
          series: 'Throughput' 
        }));
        break;
      case 'resources':
        data = [
          ...currentMetrics.map(d => ({ date: d.timestamp, value: d.cpuUsage, series: 'CPU' })),
          ...currentMetrics.map(d => ({ date: d.timestamp, value: d.memoryUsage, series: 'Memory' }))
        ];
        break;
      case 'errors':
        data = currentMetrics.map(d => ({ 
          date: d.timestamp, 
          value: d.errorRate * 100, 
          series: 'Error Rate' 
        }));
        break;
    }

    // Group data by series
    const series = d3.group(data, d => d.series);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(currentMetrics, d => d.timestamp) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number * 1.1])
      .range([height, 0]);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(Array.from(series.keys()))
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);

    // Grid lines
    const xGrid = d3.axisBottom(xScale)
      .tickSize(height)
      .tickFormat(() => '')
      .ticks(10);

    const yGrid = d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)
      .call(xGrid);

    g.append('g')
      .attr('class', 'grid')
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)
      .call(yGrid);

    // Line generator
    const line = d3.line<{ date: Date; value: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw lines for each series
    series.forEach((values, key) => {
      // Area under line
      const area = d3.area<{ date: Date; value: number }>()
        .x(d => xScale(d.date))
        .y0(height)
        .y1(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(values)
        .attr('fill', colorScale(key) as string)
        .attr('fill-opacity', 0.1)
        .attr('d', area);

      // Line
      g.append('path')
        .datum(values)
        .attr('fill', 'none')
        .attr('stroke', colorScale(key) as string)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Data points
      g.selectAll(`.dot-${key}`)
        .data(values)
        .enter().append('circle')
        .attr('class', `dot-${key}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 3)
        .attr('fill', colorScale(key) as string);
    });

    // X-axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%H:%M') as any)
      .ticks(6);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    // Y-axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5);

    g.append('g')
      .call(yAxis);

    // Y-axis label
    const yLabels = {
      latency: 'Latency (ms)',
      throughput: 'Requests/sec',
      resources: 'Usage (%)',
      errors: 'Error Rate (%)'
    };

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(yLabels[selectedMetric]);

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${width - 100}, 20)`);

    const legendItems = Array.from(series.keys());
    legendItems.forEach((key, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(key) as string);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .text(key);
    });

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '10px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('font-size', '12px');

    // Add interactivity
    series.forEach((values, key) => {
      g.selectAll(`.dot-${key}`)
        .on('mouseover', function(event, d: any) {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html(`
            <strong>${key}</strong><br/>
            Time: ${d3.timeFormat('%H:%M:%S')(d.date)}<br/>
            Value: ${d.value.toFixed(2)}
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });
    });

    // Cleanup tooltip on unmount
    return () => {
      d3.select('body').selectAll('.tooltip').remove();
    };

  }, [currentMetrics, selectedMetric]);

  // Calculate current stats
  const getLatestStats = () => {
    if (currentMetrics.length === 0) return null;
    const latest = currentMetrics[currentMetrics.length - 1];
    
    return {
      p50: latest.p50,
      p95: latest.p95,
      p99: latest.p99,
      throughput: latest.throughput,
      errorRate: latest.errorRate * 100,
      cpuUsage: latest.cpuUsage,
      memoryUsage: latest.memoryUsage
    };
  };

  const stats = getLatestStats();

  return (
    <div className={`performance-chart ${className}`}>
      <div className="chart-header mb-4">
        <h2 className="text-2xl font-bold mb-2">Performance Metrics</h2>
        
        {/* Controls */}
        <div className="controls flex gap-4 mb-4">
          <div className="metric-selector">
            <label className="text-sm text-gray-600 mr-2">Metric:</label>
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-1 border rounded-lg"
            >
              <option value="latency">Latency</option>
              <option value="throughput">Throughput</option>
              <option value="resources">Resources</option>
              <option value="errors">Errors</option>
            </select>
          </div>
          
          <div className="range-selector">
            <label className="text-sm text-gray-600 mr-2">Range:</label>
            <select 
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value as any)}
              className="px-3 py-1 border rounded-lg"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* Current Stats */}
        {stats && (
          <div className="current-stats grid grid-cols-7 gap-2 mb-4">
            <div className="stat-card p-2 bg-blue-50 rounded">
              <div className="text-xs text-gray-600">P50</div>
              <div className="text-lg font-bold text-blue-600">{stats.p50.toFixed(1)}ms</div>
            </div>
            <div className="stat-card p-2 bg-green-50 rounded">
              <div className="text-xs text-gray-600">P95</div>
              <div className="text-lg font-bold text-green-600">{stats.p95.toFixed(1)}ms</div>
            </div>
            <div className="stat-card p-2 bg-orange-50 rounded">
              <div className="text-xs text-gray-600">P99</div>
              <div className="text-lg font-bold text-orange-600">{stats.p99.toFixed(1)}ms</div>
            </div>
            <div className="stat-card p-2 bg-purple-50 rounded">
              <div className="text-xs text-gray-600">Throughput</div>
              <div className="text-lg font-bold text-purple-600">{stats.throughput.toFixed(0)}/s</div>
            </div>
            <div className="stat-card p-2 bg-red-50 rounded">
              <div className="text-xs text-gray-600">Error Rate</div>
              <div className="text-lg font-bold text-red-600">{stats.errorRate.toFixed(2)}%</div>
            </div>
            <div className="stat-card p-2 bg-indigo-50 rounded">
              <div className="text-xs text-gray-600">CPU</div>
              <div className="text-lg font-bold text-indigo-600">{stats.cpuUsage.toFixed(1)}%</div>
            </div>
            <div className="stat-card p-2 bg-teal-50 rounded">
              <div className="text-xs text-gray-600">Memory</div>
              <div className="text-lg font-bold text-teal-600">{stats.memoryUsage.toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="chart-container">
        <svg 
          ref={svgRef}
          className="w-full h-96 border border-gray-300 rounded-lg bg-white"
        />
      </div>

      {/* Thresholds */}
      <div className="thresholds mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Performance Thresholds</h3>
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-600">P95 Target:</span>
            <span className="font-bold ml-1">&lt; 180ms</span>
          </div>
          <div>
            <span className="text-gray-600">Throughput Target:</span>
            <span className="font-bold ml-1">&gt; 1250 req/s</span>
          </div>
          <div>
            <span className="text-gray-600">Error Rate Target:</span>
            <span className="font-bold ml-1">&lt; 1%</span>
          </div>
          <div>
            <span className="text-gray-600">Availability Target:</span>
            <span className="font-bold ml-1">&gt; 99.9%</span>
          </div>
        </div>
      </div>

      {realtime && (
        <div className="realtime-indicator mt-4 p-2 bg-green-100 rounded-lg text-center">
          <span className="text-green-700 font-semibold text-sm">
            🔴 Live Updates Enabled (1s refresh)
          </span>
        </div>
      )}
    </div>
  );
}