'use client';

/**
 * Enhanced Memory Optimization System for Monte Carlo Simulations
 * Provides advanced memory management, data streaming, and optimization techniques
 */

export interface MemoryProfile {
  totalMemoryMB: number;
  usedMemoryMB: number;
  freeMemoryMB: number;
  gcPressure: number; // 0-1 scale
  heapSizeMB: number;
  heapLimitMB: number;
  timestamp: number;
}

export interface DataChunk<T> {
  id: string;
  data: T;
  size: number;
  timestamp: number;
  accessCount: number;
  priority: 'high' | 'medium' | 'low';
}

export interface MemoryConfig {
  maxMemoryMB: number;
  gcThreshold: number;
  chunkSize: number;
  maxCacheSize: number;
  enableCompression: boolean;
  enableStreaming: boolean;
  compressionRatio: number;
}

/**
 * Advanced Memory Profiler with detailed monitoring
 */
export class MemoryProfiler {
  private profiles: MemoryProfile[] = [];
  private maxProfiles: number = 1000;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.recordProfile();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  recordProfile(): MemoryProfile {
    const profile = this.getCurrentMemoryProfile();
    this.profiles.push(profile);

    // Keep only the most recent profiles
    if (this.profiles.length > this.maxProfiles) {
      this.profiles = this.profiles.slice(-this.maxProfiles);
    }

    return profile;
  }

  getCurrentMemoryProfile(): MemoryProfile {
    const memory = (performance as any).memory;
    
    if (!memory) {
      // Fallback estimation
      return {
        totalMemoryMB: 0,
        usedMemoryMB: 0,
        freeMemoryMB: 0,
        gcPressure: 0,
        heapSizeMB: 0,
        heapLimitMB: 0,
        timestamp: Date.now()
      };
    }

    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const totalMB = memory.totalJSHeapSize / 1024 / 1024;
    const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

    return {
      totalMemoryMB: totalMB,
      usedMemoryMB: usedMB,
      freeMemoryMB: limitMB - usedMB,
      gcPressure: usedMB / limitMB,
      heapSizeMB: totalMB,
      heapLimitMB: limitMB,
      timestamp: Date.now()
    };
  }

  getProfiles(): MemoryProfile[] {
    return [...this.profiles];
  }

  getAverageMemoryUsage(): number {
    if (this.profiles.length === 0) return 0;
    
    const total = this.profiles.reduce((sum, profile) => sum + profile.usedMemoryMB, 0);
    return total / this.profiles.length;
  }

  getPeakMemoryUsage(): number {
    if (this.profiles.length === 0) return 0;
    
    return Math.max(...this.profiles.map(p => p.usedMemoryMB));
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.profiles.length < 10) return 'stable';

    const recent = this.profiles.slice(-10);
    const firstHalf = recent.slice(0, 5);
    const secondHalf = recent.slice(5);

    const firstAvg = firstHalf.reduce((sum, p) => sum + p.usedMemoryMB, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.usedMemoryMB, 0) / secondHalf.length;

    const threshold = 5; // 5MB threshold
    if (secondAvg - firstAvg > threshold) return 'increasing';
    if (firstAvg - secondAvg > threshold) return 'decreasing';
    return 'stable';
  }

  shouldTriggerGC(): boolean {
    const current = this.getCurrentMemoryProfile();
    return current.gcPressure > 0.8 || this.getMemoryTrend() === 'increasing';
  }
}

/**
 * Data Compression utilities for memory optimization
 */
export class DataCompressor {
  private static compressObject(obj: any): string {
    try {
      const jsonStr = JSON.stringify(obj);
      return this.compressString(jsonStr);
    } catch (error) {
      console.warn('Failed to compress object:', error);
      return JSON.stringify(obj);
    }
  }

  private static compressString(str: string): string {
    // Simple LZ77-like compression
    const compressed: string[] = [];
    let i = 0;

    while (i < str.length) {
      let bestMatch = { length: 0, distance: 0 };
      
      // Look for matches in the previous 255 characters
      const searchStart = Math.max(0, i - 255);
      
      for (let j = searchStart; j < i; j++) {
        let matchLength = 0;
        
        while (
          i + matchLength < str.length &&
          str[j + matchLength] === str[i + matchLength] &&
          matchLength < 255
        ) {
          matchLength++;
        }
        
        if (matchLength > bestMatch.length && matchLength > 2) {
          bestMatch = { length: matchLength, distance: i - j };
        }
      }
      
      if (bestMatch.length > 2) {
        compressed.push(`<${bestMatch.distance},${bestMatch.length}>`);
        i += bestMatch.length;
      } else {
        compressed.push(str[i]);
        i++;
      }
    }
    
    return compressed.join('');
  }

