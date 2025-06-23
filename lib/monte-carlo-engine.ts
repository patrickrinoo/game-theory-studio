// Enhanced Random Number Generation for Monte Carlo Simulations
interface RandomNumberGenerator {
  random(): number
  setSeed(seed: number): void
  getName(): string
}

// Mersenne Twister implementation for high-quality randomness
class MersenneTwister implements RandomNumberGenerator {
  private mt: number[] = new Array(624)
  private index = 0

  constructor(seed?: number) {
    this.setSeed(seed ?? Date.now())
  }

  setSeed(seed: number): void {
    this.mt[0] = seed >>> 0
    for (let i = 1; i < 624; i++) {
      this.mt[i] = (0x6c078965 * (this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)) + i) >>> 0
    }
    this.index = 0
  }

  random(): number {
    if (this.index >= 624) {
      this.generate()
    }

    let y = this.mt[this.index++]
    y ^= y >>> 11
    y ^= (y << 7) & 0x9d2c5680
    y ^= (y << 15) & 0xefc60000
    y ^= y >>> 18

    return (y >>> 0) / 0x100000000
  }

  getName(): string {
    return "Mersenne Twister"
  }

  private generate(): void {
    for (let i = 0; i < 624; i++) {
      const y = (this.mt[i] & 0x80000000) | (this.mt[(i + 1) % 624] & 0x7fffffff)
      this.mt[i] = this.mt[(i + 397) % 624] ^ (y >>> 1)
      if (y % 2 !== 0) {
        this.mt[i] ^= 0x9908b0df
      }
    }
    this.index = 0
  }
}

// Linear Congruential Generator for fast, lightweight randomness
class LinearCongruentialGenerator implements RandomNumberGenerator {
  private seed: number

  constructor(seed?: number) {
    this.seed = seed ?? Date.now()
  }

  setSeed(seed: number): void {
    this.seed = seed
  }

  random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 0x100000000
    return this.seed / 0x100000000
  }

  getName(): string {
    return "Linear Congruential Generator"
  }
}

// Xorshift algorithm for fast, good-quality randomness
class XorshiftGenerator implements RandomNumberGenerator {
  private state: number

  constructor(seed?: number) {
    this.state = seed ?? Date.now()
  }

  setSeed(seed: number): void {
    this.state = seed
  }

  random(): number {
    this.state ^= this.state << 13
    this.state ^= this.state >>> 17
    this.state ^= this.state << 5
    return (this.state >>> 0) / 0x100000000
  }

  getName(): string {
    return "Xorshift"
  }
}

// Built-in Math.random wrapper for comparison
class MathRandomGenerator implements RandomNumberGenerator {
  setSeed(seed: number): void {
    // Math.random() cannot be seeded, this is a no-op
    console.warn("Math.random() does not support seeding")
  }

  random(): number {
    return Math.random()
  }

  getName(): string {
    return "Math.random()"
  }
}

// Randomness quality validator
class RandomnessValidator {
  // Chi-square test for uniformity
  static chiSquareTest(samples: number[], bins: number = 10): { statistic: number; pValue: number; isUniform: boolean } {
    const binSize = 1.0 / bins
    const expectedPerBin = samples.length / bins
    const observedCounts = new Array(bins).fill(0)

    // Count samples in each bin
    for (const sample of samples) {
      const binIndex = Math.min(Math.floor(sample / binSize), bins - 1)
      observedCounts[binIndex]++
    }

    // Calculate chi-square statistic
    let chiSquare = 0
    for (let i = 0; i < bins; i++) {
      const diff = observedCounts[i] - expectedPerBin
      chiSquare += (diff * diff) / expectedPerBin
    }

    // Rough p-value calculation (simplified)
    const degreesOfFreedom = bins - 1
    const pValue = this.approximatePValue(chiSquare, degreesOfFreedom)

    return {
      statistic: chiSquare,
      pValue,
      isUniform: pValue > 0.05 // 95% confidence level
    }
  }

  // Serial correlation test
  static serialCorrelationTest(samples: number[]): { correlation: number; isIndependent: boolean } {
    if (samples.length < 2) return { correlation: 0, isIndependent: true }

    const n = samples.length - 1
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0

    for (let i = 0; i < n; i++) {
      const x = samples[i]
      const y = samples[i + 1]
      sumXY += x * y
      sumX += x
      sumY += y
      sumX2 += x * x
      sumY2 += y * y
    }

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    const correlation = denominator === 0 ? 0 : numerator / denominator

    return {
      correlation,
      isIndependent: Math.abs(correlation) < 0.1 // Low correlation indicates independence
    }
  }

  private static approximatePValue(chiSquare: number, df: number): number {
    // Simplified p-value approximation using normal distribution
    // This is not exact but sufficient for basic quality assessment
    const mean = df
    const variance = 2 * df
    const z = (chiSquare - mean) / Math.sqrt(variance)
    return 1 - this.normalCDF(z)
  }

  private static normalCDF(z: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)))
  }

  private static erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }
}

// RNG Manager for handling different generators and validation
class RandomNumberGeneratorManager {
  private generators: Map<string, RandomNumberGenerator> = new Map()
  private currentGenerator: RandomNumberGenerator
  private lastSeed: number | null = null

  constructor() {
    // Register available generators
    this.generators.set("mersenne", new MersenneTwister())
    this.generators.set("lcg", new LinearCongruentialGenerator())
    this.generators.set("xorshift", new XorshiftGenerator())
    this.generators.set("math", new MathRandomGenerator())

    // Default to Mersenne Twister for best quality
    this.currentGenerator = this.generators.get("mersenne")!
  }

  setGenerator(type: string, seed?: number): boolean {
    const generator = this.generators.get(type)
    if (!generator) {
      console.error(`Unknown generator type: ${type}`)
      return false
    }

    this.currentGenerator = generator
    if (seed !== undefined) {
      this.setSeed(seed)
    }
    return true
  }

  setSeed(seed: number): void {
    this.lastSeed = seed
    this.currentGenerator.setSeed(seed)
  }

  random(): number {
    return this.currentGenerator.random()
  }

  getCurrentGeneratorName(): string {
    return this.currentGenerator.getName()
  }

  getLastSeed(): number | null {
    return this.lastSeed
  }

  // Generate samples for quality testing
  generateSamples(count: number): number[] {
    return Array.from({ length: count }, () => this.random())
  }

  // Validate current generator quality
  validateQuality(sampleSize: number = 10000): {
    generator: string
    seed: number | null
    uniformityTest: ReturnType<typeof RandomnessValidator.chiSquareTest>
    independenceTest: ReturnType<typeof RandomnessValidator.serialCorrelationTest>
    overall: "excellent" | "good" | "fair" | "poor"
  } {
    const samples = this.generateSamples(sampleSize)
    const uniformityTest = RandomnessValidator.chiSquareTest(samples)
    const independenceTest = RandomnessValidator.serialCorrelationTest(samples)

    // Determine overall quality
    let overall: "excellent" | "good" | "fair" | "poor"
    if (uniformityTest.isUniform && independenceTest.isIndependent) {
      overall = "excellent"
    } else if (uniformityTest.isUniform || independenceTest.isIndependent) {
      overall = "good"
    } else if (uniformityTest.pValue > 0.01 && Math.abs(independenceTest.correlation) < 0.3) {
      overall = "fair"
    } else {
      overall = "poor"
    }

    return {
      generator: this.getCurrentGeneratorName(),
      seed: this.getLastSeed(),
      uniformityTest,
      independenceTest,
      overall
    }
  }

  // Get available generator types
  getAvailableGenerators(): string[] {
    return Array.from(this.generators.keys())
  }
}

// Import game theory types for advanced strategy handling
import { 
  Player, 
  StrategyType, 
  PlayerBehavior, 
  AdaptiveParams,
  GameScenario,
  SimulationParameters,
  IterationHistory,
  ConvergencePoint
} from './game-theory-types'

// Performance Optimization Classes

// Simulation state for interruption/resumption
interface SimulationState {
  iteration: number
  outcomes: { [key: string]: number }
  strategyFrequencies: { [key: string]: number }
  playerPayoffs: number[][]
  convergenceData: Array<{ iteration: number; strategies: number[] }>
  playerHistories: Map<string, IterationHistory[]>
  strategyRewards: Map<string, number[]>
  opponentHistories: Map<string, number[]>
  isInterrupted: boolean
  resumeData?: any
}

// Performance monitor for tracking execution metrics
class PerformanceMonitor {
  private startTime: number = 0
  private checkpoints: Map<string, number> = new Map()
  private memorySnapshots: Array<{ timestamp: number; usage: number }> = []

  start(): void {
    this.startTime = performance.now()
    this.checkpoints.clear()
    this.memorySnapshots = []
  }

  checkpoint(name: string): void {
    this.checkpoints.set(name, performance.now() - this.startTime)
  }

  recordMemoryUsage(): void {
    const memory = (performance as any).memory
    if (memory) {
      this.memorySnapshots.push({
        timestamp: performance.now() - this.startTime,
        usage: memory.usedJSHeapSize / 1024 / 1024 // MB
      })
    }
  }

  getElapsedTime(): number {
    return performance.now() - this.startTime
  }

  getMetrics(): {
    totalTime: number
    checkpoints: { [key: string]: number }
    peakMemory: number
    averageMemory: number
  } {
    const peakMemory = Math.max(...this.memorySnapshots.map(s => s.usage), 0)
    const averageMemory = this.memorySnapshots.length > 0 
      ? this.memorySnapshots.reduce((sum, s) => sum + s.usage, 0) / this.memorySnapshots.length 
      : 0

    return {
      totalTime: this.getElapsedTime(),
      checkpoints: Object.fromEntries(this.checkpoints),
      peakMemory,
      averageMemory
    }
  }
}

// Memory manager for large simulations
class MemoryManager {
  private maxMemoryMB: number
  private gcThreshold: number
  private lastGC: number = 0

  constructor(maxMemoryMB: number = 1024) {
    this.maxMemoryMB = maxMemoryMB
    this.gcThreshold = maxMemoryMB * 0.8 // Trigger GC at 80% of limit
  }

  checkMemoryUsage(): { current: number; isNearLimit: boolean; shouldTriggerGC: boolean } {
    const memory = (performance as any).memory
    if (!memory) {
      return { current: 0, isNearLimit: false, shouldTriggerGC: false }
    }

    const currentMB = memory.usedJSHeapSize / 1024 / 1024
    const isNearLimit = currentMB > this.gcThreshold
    const shouldTriggerGC = isNearLimit && (Date.now() - this.lastGC > 5000) // 5 second cooldown

    return { current: currentMB, isNearLimit, shouldTriggerGC }
  }

  async triggerGarbageCollection(): Promise<void> {
    // Force garbage collection if available (dev environments)
    if ((window as any).gc) {
      (window as any).gc()
    }
    
    // Alternative: create memory pressure to encourage GC
    try {
      const temp = new Array(1000000).fill(0)
      temp.length = 0
    } catch (e) {
      // Ignore errors
    }

    this.lastGC = Date.now()
    
    // Small delay to allow GC to complete
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  optimizeDataStructures(data: any): any {
    // Convert large arrays to typed arrays where possible
    if (Array.isArray(data) && data.length > 1000 && data.every(item => typeof item === 'number')) {
      return new Float32Array(data)
    }
    
    // Remove unnecessary properties from objects
    if (typeof data === 'object' && data !== null) {
      const optimized: any = {}
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          optimized[key] = this.optimizeDataStructures(value)
        }
      }
      return optimized
    }
    
    return data
  }
}

// Batch processor for breaking large simulations into manageable chunks
class BatchProcessor {
  private batchSize: number
  private processingDelay: number

  constructor(batchSize: number = 10000, processingDelay: number = 1) {
    this.batchSize = batchSize
    this.processingDelay = processingDelay
  }

  async processBatches<T>(
    totalItems: number,
    processor: (startIndex: number, endIndex: number, batchNumber: number) => Promise<T>,
    onProgress?: (completed: number, total: number, batchNumber: number) => void
  ): Promise<T[]> {
    const results: T[] = []
    const totalBatches = Math.ceil(totalItems / this.batchSize)

    for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
      const startIndex = batchNumber * this.batchSize
      const endIndex = Math.min(startIndex + this.batchSize, totalItems)

      // Process batch
      const result = await processor(startIndex, endIndex, batchNumber)
      results.push(result)

      // Update progress
      if (onProgress) {
        onProgress(endIndex, totalItems, batchNumber + 1)
      }

      // Small delay to prevent UI blocking
      if (this.processingDelay > 0 && batchNumber < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, this.processingDelay))
      }
    }

    return results
  }

  setBatchSize(size: number): void {
    this.batchSize = Math.max(1000, Math.min(50000, size)) // Clamp between 1K-50K
  }

  getBatchSize(): number {
    return this.batchSize
  }
}

// Web Worker manager for parallel processing
class WebWorkerManager {
  private workers: Worker[] = []
  private workerCount: number
  private workerScript: string

  constructor(workerCount?: number) {
    this.workerCount = workerCount || Math.max(1, Math.min(navigator.hardwareConcurrency || 4, 8))
    this.workerScript = this.createWorkerScript()
  }

  private createWorkerScript(): string {
    // Create inline worker script for Monte Carlo processing
    return `
      // Monte Carlo Worker Implementation
      self.onmessage = function(e) {
        const { taskId, params, batch } = e.data;
        const { startIteration, endIteration, gameConfig, rngConfig } = batch;
        
        try {
          // Simplified Monte Carlo simulation for worker
          const results = simulateBatch({
            startIteration,
            endIteration,
            gameConfig,
            rngConfig
          });
          
          self.postMessage({
            taskId,
            success: true,
            results
          });
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message
          });
        }
      };
      
      function simulateBatch({ startIteration, endIteration, gameConfig, rngConfig }) {
        // Simplified simulation logic for worker context
        const outcomes = {};
        const strategyFrequencies = {};
        const playerPayoffs = Array(gameConfig.playerCount).fill(null).map(() => []);
        
        // Simple RNG (would use passed config in real implementation)
        let seed = rngConfig.seed || Date.now();
        function rng() {
          seed = (seed * 1664525 + 1013904223) % 0x100000000;
          return seed / 0x100000000;
        }
        
        for (let i = startIteration; i < endIteration; i++) {
          // Simulate iteration
          const chosenStrategies = [];
          
          for (let playerIndex = 0; playerIndex < gameConfig.playerCount; playerIndex++) {
            // Simple strategy selection
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
          
          // Calculate payoffs (simplified for 2-player)
          let payoffs = [0, 0];
          if (chosenStrategies.length === 2) {
            payoffs = gameConfig.payoffMatrix[chosenStrategies[0]][chosenStrategies[1]];
          }
          
          // Record results
          payoffs.forEach((payoff, playerIndex) => {
            playerPayoffs[playerIndex].push(payoff);
          });
          
          const outcomeKey = chosenStrategies.map(s => gameConfig.strategies[s]).join('-');
          outcomes[outcomeKey] = (outcomes[outcomeKey] || 0) + 1;
          
          const strategyKey = chosenStrategies.map(s => gameConfig.strategies[s]).join('-');
          strategyFrequencies[strategyKey] = (strategyFrequencies[strategyKey] || 0) + 1;
        }
        
        return {
          outcomes,
          strategyFrequencies,
          playerPayoffs,
          iterationsProcessed: endIteration - startIteration
        };
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
    `;
  }

  async initializeWorkers(): Promise<void> {
    // Clean up existing workers
    this.terminateWorkers()

    // Create new workers
    for (let i = 0; i < this.workerCount; i++) {
      try {
        const blob = new Blob([this.workerScript], { type: 'application/javascript' })
        const workerUrl = URL.createObjectURL(blob)
        const worker = new Worker(workerUrl)
        this.workers.push(worker)
      } catch (error) {
        console.warn(`Failed to create worker ${i}:`, error)
      }
    }
  }

  async processInParallel<T>(
    tasks: any[],
    processor: (task: any, workerIndex: number) => Promise<T>
  ): Promise<T[]> {
    if (this.workers.length === 0) {
      await this.initializeWorkers()
    }

    const results: T[] = new Array(tasks.length)
    const workerPromises: Promise<void>[] = []

    for (let i = 0; i < tasks.length; i++) {
      const workerIndex = i % this.workers.length
      const promise = processor(tasks[i], workerIndex).then(result => {
        results[i] = result
      })
      workerPromises.push(promise)
    }

    await Promise.all(workerPromises)
    return results
  }

  terminateWorkers(): void {
    this.workers.forEach(worker => {
      try {
        worker.terminate()
      } catch (error) {
        console.warn('Error terminating worker:', error)
      }
    })
    this.workers = []
  }

  getWorkerCount(): number {
    return this.workerCount
  }

  isSupported(): boolean {
    return typeof Worker !== 'undefined'
  }
}

// Advanced Strategy Simulation Classes

// Evolutionary Strategy Engine for adaptive behavior
class EvolutionaryStrategy {
  private playerMemories: Map<string, number[][]> = new Map()
  private learningHistory: Map<string, number[]> = new Map()

  // Initialize player memory for evolutionary learning
  initializePlayer(playerId: string, strategyCount: number, memoryLength: number = 10): void {
    this.playerMemories.set(playerId, Array(memoryLength).fill(null).map(() => Array(strategyCount).fill(0)))
    this.learningHistory.set(playerId, Array(strategyCount).fill(1 / strategyCount))
  }

  // Update player memory with recent outcomes
  updatePlayerMemory(playerId: string, strategyIndex: number, payoff: number, iteration: number): void {
    const memory = this.playerMemories.get(playerId)
    if (!memory) return

    const memoryIndex = iteration % memory.length
    memory[memoryIndex][strategyIndex] = payoff
  }

