'use client';

/**
 * Enhanced Web Worker Engine for Monte Carlo Simulations
 * Provides robust parallel processing with message handling, error recovery, and performance monitoring
 */

export interface WorkerTask {
  id: string;
  type: 'simulation' | 'analysis' | 'optimization';
  payload: any;
  priority: 'low' | 'medium' | 'high';
  timeout?: number;
  retryCount?: number;
}

export interface WorkerResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  workerId: number;
}

export interface WorkerMetrics {
  id: number;
  status: 'idle' | 'busy' | 'error' | 'terminated';
  tasksCompleted: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  lastTaskTimestamp: number;
  errorCount: number;
}

export interface WebWorkerEngineConfig {
  maxWorkers?: number;
  taskTimeout?: number;
  maxRetries?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  enableAutoScaling?: boolean;
  loadBalancing?: 'round-robin' | 'least-busy' | 'priority-based';
}

/**
 * Enhanced Web Worker for Monte Carlo simulations
 */
class EnhancedWebWorker {
  private worker: Worker | null = null;
  private id: number;
  private status: WorkerMetrics['status'] = 'idle';
  private metrics: WorkerMetrics;
  private currentTask: WorkerTask | null = null;
  private onMessage: ((result: WorkerResult) => void) | null = null;
  private onError: ((error: Error, taskId?: string) => void) | null = null;

  constructor(id: number, workerScript: string) {
    this.id = id;
    this.metrics = {
      id,
      status: 'idle',
      tasksCompleted: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      lastTaskTimestamp: 0,
      errorCount: 0
    };

    this.initializeWorker(workerScript);
  }