  static compress(data: any): { compressed: string; originalSize: number; compressedSize: number } {
    const originalStr = typeof data === 'string' ? data : JSON.stringify(data);
    const compressed = this.compressObject(data);
    
    return {
      compressed,
      originalSize: originalStr.length,
      compressedSize: compressed.length
    };
  }

  static decompress(compressed: string): any {
    try {
      const decompressed = this.decompressString(compressed);
      return JSON.parse(decompressed);
    } catch (error) {
      console.warn('Failed to decompress data:', error);
      return compressed;
    }
  }

  private static decompressString(compressed: string): string {
    const result: string[] = [];
    let i = 0;
    
    while (i < compressed.length) {
      if (compressed[i] === '<') {
        // Find the end of the reference
        const end = compressed.indexOf('>', i);
        if (end === -1) {
          result.push(compressed[i]);
          i++;
          continue;
        }
        
        const reference = compressed.slice(i + 1, end);
        const [distance, length] = reference.split(',').map(Number);
        
        if (!isNaN(distance) && !isNaN(length)) {
          const startPos = result.length - distance;
          for (let j = 0; j < length; j++) {
            result.push(result[startPos + j]);
          }
          i = end + 1;
        } else {
          result.push(compressed[i]);
          i++;
        }
      } else {
        result.push(compressed[i]);
        i++;
      }
    }
    
    return result.join('');
  }
}

/**
 * Streaming Data Manager for large datasets
 */
export class StreamingDataManager<T> {
  private chunks = new Map<string, DataChunk<T>>();
  private cacheOrder: string[] = [];
  private config: MemoryConfig;
  private totalSize = 0;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxMemoryMB: config.maxMemoryMB || 512,
      gcThreshold: config.gcThreshold || 0.8,
      chunkSize: config.chunkSize || 10000,
      maxCacheSize: config.maxCacheSize || 100,
      enableCompression: config.enableCompression ?? true,
      enableStreaming: config.enableStreaming ?? true,
      compressionRatio: config.compressionRatio || 0.3
    };
  }

  addChunk(id: string, data: T, priority: DataChunk<T>['priority'] = 'medium'): void {
    const size = this.estimateSize(data);
    
    // Compress if enabled
    let processedData = data;
    if (this.config.enableCompression) {
      const compressed = DataCompressor.compress(data);
      if (compressed.compressedSize < compressed.originalSize * this.config.compressionRatio) {
        processedData = compressed.compressed as any;
      }
    }

    const chunk: DataChunk<T> = {
      id,
      data: processedData,
      size,
      timestamp: Date.now(),
      accessCount: 0,
      priority
    };

    this.chunks.set(id, chunk);
    this.cacheOrder.push(id);
    this.totalSize += size;

    // Trigger cleanup if necessary
    this.manageMemory();
  }

  getChunk(id: string): T | null {
    const chunk = this.chunks.get(id);
    if (!chunk) return null;

    chunk.accessCount++;
    chunk.timestamp = Date.now();

    // Move to end of cache order (most recently used)
    const index = this.cacheOrder.indexOf(id);
    if (index > -1) {
      this.cacheOrder.splice(index, 1);
      this.cacheOrder.push(id);
    }

    // Decompress if needed
    if (this.config.enableCompression && typeof chunk.data === 'string') {
      try {
        return DataCompressor.decompress(chunk.data as string);
      } catch (error) {
        console.warn('Failed to decompress chunk:', error);
        return chunk.data;
      }
    }

    return chunk.data;
  }

  removeChunk(id: string): boolean {
    const chunk = this.chunks.get(id);
    if (!chunk) return false;

    this.chunks.delete(id);
    this.totalSize -= chunk.size;
    
    const index = this.cacheOrder.indexOf(id);
    if (index > -1) {
      this.cacheOrder.splice(index, 1);
    }

    return true;
  }

  private manageMemory(): void {
    // Remove old chunks if cache is too large
    while (this.chunks.size > this.config.maxCacheSize) {
      const oldestId = this.cacheOrder.shift();
      if (oldestId) {
        this.removeChunk(oldestId);
      }
    }

    // Remove low-priority chunks if memory pressure is high
    const memoryPressure = this.totalSize / (this.config.maxMemoryMB * 1024 * 1024);
    if (memoryPressure > this.config.gcThreshold) {
      this.evictLowPriorityChunks();
    }
  }

  private evictLowPriorityChunks(): void {
    const lowPriorityChunks = Array.from(this.chunks.entries())
      .filter(([_, chunk]) => chunk.priority === 'low')
      .sort((a, b) => a[1].accessCount - b[1].accessCount);

    const toRemove = Math.ceil(lowPriorityChunks.length * 0.3); // Remove 30% of low priority
    
    for (let i = 0; i < toRemove && i < lowPriorityChunks.length; i++) {
      this.removeChunk(lowPriorityChunks[i][0]);
    }
  }

  private estimateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16 encoding
    }
    
    if (typeof data === 'number') {
      return 8; // 64-bit number
    }
    
    if (Array.isArray(data)) {
      return data.length * 8 + 64; // Estimate array overhead
    }
    
    if (typeof data === 'object' && data !== null) {
      try {
        return JSON.stringify(data).length * 2;
      } catch {
        return 1024; // Default estimate
      }
    }
    
    return 64; // Default for other types
  }

  getMemoryStats(): {
    chunkCount: number;
    totalSizeMB: number;
    averageChunkSize: number;
    memoryPressure: number;
    cacheHitRate: number;
  } {
    const totalAccessCount = Array.from(this.chunks.values())
      .reduce((sum, chunk) => sum + chunk.accessCount, 0);
    
    const avgAccessCount = this.chunks.size > 0 ? totalAccessCount / this.chunks.size : 0;

    return {
      chunkCount: this.chunks.size,
      totalSizeMB: this.totalSize / (1024 * 1024),
      averageChunkSize: this.chunks.size > 0 ? this.totalSize / this.chunks.size : 0,
      memoryPressure: this.totalSize / (this.config.maxMemoryMB * 1024 * 1024),
      cacheHitRate: avgAccessCount > 1 ? (avgAccessCount - 1) / avgAccessCount : 0
    };
  }

  clear(): void {
    this.chunks.clear();
    this.cacheOrder = [];
    this.totalSize = 0;
  }
}

