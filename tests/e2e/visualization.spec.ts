/**
 * E2E Test Scenarios for Visualization Components
 * Tests integration between Worker1 UI, Worker2 WebSocket, and Worker3 Visualization
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WS_URL = process.env.WS_URL || 'ws://localhost:3001/ws';

// Helper functions
async function waitForWebSocketConnection(page: Page) {
  await page.waitForSelector('.connection-status', { state: 'visible' });
  await expect(page.locator('.connection-status')).toContainText('Connected', { timeout: 10000 });
}

async function clickAgent(page: Page, agentName: string) {
  await page.locator(`.node:has-text("${agentName}")`).click();
}

async function waitForAgentProgress(page: Page, agentName: string, minProgress: number) {
  await page.waitForFunction(
    ([name, progress]) => {
      const agent = document.querySelector(`.node:has-text("${name}")`);
      if (!agent) return false;
      const progressText = agent.querySelector('.progress-text')?.textContent || '0%';
      return parseInt(progressText) >= progress;
    },
    [agentName, minProgress],
    { timeout: 30000 }
  );
}

// Test Suite: Dashboard Integration
test.describe('Dashboard Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
  });

  test('should load integrated dashboard with all components', async ({ page }) => {
    // Check main components are visible
    await expect(page.locator('h1:has-text("AI Agent Dashboard")')).toBeVisible();
    await expect(page.locator('.agent-pipeline')).toBeVisible();
    await expect(page.locator('.data-flow')).toBeVisible();
    await expect(page.locator('.progress-tracker')).toBeVisible();
    await expect(page.locator('.performance-chart')).toBeVisible();
  });

  test('should show WebSocket connection status', async ({ page }) => {
    const connectionStatus = page.locator('.connection-status');
    await expect(connectionStatus).toBeVisible();
    await expect(connectionStatus).toContainText(/Connected|Live/);
  });

  test('should switch between tab layouts', async ({ page }) => {
    // Switch to tabs layout
    await page.locator('button:has-text("Tabs View")').click();
    
    // Check tab navigation
    await expect(page.locator('.tab-nav')).toBeVisible();
    
    // Navigate through tabs
    await page.locator('button:has-text("Pipeline")').click();
    await expect(page.locator('.agent-pipeline')).toBeVisible();
    
    await page.locator('button:has-text("Data Flow")').click();
    await expect(page.locator('.data-flow')).toBeVisible();
    
    await page.locator('button:has-text("Progress")').click();
    await expect(page.locator('.progress-tracker')).toBeVisible();
    
    await page.locator('button:has-text("Performance")').click();
    await expect(page.locator('.performance-chart')).toBeVisible();
  });
});

// Test Suite: Agent Pipeline Interaction
test.describe('Agent Pipeline Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
  });

  test('should execute agent pipeline on click', async ({ page }) => {
    // Click on researcher agent
    await clickAgent(page, 'Researcher');
    
    // Wait for progress
    await waitForAgentProgress(page, 'Researcher', 50);
    await waitForAgentProgress(page, 'Researcher', 100);
    
    // Check status changed to completed
    await expect(page.locator('.node:has-text("Researcher") .node-bg')).toHaveCSS('fill', /#10b981/);
  });

  test('should show agent pipeline flow animation', async ({ page }) => {
    // Start pipeline
    await page.locator('button:has-text("Play")').click();
    
    // Check animations are running
    await expect(page.locator('.animated-edge')).toBeVisible();
    
    // Wait for completion
    await page.waitForTimeout(10000);
    
    // Check all agents completed
    const completedAgents = await page.locator('.node-bg[fill="#10b981"]').count();
    expect(completedAgents).toBe(5);
  });

  test('should zoom and pan the pipeline view', async ({ page }) => {
    const pipeline = page.locator('.agent-pipeline svg');
    
    // Zoom in
    await page.locator('button:has-text("🔍+")').click();
    await page.waitForTimeout(500);
    
    // Zoom out
    await page.locator('button:has-text("🔍-")').click();
    await page.waitForTimeout(500);
    
    // Auto layout
    await page.locator('button:has-text("Auto Layout")').click();
    await expect(pipeline).toBeVisible();
  });
});

// Test Suite: Real-time Data Flow
test.describe('Real-time Data Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
  });

  test('should display real-time data particles', async ({ page }) => {
    // Wait for data flow animation
    await page.waitForSelector('.particle', { state: 'visible', timeout: 10000 });
    
    // Count particles
    const particles = await page.locator('.particle').count();
    expect(particles).toBeGreaterThan(0);
  });

  test('should update data statistics in real-time', async ({ page }) => {
    const totalDataPoints = page.locator('.stat-card:has-text("Total Data Points") .text-2xl');
    
    // Get initial value
    const initialValue = await totalDataPoints.textContent();
    
    // Wait for updates
    await page.waitForTimeout(5000);
    
    // Check value changed
    const updatedValue = await totalDataPoints.textContent();
    expect(updatedValue).not.toBe(initialValue);
  });
});

// Test Suite: Progress Tracking
test.describe('Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
  });

  test('should display task progress bars', async ({ page }) => {
    // Check progress tracker is visible
    await expect(page.locator('.progress-tracker')).toBeVisible();
    
    // Check task cards exist
    const taskCards = await page.locator('.task-card').count();
    expect(taskCards).toBeGreaterThan(0);
  });

  test('should expand/collapse task details', async ({ page }) => {
    // Click on first task to expand
    await page.locator('.task-header').first().click();
    
    // Check subtasks are visible
    await expect(page.locator('.subtasks').first()).toBeVisible();
    
    // Click again to collapse
    await page.locator('.task-header').first().click();
    
    // Check subtasks are hidden
    await expect(page.locator('.subtasks').first()).not.toBeVisible();
  });

  test('should show timeline view', async ({ page }) => {
    // Check timeline is visible
    await expect(page.locator('.timeline')).toBeVisible();
    
    // Check timeline items
    const timelineItems = await page.locator('.timeline-item').count();
    expect(timelineItems).toBeGreaterThan(0);
  });
});

// Test Suite: Performance Monitoring
test.describe('Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
  });

  test('should display performance metrics', async ({ page }) => {
    // Check performance chart is visible
    await expect(page.locator('.performance-chart')).toBeVisible();
    
    // Check current stats
    await expect(page.locator('.stat-card:has-text("P50")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("P95")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("P99")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("Throughput")')).toBeVisible();
  });

  test('should switch between metric types', async ({ page }) => {
    const metricSelector = page.locator('select[value="latency"]');
    
    // Switch to throughput
    await metricSelector.selectOption('throughput');
    await page.waitForTimeout(1000);
    
    // Switch to resources
    await metricSelector.selectOption('resources');
    await page.waitForTimeout(1000);
    
    // Switch to errors
    await metricSelector.selectOption('errors');
    await page.waitForTimeout(1000);
  });

  test('should update metrics in real-time', async ({ page }) => {
    const p95Metric = page.locator('.stat-card:has-text("P95") .text-lg');
    
    // Get initial value
    const initialP95 = await p95Metric.textContent();
    
    // Wait for updates
    await page.waitForTimeout(3000);
    
    // Check value changed
    const updatedP95 = await p95Metric.textContent();
    expect(updatedP95).not.toBe(initialP95);
  });
});

// Test Suite: Data Export/Import
test.describe('Data Export/Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
  });

  test('should export dashboard data', async ({ page }) => {
    // Setup download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.locator('button:has-text("Export")').click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Check filename
    expect(download.suggestedFilename()).toMatch(/dashboard-data-\d+\.json/);
  });

  test('should handle refresh action', async ({ page }) => {
    // Click refresh
    await page.locator('button:has-text("Refresh")').click();
    
    // Wait for reload
    await page.waitForLoadState('networkidle');
    
    // Check dashboard reloaded
    await expect(page.locator('h1:has-text("AI Agent Dashboard")')).toBeVisible();
  });
});

// Test Suite: Error Handling
test.describe('Error Handling', () => {
  test('should handle WebSocket disconnection', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Simulate WebSocket disconnection
    await page.evaluate(() => {
      const ws = (window as any).mockWebSocket;
      if (ws) ws.close();
    });
    
    // Check disconnected status
    await expect(page.locator('.connection-status')).toContainText(/Disconnected|Offline/);
  });

  test('should display error notifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
    
    // Trigger an error
    await page.evaluate(() => {
      const bridge = (window as any).integrationBridge;
      if (bridge) {
        bridge.emit('error', { message: 'Test error', severity: 'error' });
      }
    });
    
    // Check error display (if implemented)
    // await expect(page.locator('.error-notification')).toBeVisible();
  });
});

// Test Suite: Responsive Design
test.describe('Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check components stack vertically
    const dashboardGrid = page.locator('.dashboard-grid');
    await expect(dashboardGrid).toHaveCSS('grid-template-columns', /1fr/);
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check layout adjustments
    await expect(page.locator('.integrated-dashboard')).toBeVisible();
  });
});

// Test Suite: Performance
test.describe('Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
  });

  test('should handle large data volumes', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForWebSocketConnection(page);
    
    // Simulate large data volume
    await page.evaluate(() => {
      const bridge = (window as any).integrationBridge;
      if (bridge) {
        for (let i = 0; i < 1000; i++) {
          bridge.bridgeUIEvent('test', 'data', { index: i });
        }
      }
    });
    
    // Check dashboard still responsive
    await page.locator('button:has-text("Play")').click();
    await expect(page.locator('.agent-pipeline')).toBeVisible();
  });
});