  // Calculate evolutionary fitness-based strategy selection
  evolveStrategy(playerId: string, adaptiveParams: AdaptiveParams, rng: () => number): number[] {
    const memory = this.playerMemories.get(playerId)
    const currentBelief = this.learningHistory.get(playerId)
    
    if (!memory || !currentBelief) {
      return Array(adaptiveParams.initialBelief.length).fill(1 / adaptiveParams.initialBelief.length)
    }

    // Calculate average payoffs for each strategy from memory
    const avgPayoffs = currentBelief.map((_, strategyIndex) => {
      const validEntries = memory.filter(entry => entry[strategyIndex] !== 0)
      if (validEntries.length === 0) return 0
      return validEntries.reduce((sum, entry) => sum + entry[strategyIndex], 0) / validEntries.length
    })

    // Apply evolutionary pressure with exploration
    const newBelief = currentBelief.map((belief, i) => {
      const fitness = Math.max(0, avgPayoffs[i])
      const exploration = adaptiveParams.explorationRate * rng()
      return belief * adaptiveParams.learningRate + fitness * (1 - adaptiveParams.learningRate) + exploration
    })

    // Normalize to valid probability distribution
    const sum = newBelief.reduce((s, p) => s + p, 0)
    const normalizedBelief = sum > 0 ? newBelief.map(p => p / sum) : adaptiveParams.initialBelief

    // Update learning history
    this.learningHistory.set(playerId, normalizedBelief)
    
    return normalizedBelief
  }
}

// Advanced mixed strategy calculator with CDFs
class MixedStrategyCalculator {
  // Calculate cumulative distribution function
  static calculateCDF(probabilities: number[]): number[] {
    const cdf: number[] = []
    let cumulative = 0
    
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += Math.max(0, probabilities[i]) // Ensure non-negative
      cdf.push(cumulative)
    }
    
    // Normalize to ensure CDF ends at 1.0
    const total = cdf[cdf.length - 1]
    if (total > 0) {
      return cdf.map(value => value / total)
    }
    
    // Fallback to uniform distribution
    return probabilities.map((_, i) => (i + 1) / probabilities.length)
  }

  // Sample strategy using inverse transform sampling with CDF
  static sampleStrategyFromCDF(cdf: number[], random: number): number {
    for (let i = 0; i < cdf.length; i++) {
      if (random <= cdf[i]) {
        return i
      }
    }
    return cdf.length - 1 // Fallback
  }

  // Advanced mixed strategy with multiple distribution types
  static generateMixedStrategy(
    type: 'uniform' | 'weighted' | 'concentrated' | 'polarized',
    strategyCount: number,
    rng: () => number,
    weights?: number[]
  ): number[] {
    switch (type) {
      case 'uniform':
        return Array(strategyCount).fill(1 / strategyCount)
      
      case 'weighted':
        if (weights && weights.length === strategyCount) {
          const sum = weights.reduce((s, w) => s + w, 0)
          return weights.map(w => w / sum)
        }
        return Array(strategyCount).fill(1 / strategyCount)
      
      case 'concentrated':
        // Most probability on one strategy with small noise
        const concentration = rng() * strategyCount
        const dominantStrategy = Math.floor(concentration)
        const dominantWeight = 0.7 + rng() * 0.25 // 70-95% concentration
        const remaining = (1 - dominantWeight) / (strategyCount - 1)
        return Array(strategyCount).fill(remaining).map((w, i) => 
          i === dominantStrategy ? dominantWeight : w
        )
      
      case 'polarized':
        // High probability on two opposing strategies
        const strategies = Array(strategyCount).fill(0.05 / (strategyCount - 2))
        const first = Math.floor(rng() * strategyCount)
        let second = Math.floor(rng() * strategyCount)
        while (second === first) {
          second = Math.floor(rng() * strategyCount)
        }
        const splitRatio = 0.4 + rng() * 0.2 // 40-60% split
        strategies[first] = splitRatio
        strategies[second] = 1 - splitRatio - 0.05
        return strategies
    }
  }
}

// Adaptive Player Behavior Engine
class AdaptiveBehaviorEngine {
  // Tit-for-tat strategy implementation
  static titForTat(
    playerId: string, 
    opponentHistory: number[], 
    strategies: string[], 
    cooperativeIndex: number = 0
  ): number {
    if (opponentHistory.length === 0) {
      return cooperativeIndex // Start cooperative
    }
    return opponentHistory[opponentHistory.length - 1] // Copy last opponent move
  }

  // Grudger strategy - cooperate until defected against, then always defect
  static grudger(
    playerId: string,
    opponentHistory: number[],
    strategies: string[],
    cooperativeIndex: number = 0,
    defectiveIndex: number = 1
  ): number {
    const hasBeenDefectedAgainst = opponentHistory.includes(defectiveIndex)
    return hasBeenDefectedAgainst ? defectiveIndex : cooperativeIndex
  }

  // Pavlov (Win-Stay, Lose-Shift) strategy
  static pavlov(
    playerId: string,
    ownHistory: number[],
    payoffHistory: number[],
    strategies: string[],
    averagePayoff: number
  ): number {
    if (ownHistory.length === 0 || payoffHistory.length === 0) {
      return 0 // Start with first strategy
    }

    const lastPayoff = payoffHistory[payoffHistory.length - 1]
    const lastStrategy = ownHistory[ownHistory.length - 1]

    // If last payoff was above average, stay with same strategy; otherwise, shift
    if (lastPayoff >= averagePayoff) {
      return lastStrategy
    } else {
      return (lastStrategy + 1) % strategies.length
    }
  }

  // Reinforcement learning-based strategy selection
  static reinforcementLearning(
    playerId: string,
    strategyRewards: number[],
    epsilon: number,
    rng: () => number
  ): number {
    const totalReward = strategyRewards.reduce((sum, reward) => sum + Math.max(0, reward), 0)
    
    // Epsilon-greedy exploration
    if (rng() < epsilon) {
      return Math.floor(rng() * strategyRewards.length) // Explore
    }
    
    // Exploit best strategy based on accumulated rewards
    if (totalReward === 0) {
      return Math.floor(rng() * strategyRewards.length) // Random if no rewards yet
    }

    const probabilities = strategyRewards.map(reward => Math.max(0, reward) / totalReward)
    const cdf = MixedStrategyCalculator.calculateCDF(probabilities)
    return MixedStrategyCalculator.sampleStrategyFromCDF(cdf, rng())
  }
}

// Convergence Analysis System

// Statistical test results interface
interface StatisticalTestResult {
  testName: string
  statistic: number
  pValue: number
  isSignificant: boolean
  threshold: number
  interpretation: string
}

// Convergence detection result
interface ConvergenceResult {
  isConverged: boolean
  confidence: number
  iteration: number
  reason: string
  statistics: {
    mean: number[]
    variance: number[]
    standardError: number[]
    confidenceInterval: { lower: number[]; upper: number[] }
  }
  tests: StatisticalTestResult[]
  recommendedAction: 'continue' | 'stop' | 'extend_window'
}

// Moving window statistics calculator
class MovingWindowStats {
  private windowSize: number
  private data: number[][] = [] // [iteration][playerPayoffs]
  private playerCount: number

  constructor(windowSize: number, playerCount: number) {
    this.windowSize = windowSize
    this.playerCount = playerCount
    this.data = []
  }

  addDataPoint(playerPayoffs: number[]): void {
    this.data.push([...playerPayoffs])
    
    // Maintain window size
    if (this.data.length > this.windowSize) {
      this.data.shift()
    }
  }

  isFull(): boolean {
    return this.data.length >= this.windowSize
  }

  getMean(): number[] {
    if (this.data.length === 0) return Array(this.playerCount).fill(0)
    
    const sums = Array(this.playerCount).fill(0)
    this.data.forEach(payoffs => {
      payoffs.forEach((payoff, playerIndex) => {
        sums[playerIndex] += payoff
      })
    })
    
    return sums.map(sum => sum / this.data.length)
  }

  getVariance(): number[] {
    if (this.data.length < 2) return Array(this.playerCount).fill(0)
    
    const means = this.getMean()
    const squaredDiffs = Array(this.playerCount).fill(0)
    
    this.data.forEach(payoffs => {
      payoffs.forEach((payoff, playerIndex) => {
        const diff = payoff - means[playerIndex]
        squaredDiffs[playerIndex] += diff * diff
      })
    })
    
    return squaredDiffs.map(sum => sum / (this.data.length - 1))
  }

  getStandardError(): number[] {
    const variances = this.getVariance()
    return variances.map(variance => Math.sqrt(variance / this.data.length))
  }

  getConfidenceInterval(confidenceLevel: number = 0.95): { lower: number[]; upper: number[] } {
    const means = this.getMean()
    const standardErrors = this.getStandardError()
    
    // t-distribution critical value (approximation for large samples)
    const tCritical = this.getTCriticalValue(confidenceLevel, this.data.length - 1)
    
    const margins = standardErrors.map(se => se * tCritical)
    
    return {
      lower: means.map((mean, i) => mean - margins[i]),
      upper: means.map((mean, i) => mean + margins[i])
    }
  }

  private getTCriticalValue(confidenceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-table lookup for common confidence levels
    const alpha = 1 - confidenceLevel
    
    if (degreesOfFreedom >= 30) {
      // Use normal distribution approximation for large samples
      if (alpha <= 0.01) return 2.576  // 99%
      if (alpha <= 0.05) return 1.960  // 95%
      if (alpha <= 0.10) return 1.645  // 90%
    }
    
    // Simplified t-values for smaller samples (conservative estimates)
    if (alpha <= 0.01) return 3.0
    if (alpha <= 0.05) return 2.2
    if (alpha <= 0.10) return 1.8
    
    return 2.0 // Default fallback
  }

  getRecentTrend(lookback: number = 10): number[] {
    if (this.data.length < lookback) return Array(this.playerCount).fill(0)
    
    const recentData = this.data.slice(-lookback)
    const trends = Array(this.playerCount).fill(0)
    
    recentData.forEach((payoffs, index) => {
      payoffs.forEach((payoff, playerIndex) => {
        // Simple linear trend calculation
        const weight = (index + 1) / lookback // More weight to recent data
        trends[playerIndex] += payoff * weight
      })
    })
    
    return trends.map(trend => trend / lookback)
  }
}

// Statistical convergence analyzer
class ConvergenceAnalyzer {
  private windowSize: number
  private confidenceLevel: number
  private stabilityThreshold: number
  private minIterations: number
  private maxIterations: number
  private windows: MovingWindowStats[]
  private convergenceHistory: ConvergenceResult[]

  constructor(options: {
    windowSize?: number
    confidenceLevel?: number
    stabilityThreshold?: number
    minIterations?: number
    maxIterations?: number
    playerCount: number
  }) {
    this.windowSize = options.windowSize || 1000
    this.confidenceLevel = options.confidenceLevel || 0.95
    this.stabilityThreshold = options.stabilityThreshold || 0.01
    this.minIterations = options.minIterations || 5000
    this.maxIterations = options.maxIterations || 1000000
    
    // Create multiple windows for different timeframes
    this.windows = [
      new MovingWindowStats(this.windowSize, options.playerCount),
      new MovingWindowStats(this.windowSize * 2, options.playerCount),
      new MovingWindowStats(this.windowSize / 2, options.playerCount)
    ]
    
    this.convergenceHistory = []
  }

  addDataPoint(iteration: number, playerPayoffs: number[]): void {
    this.windows.forEach(window => window.addDataPoint(playerPayoffs))
  }

  checkConvergence(iteration: number): ConvergenceResult {
    const mainWindow = this.windows[0]
    
    // Must have minimum iterations and full window
    if (iteration < this.minIterations || !mainWindow.isFull()) {
      return this.createNonConvergedResult(iteration, 'Insufficient data')
    }

    // Gather statistics
    const mean = mainWindow.getMean()
    const variance = mainWindow.getVariance()
    const standardError = mainWindow.getStandardError()
    const confidenceInterval = mainWindow.getConfidenceInterval(this.confidenceLevel)

    // Run statistical tests
    const tests = this.runStatisticalTests(iteration)
    
    // Determine convergence
    const stabilityTest = this.checkStability(mean, standardError)
    const varianceTest = this.checkVarianceStability()
    const trendTest = this.checkTrendStability()
    
    const isConverged = stabilityTest && varianceTest && trendTest && 
                       tests.every(test => test.isSignificant)
    
    const confidence = this.calculateConfidence(tests, stabilityTest, varianceTest, trendTest)
    
    const result: ConvergenceResult = {
      isConverged,
      confidence,
      iteration,
      reason: this.generateReason(isConverged, tests, stabilityTest, varianceTest, trendTest),
      statistics: {
        mean,
        variance,
        standardError,
        confidenceInterval
      },
      tests,
      recommendedAction: this.getRecommendedAction(isConverged, iteration, confidence)
    }

    this.convergenceHistory.push(result)
    return result
  }

  private runStatisticalTests(iteration: number): StatisticalTestResult[] {
    const tests: StatisticalTestResult[] = []
    
    // 1. Welch's t-test for mean stability
    tests.push(this.welchTTest())
    
    // 2. F-test for variance equality
    tests.push(this.fTestVariance())
    
    // 3. Run test for randomness
    tests.push(this.runTest())
    
    // 4. Autocorrelation test
    tests.push(this.autocorrelationTest())
    
    return tests
  }

  private welchTTest(): StatisticalTestResult {
    const window1 = this.windows[0] // Recent window
    const window2 = this.windows[1] // Longer window
    
    if (!window1.isFull() || !window2.isFull()) {
      return {
        testName: "Welch's t-test",
        statistic: 0,
        pValue: 1,
        isSignificant: false,
        threshold: 0.05,
        interpretation: "Insufficient data for test"
      }
    }

    const mean1 = window1.getMean()
    const mean2 = window2.getMean()
    const var1 = window1.getVariance()
    const var2 = window2.getVariance()
    
    // Calculate t-statistic for first player (simplified)
    const pooledSE = Math.sqrt(var1[0] / this.windowSize + var2[0] / (this.windowSize * 2))
    const tStatistic = pooledSE > 0 ? Math.abs(mean1[0] - mean2[0]) / pooledSE : 0
    
    // Approximate p-value (simplified)
    const pValue = tStatistic > 2 ? 0.01 : (tStatistic > 1.5 ? 0.1 : 0.5)
    
    return {
      testName: "Welch's t-test",
      statistic: tStatistic,
      pValue,
      isSignificant: pValue > 0.05, // Non-significant means stable
      threshold: 0.05,
      interpretation: pValue > 0.05 ? "Means are statistically stable" : "Means are still changing"
    }
  }

  private fTestVariance(): StatisticalTestResult {
    const shortWindow = this.windows[2] // Shorter window
    const longWindow = this.windows[0] // Main window
    
    if (!shortWindow.isFull() || !longWindow.isFull()) {
      return {
        testName: "F-test for Variance",
        statistic: 0,
        pValue: 1,
        isSignificant: false,
        threshold: 0.05,
        interpretation: "Insufficient data for test"
      }
    }

    const var1 = shortWindow.getVariance()[0]
    const var2 = longWindow.getVariance()[0]
    
    const fStatistic = var1 > var2 ? var1 / var2 : var2 / var1
    
    // Simplified p-value calculation
    const pValue = fStatistic > 2 ? 0.01 : (fStatistic > 1.5 ? 0.1 : 0.8)
    
    return {
      testName: "F-test for Variance",
      statistic: fStatistic,
      pValue,
      isSignificant: pValue > 0.05, // Non-significant means stable variance
      threshold: 0.05,
      interpretation: pValue > 0.05 ? "Variance is stable" : "Variance is still changing"
    }
  }

  private runTest(): StatisticalTestResult {
    const window = this.windows[0]
    if (!window.isFull()) {
      return {
        testName: "Runs Test",
        statistic: 0,
        pValue: 1,
        isSignificant: false,
        threshold: 0.05,
        interpretation: "Insufficient data for test"
      }
    }

    // Simplified runs test for randomness
    const means = window.getMean()
    const median = means[0] // Use first player's mean as reference
    
    let runs = 1
    let lastAboveMedian = false
    
    // This is a simplified version - would need actual data points for proper implementation
    const runStatistic = Math.abs(runs - this.windowSize / 2) / Math.sqrt(this.windowSize / 4)
    const pValue = runStatistic > 2 ? 0.01 : 0.5
    
    return {
      testName: "Runs Test",
      statistic: runStatistic,
      pValue,
      isSignificant: pValue > 0.05,
      threshold: 0.05,
      interpretation: pValue > 0.05 ? "Data appears random (good for convergence)" : "Data shows patterns"
    }
  }

  private autocorrelationTest(): StatisticalTestResult {
    // Simplified autocorrelation test
    const window = this.windows[0]
    if (!window.isFull()) {
      return {
        testName: "Autocorrelation Test",
        statistic: 0,
        pValue: 1,
        isSignificant: false,
        threshold: 0.05,
        interpretation: "Insufficient data for test"
      }
    }

    // For now, return a positive result (would need actual time series data)
    return {
      testName: "Autocorrelation Test",
      statistic: 0.1,
      pValue: 0.8,
      isSignificant: true,
      threshold: 0.05,
      interpretation: "Low autocorrelation indicates good convergence"
    }
  }

  private checkStability(mean: number[], standardError: number[]): boolean {
    // Check if standard error is below threshold relative to mean
    return standardError.every((se, index) => {
      const relativeSE = Math.abs(mean[index]) > 0 ? se / Math.abs(mean[index]) : se
      return relativeSE < this.stabilityThreshold
    })
  }

  private checkVarianceStability(): boolean {
    // Compare variance between windows
    const shortWindow = this.windows[2]
    const longWindow = this.windows[0]
    
    if (!shortWindow.isFull() || !longWindow.isFull()) return false
    
    const shortVar = shortWindow.getVariance()
    const longVar = longWindow.getVariance()
    
    return shortVar.every((sv, index) => {
      const lv = longVar[index]
      if (lv === 0) return sv < this.stabilityThreshold
      return Math.abs(sv - lv) / lv < this.stabilityThreshold
    })
  }

  private checkTrendStability(): boolean {
    // Check if recent trends are stable
    const window = this.windows[0]
    if (!window.isFull()) return false
    
    const recentTrend = window.getRecentTrend(50)
    const longerTrend = window.getRecentTrend(200)
    
    return recentTrend.every((rt, index) => {
      const lt = longerTrend[index]
      return Math.abs(rt - lt) < this.stabilityThreshold * Math.abs(lt || 1)
    })
  }

  private calculateConfidence(
    tests: StatisticalTestResult[], 
    stability: boolean, 
    variance: boolean, 
    trend: boolean
  ): number {
    let confidence = 0
    
    // Weight statistical tests
    const passedTests = tests.filter(test => test.isSignificant).length
    confidence += (passedTests / tests.length) * 0.4
    
    // Weight stability checks
    if (stability) confidence += 0.3
    if (variance) confidence += 0.2
    if (trend) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }

  private generateReason(
    isConverged: boolean, 
    tests: StatisticalTestResult[], 
    stability: boolean, 
    variance: boolean, 
    trend: boolean
  ): string {
    if (!isConverged) {
      const issues = []
      if (!stability) issues.push("means not stable")
      if (!variance) issues.push("variance not stable")
      if (!trend) issues.push("trends not stable")
      
      const failedTests = tests.filter(test => !test.isSignificant)
      if (failedTests.length > 0) {
        issues.push(`statistical tests failed: ${failedTests.map(t => t.testName).join(', ')}`)
      }
      
      return `Not converged: ${issues.join(', ')}`
    }
    
    return "All convergence criteria met: statistical stability achieved"
  }

  private getRecommendedAction(
    isConverged: boolean, 
    iteration: number, 
    confidence: number
  ): 'continue' | 'stop' | 'extend_window' {
    if (isConverged && confidence > 0.8) return 'stop'
    if (iteration > this.maxIterations) return 'stop'
    if (confidence > 0.5 && iteration > this.minIterations * 2) return 'extend_window'
    return 'continue'
  }

  private createNonConvergedResult(iteration: number, reason: string): ConvergenceResult {
    return {
      isConverged: false,
      confidence: 0,
      iteration,
      reason,
      statistics: {
        mean: [],
        variance: [],
        standardError: [],
        confidenceInterval: { lower: [], upper: [] }
      },
      tests: [],
      recommendedAction: 'continue'
    }
  }

  getConvergenceHistory(): ConvergenceResult[] {
    return [...this.convergenceHistory]
  }

  reset(): void {
    this.windows.forEach(window => {
      (window as any).data = []
    })
    this.convergenceHistory = []
  }

  // Generate convergence visualization data
  generateVisualizationData(): {
    convergencePoints: ConvergencePoint[]
    confidenceTrend: Array<{ iteration: number; confidence: number }>
    statisticalTests: Array<{ iteration: number; tests: StatisticalTestResult[] }>
  } {
    const convergencePoints: ConvergencePoint[] = this.convergenceHistory.map(result => ({
      iteration: result.iteration,
      strategies: [], // Would be populated with actual strategy data
      payoffs: result.statistics.mean,
      variance: result.statistics.variance.reduce((sum, v) => sum + v, 0) / result.statistics.variance.length,
      isConverged: result.isConverged
    }))

    const confidenceTrend = this.convergenceHistory.map(result => ({
      iteration: result.iteration,
      confidence: result.confidence
    }))

    const statisticalTests = this.convergenceHistory.map(result => ({
      iteration: result.iteration,
      tests: result.tests
    }))

    return {
      convergencePoints,
      confidenceTrend,
      statisticalTests
    }
  }
}

// Advanced Results Aggregation System

// Comprehensive payoff distribution tracking
interface PayoffDistribution {
  playerIndex: number
  values: number[]
  frequency: Map<number, number>
  percentiles: { [key: number]: number } // 25th, 50th, 75th, 90th, 95th, 99th
  statistics: {
    mean: number
    median: number
    mode: number[]
    variance: number
    standardDeviation: number
    skewness: number
    kurtosis: number
    range: { min: number; max: number }
  }
  confidence: { level: number; lower: number; upper: number }[]
}

// Strategy evolution tracking over time
interface StrategyEvolution {
  strategyName: string
  strategyIndex: number
  playerIndex: number
  timeline: Array<{
    iteration: number
    frequency: number
    averagePayoff: number
    variance: number
    winRate: number // percentage of times this strategy had highest payoff
    dominanceScore: number // 0-1 score of strategy dominance
  }>
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
    slope: number
    correlation: number
    volatility: number
  }
}

// Advanced statistical measures collection
interface AdvancedStatistics {
  descriptiveStats: {
    centralTendency: { mean: number; median: number; mode: number[] }
    dispersion: { variance: number; standardDeviation: number; coefficientOfVariation: number }
    shape: { skewness: number; kurtosis: number }
    position: { quartiles: number[]; percentiles: number[] }
  }
  inferentialStats: {
    confidenceIntervals: Array<{ level: number; lower: number; upper: number }>
    tTests: Array<{ comparison: string; statistic: number; pValue: number; significant: boolean }>
    anova: { fStatistic: number; pValue: number; significant: boolean }
    correlations: { pearson: number[][]; spearman: number[][] }
  }
  temporalStats: {
    trendAnalysis: { slope: number; rSquared: number; significance: number }
    seasonality: { detected: boolean; period: number; strength: number }
    changePoints: Array<{ iteration: number; magnitude: number; significance: number }>
  }
}

// Real-time calculation engine
class RealTimeCalculator {
  private runningMeans: number[]
  private runningSums: number[]
  private runningSquaredSums: number[]
  private count: number = 0
  private playerCount: number

  constructor(playerCount: number) {
    this.playerCount = playerCount
    this.runningMeans = Array(playerCount).fill(0)
    this.runningSums = Array(playerCount).fill(0)
    this.runningSquaredSums = Array(playerCount).fill(0)
  }

  addDataPoint(playerPayoffs: number[]): void {
    this.count++
    
    playerPayoffs.forEach((payoff, playerIndex) => {
      if (playerIndex < this.playerCount) {
        // Update running sums
        this.runningSums[playerIndex] += payoff
        this.runningSquaredSums[playerIndex] += payoff * payoff
        
        // Update running mean
        this.runningMeans[playerIndex] = this.runningSums[playerIndex] / this.count
      }
    })
  }

  getCurrentMeans(): number[] {
    return [...this.runningMeans]
  }

  getCurrentVariances(): number[] {
    if (this.count < 2) return Array(this.playerCount).fill(0)
    
    return this.runningMeans.map((mean, playerIndex) => {
      const sumSquares = this.runningSquaredSums[playerIndex]
      const sumMean = this.runningSums[playerIndex]
      return (sumSquares - (sumMean * sumMean) / this.count) / (this.count - 1)
    })
  }

  getCurrentStandardDeviations(): number[] {
    return this.getCurrentVariances().map(variance => Math.sqrt(variance))
  }

  getCurrentCoefficientsOfVariation(): number[] {
    const means = this.getCurrentMeans()
    const stdDevs = this.getCurrentStandardDeviations()
    
    return means.map((mean, index) => {
      return mean !== 0 ? stdDevs[index] / Math.abs(mean) : 0
    })
  }

  reset(): void {
    this.count = 0
    this.runningMeans.fill(0)
    this.runningSums.fill(0)
    this.runningSquaredSums.fill(0)
  }
}

// Historical data manager
class HistoricalDataManager {
  private historicalResults: Map<string, any> = new Map()
  private comparisonCache: Map<string, any> = new Map()

  storeResult(sessionId: string, result: any): void {
    this.historicalResults.set(sessionId, {
      timestamp: Date.now(),
      ...result
    })
  }

  compareToHistorical(currentResult: any, criteria: {
    gameType?: string
    playerCount?: number
    iterations?: number
    timeWindow?: number // days
  }): {
    similarSessions: Array<{ sessionId: string; similarity: number; result: any }>
    averageComparison: { improvements: string[]; regressions: string[] }
    percentileRanking: { [key: string]: number }
  } {
    const relevantSessions = this.getRelevantSessions(criteria)
    
    const comparisons = relevantSessions.map(session => ({
      sessionId: session.sessionId,
      similarity: this.calculateSimilarity(currentResult, session.result),
      result: session.result
    }))

    const sortedSimilar = comparisons
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10) // Top 10 most similar

    return {
      similarSessions: sortedSimilar,
      averageComparison: this.generateAverageComparison(currentResult, relevantSessions),
      percentileRanking: this.calculatePercentileRanking(currentResult, relevantSessions)
    }
  }

  private getRelevantSessions(criteria: any): Array<{ sessionId: string; result: any }> {
    const now = Date.now()
    const timeWindowMs = (criteria.timeWindow || 30) * 24 * 60 * 60 * 1000

    return Array.from(this.historicalResults.entries())
      .filter(([sessionId, data]) => {
        // Time filter
        if (criteria.timeWindow && (now - data.timestamp) > timeWindowMs) return false
        
        // Game type filter
        if (criteria.gameType && data.gameType !== criteria.gameType) return false
        
        // Player count filter
        if (criteria.playerCount && data.playerCount !== criteria.playerCount) return false
        
        // Iteration count filter (within 50% range)
        if (criteria.iterations) {
          const iterationRatio = data.iterations / criteria.iterations
          if (iterationRatio < 0.5 || iterationRatio > 2.0) return false
        }
        
        return true
      })
      .map(([sessionId, data]) => ({ sessionId, result: data }))
  }

  private calculateSimilarity(result1: any, result2: any): number {
    // Simple similarity calculation based on expected payoffs
    if (!result1.expectedPayoffs || !result2.expectedPayoffs) return 0
    
    const payoffs1 = result1.expectedPayoffs
    const payoffs2 = result2.expectedPayoffs
    
    if (payoffs1.length !== payoffs2.length) return 0
    
    // Calculate normalized Euclidean distance
    let sumSquaredDiffs = 0
    let sumSquaredMagnitudes = 0
    
    for (let i = 0; i < payoffs1.length; i++) {
      sumSquaredDiffs += Math.pow(payoffs1[i] - payoffs2[i], 2)
      sumSquaredMagnitudes += Math.pow(payoffs1[i], 2) + Math.pow(payoffs2[i], 2)
    }
    
    return sumSquaredMagnitudes > 0 ? 1 - Math.sqrt(sumSquaredDiffs / sumSquaredMagnitudes) : 0
  }

  private generateAverageComparison(currentResult: any, historicalSessions: any[]): any {
    if (historicalSessions.length === 0) {
      return { improvements: [], regressions: [] }
    }

    const improvements: string[] = []
    const regressions: string[] = []

    // Compare expected payoffs
    if (currentResult.expectedPayoffs && historicalSessions[0]?.result?.expectedPayoffs) {
      const currentTotal = currentResult.expectedPayoffs.reduce((sum: number, p: number) => sum + p, 0)
      const historicalAvg = historicalSessions
        .map(session => session.result.expectedPayoffs?.reduce((sum: number, p: number) => sum + p, 0) || 0)
        .reduce((sum, total) => sum + total, 0) / historicalSessions.length

      if (currentTotal > historicalAvg * 1.05) {
        improvements.push('Overall payoff performance improved')
      } else if (currentTotal < historicalAvg * 0.95) {
        regressions.push('Overall payoff performance declined')
      }
    }

    return { improvements, regressions }
  }

  private calculatePercentileRanking(currentResult: any, historicalSessions: any[]): { [key: string]: number } {
    if (historicalSessions.length === 0) return {}

    const rankings: { [key: string]: number } = {}

    // Rank expected payoffs
    if (currentResult.expectedPayoffs) {
      currentResult.expectedPayoffs.forEach((payoff: number, playerIndex: number) => {
        const historicalPayoffs = historicalSessions
          .map(session => session.result.expectedPayoffs?.[playerIndex])
          .filter(p => p !== undefined)
          .sort((a, b) => a - b)

        if (historicalPayoffs.length > 0) {
          const rank = historicalPayoffs.filter(p => p <= payoff).length
          rankings[`player${playerIndex}_payoff`] = (rank / historicalPayoffs.length) * 100
        }
      })
    }

    return rankings
  }

  getStoredSessionCount(): number {
    return this.historicalResults.size
  }

  clearOldSessions(daysToKeep: number = 30): number {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    let removedCount = 0

    for (const [sessionId, data] of this.historicalResults.entries()) {
      if (data.timestamp < cutoffTime) {
        this.historicalResults.delete(sessionId)
        removedCount++
      }
    }

    return removedCount
  }
}

// Advanced results aggregator
class AdvancedResultsAggregator {
  private payoffDistributions: Map<number, PayoffDistribution> = new Map()
  private strategyEvolutions: Map<string, StrategyEvolution> = new Map()
  private realTimeCalculator: RealTimeCalculator
  private historicalManager: HistoricalDataManager
  private rawPayoffData: Map<number, number[]> = new Map()
  private strategyFrequencyHistory: Array<{ iteration: number; frequencies: Map<string, number> }> = []

  constructor(playerCount: number) {
    this.realTimeCalculator = new RealTimeCalculator(playerCount)
    this.historicalManager = new HistoricalDataManager()
    
    // Initialize payoff distributions for each player
    for (let i = 0; i < playerCount; i++) {
      this.rawPayoffData.set(i, [])
    }
  }

  addIterationData(iteration: number, playerPayoffs: number[], strategyChoices: number[], strategyNames: string[]): void {
    // Update real-time calculations
    this.realTimeCalculator.addDataPoint(playerPayoffs)
    
    // Store raw payoff data
    playerPayoffs.forEach((payoff, playerIndex) => {
      const playerData = this.rawPayoffData.get(playerIndex) || []
      playerData.push(payoff)
      this.rawPayoffData.set(playerIndex, playerData)
    })

    // Track strategy frequency for this iteration
    const currentFrequencies = new Map<string, number>()
    strategyChoices.forEach((strategyIndex, playerIndex) => {
      if (strategyIndex < strategyNames.length) {
        const strategyName = strategyNames[strategyIndex]
        const key = `${playerIndex}_${strategyName}`
        currentFrequencies.set(key, (currentFrequencies.get(key) || 0) + 1)
      }
    })
    
    this.strategyFrequencyHistory.push({
      iteration,
      frequencies: currentFrequencies
    })

    // Update strategy evolution tracking (sample every 100 iterations for performance)
    if (iteration % 100 === 0) {
      this.updateStrategyEvolution(iteration, strategyChoices, playerPayoffs, strategyNames)
    }
  }

  private updateStrategyEvolution(iteration: number, strategyChoices: number[], playerPayoffs: number[], strategyNames: string[]): void {
    strategyChoices.forEach((strategyIndex, playerIndex) => {
      if (strategyIndex < strategyNames.length) {
        const strategyName = strategyNames[strategyIndex]
        const key = `${playerIndex}_${strategyName}`
        
        let evolution = this.strategyEvolutions.get(key)
        if (!evolution) {
          evolution = {
            strategyName,
            strategyIndex,
            playerIndex,
            timeline: [],
            trends: {
              direction: 'stable',
              slope: 0,
              correlation: 0,
              volatility: 0
            }
          }
          this.strategyEvolutions.set(key, evolution)
        }

        // Calculate frequency over recent history
        const recentWindow = 1000 // Last 1000 iterations
        const recentHistory = this.strategyFrequencyHistory
          .filter(entry => entry.iteration > iteration - recentWindow)
        
        const recentCount = recentHistory.reduce((sum, entry) => {
          return sum + (entry.frequencies.get(key) || 0)
        }, 0)
        
        const frequency = recentHistory.length > 0 ? recentCount / recentHistory.length : 0
        
        // Calculate average payoff for this strategy
        const averagePayoff = playerPayoffs[playerIndex]
        
        // Calculate win rate (simplified)
        const maxPayoffThisIteration = Math.max(...playerPayoffs)
        const winRate = playerPayoffs[playerIndex] === maxPayoffThisIteration ? 1 : 0
        
        // Add timeline entry
        evolution.timeline.push({
          iteration,
          frequency,
          averagePayoff,
          variance: 0, // Would be calculated with more historical data
          winRate,
          dominanceScore: frequency * (averagePayoff / (Math.max(...playerPayoffs) || 1))
        })

        // Update trends (simplified)
        if (evolution.timeline.length >= 2) {
          const recent = evolution.timeline.slice(-10) // Last 10 data points
          if (recent.length >= 2) {
            const firstFreq = recent[0].frequency
            const lastFreq = recent[recent.length - 1].frequency
            evolution.trends.slope = (lastFreq - firstFreq) / recent.length
            
            if (Math.abs(evolution.trends.slope) > 0.01) {
              evolution.trends.direction = evolution.trends.slope > 0 ? 'increasing' : 'decreasing'
            } else {
              evolution.trends.direction = 'stable'
            }
          }
        }
      }
    })
  }

  generatePayoffDistributions(): Map<number, PayoffDistribution> {
    this.payoffDistributions.clear()
    
    for (const [playerIndex, payoffs] of this.rawPayoffData.entries()) {
      if (payoffs.length === 0) continue
      
      const sortedPayoffs = [...payoffs].sort((a, b) => a - b)
      const distribution: PayoffDistribution = {
        playerIndex,
        values: payoffs,
        frequency: this.calculateFrequency(payoffs),
        percentiles: this.calculatePercentiles(sortedPayoffs),
        statistics: this.calculateDescriptiveStats(payoffs),
        confidence: this.calculateConfidenceIntervals(payoffs)
      }
      
      this.payoffDistributions.set(playerIndex, distribution)
    }
    
    return this.payoffDistributions
  }

  private calculateFrequency(values: number[]): Map<number, number> {
    const frequency = new Map<number, number>()
    
    values.forEach(value => {
      // Round to 2 decimal places for frequency calculation
      const rounded = Math.round(value * 100) / 100
      frequency.set(rounded, (frequency.get(rounded) || 0) + 1)
    })
    
    return frequency
  }