/**
 * Memory-Optimized Result Processor for Monte Carlo simulations
 */
export class ResultProcessor {
  private streamingManager: StreamingDataManager<any>;
  private profiler: MemoryProfiler;
  private config: MemoryConfig;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxMemoryMB: config.maxMemoryMB || 512,
      gcThreshold: config.gcThreshold || 0.8,
      chunkSize: config.chunkSize || 10000,
      maxCacheSize: config.maxCacheSize || 100,
      enableCompression: config.enableCompression ?? true,
      enableStreaming: config.enableStreaming ?? true,
      compressionRatio: config.compressionRatio || 0.3
    };

    this.streamingManager = new StreamingDataManager(this.config);
    this.profiler = new MemoryProfiler();
  }

  startProcessing(): void {
    this.profiler.startMonitoring(1000);
  }

  stopProcessing(): void {
    this.profiler.stopMonitoring();
  }

  processResults(results: any[], onProgress?: (progress: number) => void): Promise<any> {
    return new Promise(async (resolve) => {
      const totalResults = results.length;
      const processedResults: any = {
        aggregatedData: {},
        chunks: [],
        metadata: {
          totalResults,
          processingTime: 0,
          memoryStats: {}
        }
      };

      const startTime = Date.now();
      
      // Process in chunks to manage memory
      for (let i = 0; i < totalResults; i += this.config.chunkSize) {
        const chunkEnd = Math.min(i + this.config.chunkSize, totalResults);
        const chunk = results.slice(i, chunkEnd);
        
        // Process chunk
        const processedChunk = this.processChunk(chunk, i);
        const chunkId = `chunk_${Math.floor(i / this.config.chunkSize)}`;
        
        // Store in streaming manager
        this.streamingManager.addChunk(chunkId, processedChunk, 'high');
        processedResults.chunks.push(chunkId);

        // Update progress
        if (onProgress) {
          onProgress(chunkEnd / totalResults);
        }

        // Check memory pressure and GC if needed
        if (this.profiler.shouldTriggerGC()) {
          await this.triggerGarbageCollection();
        }

        // Small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Finalize processing
      processedResults.metadata.processingTime = Date.now() - startTime;
      processedResults.metadata.memoryStats = this.getMemoryStats();

      resolve(processedResults);
    });
  }

  private processChunk(chunk: any[], chunkIndex: number): any {
    // Aggregate chunk data efficiently
    const aggregated = {
      chunkIndex,
      size: chunk.length,
      statistics: this.calculateChunkStatistics(chunk),
      summary: this.summarizeChunk(chunk)
    };

    return aggregated;
  }

  private calculateChunkStatistics(chunk: any[]): any {
    if (!chunk.length) return {};

    // Efficient statistical calculations
    const stats: any = {};
    
    if (chunk[0].playerPayoffs) {
      const playerCount = chunk[0].playerPayoffs.length;
      stats.playerStats = Array(playerCount).fill(null).map(() => ({
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity
      }));

      chunk.forEach(result => {
        if (result.playerPayoffs) {
          result.playerPayoffs.forEach((payoffs: number[], playerIndex: number) => {
            const playerStat = stats.playerStats[playerIndex];
            payoffs.forEach(payoff => {
              playerStat.sum += payoff;
              playerStat.count++;
              playerStat.min = Math.min(playerStat.min, payoff);
              playerStat.max = Math.max(playerStat.max, payoff);
            });
          });
        }
      });

      // Calculate means and finalize stats
      stats.playerStats.forEach((stat: any) => {
        stat.mean = stat.count > 0 ? stat.sum / stat.count : 0;
      });
    }

    return stats;
  }

  private summarizeChunk(chunk: any[]): any {
    const summary = {
      totalIterations: chunk.length,
      outcomeCounts: {},
      strategyFrequencies: {},
      trends: {}
    };

    chunk.forEach(result => {
      // Aggregate outcomes
      if (result.outcomes) {
        Object.entries(result.outcomes).forEach(([key, value]) => {
          summary.outcomeCounts[key] = (summary.outcomeCounts[key] || 0) + (value as number);
        });
      }

      // Aggregate strategy frequencies
      if (result.strategyFrequencies) {
        Object.entries(result.strategyFrequencies).forEach(([key, value]) => {
          summary.strategyFrequencies[key] = (summary.strategyFrequencies[key] || 0) + (value as number);
        });
      }
    });

    return summary;
  }

  getChunkResults(chunkId: string): any | null {
    return this.streamingManager.getChunk(chunkId);
  }

  aggregateAllResults(): any {
    const allChunkIds = Array.from({ length: this.streamingManager.getMemoryStats().chunkCount }, 
      (_, i) => `chunk_${i}`);
    
    const aggregated = {
      totalResults: 0,
      combinedStatistics: {},
      combinedSummary: {
        outcomeCounts: {},
        strategyFrequencies: {},
        totalIterations: 0
      }
    };

    allChunkIds.forEach(chunkId => {
      const chunkData = this.streamingManager.getChunk(chunkId);
      if (chunkData) {
        aggregated.totalResults += chunkData.size;
        
        // Merge outcomes
        Object.entries(chunkData.summary.outcomeCounts || {}).forEach(([key, value]) => {
          aggregated.combinedSummary.outcomeCounts[key] = 
            (aggregated.combinedSummary.outcomeCounts[key] || 0) + (value as number);
        });

        // Merge strategy frequencies
        Object.entries(chunkData.summary.strategyFrequencies || {}).forEach(([key, value]) => {
          aggregated.combinedSummary.strategyFrequencies[key] = 
            (aggregated.combinedSummary.strategyFrequencies[key] || 0) + (value as number);
        });

        aggregated.combinedSummary.totalIterations += chunkData.summary.totalIterations || 0;
      }
    });

    return aggregated;
  }

  private async triggerGarbageCollection(): Promise<void> {
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // Create memory pressure to encourage GC
    try {
      const temp = new Array(100000).fill(0);
      temp.length = 0;
    } catch (e) {
      // Ignore errors
    }

    // Small delay to allow GC to complete
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  getMemoryStats(): any {
    return {
      streaming: this.streamingManager.getMemoryStats(),
      profiler: {
        average: this.profiler.getAverageMemoryUsage(),
        peak: this.profiler.getPeakMemoryUsage(),
        trend: this.profiler.getMemoryTrend(),
        current: this.profiler.getCurrentMemoryProfile()
      }
    };
  }

  cleanup(): void {
    this.profiler.stopMonitoring();
    this.streamingManager.clear();
  }
}

export default ResultProcessor; 