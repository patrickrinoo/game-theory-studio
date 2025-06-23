import { StrategyEvolutionData, PayoffDistributionData, StrategySpaceData, PerformanceData } from './visualization-types';
import { Player, Strategy, StrategyType, PlayerBehavior, GameType } from './game-theory-types';

/**
 * Generate sample strategy evolution data for testing visualization components
 */
export function generateSampleStrategyEvolutionData(): StrategyEvolutionData {
  // Sample players and strategies
  const players: Player[] = [
    {
      id: 'player1',
      name: 'Player 1',
      strategyType: StrategyType.MIXED,
      behavior: PlayerBehavior.RATIONAL,
      color: '#3b82f6'
    },
    {
      id: 'player2',
      name: 'Player 2',
      strategyType: StrategyType.MIXED,
      behavior: PlayerBehavior.RATIONAL,
      color: '#ef4444'
    }
  ];

  const strategies: Strategy[] = [
    { id: 'cooperate', name: 'Cooperate', description: 'Always cooperate', shortName: 'C' },
    { id: 'defect', name: 'Defect', description: 'Always defect', shortName: 'D' }
  ];

  // Generate evolution data over 10,000 iterations
  const iterations = Array.from({ length: 100 }, (_, i) => i * 100); // Sample every 100 iterations
  const series = [];

  // Player 1 strategies
  for (const strategy of strategies) {
    const data = iterations.map(iteration => {
      // Simulate strategy evolution with some randomness and convergence
      const baseProb = strategy.id === 'cooperate' ? 0.7 : 0.3;
      const noise = (Math.random() - 0.5) * 0.1;
      const convergenceFactor = Math.exp(-iteration / 3000); // Converge over time
      const probability = Math.max(0, Math.min(1, baseProb + noise * convergenceFactor));
      
      return {
        iteration,
        playerId: 'player1',
        playerName: 'Player 1',
        strategyId: strategy.id,
        strategyName: strategy.name,
        probability,
        payoff: probability * (strategy.id === 'cooperate' ? 3 : 1),
        timestamp: Date.now() + iteration * 10
      };
    });

    series.push({
      playerId: 'player1',
      playerName: 'Player 1',
      strategyId: strategy.id,
      strategyName: strategy.name,
      color: strategy.id === 'cooperate' ? '#3b82f6' : '#1d4ed8',
      data
    });
  }

  // Player 2 strategies (mirror evolution with different dynamics)
  for (const strategy of strategies) {
    const data = iterations.map(iteration => {
      const baseProb = strategy.id === 'cooperate' ? 0.4 : 0.6;
      const noise = (Math.random() - 0.5) * 0.15;
      const convergenceFactor = Math.exp(-iteration / 2500);
      const probability = Math.max(0, Math.min(1, baseProb + noise * convergenceFactor));
      
      return {
        iteration,
        playerId: 'player2',
        playerName: 'Player 2',
        strategyId: strategy.id,
        strategyName: strategy.name,
        probability,
        payoff: probability * (strategy.id === 'cooperate' ? 3 : 1),
        timestamp: Date.now() + iteration * 10
      };
    });

    series.push({
      playerId: 'player2',
      playerName: 'Player 2',
      strategyId: strategy.id,
      strategyName: strategy.name,
      color: strategy.id === 'cooperate' ? '#ef4444' : '#dc2626',
      data
    });
  }

  return {
    series,
    iterations,
    players,
    strategies,
    config: {
      scenario: {
        id: 'prisoners-dilemma',
        name: "Prisoner's Dilemma",
        description: 'Classic game theory scenario',
        type: GameType.PRISONERS_DILEMMA,
        payoffMatrix: {
          players: 2,
          strategies,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
          isSymmetric: true
        },
        players,
        tags: ['classic', 'cooperation'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      parameters: {
        iterations: 10000,
        batchSize: 1000,
        useWebWorkers: false,
        trackHistory: true,
        progressUpdateInterval: 100
      }
    }
  };
}

/**
 * Generate sample payoff distribution data
 */
export function generateSamplePayoffDistributionData(): PayoffDistributionData {
  const series = [];
  const numBins = 20;
  const range: [number, number] = [0, 5];

  // Player 1 payoff distribution
  const player1Bins = Array.from({ length: numBins }, (_, i) => {
    const binStart = range[0] + (i * (range[1] - range[0])) / numBins;
    const binEnd = range[0] + ((i + 1) * (range[1] - range[0])) / numBins;
    const binCenter = (binStart + binEnd) / 2;
    
    // Normal-ish distribution around 3
    const distance = Math.abs(binCenter - 3);
    const count = Math.max(0, 1000 - distance * 200 + Math.random() * 100);
    
    return {
      binStart,
      binEnd,
      binCenter,
      count,
      frequency: count / 10000,
      density: count / (10000 * (binEnd - binStart)),
      playerId: 'player1'
    };
  });

  series.push({
    playerId: 'player1',
    playerName: 'Player 1',
    color: '#3b82f6',
    bins: player1Bins,
    statistics: {
      mean: 2.8,
      median: 3.0,
      std: 0.8,
      min: 0,
      max: 5,
      q25: 2.2,
      q75: 3.6
    }
  });

  // Player 2 payoff distribution
  const player2Bins = Array.from({ length: numBins }, (_, i) => {
    const binStart = range[0] + (i * (range[1] - range[0])) / numBins;
    const binEnd = range[0] + ((i + 1) * (range[1] - range[0])) / numBins;
    const binCenter = (binStart + binEnd) / 2;
    
    // Slightly different distribution
    const distance = Math.abs(binCenter - 2.5);
    const count = Math.max(0, 800 - distance * 180 + Math.random() * 120);
    
    return {
      binStart,
      binEnd,
      binCenter,
      count,
      frequency: count / 10000,
      density: count / (10000 * (binEnd - binStart)),
      playerId: 'player2'
    };
  });

  series.push({
    playerId: 'player2',
    playerName: 'Player 2',
    color: '#ef4444',
    bins: player2Bins,
    statistics: {
      mean: 2.5,
      median: 2.4,
      std: 0.9,
      min: 0,
      max: 5,
      q25: 1.8,
      q75: 3.2
    }
  });

  return {
    series,
    binCount: numBins,
    range,
    overlayStatistics: true
  };
}

/**
 * Generate sample performance monitoring data
 */
export function generateSamplePerformanceData(): PerformanceData {
  const startTime = Date.now() - 60000; // 1 minute ago
  const metrics = [];

  for (let i = 0; i < 60; i++) {
    const timestamp = startTime + i * 1000;
    const progress = i / 60;
    
    // Simulate decreasing performance over time (typical of long simulations)
    const baseIterationsPerSecond = 1000 - progress * 200 + Math.random() * 100;
    const memoryUsage = 100 + progress * 150 + Math.random() * 20;
    const convergenceScore = Math.min(1, progress * 1.2 + Math.random() * 0.1);
    
    metrics.push({
      timestamp,
      iterationsPerSecond: Math.max(100, baseIterationsPerSecond),
      memoryUsage,
      convergenceScore: Math.max(0, Math.min(1, convergenceScore)),
      cpuUsage: 60 + Math.random() * 20,
      totalIterations: 10000,
      completedIterations: Math.floor(progress * 10000)
    });
  }

  return {
    metrics,
    targetIterations: 10000,
    startTime,
    estimatedCompletion: Date.now() + 30000,
    bottlenecks: ['Memory allocation', 'Strategy computation']
  };
}

/**
 * Generate sample Nash equilibrium visualization data
 */
export function generateSampleStrategySpaceData(): StrategySpaceData {
  const players: Player[] = [
    { id: 'player1', name: 'Player 1', strategyType: 'mixed', behavior: 'rational' },
    { id: 'player2', name: 'Player 2', strategyType: 'mixed', behavior: 'rational' }
  ];

  const strategies: Strategy[] = [
    { id: 'cooperate', name: 'Cooperate', description: 'Always cooperate', shortName: 'C' },
    { id: 'defect', name: 'Defect', description: 'Always defect', shortName: 'D' }
  ];

  // Nash equilibria points
  const equilibria = [
    {
      x: 0.2,
      y: 0.2,
      strategies: {
        player1: [0.2, 0.8], // 20% cooperate, 80% defect
        player2: [0.2, 0.8]
      },
      payoffs: {
        player1: 1.6,
        player2: 1.6
      },
      type: 'mixed' as const,
      stability: 0.95
    },
    {
      x: 0.0,
      y: 0.0,
      strategies: {
        player1: [0, 1], // Pure defect
        player2: [0, 1]
      },
      payoffs: {
        player1: 1,
        player2: 1
      },
      type: 'pure' as const,
      stability: 0.8
    }
  ];

  // Best response functions
  const bestResponseFunctions = [
    {
      playerId: 'player1',
      strategyIndex: 0,
      points: Array.from({ length: 21 }, (_, i) => {
        const x = i / 20;
        const y = x > 0.5 ? 1 : 0; // Step function
        return { x, y };
      }),
      color: '#3b82f6'
    },
    {
      playerId: 'player2',
      strategyIndex: 0,
      points: Array.from({ length: 21 }, (_, i) => {
        const x = i / 20;
        const y = x > 0.5 ? 1 : 0;
        return { x, y };
      }),
      color: '#ef4444'
    }
  ];

  // Dominated strategy regions
  const dominatedRegions = [
    {
      vertices: [
        { x: 0.5, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0.5 },
        { x: 0.5, y: 0.5 }
      ],
      type: 'strictly' as const
    }
  ];

  return {
    equilibria,
    bestResponseFunctions,
    dominatedRegions,
    players,
    strategies
  };
}

/**
 * Generate comprehensive test data for all visualization components
 */
export function generateSampleVisualizationData() {
  return {
    strategyEvolution: generateSampleStrategyEvolutionData(),
    payoffDistribution: generateSamplePayoffDistributionData(),
    performance: generateSamplePerformanceData(),
    strategySpace: generateSampleStrategySpaceData()
  };
} 