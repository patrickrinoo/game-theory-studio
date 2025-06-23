import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test configuration
global.console = {
  ...console,
  // Silence specific logs during testing
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Mock Web Workers for testing environment
(global as any).Worker = class MockWorker {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  constructor(url: string) {
    this.url = url;
  }
  
  postMessage(data: any) {
    // Simulate async worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { result: 'mock-result' } } as MessageEvent);
      }
    }, 10);
  }
  
  terminate() {
    // Mock termination
  }
};

// Mock performance APIs
if (typeof global.performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now()
  };
}

// Setup test localStorage mock
const mockStorage = new Map();
(global as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (index: number) => Array.from(mockStorage.keys())[index] || null
};

// Mock for memory usage in Node.js environment
if (typeof process !== 'undefined' && process.memoryUsage) {
  const originalMemoryUsage = process.memoryUsage;
  (process as any).memoryUsage = () => ({
    rss: 50 * 1024 * 1024,
    heapTotal: 30 * 1024 * 1024,
    heapUsed: 20 * 1024 * 1024,
    external: 5 * 1024 * 1024,
    arrayBuffers: 1 * 1024 * 1024
  });
}

// Setup global error handler for unhandled promises
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

// Test timeout will be configured in vitest.config.ts 