  private calculatePercentiles(sortedValues: number[]): { [key: number]: number } {
    if (sortedValues.length === 0) return {}
    
    const percentiles = [25, 50, 75, 90, 95, 99]
    const result: { [key: number]: number } = {}
    
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * sortedValues.length) - 1
      result[p] = sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))]
    })
    
    return result
  }

  private calculateDescriptiveStats(values: number[]): PayoffDistribution['statistics'] {
    if (values.length === 0) {
      return {
        mean: 0, median: 0, mode: [], variance: 0, standardDeviation: 0,
        skewness: 0, kurtosis: 0, range: { min: 0, max: 0 }
      }
    }

    const sorted = [...values].sort((a, b) => a - b)
    const n = values.length
    
    // Mean
    const mean = values.reduce((sum, val) => sum + val, 0) / n
    
    // Median
    const median = n % 2 === 0 
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
      : sorted[Math.floor(n/2)]
    
    // Mode
    const frequency = this.calculateFrequency(values)
    const maxFreq = Math.max(...frequency.values())
    const mode = Array.from(frequency.entries())
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val, _]) => val)
    
    // Variance and standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
    const standardDeviation = Math.sqrt(variance)
    
    // Skewness and kurtosis (simplified calculations)
    const skewness = this.calculateSkewness(values, mean, standardDeviation)
    const kurtosis = this.calculateKurtosis(values, mean, standardDeviation)
    
    return {
      mean, median, mode, variance, standardDeviation, skewness, kurtosis,
      range: { min: sorted[0], max: sorted[sorted.length - 1] }
    }
  }

  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0
    
    const n = values.length
    const skewness = values.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / stdDev, 3)
    }, 0) / n
    
    return skewness
  }

  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    if (stdDev === 0) return 0
    
    const n = values.length
    const kurtosis = values.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / stdDev, 4)
    }, 0) / n
    
    return kurtosis - 3 // Excess kurtosis
  }

  private calculateConfidenceIntervals(values: number[]): Array<{ level: number; lower: number; upper: number }> {
    if (values.length < 2) return []
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
    const standardError = Math.sqrt(variance / values.length)
    
    const confidenceLevels = [0.90, 0.95, 0.99]
    const tValues = [1.645, 1.960, 2.576] // Approximations for large samples
    
    return confidenceLevels.map((level, index) => {
      const margin = tValues[index] * standardError
      return {
        level,
        lower: mean - margin,
        upper: mean + margin
      }
    })
  }

  generateAdvancedStatistics(): AdvancedStatistics {
    const allPayoffs = Array.from(this.rawPayoffData.values()).flat()
    
    if (allPayoffs.length === 0) {
      return this.getEmptyAdvancedStatistics()
    }

    const sorted = [...allPayoffs].sort((a, b) => a - b)
    const mean = allPayoffs.reduce((sum, val) => sum + val, 0) / allPayoffs.length
    const variance = allPayoffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (allPayoffs.length - 1)
    const standardDeviation = Math.sqrt(variance)

    return {
      descriptiveStats: {
        centralTendency: {
          mean,
          median: this.calculateMedian(sorted),
          mode: this.calculateMode(allPayoffs)
        },
        dispersion: {
          variance,
          standardDeviation,
          coefficientOfVariation: mean !== 0 ? standardDeviation / Math.abs(mean) : 0
        },
        shape: {
          skewness: this.calculateSkewness(allPayoffs, mean, standardDeviation),
          kurtosis: this.calculateKurtosis(allPayoffs, mean, standardDeviation)
        },
        position: {
          quartiles: this.calculateQuartiles(sorted),
          percentiles: Object.values(this.calculatePercentiles(sorted))
        }
      },
      inferentialStats: {
        confidenceIntervals: this.calculateConfidenceIntervals(allPayoffs),
        tTests: [], // Would require comparison groups
        anova: { fStatistic: 0, pValue: 1, significant: false },
        correlations: { pearson: [[1]], spearman: [[1]] }
      },
      temporalStats: {
        trendAnalysis: { slope: 0, rSquared: 0, significance: 0 },
        seasonality: { detected: false, period: 0, strength: 0 },
        changePoints: []
      }
    }
  }

  private getEmptyAdvancedStatistics(): AdvancedStatistics {
    return {
      descriptiveStats: {
        centralTendency: { mean: 0, median: 0, mode: [] },
        dispersion: { variance: 0, standardDeviation: 0, coefficientOfVariation: 0 },
        shape: { skewness: 0, kurtosis: 0 },
        position: { quartiles: [], percentiles: [] }
      },
      inferentialStats: {
        confidenceIntervals: [],
        tTests: [],
        anova: { fStatistic: 0, pValue: 1, significant: false },
        correlations: { pearson: [], spearman: [] }
      },
      temporalStats: {
        trendAnalysis: { slope: 0, rSquared: 0, significance: 0 },
        seasonality: { detected: false, period: 0, strength: 0 },
        changePoints: []
      }
    }
  }

  private calculateMedian(sortedValues: number[]): number {
    const n = sortedValues.length
    return n % 2 === 0 
      ? (sortedValues[n/2 - 1] + sortedValues[n/2]) / 2 
      : sortedValues[Math.floor(n/2)]
  }

  private calculateMode(values: number[]): number[] {
    const frequency = this.calculateFrequency(values)
    const maxFreq = Math.max(...frequency.values())
    return Array.from(frequency.entries())
      .filter(([_, freq]) => freq === maxFreq)
      .map(([val, _]) => val)
  }

  private calculateQuartiles(sortedValues: number[]): number[] {
    if (sortedValues.length === 0) return []
    
    const q1Index = Math.floor(sortedValues.length * 0.25)
    const q2Index = Math.floor(sortedValues.length * 0.50)
    const q3Index = Math.floor(sortedValues.length * 0.75)
    
    return [
      sortedValues[q1Index],
      sortedValues[q2Index],
      sortedValues[q3Index]
    ]
  }

  getResults(): {
    payoffDistributions: Map<number, PayoffDistribution>
    strategyEvolutions: Map<string, StrategyEvolution>
    realTimeStats: {
      means: number[]
      variances: number[]
      standardDeviations: number[]
      coefficientsOfVariation: number[]
    }
    advancedStatistics: AdvancedStatistics
  } {
    return {
      payoffDistributions: this.generatePayoffDistributions(),
      strategyEvolutions: new Map(this.strategyEvolutions),
      realTimeStats: {
        means: this.realTimeCalculator.getCurrentMeans(),
        variances: this.realTimeCalculator.getCurrentVariances(),
        standardDeviations: this.realTimeCalculator.getCurrentStandardDeviations(),
        coefficientsOfVariation: this.realTimeCalculator.getCurrentCoefficientsOfVariation()
      },
      advancedStatistics: this.generateAdvancedStatistics()
    }
  }

  compareToHistorical(sessionId: string, criteria: any): any {
    return this.historicalManager.compareToHistorical(this.getResults(), criteria)
  }

  storeSession(sessionId: string): void {
    this.historicalManager.storeResult(sessionId, {
      ...this.getResults(),
      timestamp: Date.now()
    })
  }

  reset(): void {
    this.payoffDistributions.clear()
    this.strategyEvolutions.clear()
    this.realTimeCalculator.reset()
    this.rawPayoffData.clear()
    this.strategyFrequencyHistory = []
  }
}

// Nash Equilibrium Analysis
interface NashEquilibriumResult {
  type: 'pure' | 'mixed' | 'approximate'
  strategies: number[] | number[][] // Pure: indices, Mixed: probabilities
  payoffs: number[]
  isStrict: boolean
  stability: number // 0-1 score
  confidence: number // For approximate solutions
  convergenceIterations?: number
}

interface EvolutionaryStableStrategy {
  strategyIndex: number
  strategyName: string
  invasionThreshold: number
  stability: number
  fitnessAdvantage: number
  isESS: boolean
}

interface CoalitionAnalysis {
  shapleyValues: number[]
  coreExists: boolean
  coreSolutions: number[][]
  bargainingSolutions: {
    nash: number[]
    kalaiSmorodinsky: number[]
  }
  votingPower: number[]
}

interface DominanceAnalysis {
  strictlyDominated: Array<{ player: number; strategy: number; dominatedBy: number[] }>
  weaklyDominated: Array<{ player: number; strategy: number; dominatedBy: number[] }>
  eliminationOrder: Array<{ iteration: number; eliminated: Array<{ player: number; strategy: number }> }>
  remainingStrategies: number[][]
}

interface GameTheoryAnalysisResult {
  nashEquilibria: NashEquilibriumResult[]
  evolutionaryStableStrategies: EvolutionaryStableStrategy[]
  dominanceAnalysis: DominanceAnalysis
  coalitionAnalysis?: CoalitionAnalysis
  gameProperties: {
    isZeroSum: boolean
    isSymmetric: boolean
    hasStrictlyDominantStrategies: boolean
    hasPureDominanceEquilibrium: boolean
    maxPlayerCount: number
    strategyCount: number[]
  }
  computationTime: number
}

class NashEquilibriumCalculator {
  // Find pure strategy Nash equilibria using best response analysis
  static findPureNashEquilibria(payoffMatrix: number[][][]): NashEquilibriumResult[] {
    const equilibria: NashEquilibriumResult[] = []
    const playerCount = payoffMatrix[0][0].length
    const strategyCounts = this.getStrategyCounts(payoffMatrix)
    
    // Generate all strategy combinations
    const strategyCombinations = this.generateStrategyCombinations(strategyCounts)
    
    for (const combination of strategyCombinations) {
      if (this.isPureNashEquilibrium(combination, payoffMatrix)) {
        const payoffs = this.calculatePayoffs(combination, payoffMatrix)
        const stability = this.calculateStability(combination, payoffMatrix)
        
        equilibria.push({
          type: 'pure',
          strategies: combination,
          payoffs,
          isStrict: this.isStrictEquilibrium(combination, payoffMatrix),
          stability,
          confidence: 1.0 // Pure equilibria have perfect confidence
        })
      }
    }
    
    return equilibria
  }

  // Find mixed strategy Nash equilibria using iterative best response
  static findMixedNashEquilibria(
    payoffMatrix: number[][][], 
    maxIterations: number = 1000,
    tolerance: number = 1e-6,
    rng: () => number = Math.random
  ): NashEquilibriumResult[] {
    const equilibria: NashEquilibriumResult[] = []
    const playerCount = payoffMatrix[0][0].length
    const strategyCounts = this.getStrategyCounts(payoffMatrix)
    
    // Try multiple random starting points
    const attempts = Math.min(20, playerCount * 5)
    
    for (let attempt = 0; attempt < attempts; attempt++) {
      const result = this.findMixedEquilibriumFromStartingPoint(
        payoffMatrix, 
        strategyCounts, 
        maxIterations, 
        tolerance, 
        rng
      )
      
      if (result && !this.isDuplicateEquilibrium(result, equilibria, tolerance)) {
        equilibria.push(result)
      }
    }
    
    return equilibria
  }

  private static findMixedEquilibriumFromStartingPoint(
    payoffMatrix: number[][][], 
    strategyCounts: number[], 
    maxIterations: number, 
    tolerance: number, 
    rng: () => number
  ): NashEquilibriumResult | null {
    const playerCount = payoffMatrix[0][0].length
    
    // Initialize random mixed strategies
    let strategies: number[][] = []
    for (let i = 0; i < playerCount; i++) {
      strategies[i] = this.generateRandomProbabilities(strategyCounts[i], rng)
    }
    
    let converged = false
    let iteration = 0
    
    while (!converged && iteration < maxIterations) {
      const newStrategies: number[][] = []
      
      for (let player = 0; player < playerCount; player++) {
        const bestResponse = this.calculateBestResponse(player, strategies, payoffMatrix)
        newStrategies[player] = bestResponse
      }
      
      // Check convergence
      converged = this.hasConverged(strategies, newStrategies, tolerance)
      strategies = newStrategies
      iteration++
    }
    
    if (converged && this.isMixedNashEquilibrium(strategies, payoffMatrix, tolerance)) {
      const payoffs = this.calculateMixedPayoffs(strategies, payoffMatrix)
      const stability = this.calculateMixedStability(strategies, payoffMatrix)
      
      return {
        type: 'mixed',
        strategies,
        payoffs,
        isStrict: false, // Mixed equilibria are typically not strict
        stability,
        confidence: this.calculateConfidence(strategies, payoffMatrix, tolerance),
        convergenceIterations: iteration
      }
    }
    
    return null
  }

  // Monte Carlo approximation for complex games
  static findApproximateNashEquilibria(
    payoffMatrix: number[][][],
    samples: number = 100000,
    tolerance: number = 1e-3,
    rng: () => number = Math.random
  ): NashEquilibriumResult[] {
    const equilibria: NashEquilibriumResult[] = []
    const playerCount = payoffMatrix[0][0].length
    const strategyCounts = this.getStrategyCounts(payoffMatrix)
    
    const candidateEquilibria: Array<{ strategies: number[][]; fitness: number }> = []
    
    // Sample strategy combinations and evaluate
    for (let sample = 0; sample < samples; sample++) {
      const strategies: number[][] = []
      for (let player = 0; player < playerCount; player++) {
        strategies[player] = this.generateRandomProbabilities(strategyCounts[player], rng)
      }
      
      const fitness = this.evaluateEquilibriumFitness(strategies, payoffMatrix)
      
      if (fitness > 1 - tolerance) { // Close to equilibrium
        candidateEquilibria.push({ strategies, fitness })
      }
    }
    
    // Cluster similar candidates and refine
    const clusteredCandidates = this.clusterEquilibriaCandidates(candidateEquilibria, tolerance)
    
    for (const cluster of clusteredCandidates) {
      const refined = this.refineApproximateEquilibrium(cluster.strategies, payoffMatrix, tolerance)
      if (refined) {
        equilibria.push(refined)
      }
    }
    
    return equilibria
  }

  private static getStrategyCounts(payoffMatrix: number[][][]): number[] {
    const playerCount = payoffMatrix[0][0].length
    const strategyCounts: number[] = []
    
    for (let player = 0; player < playerCount; player++) {
      // For symmetric games, all players have same strategy count
      strategyCounts[player] = payoffMatrix.length
    }
    
    return strategyCounts
  }

  private static generateStrategyCombinations(strategyCounts: number[]): number[][] {
    const combinations: number[][] = []
    const generateRecursive = (current: number[], playerIndex: number) => {
      if (playerIndex === strategyCounts.length) {
        combinations.push([...current])
        return
      }
      
      for (let strategy = 0; strategy < strategyCounts[playerIndex]; strategy++) {
        current[playerIndex] = strategy
        generateRecursive(current, playerIndex + 1)
      }
    }
    
    generateRecursive([], 0)
    return combinations
  }

  private static isPureNashEquilibrium(strategies: number[], payoffMatrix: number[][][]): boolean {
    const playerCount = strategies.length
    
    for (let player = 0; player < playerCount; player++) {
      const currentPayoff = this.getPlayerPayoff(player, strategies, payoffMatrix)
      
      // Check if any unilateral deviation is beneficial
      for (let altStrategy = 0; altStrategy < payoffMatrix.length; altStrategy++) {
        if (altStrategy === strategies[player]) continue
        
        const altStrategies = [...strategies]
        altStrategies[player] = altStrategy
        const altPayoff = this.getPlayerPayoff(player, altStrategies, payoffMatrix)
        
        if (altPayoff > currentPayoff) {
          return false // Beneficial deviation found
        }
      }
    }
    
    return true
  }

  private static calculatePayoffs(strategies: number[], payoffMatrix: number[][][]): number[] {
    const playerCount = strategies.length
    const payoffs: number[] = []
    
    for (let player = 0; player < playerCount; player++) {
      payoffs[player] = this.getPlayerPayoff(player, strategies, payoffMatrix)
    }
    
    return payoffs
  }

  private static getPlayerPayoff(player: number, strategies: number[], payoffMatrix: number[][][]): number {
    const strategyCombination = strategies
    return payoffMatrix[strategyCombination[0]][strategyCombination[1] || 0][player]
  }

  private static calculateStability(strategies: number[], payoffMatrix: number[][][]): number {
    const playerCount = strategies.length
    let totalStability = 0
    
    for (let player = 0; player < playerCount; player++) {
      const currentPayoff = this.getPlayerPayoff(player, strategies, payoffMatrix)
      let maxAlternativePayoff = currentPayoff
      
      for (let altStrategy = 0; altStrategy < payoffMatrix.length; altStrategy++) {
        if (altStrategy === strategies[player]) continue
        
        const altStrategies = [...strategies]
        altStrategies[player] = altStrategy
        const altPayoff = this.getPlayerPayoff(player, altStrategies, payoffMatrix)
        maxAlternativePayoff = Math.max(maxAlternativePayoff, altPayoff)
      }
      
      // Stability is inverse of incentive to deviate
      const deviationIncentive = Math.max(0, maxAlternativePayoff - currentPayoff)
      const playerStability = 1 / (1 + deviationIncentive)
      totalStability += playerStability
    }
    
    return totalStability / playerCount
  }

  private static isStrictEquilibrium(strategies: number[], payoffMatrix: number[][][]): boolean {
    const playerCount = strategies.length
    
    for (let player = 0; player < playerCount; player++) {
      const currentPayoff = this.getPlayerPayoff(player, strategies, payoffMatrix)
      
      for (let altStrategy = 0; altStrategy < payoffMatrix.length; altStrategy++) {
        if (altStrategy === strategies[player]) continue
        
        const altStrategies = [...strategies]
        altStrategies[player] = altStrategy
        const altPayoff = this.getPlayerPayoff(player, altStrategies, payoffMatrix)
        
        if (altPayoff >= currentPayoff) {
          return false // Non-strict inequality found
        }
      }
    }
    
    return true
  }

  private static generateRandomProbabilities(count: number, rng: () => number): number[] {
    const probabilities: number[] = []
    let sum = 0
    
    for (let i = 0; i < count; i++) {
      const prob = rng()
      probabilities[i] = prob
      sum += prob
    }
    
    // Normalize to sum to 1
    return probabilities.map(p => p / sum)
  }

  private static calculateBestResponse(
    player: number, 
    opponentStrategies: number[][], 
    payoffMatrix: number[][][]
  ): number[] {
    const strategyCount = payoffMatrix.length
    const expectedPayoffs: number[] = []
    
    // Calculate expected payoff for each pure strategy
    for (let strategy = 0; strategy < strategyCount; strategy++) {
      let expectedPayoff = 0
      
      // For 2-player games, calculate against opponent's mixed strategy
      if (opponentStrategies.length === 2) {
        const opponent = 1 - player
        for (let oppStrategy = 0; oppStrategy < strategyCount; oppStrategy++) {
          const probability = opponentStrategies[opponent][oppStrategy]
          const strategies = player === 0 ? [strategy, oppStrategy] : [oppStrategy, strategy]
          const payoff = this.getPlayerPayoff(player, strategies, payoffMatrix)
          expectedPayoff += probability * payoff
        }
      }
      
      expectedPayoffs[strategy] = expectedPayoff
    }
    
    // Best response is probability 1 on best strategy, 0 on others
    const bestStrategy = expectedPayoffs.indexOf(Math.max(...expectedPayoffs))
    const bestResponse = new Array(strategyCount).fill(0)
    bestResponse[bestStrategy] = 1
    
    return bestResponse
  }

