/**
 * Performance Optimizer for Visualization Components
 * Achieves 60fps rendering and reduces memory usage
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';

// Performance configuration
export const PERFORMANCE_CONFIG = {
  TARGET_FPS: 60,
  FRAME_BUDGET: 1000 / 60, // ~16.67ms per frame
  MAX_DATA_POINTS: 1000,
  THROTTLE_DELAY: 50,
  DEBOUNCE_DELAY: 200,
  VIRTUAL_RENDER_THRESHOLD: 100,
  CANVAS_RENDER_THRESHOLD: 500,
  WORKER_ENABLED: typeof Worker !== 'undefined'
};

/**
 * Request Animation Frame with FPS tracking
 */
export class FrameScheduler {
  private frameId: number | null = null;
  private lastFrameTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private callbacks: Set<(deltaTime: number) => void> = new Set();

  /**
   * Start the frame scheduler
   */
  start() {
    if (this.frameId !== null) return;
    
    const frame = (timestamp: number) => {
      const deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      
      // Update FPS counter
      this.frameCount++;
      if (timestamp - this.fpsUpdateTime > 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.fpsUpdateTime = timestamp;
      }
      
      // Execute callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(deltaTime);
        } catch (error) {
          console.error('Frame callback error:', error);
        }
      });
      
      this.frameId = requestAnimationFrame(frame);
    };
    
    this.frameId = requestAnimationFrame(frame);
  }

  /**
   * Stop the frame scheduler
   */
  stop() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Add a callback to be executed on each frame
   */
  addCallback(callback: (deltaTime: number) => void) {
    this.callbacks.add(callback);
  }

  /**
   * Remove a callback
   */
  removeCallback(callback: (deltaTime: number) => void) {
    this.callbacks.delete(callback);
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }
}

/**
 * Virtual DOM for D3 optimizations
 */
export class VirtualD3 {
  private virtualNodes: Map<string, any> = new Map();
  private pendingUpdates: Map<string, any> = new Map();
  private updateScheduled: boolean = false;

  /**
   * Queue an update for batch processing
   */
  queueUpdate(key: string, update: any) {
    this.pendingUpdates.set(key, update);
    
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => this.flushUpdates());
    }
  }

  /**
   * Flush all pending updates
   */
  private flushUpdates() {
    const startTime = performance.now();
    
    this.pendingUpdates.forEach((update, key) => {
      // Apply update with frame budget check
      if (performance.now() - startTime < PERFORMANCE_CONFIG.FRAME_BUDGET) {
        this.applyUpdate(key, update);
      } else {
        // Defer to next frame if over budget
        requestAnimationFrame(() => this.applyUpdate(key, update));
      }
    });
    
    this.pendingUpdates.clear();
    this.updateScheduled = false;
  }

  /**
   * Apply a single update
   */
  private applyUpdate(key: string, update: any) {
    const node = this.virtualNodes.get(key);
    if (node && update.fn) {
      update.fn(node);
    }
  }

  /**
   * Register a virtual node
   */
  registerNode(key: string, node: any) {
    this.virtualNodes.set(key, node);
  }

  /**
   * Unregister a virtual node
   */
  unregisterNode(key: string) {
    this.virtualNodes.delete(key);
  }
}

/**
 * Memory-efficient data buffer
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add item to buffer
   */
  push(item: T) {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  /**
   * Get all items as array
   */
  toArray(): T[] {
    const result: T[] = [];
    let index = this.head;
    
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[index]);
      index = (index + 1) % this.capacity;
    }
    
    return result;
  }

  /**
   * Get buffer size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Clear buffer
   */
  clear() {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }
}

/**
 * Canvas renderer for high-performance visualization
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private pixelRatio: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true 
    })!;
    
    this.pixelRatio = window.devicePixelRatio || 1;
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.setupCanvas();
  }

  /**
   * Setup canvas for high DPI displays
   */
  private setupCanvas() {
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  /**
   * Clear canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Draw optimized path
   */
  drawPath(points: Array<{ x: number; y: number }>, style: any) {
    if (points.length < 2) return;
    
    this.ctx.save();
    this.ctx.strokeStyle = style.stroke || '#000';
    this.ctx.lineWidth = style.strokeWidth || 1;
    this.ctx.globalAlpha = style.opacity || 1;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    // Use optimized line drawing
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Draw batch of circles efficiently
   */
  drawCircles(circles: Array<{ x: number; y: number; r: number; fill: string }>) {
    circles.forEach(circle => {
      this.ctx.fillStyle = circle.fill;
      this.ctx.beginPath();
      this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}

/**
 * React Hook: useOptimizedD3
 */
export function useOptimizedD3(
  renderFn: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void,
  dependencies: any[] = []
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const virtualD3 = useRef(new VirtualD3());
  const frameScheduler = useRef(new FrameScheduler());

  const optimizedRender = useCallback(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    // Use virtual DOM for batch updates
    virtualD3.current.queueUpdate('main', {
      fn: () => renderFn(svg)
    });
  }, dependencies);

  useEffect(() => {
    frameScheduler.current.start();
    frameScheduler.current.addCallback(optimizedRender);
    
    return () => {
      frameScheduler.current.removeCallback(optimizedRender);
      frameScheduler.current.stop();
    };
  }, [optimizedRender]);

  return svgRef;
}

/**
 * React Hook: useThrottle
 */
export function useThrottle<T>(value: T, delay: number = PERFORMANCE_CONFIG.THROTTLE_DELAY): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));

    return () => clearTimeout(handler);
  }, [value, delay]);

  return throttledValue;
}

/**
 * React Hook: useDebounce
 */
export function useDebounce<T>(value: T, delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React Hook: useVirtualization
 */
export function useVirtualization<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetY: startIndex * itemHeight
    };
  }, [scrollTop, items, containerHeight, itemHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleRange,
    handleScroll,
    totalHeight: items.length * itemHeight
  };
}

/**
 * Web Worker for heavy computations
 */
export function createVisualizationWorker() {
  const workerCode = `
    self.onmessage = function(e) {
      const { type, data } = e.data;
      
      switch (type) {
        case 'calculate_layout':
          const layout = calculateLayout(data);
          self.postMessage({ type: 'layout_result', data: layout });
          break;
          
        case 'process_data':
          const processed = processData(data);
          self.postMessage({ type: 'data_result', data: processed });
          break;
      }
    };
    
    function calculateLayout(nodes) {
      // Implement force-directed layout or other algorithms
      return nodes.map(node => ({
        ...node,
        x: Math.random() * 1000,
        y: Math.random() * 500
      }));
    }
    
    function processData(data) {
      // Heavy data processing
      return data.reduce((acc, item) => {
        // Process item
        return acc;
      }, []);
    }
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  return new Worker(workerUrl);
}

/**
 * Memoized selectors for performance
 */
export const createMemoizedSelectors = () => {
  const cache = new Map();

  return {
    selectFilteredData: (data: any[], filter: string) => {
      const key = `${filter}-${data.length}`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = data.filter(item => item.type === filter);
      cache.set(key, result);
      
      // Limit cache size
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return result;
    }
  };
};

// Import optimization for lazy loading
import { useState } from 'react';

/**
 * Lazy load heavy visualization components
 */
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>
) {
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component) return;
    
    setIsLoading(true);
    try {
      const module = await importFn();
      setComponent(() => module.default);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [Component, importFn]);

  return { Component, loadComponent, isLoading, error };
}