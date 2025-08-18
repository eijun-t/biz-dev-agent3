/**
 * Full Integration E2E Test Suite
 * MVP Worker3 - Complete Quality Assurance
 * All features and performance validation
 */

import { test, expect, Page } from '@playwright/test';
import { setupMockServer } from '../utils/mock-server';
import { performance } from 'perf_hooks';

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const PERFORMANCE_BUDGET = {
  FCP: 1500,  // First Contentful Paint
  LCP: 2500,  // Largest Contentful Paint
  TTI: 3500,  // Time to Interactive
  CLS: 0.1,   // Cumulative Layout Shift
  FID: 100    // First Input Delay
};

test.describe('Full Integration Test Suite', () => {
  let mockServer: any;
  
  test.beforeAll(async () => {
    mockServer = await setupMockServer();
  });
  
  test.afterAll(async () => {
    await mockServer?.close();
  });

  test.describe('Report History Features', () => {
    test('should load and display reports', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      // Wait for reports to load
      await page.waitForSelector('.report-card', { timeout: 5000 });
      
      // Verify reports are displayed
      const reports = await page.$$('.report-card');
      expect(reports.length).toBeGreaterThan(0);
      
      // Check performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstByte: navigation.responseStart - navigation.fetchStart
        };
      });
      
      expect(metrics.loadTime).toBeLessThan(3000);
      expect(metrics.firstByte).toBeLessThan(500);
    });

    test('should search with filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      // Open filter panel
      await page.click('button:has-text("Show Filters")');
      
      // Enter search query
      await page.fill('input[placeholder="Search reports..."]', 'healthcare');
      
      // Select status filter
      await page.check('input[type="checkbox"][value="completed"]');
      
      // Apply filters
      await page.click('button:has-text("Search")');
      
      // Wait for results
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const results = await page.$$('.report-card');
      expect(results.length).toBeGreaterThan(0);
      
      // Verify search term highlighting
      const highlighted = await page.$('.highlight');
      expect(highlighted).toBeTruthy();
    });

    test('should compare multiple reports', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      // Select reports for comparison
      const checkboxes = await page.$$('input[type="checkbox"]:has-text("Compare")');
      await checkboxes[0].check();
      await checkboxes[1].check();
      
      // Click compare button
      await page.click('button:has-text("Compare Reports")');
      
      // Wait for comparison modal
      await page.waitForSelector('.comparison-results', { timeout: 5000 });
      
      // Verify comparison results
      const similarity = await page.textContent('.similarity-score');
      expect(similarity).toMatch(/\d+%/);
      
      // Close modal
      await page.click('button:has-text("Close")');
    });

    test('should export reports in multiple formats', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      // Test each export format
      const formats = ['PDF', 'Excel', 'CSV', 'JSON'];
      
      for (const format of formats) {
        // Start download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        
        // Click export button
        await page.hover('button:has-text("Export Reports")');
        await page.click(`button:has-text("Export as ${format}")`);  
        
        // Wait for download
        const download = await downloadPromise;
        
        // Verify download
        expect(download).toBeTruthy();
        const filename = download.suggestedFilename();
        expect(filename).toMatch(new RegExp(`\\.${format.toLowerCase()}$`, 'i'));
      }
    });

    test('should handle batch operations', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      // Select multiple reports
      const checkboxes = await page.$$('input[type="checkbox"]:has-text("Select")');
      await checkboxes[0].check();
      await checkboxes[1].check();
      await checkboxes[2].check();
      
      // Verify action bar appears
      await expect(page.locator('.action-bar')).toBeVisible();
      
      // Test archive operation
      await page.click('button:has-text("Archive Selected")');
      
      // Confirm action
      page.on('dialog', dialog => dialog.accept());
      
      // Wait for operation to complete
      await page.waitForTimeout(1000);
      
      // Verify success message
      await expect(page.locator('.success-message')).toBeVisible();
    });
  });

  test.describe('Agent Pipeline Visualization', () => {
    test('should display and animate pipeline', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Wait for pipeline to load
      await page.waitForSelector('.agent-pipeline', { timeout: 5000 });
      
      // Verify all agents are displayed
      const agents = ['researcher', 'ideator', 'critic', 'analyst', 'writer'];
      for (const agent of agents) {
        await expect(page.locator(`[data-agent="${agent}"]`)).toBeVisible();
      }
      
      // Start pipeline
      await page.click('button:has-text("Start Pipeline")');
      
      // Verify animation starts
      await expect(page.locator('.pipeline-animation')).toHaveClass(/animating/);
      
      // Check FPS counter
      const fps = await page.textContent('.fps-counter');
      expect(parseInt(fps || '0')).toBeGreaterThan(30);
    });

    test('should handle real-time updates', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Wait for WebSocket connection
      await page.waitForFunction(() => {
        return (window as any).wsConnected === true;
      }, { timeout: 5000 });
      
      // Verify real-time updates
      const initialCount = await page.textContent('.update-counter');
      
      // Wait for updates
      await page.waitForTimeout(3000);
      
      const newCount = await page.textContent('.update-counter');
      expect(parseInt(newCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'));
    });
  });

  test.describe('Performance Tests', () => {
    test('should meet performance budget', async ({ page }) => {
      // Navigate and measure performance
      await page.goto(`${BASE_URL}/reports`);
      
      // Get Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};
          
          // LCP
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            vitals.lcp = entries[entries.length - 1].startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // FCP
          const fcp = performance.getEntriesByName('first-contentful-paint')[0];
          vitals.fcp = fcp ? fcp.startTime : 0;
          
          // CLS
          let cls = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
            vitals.cls = cls;
          }).observe({ entryTypes: ['layout-shift'] });
          
          // TTI approximation
          vitals.tti = performance.timing.domInteractive - performance.timing.fetchStart;
          
          setTimeout(() => resolve(vitals), 2000);
        });
      });
      
      // Assert performance metrics
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_BUDGET.FCP);
      expect(vitals.lcp).toBeLessThan(PERFORMANCE_BUDGET.LCP);
      expect(vitals.tti).toBeLessThan(PERFORMANCE_BUDGET.TTI);
      expect(vitals.cls).toBeLessThan(PERFORMANCE_BUDGET.CLS);
    });

    test('should handle 1000 concurrent users', async ({ page }) => {
      // Simulate load test
      const results = await page.evaluate(async () => {
        const requests = [];
        const startTime = performance.now();
        
        // Simulate 1000 concurrent requests
        for (let i = 0; i < 1000; i++) {
          requests.push(
            fetch('/api/reports/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `test${i}`, limit: 10 })
            })
          );
        }
        
        const responses = await Promise.all(requests);
        const endTime = performance.now();
        
        return {
          totalTime: endTime - startTime,
          successCount: responses.filter(r => r.ok).length,
          averageTime: (endTime - startTime) / 1000
        };
      });
      
      // Assert load test results
      expect(results.successCount).toBeGreaterThan(990); // >99% success rate
      expect(results.averageTime).toBeLessThan(100); // <100ms average
    });

    test('should maintain 60fps during animations', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Start animation
      await page.click('button:has-text("Start Animation")');
      
      // Measure FPS
      const fps = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          let lastTime = performance.now();
          const fpsValues: number[] = [];
          
          function measureFPS() {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
              const fps = Math.round((frames * 1000) / (currentTime - lastTime));
              fpsValues.push(fps);
              frames = 0;
              lastTime = currentTime;
              
              if (fpsValues.length >= 5) {
                const avgFPS = fpsValues.reduce((a, b) => a + b) / fpsValues.length;
                resolve(avgFPS);
              } else {
                requestAnimationFrame(measureFPS);
              }
            } else {
              requestAnimationFrame(measureFPS);
            }
          }
          
          requestAnimationFrame(measureFPS);
        });
      });
      
      expect(fps).toBeGreaterThan(55); // Allow small margin below 60fps
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);
      
      await page.goto(`${BASE_URL}/reports`);
      
      // Verify error message is displayed
      await expect(page.locator('.error-message')).toBeVisible();
      await expect(page.locator('.error-message')).toContainText('connection');
      
      // Verify retry button exists
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
      
      // Go back online
      await page.context().setOffline(false);
      
      // Click retry
      await page.click('button:has-text("Retry")');
      
      // Verify recovery
      await expect(page.locator('.report-card')).toBeVisible();
    });

    test('should handle API errors with fallback', async ({ page }) => {
      // Mock API error
      await page.route('**/api/reports/search', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.goto(`${BASE_URL}/reports`);
      
      // Verify fallback to cached data
      await expect(page.locator('.cache-indicator')).toBeVisible();
      await expect(page.locator('.cache-indicator')).toContainText('cached');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Verify action was triggered
      await expect(page.locator('.selected')).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      // Check ARIA labels
      const elements = await page.$$('[aria-label]');
      expect(elements.length).toBeGreaterThan(0);
      
      // Verify screen reader text
      const srOnly = await page.$$('.sr-only');
      expect(srOnly.length).toBeGreaterThan(0);
    });
  });
});

// Export test utilities
export { PERFORMANCE_BUDGET, BASE_URL };