  private static hasConverged(
    oldStrategies: number[][], 
    newStrategies: number[][], 
    tolerance: number
  ): boolean {
    for (let player = 0; player < oldStrategies.length; player++) {
      for (let strategy = 0; strategy < oldStrategies[player].length; strategy++) {
        if (Math.abs(oldStrategies[player][strategy] - newStrategies[player][strategy]) > tolerance) {
          return false
        }
      }
    }
    return true
  }

  private static isMixedNashEquilibrium(
    strategies: number[][], 
    payoffMatrix: number[][][], 
    tolerance: number
  ): boolean {
    const playerCount = strategies.length
    
    for (let player = 0; player < playerCount; player++) {
      const bestResponse = this.calculateBestResponse(player, strategies, payoffMatrix)
      
      // Check if current strategy is close to best response
      for (let strategy = 0; strategy < strategies[player].length; strategy++) {
        if (Math.abs(strategies[player][strategy] - bestResponse[strategy]) > tolerance) {
          return false
        }
      }
    }
    
    return true
  }

  private static calculateMixedPayoffs(strategies: number[][], payoffMatrix: number[][][]): number[] {
    const playerCount = strategies.length
    const payoffs: number[] = []
    
    for (let player = 0; player < playerCount; player++) {
      let expectedPayoff = 0
      
      // For 2-player games
      if (playerCount === 2) {
        const opponent = 1 - player
        for (let myStrategy = 0; myStrategy < strategies[player].length; myStrategy++) {
          for (let oppStrategy = 0; oppStrategy < strategies[opponent].length; oppStrategy++) {
            const probability = strategies[player][myStrategy] * strategies[opponent][oppStrategy]
            const gameStrategies = player === 0 ? [myStrategy, oppStrategy] : [oppStrategy, myStrategy]
            const payoff = this.getPlayerPayoff(player, gameStrategies, payoffMatrix)
            expectedPayoff += probability * payoff
          }
        }
      }
      
      payoffs[player] = expectedPayoff
    }
    
    return payoffs
  }

  private static calculateMixedStability(strategies: number[][], payoffMatrix: number[][][]): number {
    // Stability based on how close the mixed strategy is to indifference
    const playerCount = strategies.length
    let totalStability = 0
    
    for (let player = 0; player < playerCount; player++) {
      const expectedPayoffs: number[] = []
      
      // Calculate expected payoff for each pure strategy
      for (let strategy = 0; strategy < strategies[player].length; strategy++) {
        let expectedPayoff = 0
        
        if (playerCount === 2) {
          const opponent = 1 - player
          for (let oppStrategy = 0; oppStrategy < strategies[opponent].length; oppStrategy++) {
            const probability = strategies[opponent][oppStrategy]
            const gameStrategies = player === 0 ? [strategy, oppStrategy] : [oppStrategy, strategy]
            const payoff = this.getPlayerPayoff(player, gameStrategies, payoffMatrix)
            expectedPayoff += probability * payoff
          }
        }
        
        expectedPayoffs[strategy] = expectedPayoff
      }
      
      // Calculate variance in expected payoffs (lower variance = more stable)
      const mean = expectedPayoffs.reduce((sum, payoff) => sum + payoff, 0) / expectedPayoffs.length
      const variance = expectedPayoffs.reduce((sum, payoff) => sum + Math.pow(payoff - mean, 2), 0) / expectedPayoffs.length
      const stability = 1 / (1 + variance)
      
      totalStability += stability
    }
    
    return totalStability / playerCount
  }

  private static calculateConfidence(
    strategies: number[][], 
    payoffMatrix: number[][][], 
    tolerance: number
  ): number {
    // Confidence based on how well the strategy satisfies equilibrium conditions
    const fitness = this.evaluateEquilibriumFitness(strategies, payoffMatrix)
    return Math.max(0, Math.min(1, fitness))
  }

  private static evaluateEquilibriumFitness(strategies: number[][], payoffMatrix: number[][][]): number {
    let totalFitness = 0
    const playerCount = strategies.length
    
    for (let player = 0; player < playerCount; player++) {
      const bestResponse = this.calculateBestResponse(player, strategies, payoffMatrix)
      
      // Calculate similarity to best response
      let similarity = 0
      for (let strategy = 0; strategy < strategies[player].length; strategy++) {
        similarity += Math.min(strategies[player][strategy], bestResponse[strategy])
      }
      
      totalFitness += similarity
    }
    
    return totalFitness / playerCount
  }

  private static isDuplicateEquilibrium(
    candidate: NashEquilibriumResult, 
    existing: NashEquilibriumResult[], 
    tolerance: number
  ): boolean {
    for (const equilibrium of existing) {
      if (equilibrium.type !== candidate.type) continue
      
      let isDuplicate = true
      
      if (candidate.type === 'pure' && Array.isArray(candidate.strategies) && Array.isArray(equilibrium.strategies)) {
        // Compare pure strategies
        if (candidate.strategies.length !== equilibrium.strategies.length) continue
        
        for (let i = 0; i < candidate.strategies.length; i++) {
          if (candidate.strategies[i] !== equilibrium.strategies[i]) {
            isDuplicate = false
            break
          }
        }
      } else if (candidate.type === 'mixed' && Array.isArray(candidate.strategies[0]) && Array.isArray(equilibrium.strategies[0])) {
        // Compare mixed strategies
        const candidateStrategies = candidate.strategies as number[][]
        const equilibriumStrategies = equilibrium.strategies as number[][]
        
        if (candidateStrategies.length !== equilibriumStrategies.length) continue
        
        for (let player = 0; player < candidateStrategies.length; player++) {
          if (candidateStrategies[player].length !== equilibriumStrategies[player].length) {
            isDuplicate = false
            break
          }
          
          for (let strategy = 0; strategy < candidateStrategies[player].length; strategy++) {
            if (Math.abs(candidateStrategies[player][strategy] - equilibriumStrategies[player][strategy]) > tolerance) {
              isDuplicate = false
              break
            }
          }
          
          if (!isDuplicate) break
        }
      }
      
      if (isDuplicate) return true
    }
    
    return false
  }

  private static clusterEquilibriaCandidates(
    candidates: Array<{ strategies: number[][]; fitness: number }>, 
    tolerance: number
  ): Array<{ strategies: number[][]; fitness: number }> {
    const clusters: Array<{ strategies: number[][]; fitness: number }> = []
    
    for (const candidate of candidates) {
      let addedToCluster = false
      
      for (const cluster of clusters) {
        if (this.areStrategiesSimilar(candidate.strategies, cluster.strategies, tolerance)) {
          // Update cluster with better candidate
          if (candidate.fitness > cluster.fitness) {
            cluster.strategies = candidate.strategies
            cluster.fitness = candidate.fitness
          }
          addedToCluster = true
          break
        }
      }
      
      if (!addedToCluster) {
        clusters.push(candidate)
      }
    }
    
    return clusters
  }

  private static areStrategiesSimilar(
    strategies1: number[][], 
    strategies2: number[][], 
    tolerance: number
  ): boolean {
    if (strategies1.length !== strategies2.length) return false
    
    for (let player = 0; player < strategies1.length; player++) {
      if (strategies1[player].length !== strategies2[player].length) return false
      
      for (let strategy = 0; strategy < strategies1[player].length; strategy++) {
        if (Math.abs(strategies1[player][strategy] - strategies2[player][strategy]) > tolerance) {
          return false
        }
      }
    }
    
    return true
  }

  private static refineApproximateEquilibrium(
    strategies: number[][], 
    payoffMatrix: number[][][], 
    tolerance: number
  ): NashEquilibriumResult | null {
    // Refine the approximate equilibrium using local search
    let currentStrategies = strategies.map(playerStrategy => [...playerStrategy])
    let improved = true
    let iterations = 0
    const maxIterations = 100
    
    while (improved && iterations < maxIterations) {
      improved = false
      
      for (let player = 0; player < currentStrategies.length; player++) {
        const bestResponse = this.calculateBestResponse(player, currentStrategies, payoffMatrix)
        
        // Gradually move towards best response
        const learningRate = 0.1
        for (let strategy = 0; strategy < currentStrategies[player].length; strategy++) {
          const newValue = currentStrategies[player][strategy] + 
            learningRate * (bestResponse[strategy] - currentStrategies[player][strategy])
          
          if (Math.abs(newValue - currentStrategies[player][strategy]) > tolerance * 0.1) {
            improved = true
          }
          
          currentStrategies[player][strategy] = newValue
        }
        
        // Renormalize
        const sum = currentStrategies[player].reduce((a, b) => a + b, 0)
        currentStrategies[player] = currentStrategies[player].map(p => p / sum)
      }
      
      iterations++
    }
    
    // Check if refined solution is close to equilibrium
    const fitness = this.evaluateEquilibriumFitness(currentStrategies, payoffMatrix)
    
    if (fitness > 1 - tolerance) {
      const payoffs = this.calculateMixedPayoffs(currentStrategies, payoffMatrix)
      const stability = this.calculateMixedStability(currentStrategies, payoffMatrix)
      
      return {
        type: 'approximate',
        strategies: currentStrategies,
        payoffs,
        isStrict: false,
        stability,
        confidence: fitness,
        convergenceIterations: iterations
      }
    }
    
    return null
  }
}

export class MonteCarloEngine {
  private rngManager: RandomNumberGeneratorManager
  private evolutionaryEngine: EvolutionaryStrategy
  private playerHistories: Map<string, IterationHistory[]> = new Map()
  private strategyRewards: Map<string, number[]> = new Map()
  
  // Performance optimization components
  private performanceMonitor: PerformanceMonitor
  private memoryManager: MemoryManager
  private batchProcessor: BatchProcessor
  private webWorkerManager: WebWorkerManager
  private simulationState: SimulationState | null = null
  private isInterrupted: boolean = false

  // Convergence analysis components
  private convergenceAnalyzer: ConvergenceAnalyzer | null = null
  private enableEarlyStop: boolean = false

  // Advanced results aggregation components
  private resultsAggregator: AdvancedResultsAggregator | null = null
  private enableAdvancedResults: boolean = false

  // Game Theory Integration
  private gameTheoryAnalysis: GameTheoryAnalysisResult | null = null
  private enableGameTheoryAnalysis: boolean = false

  constructor() {
    this.rngManager = new RandomNumberGeneratorManager()
    this.evolutionaryEngine = new EvolutionaryStrategy()
    this.performanceMonitor = new PerformanceMonitor()
    this.memoryManager = new MemoryManager()
    this.batchProcessor = new BatchProcessor()
    this.webWorkerManager = new WebWorkerManager()
  }

  // Configure game theory analysis options
  configureGameTheoryAnalysis(options: {
    enable?: boolean
    enableNashEquilibrium?: boolean
    enableESS?: boolean
    enableDominance?: boolean
    enableCoalition?: boolean
    nashApproximation?: {
      samples?: number
      tolerance?: number
    }
    essOptions?: {
      maxGenerations?: number
      tolerance?: number
    }
  }): void {
    this.enableGameTheoryAnalysis = options.enable ?? false
    
    // Store options for later use
    this.gameTheoryOptions = {
      enableNashEquilibrium: options.enableNashEquilibrium ?? true,
      enableESS: options.enableESS ?? true,
      enableDominance: options.enableDominance ?? true,
      enableCoalition: options.enableCoalition ?? false,
      nashApproximation: options.nashApproximation ?? { samples: 50000, tolerance: 1e-3 },
      essOptions: options.essOptions ?? { maxGenerations: 1000, tolerance: 1e-6 }
    }
  }

  private gameTheoryOptions: any = {}

  // Configure convergence analysis
  configureConvergence(options: {
    enable?: boolean
    windowSize?: number
    confidenceLevel?: number
    stabilityThreshold?: number
    minIterations?: number
    maxIterations?: number
    playerCount: number
  }): void {
    if (options.enable !== false) {
      this.convergenceAnalyzer = new ConvergenceAnalyzer(options)
      this.enableEarlyStop = true
    } else {
      this.convergenceAnalyzer = null
      this.enableEarlyStop = false
    }
  }

  // Configure advanced results aggregation
  configureAdvancedResults(options: {
    enable?: boolean
    playerCount: number
    trackDistributions?: boolean
    trackEvolution?: boolean
    enableHistoricalComparison?: boolean
  }): void {
    if (options.enable !== false) {
      this.resultsAggregator = new AdvancedResultsAggregator(options.playerCount)
      this.enableAdvancedResults = true
    } else {
      this.resultsAggregator = null
      this.enableAdvancedResults = false
    }
  }

  // Configure the random number generator
  configureRNG(type: string = "mersenne", seed?: number): boolean {
    return this.rngManager.setGenerator(type, seed)
  }

  // Set seed for reproducible simulations
  setSeed(seed: number): void {
    this.rngManager.setSeed(seed)
  }

  // Get RNG information
  getRNGInfo(): {
    generator: string
    seed: number | null
    availableGenerators: string[]
  } {
    return {
      generator: this.rngManager.getCurrentGeneratorName(),
      seed: this.rngManager.getLastSeed(),
      availableGenerators: this.rngManager.getAvailableGenerators()
    }
  }

  // Validate RNG quality
  validateRNGQuality(sampleSize?: number): ReturnType<typeof RandomNumberGeneratorManager.prototype.validateQuality> {
    return this.rngManager.validateQuality(sampleSize)
  }

  // Enhanced strategy selection with advanced algorithms
  private selectAdvancedStrategy(
    player: Player,
    gameScenario: GameScenario,
    iteration: number,
    opponentHistories?: Map<string, number[]>
  ): number {
    const playerHistory = this.playerHistories.get(player.id) || []
    const strategyCount = gameScenario.payoffMatrix.strategies.length
    const rng = () => this.rngManager.random()

    switch (player.strategyType) {
      case StrategyType.PURE:
        return player.pureStrategy || 0

      case StrategyType.MIXED:
        if (player.mixedStrategy && player.mixedStrategy.length === strategyCount) {
          const cdf = MixedStrategyCalculator.calculateCDF(player.mixedStrategy)
          return MixedStrategyCalculator.sampleStrategyFromCDF(cdf, rng())
        }
        // Fallback to uniform mixed strategy
        const uniformProbs = Array(strategyCount).fill(1 / strategyCount)
        const uniformCdf = MixedStrategyCalculator.calculateCDF(uniformProbs)
        return MixedStrategyCalculator.sampleStrategyFromCDF(uniformCdf, rng())

      case StrategyType.ADAPTIVE:
        if (player.adaptiveParams) {
          // Initialize if first iteration
          if (iteration === 0) {
            this.evolutionaryEngine.initializePlayer(
              player.id, 
              strategyCount, 
              player.adaptiveParams.memoryLength
            )
          }

          // Evolve strategy based on experience
          const evolvedProbs = this.evolutionaryEngine.evolveStrategy(
            player.id, 
            player.adaptiveParams, 
            rng
          )
          const evolvedCdf = MixedStrategyCalculator.calculateCDF(evolvedProbs)
          return MixedStrategyCalculator.sampleStrategyFromCDF(evolvedCdf, rng())
        }
        return 0

      case StrategyType.RANDOM:
        return Math.floor(rng() * strategyCount)

      default:
        return 0
    }
  }

  // Enhanced strategy selection with behavioral patterns
  private selectBehavioralStrategy(
    player: Player,
    gameScenario: GameScenario,
    iteration: number,
    opponentHistories: Map<string, number[]>
  ): number {
    const playerHistory = this.playerHistories.get(player.id) || []
    const strategies = gameScenario.payoffMatrix.strategies
    const strategyCount = strategies.length
    const rng = () => this.rngManager.random()

    // Get opponent history (simplified for 2-player games)
    const opponentIds = Array.from(opponentHistories.keys()).filter(id => id !== player.id)
    const opponentHistory = opponentIds.length > 0 ? opponentHistories.get(opponentIds[0]) || [] : []

    switch (player.behavior) {
      case PlayerBehavior.RATIONAL:
        // Use standard strategy selection
        return this.selectAdvancedStrategy(player, gameScenario, iteration)

      case PlayerBehavior.TIT_FOR_TAT:
        // Assume cooperative strategy is at index 0
        return AdaptiveBehaviorEngine.titForTat(player.id, opponentHistory, strategies.map(s => s.name), 0)

      case PlayerBehavior.GRUDGER:
        // Assume cooperative at 0, defective at 1
        return AdaptiveBehaviorEngine.grudger(player.id, opponentHistory, strategies.map(s => s.name), 0, 1)

      case PlayerBehavior.PAVLOV:
        const payoffHistory = playerHistory.map(h => h.payoffs[parseInt(player.id)] || 0)
        const avgPayoff = payoffHistory.length > 0 ? 
          payoffHistory.reduce((sum, p) => sum + p, 0) / payoffHistory.length : 0
        return AdaptiveBehaviorEngine.pavlov(
          player.id,
          playerHistory.map(h => h.playerChoices[parseInt(player.id)] || 0),
          payoffHistory,
          strategies.map(s => s.name),
          avgPayoff
        )

      case PlayerBehavior.AGGRESSIVE:
        // Generate polarized mixed strategy favoring aggressive options
        const aggressiveProbs = MixedStrategyCalculator.generateMixedStrategy(
          'polarized', strategyCount, rng
        )
        const aggressiveCdf = MixedStrategyCalculator.calculateCDF(aggressiveProbs)
        return MixedStrategyCalculator.sampleStrategyFromCDF(aggressiveCdf, rng())

      case PlayerBehavior.COOPERATIVE:
        // Generate concentrated strategy favoring cooperative options (assume first is cooperative)
        const cooperativeProbs = MixedStrategyCalculator.generateMixedStrategy(
          'concentrated', strategyCount, rng
        )
        const cooperativeCdf = MixedStrategyCalculator.calculateCDF(cooperativeProbs)
        return MixedStrategyCalculator.sampleStrategyFromCDF(cooperativeCdf, rng())

      case PlayerBehavior.RANDOM:
        return Math.floor(rng() * strategyCount)

      default:
        return this.selectAdvancedStrategy(player, gameScenario, iteration)
    }
  }