  private initializeWorker(workerScript: string): void {
    try {
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event) => {
        const result: WorkerResult = event.data;
        this.handleWorkerResult(result);
      };

      this.worker.onerror = (error) => {
        this.handleWorkerError(new Error(`Worker ${this.id} error: ${error.message}`));
      };

      this.status = 'idle';
    } catch (error) {
      this.handleWorkerError(error as Error);
    }
  }

  private handleWorkerResult(result: WorkerResult): void {
    if (this.currentTask) {
      const processingTime = Date.now() - this.metrics.lastTaskTimestamp;
      
      // Update metrics
      this.metrics.tasksCompleted++;
      this.metrics.totalProcessingTime += processingTime;
      this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.tasksCompleted;
      
      if (result.success) {
        this.status = 'idle';
      } else {
        this.metrics.errorCount++;
        this.status = 'error';
      }

      this.currentTask = null;
      
      if (this.onMessage) {
        this.onMessage({
          ...result,
          processingTime,
          workerId: this.id
        });
      }
    }
  }

  private handleWorkerError(error: Error): void {
    this.status = 'error';
    this.metrics.errorCount++;
    
    if (this.onError) {
      this.onError(error, this.currentTask?.id);
    }

    // Try to recover by reinitializing the worker
    this.terminate();
    setTimeout(() => {
      this.initializeWorker(this.createDefaultWorkerScript());
    }, 1000);
  }

  private createDefaultWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { taskId, type, payload } = e.data;
        
        try {
          let result;
          
          switch (type) {
            case 'simulation':
              result = simulateMonteCarloIteration(payload);
              break;
            case 'analysis':
              result = performAnalysis(payload);
              break;
            case 'optimization':
              result = optimizeStrategies(payload);
              break;
            default:
              throw new Error('Unknown task type: ' + type);
          }
          
          self.postMessage({
            taskId,
            success: true,
            data: result
          });
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message
          });
        }
      };
      
      function simulateMonteCarloIteration(payload) {
        const { iterations, gameConfig, rngConfig } = payload;
        
        // Enhanced simulation logic
        const results = {
          outcomes: {},
          strategyFrequencies: {},
          playerPayoffs: Array(gameConfig.playerCount).fill(null).map(() => []),
          convergenceData: [],
          statistics: {
            mean: [],
            variance: [],
            standardDeviation: []
          }
        };
        
        // Initialize RNG
        let seed = rngConfig.seed || Date.now();
        function rng() {
          seed = (seed * 1664525 + 1013904223) % 0x100000000;
          return seed / 0x100000000;
        }
        
        // Run iterations
        for (let i = 0; i < iterations; i++) {
          const chosenStrategies = [];
          
          // Strategy selection for each player
          for (let playerIndex = 0; playerIndex < gameConfig.playerCount; playerIndex++) {
            if (gameConfig.playerStrategies[playerIndex] === 'mixed') {
              const probs = gameConfig.mixedStrategies[playerIndex] || 
                           Array(gameConfig.strategies.length).fill(1 / gameConfig.strategies.length);
              chosenStrategies.push(selectStrategyByProbability(probs, rng));
            } else {
              const strategyIndex = gameConfig.strategies.findIndex(
                s => s.toLowerCase() === gameConfig.playerStrategies[playerIndex].toLowerCase()
              );
              chosenStrategies.push(strategyIndex >= 0 ? strategyIndex : 0);
            }
          }
          
          // Calculate payoffs
          let payoffs = calculatePayoffs(chosenStrategies, gameConfig.payoffMatrix);
          
          // Store results
          payoffs.forEach((payoff, playerIndex) => {
            results.playerPayoffs[playerIndex].push(payoff);
          });
          
          // Update outcomes and frequencies
          const outcomeKey = chosenStrategies.map(s => gameConfig.strategies[s]).join('-');
          results.outcomes[outcomeKey] = (results.outcomes[outcomeKey] || 0) + 1;
          results.strategyFrequencies[outcomeKey] = (results.strategyFrequencies[outcomeKey] || 0) + 1;
          
          // Convergence tracking (every 100 iterations)
          if (i % 100 === 0) {
            results.convergenceData.push({
              iteration: i,
              strategies: chosenStrategies.slice(),
              payoffs: payoffs.slice()
            });
          }
        }
        
        // Calculate statistics
        results.statistics.mean = results.playerPayoffs.map(payoffs => 
          payoffs.reduce((sum, p) => sum + p, 0) / payoffs.length
        );
        
        results.statistics.variance = results.playerPayoffs.map((payoffs, index) => {
          const mean = results.statistics.mean[index];
          return payoffs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / payoffs.length;
        });
        
        results.statistics.standardDeviation = results.statistics.variance.map(v => Math.sqrt(v));
        
        return results;
      }
      
      function performAnalysis(payload) {
        const { data, analysisType } = payload;
        
        switch (analysisType) {
          case 'nash-equilibrium':
            return findNashEquilibrium(data);
          case 'dominance':
            return analyzeDominance(data);
          case 'convergence':
            return analyzeConvergence(data);
          default:
            return { error: 'Unknown analysis type' };
        }
      }
      
      function optimizeStrategies(payload) {
        const { payoffMatrix, players } = payload;
        
        // Simple optimization using best response
        const optimizedStrategies = [];
        
        for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
          const bestResponse = findBestResponse(playerIndex, payoffMatrix);
          optimizedStrategies.push(bestResponse);
        }
        
        return { optimizedStrategies };
      }
      
      function selectStrategyByProbability(probabilities, rng) {
        const random = rng();
        let cumulative = 0;
        
        for (let i = 0; i < probabilities.length; i++) {
          cumulative += probabilities[i];
          if (random <= cumulative) {
            return i;
          }
        }
        
        return probabilities.length - 1;
      }
      
      function calculatePayoffs(strategies, payoffMatrix) {
        if (strategies.length === 2) {
          return payoffMatrix[strategies[0]][strategies[1]];
        }
        
        // Multi-player payoff calculation
        const payoffs = new Array(strategies.length).fill(0);
        for (let i = 0; i < strategies.length; i++) {
          payoffs[i] = payoffMatrix[i][strategies[0]][strategies[1]] || 0;
        }
        return payoffs;
      }
      
      function findNashEquilibrium(payoffMatrix) {
        // Simplified Nash equilibrium finding
        const equilibria = [];
        
        // Check pure strategy Nash equilibria
        for (let i = 0; i < payoffMatrix.length; i++) {
          for (let j = 0; j < payoffMatrix[i].length; j++) {
            if (isPureNashEquilibrium([i, j], payoffMatrix)) {
              equilibria.push({ 
                type: 'pure', 
                strategies: [i, j], 
                payoffs: payoffMatrix[i][j] 
              });
            }
          }
        }
        
        return equilibria;
      }
      
      function isPureNashEquilibrium(strategies, payoffMatrix) {
        // Check if no player can improve by unilateral deviation
        for (let player = 0; player < strategies.length; player++) {
          const currentPayoff = payoffMatrix[strategies[0]][strategies[1]][player];
          
          for (let altStrategy = 0; altStrategy < payoffMatrix.length; altStrategy++) {
            if (altStrategy === strategies[player]) continue;
            
            const altStrategies = strategies.slice();
            altStrategies[player] = altStrategy;
            
            const altPayoff = payoffMatrix[altStrategies[0]][altStrategies[1]][player];
            if (altPayoff > currentPayoff) {
              return false;
            }
          }
        }
        
        return true;
      }
      
      function analyzeDominance(payoffMatrix) {
        const dominated = [];
        
        for (let player = 0; player < 2; player++) {
          for (let strategy = 0; strategy < payoffMatrix.length; strategy++) {
            for (let dominating = 0; dominating < payoffMatrix.length; dominating++) {
              if (strategy === dominating) continue;
              
              if (isDominated(player, strategy, dominating, payoffMatrix)) {
                dominated.push({ player, strategy, dominatedBy: dominating });
              }
            }
          }
        }
        
        return { dominated };
      }
      
      function isDominated(player, strategy, dominating, payoffMatrix) {
        for (let opponent = 0; opponent < payoffMatrix.length; opponent++) {
          const strategyPayoff = player === 0 ? 
            payoffMatrix[strategy][opponent][0] : 
            payoffMatrix[opponent][strategy][1];
          const dominatingPayoff = player === 0 ? 
            payoffMatrix[dominating][opponent][0] : 
            payoffMatrix[opponent][dominating][1];
          
          if (dominatingPayoff <= strategyPayoff) {
            return false;
          }
        }
        
        return true;
      }
      
      function analyzeConvergence(data) {
        const { timeSeries } = data;
        
        if (timeSeries.length < 2) {
          return { converged: false, confidence: 0 };
        }
        
        // Simple convergence test using recent stability
        const recentData = timeSeries.slice(-Math.min(100, timeSeries.length));
        const mean = recentData.reduce((sum, value) => sum + value, 0) / recentData.length;
        const variance = recentData.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / recentData.length;
        
        const coefficient = variance / (mean * mean);
        const converged = coefficient < 0.01; // 1% coefficient of variation
        
        return { 
          converged, 
          confidence: Math.max(0, 1 - coefficient),
          statistics: { mean, variance, coefficient }
        };
      }
      
      function findBestResponse(player, payoffMatrix) {
        let bestStrategy = 0;
        let bestPayoff = -Infinity;
        
        for (let strategy = 0; strategy < payoffMatrix.length; strategy++) {
          let totalPayoff = 0;
          let count = 0;
          
          for (let opponent = 0; opponent < payoffMatrix.length; opponent++) {
            const payoff = player === 0 ? 
              payoffMatrix[strategy][opponent][0] : 
              payoffMatrix[opponent][strategy][1];
            totalPayoff += payoff;
            count++;
          }
          
          const averagePayoff = totalPayoff / count;
          if (averagePayoff > bestPayoff) {
            bestPayoff = averagePayoff;
            bestStrategy = strategy;
          }
        }
        
        return bestStrategy;
      }
    `;
  }

  public executeTask(
    task: WorkerTask,
    onMessage?: (result: WorkerResult) => void,
    onError?: (error: Error, taskId?: string) => void
  ): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      if (!this.worker || this.status === 'terminated') {
        reject(new Error('Worker not available'));
        return;
      }

      if (this.status === 'busy') {
        reject(new Error('Worker is busy'));
        return;
      }

      this.currentTask = task;
      this.status = 'busy';
      this.metrics.lastTaskTimestamp = Date.now();
      this.onMessage = (result) => {
        if (onMessage) onMessage(result);
        resolve(result);
      };
      this.onError = (error, taskId) => {
        if (onError) onError(error, taskId);
        reject(error);
      };

      // Set timeout if specified
      let timeout: NodeJS.Timeout | null = null;
      if (task.timeout) {
        timeout = setTimeout(() => {
          this.handleWorkerError(new Error(`Task ${task.id} timed out`));
        }, task.timeout);
      }

      try {
        this.worker.postMessage({
          taskId: task.id,
          type: task.type,
          payload: task.payload
        });
      } catch (error) {
        if (timeout) clearTimeout(timeout);
        this.handleWorkerError(error as Error);
      }
    });
  }

  public getMetrics(): WorkerMetrics {
    return { ...this.metrics };
  }

  public isAvailable(): boolean {
    return this.status === 'idle' && this.worker !== null;
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.status = 'terminated';
    this.currentTask = null;
  }
}

/**
 * Enhanced Web Worker Engine with advanced features
 */
export class WebWorkerEngine {
  private workers: EnhancedWebWorker[] = [];
  private taskQueue: WorkerTask[] = [];
  private config: Required<WebWorkerEngineConfig>;
  private isProcessing = false;
  private completedTasks = new Map<string, WorkerResult>();
  private failedTasks = new Map<string, { task: WorkerTask; error: string; retryCount: number }>();
  private performanceMetrics = {
    totalTasksProcessed: 0,
    totalProcessingTime: 0,
    averageTaskTime: 0,
    throughputPerSecond: 0,
    lastMetricsUpdate: Date.now()
  };

  constructor(config: WebWorkerEngineConfig = {}) {
    this.config = {
      maxWorkers: config.maxWorkers || Math.max(1, Math.min(navigator.hardwareConcurrency || 4, 8)),
      taskTimeout: config.taskTimeout || 30000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      enableLogging: config.enableLogging ?? true,
      enableMetrics: config.enableMetrics ?? true,
      enableAutoScaling: config.enableAutoScaling ?? false,
      loadBalancing: config.loadBalancing || 'least-busy'
    };

    this.log('WebWorkerEngine initialized with config:', this.config);
  }

  public async initialize(): Promise<void> {
    this.log('Initializing Web Worker Engine...');
    
    if (!this.isWebWorkerSupported()) {
      throw new Error('Web Workers are not supported in this environment');
    }

    await this.createWorkers();
    this.startProcessing();
    
    this.log(`Web Worker Engine initialized with ${this.workers.length} workers`);
  }

  private isWebWorkerSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  private async createWorkers(): Promise<void> {
    const workerScript = this.createWorkerScript();
    
    for (let i = 0; i < this.config.maxWorkers; i++) {
      try {
        const worker = new EnhancedWebWorker(i, workerScript);
        this.workers.push(worker);
      } catch (error) {
        this.log(`Failed to create worker ${i}:`, error);
      }
    }
  }

  private createWorkerScript(): string {
    return new EnhancedWebWorker(0, '').createDefaultWorkerScript();
  }

  public addTask(task: Omit<WorkerTask, 'id'>): string {
    const taskWithId: WorkerTask = {
      ...task,
      id: this.generateTaskId(),
      priority: task.priority || 'medium',
      timeout: task.timeout || this.config.taskTimeout,
      retryCount: task.retryCount || 0
    };

    // Insert task based on priority
    this.insertTaskByPriority(taskWithId);
    
    this.log(`Task ${taskWithId.id} added to queue (priority: ${taskWithId.priority})`);
    
    return taskWithId.id;
  }

  private insertTaskByPriority(task: WorkerTask): void {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const taskPriority = priorityOrder[task.priority];
    
    let insertIndex = this.taskQueue.length;
    for (let i = 0; i < this.taskQueue.length; i++) {
      if (priorityOrder[this.taskQueue[i].priority] < taskPriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.taskQueue.splice(insertIndex, 0, task);
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processTaskQueue();
  }

  private async processTaskQueue(): Promise<void> {
    while (this.isProcessing) {
      if (this.taskQueue.length === 0) {
        await this.sleep(100); // Check every 100ms
        continue;
      }

      const availableWorker = this.getAvailableWorker();
      if (!availableWorker) {
        await this.sleep(50); // Wait for worker to become available
        continue;
      }

      const task = this.taskQueue.shift()!;
      
      try {
        await this.executeTaskOnWorker(task, availableWorker);
      } catch (error) {
        await this.handleTaskFailure(task, error as Error);
      }
    }
  }

  private getAvailableWorker(): EnhancedWebWorker | null {
    switch (this.config.loadBalancing) {
      case 'round-robin':
        return this.getRoundRobinWorker();
      case 'least-busy':
        return this.getLeastBusyWorker();
      case 'priority-based':
        return this.getPriorityBasedWorker();
      default:
        return this.getLeastBusyWorker();
    }
  }

  private getRoundRobinWorker(): EnhancedWebWorker | null {
    const availableWorkers = this.workers.filter(w => w.isAvailable());
    if (availableWorkers.length === 0) return null;
    
    const index = this.performanceMetrics.totalTasksProcessed % availableWorkers.length;
    return availableWorkers[index];
  }

  private getLeastBusyWorker(): EnhancedWebWorker | null {
    return this.workers
      .filter(w => w.isAvailable())
      .sort((a, b) => a.getMetrics().tasksCompleted - b.getMetrics().tasksCompleted)[0] || null;
  }

  private getPriorityBasedWorker(): EnhancedWebWorker | null {
    const availableWorkers = this.workers.filter(w => w.isAvailable());
    if (availableWorkers.length === 0) return null;
    
    // Return worker with best performance (lowest average processing time)
    return availableWorkers.sort((a, b) => 
      a.getMetrics().averageProcessingTime - b.getMetrics().averageProcessingTime
    )[0];
  }

  private async executeTaskOnWorker(task: WorkerTask, worker: EnhancedWebWorker): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await worker.executeTask(task);
      
      if (result.success) {
        this.completedTasks.set(task.id, result);
        this.updatePerformanceMetrics(Date.now() - startTime);
        this.log(`Task ${task.id} completed successfully`);
      } else {
        throw new Error(result.error || 'Task failed without specific error');
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleTaskFailure(task: WorkerTask, error: Error): Promise<void> {
    const retryCount = (task.retryCount || 0) + 1;
    
    if (retryCount <= this.config.maxRetries) {
      this.log(`Retrying task ${task.id} (attempt ${retryCount}/${this.config.maxRetries})`);
      
      const retryTask: WorkerTask = {
        ...task,
        retryCount
      };
      
      // Add delay before retry (exponential backoff)
      await this.sleep(Math.pow(2, retryCount) * 1000);
      this.insertTaskByPriority(retryTask);
    } else {
      this.failedTasks.set(task.id, { task, error: error.message, retryCount });
      this.log(`Task ${task.id} failed permanently after ${retryCount} attempts:`, error.message);
    }
  }

  private updatePerformanceMetrics(processingTime: number): void {
    this.performanceMetrics.totalTasksProcessed++;
    this.performanceMetrics.totalProcessingTime += processingTime;
    this.performanceMetrics.averageTaskTime = 
      this.performanceMetrics.totalProcessingTime / this.performanceMetrics.totalTasksProcessed;
    
    const now = Date.now();
    const timeElapsed = (now - this.performanceMetrics.lastMetricsUpdate) / 1000;
    if (timeElapsed > 0) {
      this.performanceMetrics.throughputPerSecond = 
        this.performanceMetrics.totalTasksProcessed / timeElapsed;
    }
  }

  public getTaskResult(taskId: string): WorkerResult | null {
    return this.completedTasks.get(taskId) || null;
  }

  public getTaskFailure(taskId: string): { task: WorkerTask; error: string; retryCount: number } | null {
    return this.failedTasks.get(taskId) || null;
  }

  public getQueueStatus(): {
    queueLength: number;
    processing: number;
    completed: number;
    failed: number;
    workers: {
      total: number;
      idle: number;
      busy: number;
      error: number;
    };
  } {
    const workerStats = this.workers.reduce((stats, worker) => {
      const status = worker.getMetrics().status;
      stats[status]++;
      return stats;
    }, { idle: 0, busy: 0, error: 0, terminated: 0 });

    return {
      queueLength: this.taskQueue.length,
      processing: workerStats.busy,
      completed: this.completedTasks.size,
      failed: this.failedTasks.size,
      workers: {
        total: this.workers.length,
        idle: workerStats.idle,
        busy: workerStats.busy,
        error: workerStats.error
      }
    };
  }

  public getPerformanceMetrics(): typeof this.performanceMetrics & { workerMetrics: WorkerMetrics[] } {
    return {
      ...this.performanceMetrics,
      workerMetrics: this.workers.map(w => w.getMetrics())
    };
  }

  public async shutdown(): Promise<void> {
    this.log('Shutting down Web Worker Engine...');
    
    this.isProcessing = false;
    
    // Wait for current tasks to complete (with timeout)
    const shutdownTimeout = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (this.workers.some(w => !w.isAvailable()) && (Date.now() - startTime) < shutdownTimeout) {
      await this.sleep(100);
    }
    
    // Terminate all workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    
    // Clear queues
    this.taskQueue = [];
    this.completedTasks.clear();
    this.failedTasks.clear();
    
    this.log('Web Worker Engine shut down');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[WebWorkerEngine] ${message}`, ...args);
    }
  }

  // Utility methods for Monte Carlo specific tasks
  public async runMonteCarloSimulation(params: {
    iterations: number;
    gameConfig: any;
    rngConfig: any;
    batchSize?: number;
    onProgress?: (progress: number) => void;
  }): Promise<any> {
    const { iterations, gameConfig, rngConfig, batchSize = 10000, onProgress } = params;
    
    if (!this.isProcessing) {
      await this.initialize();
    }

    const batches = Math.ceil(iterations / batchSize);
    const taskIds: string[] = [];
    
    // Create batch tasks
    for (let i = 0; i < batches; i++) {
      const startIteration = i * batchSize;
      const endIteration = Math.min((i + 1) * batchSize, iterations);
      
      const taskId = this.addTask({
        type: 'simulation',
        payload: {
          iterations: endIteration - startIteration,
          gameConfig,
          rngConfig,
          batchIndex: i
        },
        priority: 'high'
      });
      
      taskIds.push(taskId);
    }

    // Wait for all batches to complete
    const results = [];
    let completedBatches = 0;
    
    while (completedBatches < batches) {
      for (const taskId of taskIds) {
        const result = this.getTaskResult(taskId);
        if (result && !results.find(r => r.batchIndex === result.data.batchIndex)) {
          results.push(result.data);
          completedBatches++;
          
          if (onProgress) {
            onProgress(completedBatches / batches);
          }
        }
      }
      
      if (completedBatches < batches) {
        await this.sleep(100);
      }
    }

    // Aggregate results
    return this.aggregateSimulationResults(results);
  }

  private aggregateSimulationResults(batchResults: any[]): any {
    const aggregated = {
      outcomes: {},
      strategyFrequencies: {},
      playerPayoffs: [],
      convergenceData: [],
      statistics: {
        mean: [],
        variance: [],
        standardDeviation: []
      },
      metadata: {
        totalBatches: batchResults.length,
        totalIterations: 0
      }
    };

    // Aggregate outcomes and frequencies
    for (const batch of batchResults) {
      aggregated.metadata.totalIterations += batch.iterationsProcessed || 0;
      
      // Merge outcomes
      for (const [key, value] of Object.entries(batch.outcomes || {})) {
        aggregated.outcomes[key] = (aggregated.outcomes[key] || 0) + (value as number);
      }
      
      // Merge strategy frequencies
      for (const [key, value] of Object.entries(batch.strategyFrequencies || {})) {
        aggregated.strategyFrequencies[key] = (aggregated.strategyFrequencies[key] || 0) + (value as number);
      }
      
      // Merge payoffs
      if (batch.playerPayoffs) {
        batch.playerPayoffs.forEach((payoffs: number[], playerIndex: number) => {
          if (!aggregated.playerPayoffs[playerIndex]) {
            aggregated.playerPayoffs[playerIndex] = [];
          }
          aggregated.playerPayoffs[playerIndex].push(...payoffs);
        });
      }
      
      // Merge convergence data
      if (batch.convergenceData) {
        aggregated.convergenceData.push(...batch.convergenceData);
      }
    }

    // Calculate aggregated statistics
    if (aggregated.playerPayoffs.length > 0) {
      aggregated.statistics.mean = aggregated.playerPayoffs.map(payoffs => 
        payoffs.reduce((sum, p) => sum + p, 0) / payoffs.length
      );
      
      aggregated.statistics.variance = aggregated.playerPayoffs.map((payoffs, index) => {
        const mean = aggregated.statistics.mean[index];
        return payoffs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / payoffs.length;
      });
      
      aggregated.statistics.standardDeviation = aggregated.statistics.variance.map(v => Math.sqrt(v));
    }

    return aggregated;
  }
}

export default WebWorkerEngine; 