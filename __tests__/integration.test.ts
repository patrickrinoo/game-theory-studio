import { describe, it, expect, beforeEach } from 'vitest';
import { MonteCarloEngine } from '../lib/monte-carlo-engine';
import { GameType } from '../lib/game-theory-types';

describe('Integration Testing', () => {
  let engine: MonteCarloEngine;

  beforeEach(() => {
    engine = new MonteCarloEngine();
  });

  it('should run basic integration test', async () => {
    const result = await engine.runSimulationWithAdvancedAnalysis({
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]]
        }
      },
      payoffMatrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      iterations: 100,
      playerStrategies: ['Cooperate', 'Defect'],
      mixedStrategies: [[1, 0], [0, 1]],
      onProgress: () => {}
    });

    expect(result).toBeDefined();
    expect(result.outcomes).toBeDefined();
  });

  it('should run complete workflow with convergence analysis', async () => {
    engine.configureConvergence({
      enable: true,
      windowSize: 50,
      playerCount: 2
    });

    const progressUpdates: number[] = [];
    const result = await engine.runSimulationWithAdvancedAnalysis({
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]]
        }
      },
      payoffMatrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      iterations: 500,
      playerStrategies: ['Cooperate', 'Defect'],
      mixedStrategies: [[0.7, 0.3], [0.4, 0.6]],
      onProgress: (progress) => progressUpdates.push(progress),
      convergenceOptions: {
        windowSize: 50
      }
    });

    expect(result).toBeDefined();
    expect(result.outcomes).toBeDefined();
    expect(result.statistics).toBeDefined();
    expect(result.convergenceAnalysis).toBeDefined();
    expect(progressUpdates.length).toBeGreaterThan(0);
  }, 8000);

  it('should integrate game theory analysis', async () => {
    engine.configureGameTheoryAnalysis({
      enable: true,
      enableNashEquilibrium: true,
      enableDominance: true
    });

    const result = await engine.runSimulationWithGameTheoryAnalysis({
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]]
        }
      },
      payoffMatrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      iterations: 300,
      playerStrategies: ['Cooperate', 'Defect'],
      mixedStrategies: [[0.5, 0.5], [0.5, 0.5]],
      onProgress: () => {},
      gameTheoryOptions: {
        enableNashEquilibrium: true,
        enableDominance: true,
        preAnalysis: true
      }
    });

    expect(result).toBeDefined();
    expect(result.gameTheoryAnalysis).toBeDefined();
  }, 6000);

  it('should handle large-scale simulations with performance monitoring', async () => {
    engine.configurePerformance({
      maxMemoryMB: 256,
      batchSize: 500
    });

    const result = await engine.runSimulationWithAdvancedAnalysis({
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]]
        }
      },
      payoffMatrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      iterations: 1500,
      playerStrategies: ['Cooperate', 'Defect'],
      mixedStrategies: [[0.5, 0.5], [0.5, 0.5]],
      onProgress: () => {}
    });

    expect(result).toBeDefined();
    expect(result.iterations).toBe(1500);
    expect(result.performanceMetrics).toBeDefined();
    expect(result.performanceMetrics.totalTime).toBeGreaterThan(0);
  }, 10000);
}); 