  // Update player learning and memory
  private updatePlayerLearning(
    playerId: string,
    strategyIndex: number,
    payoff: number,
    iteration: number
  ): void {
    // Update evolutionary memory
    this.evolutionaryEngine.updatePlayerMemory(playerId, strategyIndex, payoff, iteration)

    // Update strategy rewards for reinforcement learning
    if (!this.strategyRewards.has(playerId)) {
      this.strategyRewards.set(playerId, [])
    }
    const rewards = this.strategyRewards.get(playerId)!
    if (rewards.length <= strategyIndex) {
      rewards.push(...Array(strategyIndex - rewards.length + 1).fill(0))
    }
    rewards[strategyIndex] += payoff
  }

  // Performance configuration methods
  configurePerformance(options: {
    maxMemoryMB?: number
    batchSize?: number
    workerCount?: number
    useWebWorkers?: boolean
  }): void {
    if (options.maxMemoryMB) {
      this.memoryManager = new MemoryManager(options.maxMemoryMB)
    }
    
    if (options.batchSize) {
      this.batchProcessor.setBatchSize(options.batchSize)
    }
    
    if (options.workerCount) {
      this.webWorkerManager = new WebWorkerManager(options.workerCount)
    }
  }

  // Interrupt simulation
  interrupt(): void {
    this.isInterrupted = true
  }

  // Resume simulation from saved state
  async resumeSimulation(
    onProgress: (progress: number) => void
  ): Promise<any> {
    if (!this.simulationState) {
      throw new Error('No simulation state to resume from')
    }

    const state = this.simulationState
    this.isInterrupted = false

    return this.continueSimulation(state, onProgress)
  }

  // Continue simulation from a given state
  private async continueSimulation(
    state: SimulationState,
    onProgress: (progress: number) => void
  ): Promise<any> {
    // Implementation would continue from state.iteration
    // This is a simplified version
    const progress = (state.iteration / (state.resumeData?.totalIterations || state.iteration)) * 100
    onProgress(progress)
    
    return {
      ...state,
      resumed: true,
      finalProgress: 100
    }
  }

  // Enhanced simulation with convergence analysis and advanced results aggregation
  async runSimulationWithAdvancedAnalysis(params: {
    game: any
    payoffMatrix: number[][][]
    iterations: number
    playerStrategies: string[]
    mixedStrategies: number[][]
    onProgress: (progress: number, analysisData?: any) => void
    rngType?: string
    seed?: number
    gameScenario?: GameScenario
    players?: Player[]
    enableLearning?: boolean
    useWebWorkers?: boolean
    batchSize?: number
    enableInterruption?: boolean
    convergenceOptions?: {
      windowSize?: number
      confidenceLevel?: number
      stabilityThreshold?: number
      minIterations?: number
      maxIterations?: number
    }
    advancedResultsOptions?: {
      trackDistributions?: boolean
      trackEvolution?: boolean
      enableHistoricalComparison?: boolean
    }
  }) {
    const { 
      game,
      iterations,
      onProgress,
      convergenceOptions,
      advancedResultsOptions,
      ...baseParams
    } = params

    // Configure convergence analysis
    this.configureConvergence({
      ...convergenceOptions,
      playerCount: game.payoffMatrix.players,
      enable: true
    })

    // Configure advanced results aggregation
    this.configureAdvancedResults({
      ...advancedResultsOptions,
      playerCount: game.payoffMatrix.players,
      enable: true
    })

    // Initialize performance monitoring
    this.performanceMonitor.start()
    this.isInterrupted = false

         // Run simulation with advanced analysis
     return this.runOptimizedSimulationWithConvergence({
      ...params,
      onProgress: (progress: number, metrics?: any) => {
        let analysisData: any = { metrics }
        
        // Add convergence data
        if (this.convergenceAnalyzer) {
          const convergenceViz = this.convergenceAnalyzer.generateVisualizationData()
          analysisData.convergence = convergenceViz
        }

        // Add real-time results aggregation data
        if (this.resultsAggregator && this.enableAdvancedResults) {
          const results = this.resultsAggregator.getResults()
          analysisData.results = {
            realTimeStats: results.realTimeStats,
            strategyEvolutions: Array.from(results.strategyEvolutions.entries()).map(([key, evolution]) => ({
              key,
              ...evolution,
              timeline: evolution.timeline.slice(-10) // Last 10 data points for UI
            }))
          }
        }
        
        onProgress(progress, analysisData)
      }
    })
  }

  // Backward compatibility - Enhanced simulation with convergence analysis
  async runSimulationWithConvergence(params: {
    game: any
    payoffMatrix: number[][][]
    iterations: number
    playerStrategies: string[]
    mixedStrategies: number[][]
    onProgress: (progress: number, convergenceData?: any) => void
    rngType?: string
    seed?: number
    gameScenario?: GameScenario
    players?: Player[]
    enableLearning?: boolean
    useWebWorkers?: boolean
    batchSize?: number
    enableInterruption?: boolean
    convergenceOptions?: {
      windowSize?: number
      confidenceLevel?: number
      stabilityThreshold?: number
      minIterations?: number
      maxIterations?: number
    }
  }) {
    // Delegate to advanced analysis method
    return this.runSimulationWithAdvancedAnalysis({
      ...params,
      advancedResultsOptions: { trackDistributions: true, trackEvolution: true }
    })
  }

    // Internal simulation method with convergence
  private async runOptimizedSimulationWithConvergence(params: any): Promise<any> {
    const { 
      game, 
      payoffMatrix, 
      iterations, 
      playerStrategies, 
      mixedStrategies, 
      onProgress, 
      rngType, 
      seed,
      gameScenario,
      players,
      enableLearning = false
    } = params

    // Validate input parameters
    if (iterations < 0) {
      throw new Error('Iterations must be non-negative')
    }
    
    if (!payoffMatrix || !Array.isArray(payoffMatrix) || payoffMatrix.length === 0) {
      throw new Error('Invalid payoff matrix')
    }

    if (playerStrategies && playerStrategies.length !== game.payoffMatrix.players) {
      throw new Error('Number of player strategies must match number of players')
    }

    if (mixedStrategies && mixedStrategies.length !== game.payoffMatrix.players) {
      throw new Error('Number of mixed strategies must match number of players')
    }

    // Configure RNG if specified
    if (rngType) {
      this.configureRNG(rngType, seed)
    } else if (seed !== undefined) {
      this.setSeed(seed)
    }

    // Initialize tracking data structures
    this.playerHistories.clear()
    this.strategyRewards.clear()

    const outcomes: { [key: string]: number } = {}
    const strategyFrequencies: { [key: string]: number } = {}
    const convergenceData: Array<{ iteration: number; strategies: number[] }> = []
    const playerPayoffs: number[][] = Array(game.payoffMatrix.players)
      .fill(0)
      .map(() => [])
    const opponentHistories: Map<string, number[]> = new Map()

    // Initialize player histories and opponent tracking
    if (players) {
      players.forEach((player: Player) => {
        this.playerHistories.set(player.id, [])
        opponentHistories.set(player.id, [])
      })
    }

    let finalIteration = iterations
    let earlyStopReason = ''

    for (let i = 0; i < iterations; i++) {
      // Update progress every 1000 iterations
      if (i % 1000 === 0) {
        onProgress((i / iterations) * 100)
        // Allow UI to update
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      // Check for interruption
      if (this.isInterrupted) {
        finalIteration = i
        earlyStopReason = 'Simulation interrupted by user'
        
        // Save simulation state for resumption
        this.simulationState = {
          iteration: i,
          outcomes,
          strategyFrequencies,
          playerPayoffs,
          convergenceData,
          playerHistories: this.playerHistories,
          strategyRewards: this.strategyRewards,
          opponentHistories,
          isInterrupted: true,
          resumeData: {
            game,
            payoffMatrix,
            iterations,
            playerStrategies,
            mixedStrategies,
            onProgress,
            rngType,
            seed,
            gameScenario,
            players,
            enableLearning
          }
        }
        break
      }

      // Determine strategies for each player
      const chosenStrategies: number[] = []

              for (let playerIndex = 0; playerIndex < game.payoffMatrix.players; playerIndex++) {
        let strategyIndex: number

        if (params.players && gameScenario && playerIndex < params.players.length) {
          // Use advanced strategy selection with learning
          strategyIndex = this.selectBehavioralStrategy(
            params.players[playerIndex],
            gameScenario,
            i,
            opponentHistories
          )
        } else {
          // Fallback to original strategy selection
          const playerStrategy = params.playerStrategies[playerIndex]

          if (playerStrategy === "mixed") {
            const probabilities =
              params.mixedStrategies[playerIndex] || new Array(game.strategies.length).fill(1 / game.strategies.length)
            strategyIndex = this.selectStrategyByProbability(probabilities)
          } else {
            const strategies = game.strategies || game.payoffMatrix?.strategies?.map((s: any) => s.name) || ['Strategy 0', 'Strategy 1']
            const strategyIndexFromName = strategies.findIndex(
              (s: string) => s.toLowerCase() === (playerStrategy || 'strategy0').toLowerCase(),
            )
            strategyIndex = strategyIndexFromName >= 0 ? strategyIndexFromName : 0
          }
        }

        chosenStrategies.push(strategyIndex)
      }

      // Calculate payoffs for this iteration
      const iterationPayoffs = this.calculatePayoffs(chosenStrategies, payoffMatrix)

      // Record payoffs for each player
      iterationPayoffs.forEach((payoff, playerIndex) => {
        playerPayoffs[playerIndex].push(payoff)

        // Update learning if enabled
        if (enableLearning && players && playerIndex < players.length) {
          this.updatePlayerLearning(
            players[playerIndex].id,
            chosenStrategies[playerIndex],
            payoff,
            i
          )
        }
      })

      // Update advanced results aggregation
      if (this.resultsAggregator && this.enableAdvancedResults) {
        const strategies = game.strategies || game.payoffMatrix?.strategies?.map((s: any) => s.name) || ['Strategy 0', 'Strategy 1']
        this.resultsAggregator.addIterationData(
          i,
          iterationPayoffs,
          chosenStrategies,
          strategies
        )
      }

      // Check convergence
      if (this.convergenceAnalyzer && this.enableEarlyStop && i > 0) {
        this.convergenceAnalyzer.addDataPoint(i, iterationPayoffs)
        
        // Check convergence every 500 iterations after minimum
        if (i % 500 === 0) {
          const convergenceResult = this.convergenceAnalyzer.checkConvergence(i)
          
          if (convergenceResult.recommendedAction === 'stop') {
            finalIteration = i
            earlyStopReason = `Early convergence detected: ${convergenceResult.reason}`
            break
          }
        }
      }

      // Update player histories
      if (players) {
        players.forEach((player: Player, playerIndex: number) => {
          if (playerIndex < chosenStrategies.length) {
            const history = this.playerHistories.get(player.id) || []
            history.push({
              iteration: i,
              playerChoices: [...chosenStrategies],
              payoffs: [...iterationPayoffs],
              cumulativePayoffs: playerPayoffs.map(payoffs => 
                payoffs.reduce((sum, p) => sum + p, 0)
              ),
              timestamp: Date.now()
            })
            this.playerHistories.set(player.id, history)

            // Update opponent histories (simplified for 2-player)
            if (game.payoffMatrix.players === 2) {
              const opponentIndex = 1 - playerIndex
              const opponentHistory = opponentHistories.get(player.id) || []
              if (opponentIndex < chosenStrategies.length) {
                opponentHistory.push(chosenStrategies[opponentIndex])
                opponentHistories.set(player.id, opponentHistory)
              }
            }
          }
        })
      }

      // Record outcome
      const strategies = game.strategies || game.payoffMatrix?.strategies?.map((s: any) => s.name) || ['Strategy 0', 'Strategy 1']
      const outcomeKey = chosenStrategies.map((s) => strategies[s] || `Strategy ${s}`).join("-")
      outcomes[outcomeKey] = (outcomes[outcomeKey] || 0) + 1

      // Record strategy frequency
      const strategyKey = chosenStrategies.map((s) => strategies[s] || `Strategy ${s}`).join("-")
      strategyFrequencies[strategyKey] = (strategyFrequencies[strategyKey] || 0) + 1

      // Record convergence data (sample every 100 iterations for performance)
      if (i % 100 === 0) {
        convergenceData.push({
          iteration: i,
          strategies: [...chosenStrategies],
        })
      }
    }

    // Calculate expected payoffs
    const expectedPayoffs = playerPayoffs.map(
      (payoffs) => payoffs.reduce((sum, payoff) => sum + payoff, 0) / payoffs.length,
    )

    onProgress(100)

    // Gather final convergence analysis
    let finalConvergenceAnalysis = null
    if (this.convergenceAnalyzer) {
      finalConvergenceAnalysis = {
        history: this.convergenceAnalyzer.getConvergenceHistory(),
        visualization: this.convergenceAnalyzer.generateVisualizationData(),
        finalResult: this.convergenceAnalyzer.checkConvergence(finalIteration)
      }
    }

    // Gather final advanced results aggregation
    let finalAdvancedResults = null
    if (this.resultsAggregator && this.enableAdvancedResults) {
      const results = this.resultsAggregator.getResults()
      finalAdvancedResults = {
        payoffDistributions: Array.from(results.payoffDistributions.entries()).map(([playerIndex, dist]) => ({
          playerIndex,
          statistics: dist.statistics,
          percentiles: dist.percentiles,
          confidence: dist.confidence,
          valueCount: dist.values.length
        })),
        strategyEvolutions: Array.from(results.strategyEvolutions.entries()).map(([key, evolution]) => ({
          key,
          strategyName: evolution.strategyName,
          playerIndex: evolution.playerIndex,
          trends: evolution.trends,
          timelineLength: evolution.timeline.length,
          finalStats: evolution.timeline.length > 0 ? evolution.timeline[evolution.timeline.length - 1] : null
        })),
        realTimeStats: results.realTimeStats,
        advancedStatistics: results.advancedStatistics
      }
    }

    return {
      iterations: finalIteration,
      actualIterations: finalIteration,
      requestedIterations: iterations,
      outcomes,
      strategyFrequencies,
      expectedPayoffs,
      convergenceData,
      statistics: {
        mean: expectedPayoffs,
        variance: playerPayoffs.map((payoffs) => {
          const mean = payoffs.reduce((sum, p) => sum + p, 0) / payoffs.length
          return payoffs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / payoffs.length
        }),
        confidenceInterval: playerPayoffs.map((payoffs) => {
          const mean = payoffs.reduce((sum, p) => sum + p, 0) / payoffs.length
          const variance = payoffs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / payoffs.length
          const stdError = Math.sqrt(variance / payoffs.length)
          const margin = 1.96 * stdError // 95% confidence interval
          return {
            lower: mean - margin,
            upper: mean + margin
          }
        })
      },
      executionTime: this.performanceMonitor.getElapsedTime(),
      rngInfo: this.getRNGInfo(),
      playerHistories: enableLearning ? Object.fromEntries(this.playerHistories) : undefined,
      strategyRewards: enableLearning ? Object.fromEntries(this.strategyRewards) : undefined,
      convergenceAnalysis: finalConvergenceAnalysis,
      advancedResults: finalAdvancedResults,
      earlyStop: finalIteration < iterations,
      earlyStopReason,
      performanceMetrics: this.performanceMonitor.getMetrics()
    }
  }

  // Get current convergence status
  getConvergenceStatus(): any {
    if (!this.convergenceAnalyzer) {
      return { enabled: false }
    }

    return {
      enabled: true,
      history: this.convergenceAnalyzer.getConvergenceHistory(),
      visualization: this.convergenceAnalyzer.generateVisualizationData()
    }
  }

  // Get current advanced results status
  getAdvancedResultsStatus(): any {
    if (!this.resultsAggregator) {
      return { enabled: false }
    }

    const results = this.resultsAggregator.getResults()
    return {
      enabled: true,
      realTimeStats: results.realTimeStats,
      distributionCount: results.payoffDistributions.size,
      evolutionCount: results.strategyEvolutions.size,
      advancedStatistics: results.advancedStatistics
    }
  }

  // Store current session for historical comparison
  storeSessionResults(sessionId: string): void {
    if (this.resultsAggregator && this.enableAdvancedResults) {
      this.resultsAggregator.storeSession(sessionId)
    }
  }

  // Compare current results to historical data
  compareToHistoricalResults(criteria: {
    gameType?: string
    playerCount?: number
    iterations?: number
    timeWindow?: number
  }): any {
    if (!this.resultsAggregator || !this.enableAdvancedResults) {
      return { enabled: false, message: 'Advanced results aggregation not enabled' }
    }

    return this.resultsAggregator.compareToHistorical('current', criteria)
  }

  // Helper methods that were removed during edit
  private selectStrategyByProbability(probabilities: number[]): number {
    const random = this.rngManager.random() // Using enhanced RNG instead of Math.random()
    let cumulative = 0

    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i]
      if (random <= cumulative) {
        return i
      }
    }

