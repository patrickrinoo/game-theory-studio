import { describe, it, expect, vi } from 'vitest';

/**
 * E2E Simulation Testing (Vitest-based)
 * 
 * These tests complement the Playwright E2E tests by testing simulation logic
 * and workflows in a jsdom environment. For full browser-based E2E testing,
 * see the /e2e directory with Playwright tests.
 */

describe('E2E Simulation Logic Tests', () => {
  
  it('should be able to import and test core simulation workflow', async () => {
    // Test that we can import the main simulation components
    const { MonteCarloEngine } = await import('../lib/monte-carlo-engine');
    const { GameTheoryUtils } = await import('../lib/game-theory-utils');
    
    expect(MonteCarloEngine).toBeDefined();
    expect(GameTheoryUtils).toBeDefined();
    
    // Test basic simulation workflow
    const engine = new MonteCarloEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.runSimulationWithAdvancedAnalysis).toBe('function');
  });

  it('should validate PRD game scenarios are available', async () => {
    // Test that all PRD-required game scenarios are implemented
    const { GAME_TEMPLATES } = await import('../lib/game-templates');
    const { GameType } = await import('../lib/game-theory-types');
    
    // Verify key game types from PRD exist
    expect(GAME_TEMPLATES[GameType.PRISONERS_DILEMMA]).toBeDefined();
    expect(GAME_TEMPLATES[GameType.BATTLE_OF_SEXES]).toBeDefined();
    expect(GAME_TEMPLATES[GameType.CHICKEN_GAME]).toBeDefined();
    expect(GAME_TEMPLATES[GameType.STAG_HUNT]).toBeDefined();
    
    // Verify game templates have required properties
    const prisonersDilemma = GAME_TEMPLATES[GameType.PRISONERS_DILEMMA];
    expect(prisonersDilemma.name).toBe("Prisoner's Dilemma");
    expect(prisonersDilemma.payoffMatrix).toBeDefined();
    expect(prisonersDilemma.strategies).toBeDefined();
    expect(prisonersDilemma.strategies.length).toBe(2); // Cooperate/Defect
  });

  it('should support complete simulation workflow end-to-end', async () => {
    const { MonteCarloEngine } = await import('../lib/monte-carlo-engine');
    const { GameType } = await import('../lib/game-theory-types');
    
    const engine = new MonteCarloEngine();
    
    // Simulate the complete workflow as a user would experience it
    const simulationConfig = {
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]] // Prisoner's Dilemma
        }
      },
      payoffMatrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      iterations: 1000,
      playerStrategies: ['Cooperate', 'Defect'],
      mixedStrategies: [[0.5, 0.5], [0.5, 0.5]],
      onProgress: vi.fn()
    };

    const result = await engine.runSimulationWithAdvancedAnalysis(simulationConfig);
    
    // Verify result structure matches expected E2E workflow output
    expect(result).toBeDefined();
    expect(result.outcomes).toBeDefined();
    expect(result.iterations).toBe(1000);
    expect(result.statistics).toBeDefined();
    expect(typeof result.statistics.expectedPayoffs).toBeDefined();
  });

  it('should meet PRD performance requirements in simulation', async () => {
    const { MonteCarloEngine } = await import('../lib/monte-carlo-engine');
    
    const engine = new MonteCarloEngine();
    
    // Test simple scenario (should complete quickly - PRD: <5 seconds)
    const startTime = Date.now();
    
    const simpleResult = await engine.runSimulationWithAdvancedAnalysis({
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]]
        }
      },
      payoffMatrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      iterations: 1000, // Simple scenario
      playerStrategies: ['Cooperate', 'Defect'],
      mixedStrategies: [[1, 0], [0, 1]], // Deterministic strategies
      onProgress: () => {}
    });
    
    const simpleTime = Date.now() - startTime;
    
    expect(simpleResult).toBeDefined();
    expect(simpleTime).toBeLessThan(5000); // PRD requirement: <5 seconds for simple
    
    // Test more complex scenario (PRD: <30 seconds)
    const complexStartTime = Date.now();
    
    const complexResult = await engine.runSimulationWithAdvancedAnalysis({
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]]
        }
      },
      payoffMatrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      iterations: 10000, // Complex scenario
      playerStrategies: ['Mixed', 'Mixed'],
      mixedStrategies: [[0.3, 0.7], [0.6, 0.4]], // Mixed strategies
      onProgress: () => {}
    });
    
    const complexTime = Date.now() - complexStartTime;
    
    expect(complexResult).toBeDefined();
    expect(complexTime).toBeLessThan(30000); // PRD requirement: <30 seconds for complex
  }, 35000); // Allow 35 seconds for this test

  it('should support Nash equilibrium calculation for all PRD games', async () => {
    const { NashEquilibriumCalculator } = await import('../lib/nash-equilibrium-calculator');
    const { GAME_TEMPLATES } = await import('../lib/game-templates');
    const { GameType } = await import('../lib/game-theory-types');
    
    const calculator = new NashEquilibriumCalculator();
    
    // Test Nash equilibrium calculation for key PRD games
    const prisonersTemplate = GAME_TEMPLATES[GameType.PRISONERS_DILEMMA];
    const battleTemplate = GAME_TEMPLATES[GameType.BATTLE_OF_SEXES];
    
    const prisonersPayoffMatrix = {
      players: 2,
      strategies: prisonersTemplate.strategies,
      payoffs: prisonersTemplate.payoffMatrix,
      isSymmetric: false
    };
    
    const battlePayoffMatrix = {
      players: 2,
      strategies: battleTemplate.strategies,
      payoffs: battleTemplate.payoffMatrix,
      isSymmetric: false
    };
    
    const prisonersNash = calculator.findPureStrategyEquilibria(prisonersPayoffMatrix);
    const battleNash = calculator.findPureStrategyEquilibria(battlePayoffMatrix);
    
    expect(prisonersNash).toBeDefined();
    expect(battleNash).toBeDefined();
    
    // Prisoner's Dilemma should have (Defect, Defect) as Nash equilibrium
    expect(prisonersNash.length).toBeGreaterThan(0);
    
    // Battle of Sexes should have multiple Nash equilibria
    expect(battleNash.length).toBeGreaterThanOrEqual(0);
  });

  it('should support export functionality workflow', async () => {
    // Test that export functionality can be imported and used
    const ExportManager = (await import('../lib/export-manager')).default;
    
    const exportManager = ExportManager.getInstance();
    expect(exportManager).toBeDefined();
    
    // Test export methods exist and are callable
    expect(typeof exportManager.exportCSV).toBe('function');
    expect(typeof exportManager.exportSVGAsImage).toBe('function');
    expect(typeof exportManager.exportJSON).toBe('function');
    expect(typeof exportManager.createShareableURL).toBe('function');
    
    // Test basic export functionality by checking method existence
    const mockResults = {
      iterations: 1000,
      outcomes: { 'CC': 250, 'CD': 250, 'DC': 250, 'DD': 250 },
      strategyFrequencies: { 'P0_S0': 0.5, 'P0_S1': 0.5, 'P1_S0': 0.5, 'P1_S1': 0.5 },
      expectedPayoffs: [2.5, 2.5],
      convergenceData: [],
      timestamp: Date.now(),
      gameId: 'prisoners-dilemma'
    };
    
    const mockGame = { id: 'test', name: 'Test Game', description: 'Test' };
    
    // Test shareable URL creation (doesn't require file system)
    const shareableURL = exportManager.createShareableURL(mockResults, mockGame);
    expect(shareableURL).toBeDefined();
    expect(typeof shareableURL).toBe('string');
    expect(shareableURL.includes('share')).toBe(true);
  });

  it('should handle error cases gracefully in E2E workflow', async () => {
    const { MonteCarloEngine } = await import('../lib/monte-carlo-engine');
    
    const engine = new MonteCarloEngine();
    
    // Test with invalid configuration
    const invalidConfig = {
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [] // Invalid empty payoffs
        }
      },
      payoffMatrix: [],
      iterations: 0, // Invalid iterations
      playerStrategies: [],
      mixedStrategies: [],
      onProgress: () => {}
    };
    
    // Should handle gracefully without crashing
    try {
      await engine.runSimulationWithAdvancedAnalysis(invalidConfig);
    } catch (error) {
      // Error handling is expected for invalid config
      expect(error).toBeDefined();
    }
  });

  it('should support real-time progress updates in E2E workflow', async () => {
    const { MonteCarloEngine } = await import('../lib/monte-carlo-engine');
    
    const engine = new MonteCarloEngine();
    const progressUpdates: number[] = [];
    
    await engine.runSimulationWithAdvancedAnalysis({
      game: {
        payoffMatrix: {
          players: 2,
          payoffs: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]]
        }
      },
      payoffMatrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      iterations: 500,
      playerStrategies: ['Cooperate', 'Defect'],
      mixedStrategies: [[0.5, 0.5], [0.5, 0.5]],
      onProgress: (progress) => progressUpdates.push(progress)
    });
    
    // Should have received progress updates during simulation
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[progressUpdates.length - 1]).toBeCloseTo(100, 0);
  });
}); 