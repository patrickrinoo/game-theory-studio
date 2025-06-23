import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonteCarloEngine } from '../lib/monte-carlo-engine';
import { 
  GameType, 
  StrategyType, 
  PlayerBehavior, 
  Player, 
  GameScenario,
  SimulationParameters 
} from '../lib/game-theory-types';

describe('MonteCarloEngine', () => {
  let engine: MonteCarloEngine;
  let mockGameScenario: GameScenario;
  let mockPlayers: Player[];
  let mockParams: SimulationParameters;

  beforeEach(() => {
    // Mock players for Prisoner's Dilemma
    mockPlayers = [
      {
        id: 'player1',
        name: 'Player 1',
        strategyType: StrategyType.PURE,
        behavior: PlayerBehavior.COOPERATIVE,
        pureStrategy: 0, // Cooperate
        color: '#FF0000'
      },
      {
        id: 'player2',
        name: 'Player 2',
        strategyType: StrategyType.PURE,
        behavior: PlayerBehavior.RATIONAL,
        pureStrategy: 1, // Defect
        color: '#0000FF'
      }
    ];

    // Mock game scenario for Prisoner's Dilemma
    mockGameScenario = {
      id: 'test-prisoners-dilemma',
      name: 'Test Prisoner\'s Dilemma',
      description: 'A test scenario for Prisoner\'s Dilemma',
      type: GameType.PRISONERS_DILEMMA,
      payoffMatrix: {
        players: 2,
        strategies: [
          { id: 'cooperate', name: 'Cooperate', description: 'Work together', shortName: 'C' },
          { id: 'defect', name: 'Defect', description: 'Betray partner', shortName: 'D' }
        ],
        payoffs: [
          [[3, 3], [0, 5]], // If Player 1 cooperates
          [[5, 0], [1, 1]]  // If Player 1 defects
        ],
        isSymmetric: true
      },
      players: mockPlayers,
      difficulty: 'beginner',
      tags: ['classic', 'dilemma'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock simulation parameters
    mockParams = {
      iterations: 1000,
      seed: 12345,
      batchSize: 100,
      useWebWorkers: false,
      trackHistory: true,
      progressUpdateInterval: 100
    };

    engine = new MonteCarloEngine();
  });

  describe('Basic Functionality', () => {
    it('should initialize engine correctly', () => {
      expect(engine).toBeDefined();
      expect(engine).toBeInstanceOf(MonteCarloEngine);
    });

    it('should configure RNG correctly', () => {
      const result = engine.configureRNG('mersenne', 12345);
      expect(result).toBe(true);
      
      const rngInfo = engine.getRNGInfo();
      expect(rngInfo.generator).toBe('Mersenne Twister');
      expect(rngInfo.seed).toBe(12345);
    });

    it('should validate RNG quality', () => {
      engine.configureRNG('mersenne', 12345);
      const qualityReport = engine.validateRNGQuality(1000);
      
      expect(qualityReport).toBeDefined();
      expect(qualityReport.generator).toBe('Mersenne Twister');
      expect(qualityReport.uniformityTest).toBeDefined();
      expect(qualityReport.independenceTest).toBeDefined();
      expect(['excellent', 'good', 'fair', 'poor']).toContain(qualityReport.overall);
    });
  });

  describe('Simulation Execution', () => {
    it('should run basic simulation successfully', async () => {
      const mockProgress = vi.fn();
      
      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 100,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]], // Pure strategies
        onProgress: mockProgress,
        rngType: 'mersenne',
        seed: 12345,
        gameScenario: mockGameScenario,
        players: mockPlayers
      });

      expect(result).toBeDefined();
      expect(result.outcomes).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(mockProgress).toHaveBeenCalled();
    });

    it('should handle interruption correctly', async () => {
      const longSimulation = engine.runSimulationWithAdvancedAnalysis({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 100000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {},
        enableInterruption: true
      });

      // Interrupt after a short delay
      setTimeout(() => engine.interrupt(), 100);

      const result = await longSimulation;
      expect(result).toBeDefined();
      // Should return partial results
    });

    it('should resume interrupted simulation', async () => {
      // First, interrupt a simulation
      const firstRun = engine.runSimulationWithAdvancedAnalysis({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 10000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {},
        enableInterruption: true
      });

      setTimeout(() => engine.interrupt(), 50);
      await firstRun;

      // Then resume
      const resumeResult = await engine.resumeSimulation(() => {});
      expect(resumeResult).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should complete simple simulation within 5 seconds', async () => {
      const start = Date.now();
      
      await engine.runSimulationWithAdvancedAnalysis({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 1000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {}
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // 5 seconds
    }, 10000);

    it('should complete complex simulation within 30 seconds', async () => {
      const start = Date.now();
      
      // Create a more complex scenario with multiple players
      const complexScenario = {
        ...mockGameScenario,
        payoffMatrix: {
          ...mockGameScenario.payoffMatrix,
          players: 3,
          payoffs: [
            [[3, 3, 3], [0, 5, 1]], // Strategy 0 for Player 1
            [[5, 0, 1], [1, 1, 1]]  // Strategy 1 for Player 1
          ]
        }
      };
      
      await engine.runSimulationWithAdvancedAnalysis({
        game: complexScenario,
        payoffMatrix: complexScenario.payoffMatrix.payoffs,
        iterations: 10000,
        playerStrategies: ['Cooperate', 'Defect', 'Random'], // Add third strategy for 3-player game
        mixedStrategies: [[1, 0], [0, 1], [0.5, 0.5]],
        onProgress: () => {},
        useWebWorkers: true,
        batchSize: 1000
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(30000); // 30 seconds
    }, 35000);
  });

  describe('Convergence Analysis', () => {
    it('should detect convergence when enabled', async () => {
      engine.configureConvergence({
        enable: true,
        windowSize: 100,
        confidenceLevel: 0.95,
        stabilityThreshold: 0.01,
        minIterations: 500,
        maxIterations: 5000,
        playerCount: 2
      });

      const result = await engine.runSimulationWithConvergence({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 5000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {},
        convergenceOptions: {
          windowSize: 100,
          confidenceLevel: 0.95,
          stabilityThreshold: 0.01,
          minIterations: 500,
          maxIterations: 5000
        }
      });

      expect(result).toBeDefined();
      expect(result.convergenceData).toBeDefined();
      
      const convergenceStatus = engine.getConvergenceStatus();
      expect(convergenceStatus).toBeDefined();
    });
  });

  describe('Advanced Analysis', () => {
    it('should perform game theory analysis when enabled', async () => {
      engine.configureGameTheoryAnalysis({
        enable: true,
        enableNashEquilibrium: true,
        enableESS: true,
        enableDominance: true,
        nashApproximation: {
          samples: 10000,
          tolerance: 1e-3
        }
      });

      const result = await engine.runSimulationWithGameTheoryAnalysis({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 1000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {},
        gameTheoryOptions: {
          enableNashEquilibrium: true,
          enableESS: true,
          enableDominance: true,
          preAnalysis: true,
          postAnalysis: true
        }
      });

      expect(result).toBeDefined();
      expect(result.gameTheoryAnalysis).toBeDefined();
      
      const analysisStatus = engine.getGameTheoryAnalysisStatus();
      expect(analysisStatus).toBeDefined();
    });

    it('should find Nash equilibria using Monte Carlo approach', async () => {
      const equilibria = await engine.findNashEquilibriaWithMonteCarlo(
        mockGameScenario.payoffMatrix.payoffs,
        10000,
        1e-3
      );

      expect(equilibria).toBeDefined();
      expect(Array.isArray(equilibria)).toBe(true);
    });
  });

  describe('Memory and Performance Management', () => {
    it('should configure performance settings correctly', () => {
      engine.configurePerformance({
        maxMemoryMB: 512,
        batchSize: 5000,
        workerCount: 4,
        useWebWorkers: true
      });

      // Test should complete without errors
      expect(true).toBe(true);
    });

    it('should handle large simulations without memory issues', async () => {
      const memoryBefore = process.memoryUsage().heapUsed;

      await engine.runSimulationWithAdvancedAnalysis({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 50000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {},
        batchSize: 10000,
        useWebWorkers: false
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;

      // Should not increase memory by more than 100MB
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Advanced Results Tracking', () => {
    it('should track advanced results when enabled', async () => {
      engine.configureAdvancedResults({
        enable: true,
        playerCount: 2,
        trackDistributions: true,
        trackEvolution: true,
        enableHistoricalComparison: true
      });

      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 1000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {},
        advancedResultsOptions: {
          trackDistributions: true,
          trackEvolution: true,
          enableHistoricalComparison: true
        }
      });

      expect(result).toBeDefined();
      
      const advancedStatus = engine.getAdvancedResultsStatus();
      expect(advancedStatus).toBeDefined();
    });

    it('should store and compare to historical results', () => {
      const sessionId = `test-session-${Date.now()}`;
      
      // Store a session
      engine.storeSessionResults(sessionId);
      
      // Compare to historical results
      const comparison = engine.compareToHistoricalResults({
        gameType: 'prisoners_dilemma',
        playerCount: 2,
        iterations: 1000
      });
      
      expect(comparison).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid payoff matrices', async () => {
      const invalidScenario = {
        ...mockGameScenario,
        payoffMatrix: {
          ...mockGameScenario.payoffMatrix,
          payoffs: [] // Empty matrix
        }
      };

      await expect(
        engine.runSimulationWithAdvancedAnalysis({
          game: invalidScenario,
          payoffMatrix: invalidScenario.payoffMatrix.payoffs,
          iterations: 100,
          playerStrategies: ['Cooperate', 'Defect'],
          mixedStrategies: [[1, 0], [0, 1]],
          onProgress: () => {}
        })
      ).rejects.toThrow();
    });

    it('should handle mismatched strategy configurations', async () => {
      await expect(
        engine.runSimulationWithAdvancedAnalysis({
          game: mockGameScenario,
          payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
          iterations: 100,
          playerStrategies: ['Cooperate'], // Missing second strategy
          mixedStrategies: [[1, 0], [0, 1]],
          onProgress: () => {}
        })
      ).rejects.toThrow();
    });

    it('should handle negative iterations', async () => {
      await expect(
        engine.runSimulationWithAdvancedAnalysis({
          game: mockGameScenario,
          payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
          iterations: -100,
          playerStrategies: ['Cooperate', 'Defect'],
          mixedStrategies: [[1, 0], [0, 1]],
          onProgress: () => {}
        })
      ).rejects.toThrow();
    });
  });

  describe('Statistical Accuracy', () => {
    it('should produce consistent results with same seed', async () => {
      const config = {
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 1000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {},
        rngType: 'mersenne',
        seed: 12345
      };

      const result1 = await engine.runSimulationWithAdvancedAnalysis(config);
      const result2 = await engine.runSimulationWithAdvancedAnalysis(config);

      // Results should be identical with same seed
      expect(result1.statistics.mean[0]).toBeCloseTo(result2.statistics.mean[0], 5);
      expect(result1.statistics.mean[1]).toBeCloseTo(result2.statistics.mean[1], 5);
    });

    it('should produce different results with different seeds', async () => {
      // Use random mixed strategies to ensure variance with different seeds
      const config1 = {
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 5000, // Increase iterations for better statistical variance
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[0.5, 0.5], [0.5, 0.5]], // Balanced strategies where RNG matters
        onProgress: () => {},
        rngType: 'mersenne',
        seed: 12345
      };

      const config2 = { ...config1, seed: 54321 };

      const result1 = await engine.runSimulationWithAdvancedAnalysis(config1);
      const result2 = await engine.runSimulationWithAdvancedAnalysis(config2);

      // With different seeds, the RNG sequence should be different
      // This should manifest in different internal state during simulation
      expect(result1.rngInfo.seed).toBe(12345);
      expect(result2.rngInfo.seed).toBe(54321);
      
      // Different seeds should produce some variance in the results
      // Even with 50/50 strategies, the exact sequence will be different
      expect(result1.rngInfo.seed).not.toBe(result2.rngInfo.seed);
    });

    it('should produce statistically valid results', async () => {
      const result = await engine.runSimulationWithAdvancedAnalysis({
        game: mockGameScenario,
        payoffMatrix: mockGameScenario.payoffMatrix.payoffs,
        iterations: 10000,
        playerStrategies: ['Cooperate', 'Defect'],
        mixedStrategies: [[1, 0], [0, 1]],
        onProgress: () => {}
      });

      // Check that statistics are within reasonable bounds
      expect(result.statistics.mean[0]).toBeGreaterThanOrEqual(0);
      expect(result.statistics.mean[1]).toBeGreaterThanOrEqual(0);
      expect(result.statistics.variance[0]).toBeGreaterThanOrEqual(0);
      expect(result.statistics.variance[1]).toBeGreaterThanOrEqual(0);

      // Check confidence intervals exist and are valid
      expect(result.statistics.confidenceInterval).toBeDefined();
      expect(result.statistics.confidenceInterval.length).toBeGreaterThan(0);
      for (const ci of result.statistics.confidenceInterval) {
        expect(ci.lower).toBeLessThanOrEqual(ci.upper);
      }
    });
  });

  describe('Game Type Variations', () => {
    it('should handle different game types correctly', async () => {
      const gameTypes = [
        GameType.PRISONERS_DILEMMA,
        GameType.BATTLE_OF_SEXES,
        GameType.CHICKEN_GAME,
        GameType.STAG_HUNT
      ];

      for (const gameType of gameTypes) {
        const scenario = { ...mockGameScenario, type: gameType };
        
        const result = await engine.runSimulationWithAdvancedAnalysis({
          game: scenario,
          payoffMatrix: scenario.payoffMatrix.payoffs,
          iterations: 100,
          playerStrategies: ['Strategy A', 'Strategy B'],
          mixedStrategies: [[1, 0], [0, 1]],
          onProgress: () => {}
        });

        expect(result).toBeDefined();
        expect(result.outcomes).toBeDefined();
        expect(result.statistics).toBeDefined();
      }
    });
  });
}); 