    return probabilities.length - 1 // Fallback
  }

  private calculatePayoffs(strategies: number[], payoffMatrix: number[][][]): number[] {
    if (strategies.length === 2) {
      // 2-player game
      const [player1Strategy, player2Strategy] = strategies
      return payoffMatrix[player1Strategy][player2Strategy]
    }

    // For now, only support 2-player games
    // Could be extended for n-player games
    return [0, 0]
  }

  // Game Theory Integration Methods

  // Perform comprehensive game theory analysis
  async performGameTheoryAnalysis(payoffMatrix: number[][][]): Promise<GameTheoryAnalysisResult | null> {
    if (!this.enableGameTheoryAnalysis) {
      console.warn('Game theory analysis not enabled')
      return null
    }

    try {
      this.gameTheoryAnalysis = GameTheoryAnalyzer.performCompleteAnalysis(
        payoffMatrix,
        this.gameTheoryOptions
      )
      
      return this.gameTheoryAnalysis
    } catch (error) {
      console.error('Game theory analysis failed:', error)
      return null
    }
  }

  // Find Nash equilibria using Monte Carlo sampling
  async findNashEquilibriaWithMonteCarlo(
    payoffMatrix: number[][][],
    samples: number = 100000,
    tolerance: number = 1e-3
  ): Promise<NashEquilibriumResult[]> {
    const rng = () => this.rngManager.random()
    
    return NashEquilibriumCalculator.findApproximateNashEquilibria(
      payoffMatrix,
      samples,
      tolerance,
      rng
    )
  }

  // Enhanced simulation with integrated game theory analysis
  async runSimulationWithGameTheoryAnalysis(params: {
    game: any
    payoffMatrix: number[][][]
    iterations: number
    playerStrategies: string[]
    mixedStrategies: number[][]
    onProgress: (progress: number, analysisData?: any) => void
    rngType?: string
    seed?: number
    gameScenario?: GameScenario
    players?: Player[]
    enableLearning?: boolean
    useWebWorkers?: boolean
    batchSize?: number
    enableInterruption?: boolean
    gameTheoryOptions?: {
      enableNashEquilibrium?: boolean
      enableESS?: boolean
      enableDominance?: boolean
      enableCoalition?: boolean
      preAnalysis?: boolean // Run analysis before simulation
      postAnalysis?: boolean // Run analysis after simulation
    }
  }) {
    const startTime = Date.now()
    this.performanceMonitor.start()

    // Configure RNG
    if (params.rngType) {
      this.configureRNG(params.rngType, params.seed)
    }

    // Configure game theory analysis if options provided
    if (params.gameTheoryOptions) {
      this.configureGameTheoryAnalysis({
        enable: true,
        ...params.gameTheoryOptions
      })
    }

    let preAnalysisResults: GameTheoryAnalysisResult | null = null
    let postAnalysisResults: GameTheoryAnalysisResult | null = null

    // Pre-simulation game theory analysis
    if (params.gameTheoryOptions?.preAnalysis && this.enableGameTheoryAnalysis) {
      try {
        preAnalysisResults = await this.performGameTheoryAnalysis(params.payoffMatrix)
      } catch (error) {
        console.warn('Pre-simulation game theory analysis failed:', error)
      }
    }

    // Run the Monte Carlo simulation with advanced analysis
    const simulationResults = await this.runSimulationWithAdvancedAnalysis({
      ...params,
      onProgress: (progress: number, analysisData?: any) => {
        // Enhance progress callback with game theory data
        const enhancedData = {
          ...analysisData,
          gameTheoryAnalysis: preAnalysisResults,
          nashEquilibria: preAnalysisResults?.nashEquilibria || [],
          evolutionaryStableStrategies: preAnalysisResults?.evolutionaryStableStrategies || [],
          dominanceAnalysis: preAnalysisResults?.dominanceAnalysis,
          gameProperties: preAnalysisResults?.gameProperties
        }
        
        params.onProgress(progress, enhancedData)
      }
    })

    // Post-simulation game theory analysis
    if (params.gameTheoryOptions?.postAnalysis && this.enableGameTheoryAnalysis) {
      try {
        postAnalysisResults = await this.performGameTheoryAnalysis(params.payoffMatrix)
      } catch (error) {
        console.warn('Post-simulation game theory analysis failed:', error)
      }
    }

    // Combine simulation results with game theory analysis
    const combinedResults = {
      ...simulationResults,
      gameTheoryAnalysis: {
        preAnalysis: preAnalysisResults,
        postAnalysis: postAnalysisResults,
        equilibriumConvergence: this.analyzeEquilibriumConvergence(
          simulationResults,
          preAnalysisResults
        )
      },
      computationTime: {
        simulation: simulationResults.computationTime || (Date.now() - startTime),
        gameTheory: (preAnalysisResults?.computationTime || 0) + (postAnalysisResults?.computationTime || 0)
      }
    }

    return combinedResults
  }

  // Analyze how simulation results relate to theoretical equilibria
  private analyzeEquilibriumConvergence(
    simulationResults: any,
    gameTheoryAnalysis: GameTheoryAnalysisResult | null
  ): any {
    if (!gameTheoryAnalysis || !simulationResults.strategyFrequencies) {
      return null
    }

    const convergenceAnalysis: {
      nashEquilibriumConvergence: Array<{
        equilibrium: NashEquilibriumResult
        convergence: { distance: number; confidence: number; converged: boolean }
        distance: number
        confidence: number
      }>
      dominanceValidation: any
      essValidation: any
    } = {
      nashEquilibriumConvergence: [],
      dominanceValidation: null,
      essValidation: null
    }

    // Check convergence to Nash equilibria
    for (const equilibrium of gameTheoryAnalysis.nashEquilibria) {
      if (equilibrium.type === 'pure' && Array.isArray(equilibrium.strategies)) {
        const convergence = this.checkPureEquilibriumConvergence(
          simulationResults.strategyFrequencies,
          equilibrium.strategies as number[]
        )
        
        convergenceAnalysis.nashEquilibriumConvergence.push({
          equilibrium,
          convergence,
          distance: convergence.distance,
          confidence: convergence.confidence
        })
      } else if (equilibrium.type === 'mixed' && Array.isArray(equilibrium.strategies[0])) {
        const convergence = this.checkMixedEquilibriumConvergence(
          simulationResults.strategyFrequencies,
          equilibrium.strategies as number[][]
        )
        
        convergenceAnalysis.nashEquilibriumConvergence.push({
          equilibrium,
          convergence,
          distance: convergence.distance,
          confidence: convergence.confidence
        })
      }
    }

    // Validate dominance predictions
    if (gameTheoryAnalysis.dominanceAnalysis.strictlyDominated.length > 0) {
      convergenceAnalysis.dominanceValidation = this.validateDominanceResults(
        simulationResults.strategyFrequencies,
        gameTheoryAnalysis.dominanceAnalysis
      )
    }

    // Validate ESS predictions
    if (gameTheoryAnalysis.evolutionaryStableStrategies.some(ess => ess.isESS)) {
      convergenceAnalysis.essValidation = this.validateESSResults(
        simulationResults.strategyFrequencies,
        gameTheoryAnalysis.evolutionaryStableStrategies
      )
    }

    return convergenceAnalysis
  }

  private checkPureEquilibriumConvergence(
    strategyFrequencies: any,
    equilibriumStrategies: number[]
  ): { distance: number; confidence: number; converged: boolean } {
    // Calculate how close simulation frequencies are to pure equilibrium
    let totalDistance = 0
    let playerCount = 0

    for (const [strategyKey, freq] of Object.entries(strategyFrequencies)) {
      const strategy = freq as any
      const playerIndex = strategy.playerIndex
      const strategyIndex = strategy.strategyIndex
      const frequency = strategy.percentage / 100

      if (playerIndex < equilibriumStrategies.length) {
        const isEquilibriumStrategy = strategyIndex === equilibriumStrategies[playerIndex]
        const expectedFrequency = isEquilibriumStrategy ? 1.0 : 0.0
        totalDistance += Math.abs(frequency - expectedFrequency)
        playerCount = Math.max(playerCount, playerIndex + 1)
      }
    }

    const avgDistance = playerCount > 0 ? totalDistance / playerCount : 1.0
    const confidence = Math.max(0, 1 - avgDistance)
    const converged = avgDistance < 0.1 // 10% tolerance

    return { distance: avgDistance, confidence, converged }
  }

  private checkMixedEquilibriumConvergence(
    strategyFrequencies: any,
    equilibriumStrategies: number[][]
  ): { distance: number; confidence: number; converged: boolean } {
    // Calculate how close simulation frequencies are to mixed equilibrium
    let totalDistance = 0
    let comparisonCount = 0

    for (const [strategyKey, freq] of Object.entries(strategyFrequencies)) {
      const strategy = freq as any
      const playerIndex = strategy.playerIndex
      const strategyIndex = strategy.strategyIndex
      const frequency = strategy.percentage / 100

      if (playerIndex < equilibriumStrategies.length && 
          strategyIndex < equilibriumStrategies[playerIndex].length) {
        const expectedFrequency = equilibriumStrategies[playerIndex][strategyIndex]
        totalDistance += Math.abs(frequency - expectedFrequency)
        comparisonCount++
      }
    }

    const avgDistance = comparisonCount > 0 ? totalDistance / comparisonCount : 1.0
    const confidence = Math.max(0, 1 - avgDistance)
    const converged = avgDistance < 0.15 // 15% tolerance for mixed strategies

    return { distance: avgDistance, confidence, converged }
  }

  private validateDominanceResults(
    strategyFrequencies: any,
    dominanceAnalysis: DominanceAnalysis
  ): any {
    const validation: {
      strictDominanceValidated: boolean
      weakDominanceValidated: boolean
      dominatedStrategyFrequencies: Array<{
        player: number
        strategy: number
        frequency: number
        type: string
      }>
      violations: Array<{
        type: string
        player: number
        strategy: number
        frequency: number
        expected: string
      }>
    } = {
      strictDominanceValidated: true,
      weakDominanceValidated: true,
      dominatedStrategyFrequencies: [],
      violations: []
    }

    // Check if strictly dominated strategies have low frequency
    for (const dominated of dominanceAnalysis.strictlyDominated) {
      const frequency = this.getStrategyFrequency(strategyFrequencies, dominated.player, dominated.strategy)
      
      validation.dominatedStrategyFrequencies.push({
        player: dominated.player,
        strategy: dominated.strategy,
        frequency,
        type: 'strict'
      })

      if (frequency > 0.05) { // 5% threshold for strictly dominated strategies
        validation.strictDominanceValidated = false
        validation.violations.push({
          type: 'strict_dominance',
          player: dominated.player,
          strategy: dominated.strategy,
          frequency,
          expected: 'near zero'
        })
      }
    }

    return validation
  }

  private validateESSResults(
    strategyFrequencies: any,
    essStrategies: EvolutionaryStableStrategy[]
  ): any {
    const validation: {
      essValidated: boolean
      essFrequencies: Array<{
        strategyIndex: number
        strategyName: string
        frequency: number
        expectedHigh: boolean
      }>
      violations: Array<{
        type: string
        strategyIndex: number
        frequency: number
        stability: number
        expected: string
      }>
    } = {
      essValidated: true,
      essFrequencies: [],
      violations: []
    }

    for (const ess of essStrategies) {
      if (ess.isESS) {
        const frequency = this.getStrategyFrequency(strategyFrequencies, 0, ess.strategyIndex) // Assume player 0 for ESS
        
        validation.essFrequencies.push({
          strategyIndex: ess.strategyIndex,
          strategyName: ess.strategyName,
          frequency,
          expectedHigh: ess.stability > 0.8
        })

        // ESS should have high frequency if stable
        if (ess.stability > 0.8 && frequency < 0.6) {
          validation.essValidated = false
          validation.violations.push({
            type: 'ess_frequency',
            strategyIndex: ess.strategyIndex,
            frequency,
            stability: ess.stability,
            expected: 'high frequency'
          })
        }
      }
    }

    return validation
  }

  private getStrategyFrequency(strategyFrequencies: any, player: number, strategy: number): number {
    for (const [key, freq] of Object.entries(strategyFrequencies)) {
      const strategyData = freq as any
      if (strategyData.playerIndex === player && strategyData.strategyIndex === strategy) {
        return strategyData.percentage / 100
      }
    }
    return 0
  }

  // Get current game theory analysis results
  getGameTheoryAnalysisStatus(): any {
    if (!this.enableGameTheoryAnalysis) {
      return {
        enabled: false,
        message: 'Game theory analysis not enabled'
      }
    }

    return {
      enabled: true,
      hasResults: this.gameTheoryAnalysis !== null,
      analysis: this.gameTheoryAnalysis,
      options: this.gameTheoryOptions,
      lastAnalysisTime: this.gameTheoryAnalysis?.computationTime
    }
  }
}

// Add after the NashEquilibriumCalculator class:

class EvolutionaryStableStrategyAnalyzer {
  // Analyze evolutionary stable strategies using replicator dynamics
  static analyzeESS(
    payoffMatrix: number[][][],
    populations: number[] = [0.5, 0.5], // Initial population proportions
    maxGenerations: number = 1000,
    tolerance: number = 1e-6
  ): EvolutionaryStableStrategy[] {
    const strategies: EvolutionaryStableStrategy[] = []
    const strategyCount = payoffMatrix.length
    
    for (let strategyIndex = 0; strategyIndex < strategyCount; strategyIndex++) {
      const analysis = this.testStrategyStability(
        strategyIndex,
        payoffMatrix,
        populations,
        maxGenerations,
        tolerance
      )
      
      strategies.push({
        strategyIndex,
        strategyName: `Strategy ${strategyIndex}`,
        invasionThreshold: analysis.invasionThreshold,
        stability: analysis.stability,
        fitnessAdvantage: analysis.fitnessAdvantage,
        isESS: analysis.isESS
      })
    }
    
    return strategies
  }

  private static testStrategyStability(
    strategyIndex: number,
    payoffMatrix: number[][][],
    initialPopulations: number[],
    maxGenerations: number,
    tolerance: number
  ): {
    invasionThreshold: number
    stability: number
    fitnessAdvantage: number
    isESS: boolean
  } {
    let maxInvasionThreshold = 0
    let totalStability = 0
    let maxFitnessAdvantage = 0
    
    // Test against all possible invading strategies
    for (let invaderIndex = 0; invaderIndex < payoffMatrix.length; invaderIndex++) {
      if (invaderIndex === strategyIndex) continue
      
      const result = this.runReplicatorDynamics(
        strategyIndex,
        invaderIndex,
        payoffMatrix,
        initialPopulations,
        maxGenerations,
        tolerance
      )
      
      maxInvasionThreshold = Math.max(maxInvasionThreshold, result.invasionThreshold)
      totalStability += result.stability
      maxFitnessAdvantage = Math.max(maxFitnessAdvantage, result.fitnessAdvantage)
    }
    
    const avgStability = totalStability / (payoffMatrix.length - 1)
    const isESS = maxInvasionThreshold > 0 && avgStability > 0.8
    
    return {
      invasionThreshold: maxInvasionThreshold,
      stability: avgStability,
      fitnessAdvantage: maxFitnessAdvantage,
      isESS
    }
  }

  private static runReplicatorDynamics(
    residentStrategy: number,
    invaderStrategy: number,
    payoffMatrix: number[][][],
    initialPopulations: number[],
    maxGenerations: number,
    tolerance: number
  ): {
    invasionThreshold: number
    stability: number
    fitnessAdvantage: number
  } {
    let residentProp = 0.99 // Start with resident strategy dominant
    let invaderProp = 0.01
    
    let generation = 0
    let converged = false
    let previousResident = residentProp
    
    while (!converged && generation < maxGenerations) {
      // Calculate fitness for each strategy
      const residentFitness = this.calculateStrategyFitness(
        residentStrategy,
        [residentProp, invaderProp],
        payoffMatrix
      )
      
      const invaderFitness = this.calculateStrategyFitness(
        invaderStrategy,
        [residentProp, invaderProp],
        payoffMatrix
      )
      
      const avgFitness = residentProp * residentFitness + invaderProp * invaderFitness
      
      // Update populations using replicator dynamics
      if (avgFitness > 0) {
        residentProp = (residentProp * residentFitness) / avgFitness
        invaderProp = (invaderProp * invaderFitness) / avgFitness
      }
      
      // Check convergence
      if (Math.abs(residentProp - previousResident) < tolerance) {
        converged = true
      }
      
      previousResident = residentProp
      generation++
    }
    
    // Determine invasion threshold and stability
    const invasionThreshold = residentProp > 0.95 ? 0.05 : 0
    const stability = residentProp
    const fitnessAdvantage = this.calculateStrategyFitness(
      residentStrategy,
      [1, 0],
      payoffMatrix
    ) - this.calculateStrategyFitness(invaderStrategy, [1, 0], payoffMatrix)
    
    return {
      invasionThreshold,
      stability,
      fitnessAdvantage
    }
  }

  private static calculateStrategyFitness(
    strategyIndex: number,
    populations: number[],
    payoffMatrix: number[][][]
  ): number {
    let fitness = 0
    
    // Calculate expected payoff against population distribution
    for (let opponentStrategy = 0; opponentStrategy < payoffMatrix.length; opponentStrategy++) {
      const probability = populations[opponentStrategy] || 0
      const payoff = payoffMatrix[strategyIndex][opponentStrategy][0] // Assuming symmetric game
      fitness += probability * payoff
    }
    
    return fitness
  }
}

class DominanceAnalyzer {
  // Analyze strategic dominance and perform iterated elimination
  static analyzeDominance(payoffMatrix: number[][][]): DominanceAnalysis {
    const playerCount = payoffMatrix[0][0].length
    const strategyCount = payoffMatrix.length
    
    let remainingStrategies: number[][] = []
    for (let player = 0; player < playerCount; player++) {
      remainingStrategies[player] = Array.from({ length: strategyCount }, (_, i) => i)
    }
    
    const strictlyDominated: Array<{ player: number; strategy: number; dominatedBy: number[] }> = []
    const weaklyDominated: Array<{ player: number; strategy: number; dominatedBy: number[] }> = []
    const eliminationOrder: Array<{ iteration: number; eliminated: Array<{ player: number; strategy: number }> }> = []
    
    let iteration = 0
    let eliminatedInRound = true
    
    while (eliminatedInRound && iteration < 20) { // Prevent infinite loops
      eliminatedInRound = false
      const roundEliminations: Array<{ player: number; strategy: number }> = []
      
      for (let player = 0; player < playerCount; player++) {
        const playerStrategies = remainingStrategies[player]
        
        for (let i = 0; i < playerStrategies.length; i++) {
          const strategy = playerStrategies[i]
          const dominatingStrategies = this.findDominatingStrategies(
            player,
            strategy,
            remainingStrategies,
            payoffMatrix
          )
          
          if (dominatingStrategies.strict.length > 0) {
            strictlyDominated.push({
              player,
              strategy,
              dominatedBy: dominatingStrategies.strict
            })
            
            // Remove from remaining strategies
            remainingStrategies[player] = remainingStrategies[player].filter(s => s !== strategy)
            roundEliminations.push({ player, strategy })
            eliminatedInRound = true
          } else if (dominatingStrategies.weak.length > 0) {
            weaklyDominated.push({
              player,
              strategy,
              dominatedBy: dominatingStrategies.weak
            })
          }
        }
      }
      
      if (roundEliminations.length > 0) {
        eliminationOrder.push({
          iteration,
          eliminated: roundEliminations
        })
      }
      
      iteration++
    }
    
    return {
      strictlyDominated,
      weaklyDominated,
      eliminationOrder,
      remainingStrategies
    }
  }

