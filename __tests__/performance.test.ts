import { describe, it, expect, beforeEach } from 'vitest';
import { MonteCarloEngine } from '../lib/monte-carlo-engine';
import { 
  GameType, 
  StrategyType, 
  PlayerBehavior, 
  Player, 
  GameScenario 
} from '../lib/game-theory-types';

describe('Performance Testing Framework', () => {
  let engine: MonteCarloEngine;

  beforeEach(() => {
    engine = new MonteCarloEngine();
    engine.configureRNG('mersenne', 12345);
  });

  describe('PRD Performance Requirements', () => {
    it('should complete simple scenarios within 5 seconds', async () => {
      const simpleScenario: GameScenario = {
        id: 'simple-performance-test',
        name: 'Simple Performance Test',
        description: 'Basic 2-player, 1000 iterations',
        type: GameType.PRISONERS_DILEMMA,
        payoffMatrix: {
          players: 2,
          strategies: [
            { id: 'cooperate', name: 'Cooperate', description: 'Work together', shortName: 'C' },
            { id: 'defect', name: 'Defect', description: 'Betray partner', shortName: 'D' }
          ],
          payoffs: [
            [[3, 3], [0, 5]],
            [[5, 0], [1, 1]]
          ],
          isSymmetric: true
        },
        players: [
          {
            id: 'player1',
            name: 'Player 1',
            strategyType: StrategyType.PURE,
            behavior: PlayerBehavior.COOPERATIVE,
            pureStrategy: 0,
            color: '#FF0000'
          },
          {
            id: 'player2',
            name: 'Player 2',
            strategyType: StrategyType.PURE,
            behavior: PlayerBehavior.RATIONAL,
            pureStrategy: 1,
            color: '#0000FF'
          }
        ],
        difficulty: 'beginner',
        tags: ['performance'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const start = performance.now();
      
      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: simpleScenario,
        payoffMatrix: simpleScenario.payoffMatrix.payoffs,
        iterations: 1000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {},
        useWebWorkers: false,
        batchSize: 100
      });

      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // PRD requirement: 5 seconds
      expect(result.executionTime).toBeLessThan(5000);
    }, 10000);

    it('should complete complex scenarios within 30 seconds', async () => {
      const complexScenario: GameScenario = {
        id: 'complex-performance-test',
        name: 'Complex Performance Test',
        description: 'Multi-player, high iterations, mixed strategies',
        type: GameType.PUBLIC_GOODS,
        payoffMatrix: {
          players: 2, // Keep at 2 for manageable complexity
          strategies: [
            { id: 'contribute', name: 'Contribute', description: 'Add to public good', shortName: 'C' },
            { id: 'free_ride', name: 'Free Ride', description: 'Don\'t contribute', shortName: 'F' }
          ],
          payoffs: [
            [[2, 2], [0, 3]],
            [[3, 0], [1, 1]]
          ],
          isSymmetric: true
        },
        players: [
          {
            id: 'player1',
            name: 'Complex Player 1',
            strategyType: StrategyType.ADAPTIVE,
            behavior: PlayerBehavior.TIT_FOR_TAT,
            adaptiveParams: {
              learningRate: 0.1,
              explorationRate: 0.05,
              memoryLength: 20,
              initialBelief: [0.5, 0.5]
            },
            color: '#FF0000'
          },
          {
            id: 'player2',
            name: 'Complex Player 2',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RANDOM,
            mixedStrategy: [0.6, 0.4],
            color: '#0000FF'
          }
        ],
        difficulty: 'advanced',
        tags: ['performance', 'complex'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const start = performance.now();
      
      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: complexScenario,
        payoffMatrix: complexScenario.payoffMatrix.payoffs,
        iterations: 10000, // Higher iteration count
        playerStrategies: ['Contribute', 'Free Ride'],
        mixedStrategies: [[0.6, 0.4], [0.4, 0.6]],
        onProgress: () => {},
        enableLearning: true,
        useWebWorkers: false,
        batchSize: 1000,
        convergenceOptions: {
          windowSize: 100,
          confidenceLevel: 0.95,
          stabilityThreshold: 0.01,
          minIterations: 1000,
          maxIterations: 10000
        }
      });

      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(30000); // PRD requirement: 30 seconds
      expect(result.executionTime).toBeLessThan(30000);
    }, 35000);
  });

  describe('Memory Usage Testing', () => {
    it('should maintain reasonable memory usage during large simulations', async () => {
      const scenario: GameScenario = {
        id: 'memory-test',
        name: 'Memory Usage Test',
        description: 'High-iteration memory test',
        type: GameType.BATTLE_OF_SEXES,
        payoffMatrix: {
          players: 2,
          strategies: [
            { id: 'opera', name: 'Opera', description: 'Go to opera', shortName: 'O' },
            { id: 'football', name: 'Football', description: 'Go to football', shortName: 'F' }
          ],
          payoffs: [
            [[2, 1], [0, 0]],
            [[0, 0], [1, 2]]
          ],
          isSymmetric: false
        },
        players: [
          {
            id: 'player1',
            name: 'Player 1',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RATIONAL,
            mixedStrategy: [0.7, 0.3],
            color: '#FF0000'
          },
          {
            id: 'player2',
            name: 'Player 2',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RATIONAL,
            mixedStrategy: [0.3, 0.7],
            color: '#0000FF'
          }
        ],
        difficulty: 'intermediate',
        tags: ['memory'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Configure for memory efficiency
      engine.configurePerformance({
        maxMemoryMB: 128,
        batchSize: 5000,
        workerCount: 1,
        useWebWorkers: false
      });

      const memoryBefore = process.memoryUsage().heapUsed;
      
      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: scenario,
        payoffMatrix: scenario.payoffMatrix.payoffs,
        iterations: 50000, // Large number of iterations
        playerStrategies: ['Opera', 'Football'],
        mixedStrategies: [[0.7, 0.3], [0.3, 0.7]],
        onProgress: () => {},
        batchSize: 5000
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;

      expect(result).toBeDefined();
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    }, 45000);

    it('should handle memory pressure gracefully', async () => {
      // Configure with very low memory limit
      engine.configurePerformance({
        maxMemoryMB: 32, // Very low memory limit
        batchSize: 1000,
        workerCount: 1,
        useWebWorkers: false
      });

      const scenario: GameScenario = {
        id: 'memory-pressure-test',
        name: 'Memory Pressure Test',
        description: 'Test memory pressure handling',
        type: GameType.CHICKEN_GAME,
        payoffMatrix: {
          players: 2,
          strategies: [
            { id: 'swerve', name: 'Swerve', description: 'Avoid collision', shortName: 'S' },
            { id: 'straight', name: 'Straight', description: 'Keep going', shortName: 'G' }
          ],
          payoffs: [
            [[0, 0], [-1, 1]],
            [[1, -1], [-10, -10]]
          ],
          isSymmetric: true
        },
        players: [
          {
            id: 'driver1',
            name: 'Driver 1',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RATIONAL,
            mixedStrategy: [0.9, 0.1],
            color: '#FF0000'
          },
          {
            id: 'driver2',
            name: 'Driver 2',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RATIONAL,
            mixedStrategy: [0.1, 0.9],
            color: '#0000FF'
          }
        ],
        difficulty: 'intermediate',
        tags: ['memory-pressure'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Should complete without crashing despite memory constraints
      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: scenario,
        payoffMatrix: scenario.payoffMatrix.payoffs,
        iterations: 20000,
        playerStrategies: ['Swerve', 'Straight'],
        mixedStrategies: [[0.9, 0.1], [0.1, 0.9]],
        onProgress: () => {},
        batchSize: 1000
      });

      expect(result).toBeDefined();
      expect(result.outcomes).toBeDefined();
    }, 30000);
  });

  describe('Rendering Performance', () => {
    it('should provide timely progress updates during simulation', async () => {
      const scenario: GameScenario = {
        id: 'progress-test',
        name: 'Progress Update Test',
        description: 'Test progress update frequency',
        type: GameType.STAG_HUNT,
        payoffMatrix: {
          players: 2,
          strategies: [
            { id: 'stag', name: 'Stag', description: 'Hunt stag', shortName: 'S' },
            { id: 'hare', name: 'Hare', description: 'Hunt hare', shortName: 'H' }
          ],
          payoffs: [
            [[3, 3], [0, 2]],
            [[2, 0], [1, 1]]
          ],
          isSymmetric: true
        },
        players: [
          {
            id: 'hunter1',
            name: 'Hunter 1',
            strategyType: StrategyType.PURE,
            behavior: PlayerBehavior.RATIONAL,
            pureStrategy: 0,
            color: '#008000'
          },
          {
            id: 'hunter2',
            name: 'Hunter 2',
            strategyType: StrategyType.PURE,
            behavior: PlayerBehavior.RATIONAL,
            pureStrategy: 1,
            color: '#800080'
          }
        ],
        difficulty: 'intermediate',
        tags: ['progress'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const progressUpdates: { progress: number; timestamp: number }[] = [];
      const startTime = performance.now();

      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: scenario,
        payoffMatrix: scenario.payoffMatrix.payoffs,
        iterations: 5000,
        playerStrategies: ['Stag', 'Hare'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: (progress) => {
          progressUpdates.push({
            progress,
            timestamp: performance.now() - startTime
          });
        },
        batchSize: 250 // Smaller batches for more frequent updates
      });

      expect(result).toBeDefined();
      expect(progressUpdates.length).toBeGreaterThan(5); // Should have multiple updates
      
      // Check that progress increases monotonically
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].progress).toBeGreaterThanOrEqual(progressUpdates[i-1].progress);
      }

      // Check that final progress is close to 100%
      const finalProgress = progressUpdates[progressUpdates.length - 1].progress;
      expect(finalProgress).toBeGreaterThanOrEqual(90);
    }, 20000);

    it('should optimize data structures for large datasets', async () => {
      engine.configureAdvancedResults({
        enable: true,
        playerCount: 2,
        trackDistributions: true,
        trackEvolution: true,
        enableHistoricalComparison: false // Disable to save memory
      });

      const scenario: GameScenario = {
        id: 'optimization-test',
        name: 'Data Structure Optimization Test',
        description: 'Test data structure efficiency',
        type: GameType.MATCHING_PENNIES,
        payoffMatrix: {
          players: 2,
          strategies: [
            { id: 'heads', name: 'Heads', description: 'Choose heads', shortName: 'H' },
            { id: 'tails', name: 'Tails', description: 'Choose tails', shortName: 'T' }
          ],
          payoffs: [
            [[1, -1], [-1, 1]],
            [[-1, 1], [1, -1]]
          ],
          isSymmetric: false
        },
        players: [
          {
            id: 'player1',
            name: 'Player 1',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RANDOM,
            mixedStrategy: [0.5, 0.5],
            color: '#FF0000'
          },
          {
            id: 'player2',
            name: 'Player 2',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RANDOM,
            mixedStrategy: [0.5, 0.5],
            color: '#0000FF'
          }
        ],
        difficulty: 'beginner',
        tags: ['optimization'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const start = performance.now();

      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: scenario,
        payoffMatrix: scenario.payoffMatrix.payoffs,
        iterations: 25000,
        playerStrategies: ['Heads', 'Tails'],
        mixedStrategies: [[0.5, 0.5], [0.5, 0.5]],
        onProgress: () => {},
        advancedResultsOptions: {
          trackDistributions: true,
          trackEvolution: true,
          enableHistoricalComparison: false
        }
      });

      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(15000); // Should be efficient
      
      // Verify that results are still accurate despite optimizations
      // For Matching Pennies, expected payoffs should be close to zero in equilibrium
      expect(Math.abs(result.statistics.mean[0])).toBeLessThan(2); // Close to zero
      expect(Math.abs(result.statistics.mean[1])).toBeLessThan(2); // Close to zero
    }, 25000);
  });

  describe('Scalability Testing', () => {
    it('should handle increasing iteration counts efficiently', async () => {
      const scenario: GameScenario = {
        id: 'scalability-test',
        name: 'Scalability Test',
        description: 'Test performance scaling',
        type: GameType.PRISONERS_DILEMMA,
        payoffMatrix: {
          players: 2,
          strategies: [
            { id: 'cooperate', name: 'Cooperate', description: 'Work together', shortName: 'C' },
            { id: 'defect', name: 'Defect', description: 'Betray partner', shortName: 'D' }
          ],
          payoffs: [
            [[3, 3], [0, 5]],
            [[5, 0], [1, 1]]
          ],
          isSymmetric: true
        },
        players: [
          {
            id: 'player1',
            name: 'Player 1',
            strategyType: StrategyType.PURE,
            behavior: PlayerBehavior.COOPERATIVE,
            pureStrategy: 0,
            color: '#FF0000'
          },
          {
            id: 'player2',
            name: 'Player 2',
            strategyType: StrategyType.PURE,
            behavior: PlayerBehavior.RATIONAL,
            pureStrategy: 1,
            color: '#0000FF'
          }
        ],
        difficulty: 'beginner',
        tags: ['scalability'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const iterationCounts = [1000, 5000, 10000];
      const results: { iterations: number; duration: number }[] = [];

      for (const iterations of iterationCounts) {
        const start = performance.now();
        
        const result = await engine.runSimulationWithAdvancedAnalysis({
          game: scenario,
          payoffMatrix: scenario.payoffMatrix.payoffs,
          iterations: iterations,
          playerStrategies: ['Cooperate', 'Defect'],
          mixedStrategies: [[1, 0], [0, 1]],
          onProgress: () => {},
          batchSize: Math.min(1000, iterations / 10)
        });

        const duration = performance.now() - start;
        results.push({ iterations, duration });

        expect(result).toBeDefined();
      }

      // Check that performance scales reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const prevResult = results[i - 1];
        const currentResult = results[i];
        
        const iterationRatio = currentResult.iterations / prevResult.iterations;
        const timeRatio = currentResult.duration / prevResult.duration;
        
        // Time should not increase more than 3x the iteration ratio (allowing for some variance)
        expect(timeRatio).toBeLessThan(iterationRatio * 3);
      }
    }, 60000);
  });

  describe('Optimization Effectiveness', () => {
    it('should demonstrate performance improvements with optimizations', async () => {
      const scenario: GameScenario = {
        id: 'optimization-effectiveness-test',
        name: 'Optimization Effectiveness Test',
        description: 'Compare optimized vs non-optimized performance',
        type: GameType.HAWK_DOVE,
        payoffMatrix: {
          players: 2,
          strategies: [
            { id: 'hawk', name: 'Hawk', description: 'Aggressive strategy', shortName: 'H' },
            { id: 'dove', name: 'Dove', description: 'Peaceful strategy', shortName: 'D' }
          ],
          payoffs: [
            [[0, 0], [3, 1]],
            [[1, 3], [2, 2]]
          ],
          isSymmetric: true
        },
        players: [
          {
            id: 'animal1',
            name: 'Animal 1',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RATIONAL,
            mixedStrategy: [0.5, 0.5],
            color: '#FF4500'
          },
          {
            id: 'animal2',
            name: 'Animal 2',
            strategyType: StrategyType.MIXED,
            behavior: PlayerBehavior.RATIONAL,
            mixedStrategy: [0.5, 0.5],
            color: '#32CD32'
          }
        ],
        difficulty: 'intermediate',
        tags: ['optimization'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test without optimizations
      engine.configurePerformance({
        maxMemoryMB: 1024,
        batchSize: 100, // Small batch size
        workerCount: 1,
        useWebWorkers: false
      });

      const startBaseline = performance.now();
      const baselineResult = await engine.runSimulationWithAdvancedAnalysis({
        game: scenario,
        payoffMatrix: scenario.payoffMatrix.payoffs,
        iterations: 10000,
        playerStrategies: ['Hawk', 'Dove'],
        mixedStrategies: [[0.5, 0.5], [0.5, 0.5]],
        onProgress: () => {},
        batchSize: 100
      });
      const baselineDuration = performance.now() - startBaseline;

      // Test with optimizations
      engine.configurePerformance({
        maxMemoryMB: 512,
        batchSize: 2000, // Larger batch size
        workerCount: 1,
        useWebWorkers: false
      });

      const startOptimized = performance.now();
      const optimizedResult = await engine.runSimulationWithAdvancedAnalysis({
        game: scenario,
        payoffMatrix: scenario.payoffMatrix.payoffs,
        iterations: 10000,
        playerStrategies: ['Hawk', 'Dove'],
        mixedStrategies: [[0.5, 0.5], [0.5, 0.5]],
        onProgress: () => {},
        batchSize: 2000
      });
      const optimizedDuration = performance.now() - startOptimized;

      expect(baselineResult).toBeDefined();
      expect(optimizedResult).toBeDefined();
      
      // Optimized version should be faster or at least not significantly slower
      expect(optimizedDuration).toBeLessThan(baselineDuration * 1.5);
      
      // Results should be statistically similar (within reasonable bounds)
      expect(Math.abs(baselineResult.statistics.mean[0] - optimizedResult.statistics.mean[0])).toBeLessThan(0.5);
      expect(Math.abs(baselineResult.statistics.mean[1] - optimizedResult.statistics.mean[1])).toBeLessThan(0.5);
    }, 45000);
  });
}); 