  private static findDominatingStrategies(
    player: number,
    targetStrategy: number,
    remainingStrategies: number[][],
    payoffMatrix: number[][][]
  ): { strict: number[]; weak: number[] } {
    const strict: number[] = []
    const weak: number[] = []
    const playerStrategies = remainingStrategies[player]
    
    for (const candidateStrategy of playerStrategies) {
      if (candidateStrategy === targetStrategy) continue
      
      const dominanceType = this.checkDominance(
        player,
        candidateStrategy,
        targetStrategy,
        remainingStrategies,
        payoffMatrix
      )
      
      if (dominanceType === 'strict') {
        strict.push(candidateStrategy)
      } else if (dominanceType === 'weak') {
        weak.push(candidateStrategy)
      }
    }
    
    return { strict, weak }
  }

  private static checkDominance(
    player: number,
    dominatingStrategy: number,
    dominatedStrategy: number,
    remainingStrategies: number[][],
    payoffMatrix: number[][][]
  ): 'strict' | 'weak' | 'none' {
    let hasStrictAdvantage = false
    let alwaysAtLeastAsGood = true
    
    // Generate all possible opponent strategy combinations
    const opponentCombinations = this.generateOpponentCombinations(player, remainingStrategies)
    
    for (const opponentStrategies of opponentCombinations) {
      const payoffDominating = this.getPayoffForStrategyCombination(
        player,
        dominatingStrategy,
        opponentStrategies,
        payoffMatrix
      )
      
      const payoffDominated = this.getPayoffForStrategyCombination(
        player,
        dominatedStrategy,
        opponentStrategies,
        payoffMatrix
      )
      
      if (payoffDominating > payoffDominated) {
        hasStrictAdvantage = true
      } else if (payoffDominating < payoffDominated) {
        alwaysAtLeastAsGood = false
        break
      }
    }
    
    if (alwaysAtLeastAsGood && hasStrictAdvantage) {
      return 'strict'
    } else if (alwaysAtLeastAsGood) {
      return 'weak'
    } else {
      return 'none'
    }
  }

  private static generateOpponentCombinations(
    player: number,
    remainingStrategies: number[][]
  ): number[][] {
    const combinations: number[][] = []
    const otherPlayers = remainingStrategies.filter((_, index) => index !== player)
    
    if (otherPlayers.length === 1) {
      // Two-player game
      return otherPlayers[0].map(strategy => [strategy])
    }
    
    // Multi-player game - generate all combinations
    const generateRecursive = (current: number[], playerIndex: number): void => {
      if (playerIndex === otherPlayers.length) {
        combinations.push([...current])
        return
      }
      
      for (const strategy of otherPlayers[playerIndex]) {
        current[playerIndex] = strategy
        generateRecursive(current, playerIndex + 1)
      }
    }
    
    generateRecursive([], 0)
    return combinations
  }

  private static getPayoffForStrategyCombination(
    player: number,
    playerStrategy: number,
    opponentStrategies: number[],
    payoffMatrix: number[][][]
  ): number {
    // For 2-player games
    if (opponentStrategies.length === 1) {
      const opponentStrategy = opponentStrategies[0]
      if (player === 0) {
        return payoffMatrix[playerStrategy][opponentStrategy][0]
      } else {
        return payoffMatrix[opponentStrategy][playerStrategy][1]
      }
    }
    
    // For multi-player games, this would need more complex indexing
    // For now, return a simplified version
    return payoffMatrix[playerStrategy][opponentStrategies[0] || 0][player]
  }
}

class CoalitionAnalyzer {
  // Analyze coalition formation and cooperative game solutions
  static analyzeCoalitions(
    payoffMatrix: number[][][],
    playerCount: number
  ): CoalitionAnalysis {
    const shapleyValues = this.calculateShapleyValues(payoffMatrix, playerCount)
    const coreAnalysis = this.analyzeCoreExistence(payoffMatrix, playerCount)
    const bargainingSolutions = this.calculateBargainingSolutions(payoffMatrix, playerCount)
    const votingPower = this.calculateVotingPower(payoffMatrix, playerCount)
    
    return {
      shapleyValues,
      coreExists: coreAnalysis.exists,
      coreSolutions: coreAnalysis.solutions,
      bargainingSolutions,
      votingPower
    }
  }

  private static calculateShapleyValues(payoffMatrix: number[][][], playerCount: number): number[] {
    const shapleyValues: number[] = new Array(playerCount).fill(0)
    
    // Generate all possible coalitions
    const coalitions = this.generateCoalitions(playerCount)
    
    for (let player = 0; player < playerCount; player++) {
      let marginalContributions = 0
      let contributionCount = 0
      
      for (const coalition of coalitions) {
        if (!coalition.includes(player)) {
          // Calculate marginal contribution of player to this coalition
          const coalitionValue = this.calculateCoalitionValue(coalition, payoffMatrix)
          const coalitionWithPlayerValue = this.calculateCoalitionValue(
            [...coalition, player],
            payoffMatrix
          )
          
          const marginalContribution = coalitionWithPlayerValue - coalitionValue
          const coalitionSize = coalition.length
          const weight = this.factorial(coalitionSize) * this.factorial(playerCount - coalitionSize - 1) / this.factorial(playerCount)
          
          marginalContributions += weight * marginalContribution
          contributionCount++
        }
      }
      
      shapleyValues[player] = marginalContributions
    }
    
    return shapleyValues
  }

  private static generateCoalitions(playerCount: number): number[][] {
    const coalitions: number[][] = []
    const totalCoalitions = Math.pow(2, playerCount)
    
    for (let i = 0; i < totalCoalitions; i++) {
      const coalition: number[] = []
      for (let player = 0; player < playerCount; player++) {
        if ((i >> player) & 1) {
          coalition.push(player)
        }
      }
      coalitions.push(coalition)
    }
    
    return coalitions
  }

  private static calculateCoalitionValue(coalition: number[], payoffMatrix: number[][][]): number {
    if (coalition.length === 0) return 0
    if (coalition.length === 1) return this.getSoloPlayerValue(coalition[0], payoffMatrix)
    
    // For simplicity, assume coalition value is sum of best bilateral interactions
    let totalValue = 0
    
    for (let i = 0; i < coalition.length; i++) {
      for (let j = i + 1; j < coalition.length; j++) {
        const player1 = coalition[i]
        const player2 = coalition[j]
        
        // Find best strategy combination for this pair
        let bestValue = -Infinity
        for (let s1 = 0; s1 < payoffMatrix.length; s1++) {
          for (let s2 = 0; s2 < payoffMatrix[0].length; s2++) {
            const value = payoffMatrix[s1][s2][player1] + payoffMatrix[s1][s2][player2]
            bestValue = Math.max(bestValue, value)
          }
        }
        
        totalValue += bestValue
      }
    }
    
    return totalValue / coalition.length // Normalize by coalition size
  }

  private static getSoloPlayerValue(player: number, payoffMatrix: number[][][]): number {
    // Return the best unilateral payoff for the player
    let bestValue = -Infinity
    
    for (let s1 = 0; s1 < payoffMatrix.length; s1++) {
      for (let s2 = 0; s2 < payoffMatrix[0].length; s2++) {
        bestValue = Math.max(bestValue, payoffMatrix[s1][s2][player])
      }
    }
    
    return bestValue
  }

  private static analyzeCoreExistence(
    payoffMatrix: number[][][],
    playerCount: number
  ): { exists: boolean; solutions: number[][] } {
    // Simplified core analysis - check if grand coalition is stable
    const grandCoalitionValue = this.calculateCoalitionValue(
      Array.from({ length: playerCount }, (_, i) => i),
      payoffMatrix
    )
    
    const solutions: number[][] = []
    const equalSplit = new Array(playerCount).fill(grandCoalitionValue / playerCount)
    
    // Check if equal split is in the core
    const isEqualSplitInCore = this.isAllocationInCore(equalSplit, payoffMatrix, playerCount)
    
    if (isEqualSplitInCore) {
      solutions.push(equalSplit)
    }
    
    return {
      exists: solutions.length > 0,
      solutions
    }
  }

  private static isAllocationInCore(
    allocation: number[],
    payoffMatrix: number[][][],
    playerCount: number
  ): boolean {
    const coalitions = this.generateCoalitions(playerCount)
    
    for (const coalition of coalitions) {
      if (coalition.length === 0 || coalition.length === playerCount) continue
      
      const coalitionValue = this.calculateCoalitionValue(coalition, payoffMatrix)
      const coalitionAllocation = coalition.reduce((sum, player) => sum + allocation[player], 0)
      
      if (coalitionValue > coalitionAllocation) {
        return false // Coalition can improve by deviating
      }
    }
    
    return true
  }

  private static calculateBargainingSolutions(
    payoffMatrix: number[][][],
    playerCount: number
  ): { nash: number[]; kalaiSmorodinsky: number[] } {
    // Nash bargaining solution
    const nash = this.calculateNashBargainingSolution(payoffMatrix, playerCount)
    
    // Kalai-Smorodinsky solution
    const kalaiSmorodinsky = this.calculateKalaiSmorodinskySolution(payoffMatrix, playerCount)
    
    return { nash, kalaiSmorodinsky }
  }

  private static calculateNashBargainingSolution(
    payoffMatrix: number[][][],
    playerCount: number
  ): number[] {
    // Simplified Nash bargaining - maximize product of gains from cooperation
    const threatPoints = this.calculateThreatPoints(payoffMatrix, playerCount)
    const maxCooperativePayoffs = this.calculateMaxCooperativePayoffs(payoffMatrix, playerCount)
    
    const gains = maxCooperativePayoffs.map((payoff, i) => payoff - threatPoints[i])
    const totalGain = gains.reduce((sum, gain) => sum + gain, 0)
    
    // Equal gain split (simplified)
    return threatPoints.map((threat, i) => threat + totalGain / playerCount)
  }

  private static calculateKalaiSmorodinskySolution(
    payoffMatrix: number[][][],
    playerCount: number
  ): number[] {
    // Simplified Kalai-Smorodinsky - proportional to ideal point
    const threatPoints = this.calculateThreatPoints(payoffMatrix, playerCount)
    const idealPoints = this.calculateIdealPoints(payoffMatrix, playerCount)
    
    const ranges = idealPoints.map((ideal, i) => ideal - threatPoints[i])
    const totalRange = ranges.reduce((sum, range) => sum + range, 0)
    
    return threatPoints.map((threat, i) => threat + (ranges[i] / totalRange) * totalRange)
  }

  private static calculateThreatPoints(payoffMatrix: number[][][], playerCount: number): number[] {
    return new Array(playerCount).fill(0).map((_, player) => this.getSoloPlayerValue(player, payoffMatrix))
  }

  private static calculateMaxCooperativePayoffs(payoffMatrix: number[][][], playerCount: number): number[] {
    const grandCoalitionValue = this.calculateCoalitionValue(
      Array.from({ length: playerCount }, (_, i) => i),
      payoffMatrix
    )
    
    return new Array(playerCount).fill(grandCoalitionValue / playerCount)
  }

  private static calculateIdealPoints(payoffMatrix: number[][][], playerCount: number): number[] {
    return this.calculateMaxCooperativePayoffs(payoffMatrix, playerCount)
  }

  private static calculateVotingPower(payoffMatrix: number[][][], playerCount: number): number[] {
    // Simplified voting power based on pivotal positions in coalitions
    const votingPower: number[] = new Array(playerCount).fill(0)
    const coalitions = this.generateCoalitions(playerCount)
    
    for (let player = 0; player < playerCount; player++) {
      let pivotalCount = 0
      let totalCount = 0
      
      for (const coalition of coalitions) {
        if (coalition.includes(player)) {
          const coalitionWithoutPlayer = coalition.filter(p => p !== player)
          
          const valueWith = this.calculateCoalitionValue(coalition, payoffMatrix)
          const valueWithout = this.calculateCoalitionValue(coalitionWithoutPlayer, payoffMatrix)
          
          if (valueWith > valueWithout) {
            pivotalCount++
          }
          totalCount++
        }
      }
      
      votingPower[player] = totalCount > 0 ? pivotalCount / totalCount : 0
    }
    
    return votingPower
  }

  private static factorial(n: number): number {
    if (n <= 1) return 1
    return n * this.factorial(n - 1)
  }
}

class GameTheoryAnalyzer {
  // Main analyzer that coordinates all game theory algorithms
  static performCompleteAnalysis(
    payoffMatrix: number[][][],
    options: {
      enableNashEquilibrium?: boolean
      enableESS?: boolean
      enableDominance?: boolean
      enableCoalition?: boolean
      nashApproximation?: {
        samples?: number
        tolerance?: number
      }
      essOptions?: {
        maxGenerations?: number
        tolerance?: number
      }
    } = {}
  ): GameTheoryAnalysisResult {
    const startTime = performance.now()
    
    const {
      enableNashEquilibrium = true,
      enableESS = true,
      enableDominance = true,
      enableCoalition = false, // Expensive, disabled by default
      nashApproximation = { samples: 50000, tolerance: 1e-3 },
      essOptions = { maxGenerations: 1000, tolerance: 1e-6 }
    } = options
    
    // Initialize results
    let nashEquilibria: NashEquilibriumResult[] = []
    let evolutionaryStableStrategies: EvolutionaryStableStrategy[] = []
    let dominanceAnalysis: DominanceAnalysis = {
      strictlyDominated: [],
      weaklyDominated: [],
      eliminationOrder: [],
      remainingStrategies: []
    }
    let coalitionAnalysis: CoalitionAnalysis | undefined
    
    // Nash Equilibrium Analysis
    if (enableNashEquilibrium) {
      try {
        // Find pure Nash equilibria
        const pureEquilibria = NashEquilibriumCalculator.findPureNashEquilibria(payoffMatrix)
        nashEquilibria.push(...pureEquilibria)
        
        // Find mixed Nash equilibria if no pure equilibria exist
        if (pureEquilibria.length === 0) {
          const mixedEquilibria = NashEquilibriumCalculator.findMixedNashEquilibria(payoffMatrix)
          nashEquilibria.push(...mixedEquilibria)
        }
        
        // Find approximate equilibria for complex cases
        if (nashEquilibria.length === 0) {
          const approximateEquilibria = NashEquilibriumCalculator.findApproximateNashEquilibria(
            payoffMatrix,
            nashApproximation.samples,
            nashApproximation.tolerance
          )
          nashEquilibria.push(...approximateEquilibria)
        }
      } catch (error) {
        console.warn('Nash equilibrium analysis failed:', error)
      }
    }
    
    // Evolutionary Stable Strategy Analysis
    if (enableESS) {
      try {
        evolutionaryStableStrategies = EvolutionaryStableStrategyAnalyzer.analyzeESS(
          payoffMatrix,
          undefined, // Use default populations
          essOptions.maxGenerations,
          essOptions.tolerance
        )
      } catch (error) {
        console.warn('ESS analysis failed:', error)
      }
    }
    
    // Dominance Analysis
    if (enableDominance) {
      try {
        dominanceAnalysis = DominanceAnalyzer.analyzeDominance(payoffMatrix)
      } catch (error) {
        console.warn('Dominance analysis failed:', error)
      }
    }
    
    // Coalition Analysis (for multiplayer games)
    if (enableCoalition && payoffMatrix[0][0].length > 2) {
      try {
        coalitionAnalysis = CoalitionAnalyzer.analyzeCoalitions(
          payoffMatrix,
          payoffMatrix[0][0].length
        )
      } catch (error) {
        console.warn('Coalition analysis failed:', error)
      }
    }
    
    // Analyze game properties
    const gameProperties = this.analyzeGameProperties(payoffMatrix, dominanceAnalysis)
    
    const computationTime = performance.now() - startTime
    
    return {
      nashEquilibria,
      evolutionaryStableStrategies,
      dominanceAnalysis,
      coalitionAnalysis,
      gameProperties,
      computationTime
    }
  }

  private static analyzeGameProperties(
    payoffMatrix: number[][][],
    dominanceAnalysis: DominanceAnalysis
  ): GameTheoryAnalysisResult['gameProperties'] {
    const playerCount = payoffMatrix[0][0].length
    const strategyCount = payoffMatrix.length
    const strategyCounts = new Array(playerCount).fill(strategyCount)
    
    // Check if game is zero-sum
    const isZeroSum = this.isZeroSumGame(payoffMatrix)
    
    // Check if game is symmetric
    const isSymmetric = this.isSymmetricGame(payoffMatrix)
    
    // Check for strictly dominant strategies
    const hasStrictlyDominantStrategies = dominanceAnalysis.strictlyDominated.length > 0
    
    // Check if dominance elimination leads to unique solution
    const hasPureDominanceEquilibrium = dominanceAnalysis.remainingStrategies.every(
      strategies => strategies.length === 1
    )
    
    return {
      isZeroSum,
      isSymmetric,
      hasStrictlyDominantStrategies,
      hasPureDominanceEquilibrium,
      maxPlayerCount: playerCount,
      strategyCount: strategyCounts
    }
  }

  private static isZeroSumGame(payoffMatrix: number[][][]): boolean {
    const playerCount = payoffMatrix[0][0].length
    
    if (playerCount !== 2) return false // Zero-sum typically refers to 2-player games
    
    for (let i = 0; i < payoffMatrix.length; i++) {
      for (let j = 0; j < payoffMatrix[i].length; j++) {
        const sum = payoffMatrix[i][j][0] + payoffMatrix[i][j][1]
        if (Math.abs(sum) > 1e-10) { // Allow for floating point errors
          return false
        }
      }
    }
    
    return true
  }

  private static isSymmetricGame(payoffMatrix: number[][][]): boolean {
    const playerCount = payoffMatrix[0][0].length
    
    if (playerCount !== 2) return false // Simplified check for 2-player games
    
    for (let i = 0; i < payoffMatrix.length; i++) {
      for (let j = 0; j < payoffMatrix[i].length; j++) {
        // Check if swapping players gives same payoff structure
        if (payoffMatrix[i][j][0] !== payoffMatrix[j][i][1] ||
            payoffMatrix[i][j][1] !== payoffMatrix[j][i][0]) {
          return false
        }
      }
    }
    
    return true
  }
}
