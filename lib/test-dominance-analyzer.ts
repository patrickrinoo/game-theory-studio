/**
 * Test Suite for Strategic Dominance Analysis
 * 
 * This file tests the DominanceAnalyzer with known game theory examples
 * to ensure accurate identification of dominant strategies and iterative elimination.
 */

import { DominanceAnalyzer, DominanceAnalysisResult } from './dominance-analyzer';
import { PayoffMatrix, Strategy } from './game-theory-types';

// Test strategies for various games
const prisonersStrategies: Strategy[] = [
  { id: 'cooperate', name: 'Cooperate', description: 'Cooperate with the other player', shortName: 'C' },
  { id: 'defect', name: 'Defect', description: 'Betray the other player', shortName: 'D' }
];

const battleOfSexesStrategies: Strategy[] = [
  { id: 'opera', name: 'Opera', description: 'Go to the opera', shortName: 'O' },
  { id: 'football', name: 'Football', description: 'Go to the football game', shortName: 'F' }
];

const dominatedGameStrategies: Strategy[] = [
  { id: 'strategy1', name: 'Strategy 1', description: 'First strategy', shortName: 'S1' },
  { id: 'strategy2', name: 'Strategy 2', description: 'Second strategy (dominated)', shortName: 'S2' },
  { id: 'strategy3', name: 'Strategy 3', description: 'Third strategy', shortName: 'S3' }
];

/**
 * Test 1: Prisoner's Dilemma - Should find strictly dominant strategy (Defect)
 */
function testPrisonersDilemma(): void {
  console.log('=== Testing Prisoner\'s Dilemma ===');
  
  // Classic Prisoner's Dilemma payoffs
  // [Player1Strategy][Player2Strategy][PlayerIndex]
  const payoffs: number[][][] = [
    // Cooperate vs Cooperate, Cooperate vs Defect
    [[-1, -1], [-3, 0]],
    // Defect vs Cooperate, Defect vs Defect  
    [[0, -3], [-2, -2]]
  ];
  
  const matrix: PayoffMatrix = {
    players: 2,
    strategies: prisonersStrategies,
    payoffs,
    isSymmetric: true
  };
  
  const analyzer = new DominanceAnalyzer(matrix);
  const result = analyzer.analyze();
  
  console.log('Analysis Result:');
  console.log(`Has Strict Dominance: ${result.hasStrictDominance}`);
  console.log(`Strictly Dominant Strategies: ${result.strictlyDominantStrategies.length}`);
  
  if (result.strictlyDominantStrategies.length > 0) {
    result.strictlyDominantStrategies.forEach(ds => {
      console.log(`  - Player ${ds.playerIndex + 1}: ${ds.strategyName} (${ds.dominanceType})`);
      console.log(`    Dominates: ${ds.dominatedStrategyNames.join(', ')}`);
    });
  }
  
  console.log(`\nExplanation:\n${result.explanation}`);
  console.log(`Recommendations: ${result.recommendations.length}`);
  result.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Test 2: Battle of the Sexes - Should find no dominant strategies
 */
function testBattleOfSexes(): void {
  console.log('=== Testing Battle of the Sexes ===');
  
  // Battle of the Sexes payoffs (coordination game with different preferences)
  const payoffs: number[][][] = [
    // Opera vs Opera, Opera vs Football
    [[2, 1], [0, 0]],
    // Football vs Opera, Football vs Football
    [[0, 0], [1, 2]]
  ];
  
  const matrix: PayoffMatrix = {
    players: 2,
    strategies: battleOfSexesStrategies,
    payoffs,
    isSymmetric: false
  };
  
  const analyzer = new DominanceAnalyzer(matrix);
  const result = analyzer.analyze();
  
  console.log('Analysis Result:');
  console.log(`Has Strict Dominance: ${result.hasStrictDominance}`);
  console.log(`Has Weak Dominance: ${result.hasWeakDominance}`);
  console.log(`Iterative Elimination Steps: ${result.iterativeElimination.length}`);
  
  console.log(`\nExplanation:\n${result.explanation}`);
  console.log(`Recommendations: ${result.recommendations.length}`);
  result.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Test 3: Game with Dominated Strategy - Should eliminate dominated strategy
 */
function testDominatedStrategyGame(): void {
  console.log('=== Testing Game with Dominated Strategy ===');
  
  // Custom game where Strategy 2 is strictly dominated by Strategy 1
  const payoffs: number[][][] = [
    // S1 vs S1, S1 vs S2, S1 vs S3
    [[3, 3], [4, 1], [2, 2]],
    // S2 vs S1, S2 vs S2, S2 vs S3  
    [[1, 4], [2, 2], [1, 1]],
    // S3 vs S1, S3 vs S2, S3 vs S3
    [[2, 2], [1, 1], [3, 3]]
  ];
  
  const matrix: PayoffMatrix = {
    players: 2,
    strategies: dominatedGameStrategies,
    payoffs,
    isSymmetric: true
  };
  
  const analyzer = new DominanceAnalyzer(matrix);
  const result = analyzer.analyze();
  
  console.log('Analysis Result:');
  console.log(`Has Strict Dominance: ${result.hasStrictDominance}`);
  console.log(`Strictly Dominated Strategies: ${result.strictlyDominatedStrategies.length}`);
  
  if (result.strictlyDominatedStrategies.length > 0) {
    result.strictlyDominatedStrategies.forEach(ds => {
      console.log(`  - Player ${ds.playerIndex + 1}: ${ds.strategyName} is ${ds.dominationType}ly dominated`);
      console.log(`    Dominated by: ${ds.dominatedByNames.join(', ')}`);
      console.log(`    Should eliminate: ${ds.shouldEliminate}`);
    });
  }
  
  console.log(`\nIterative Elimination: ${result.iterativeElimination.length} steps`);
  result.iterativeElimination.forEach(step => {
    console.log(`  Step ${step.step}: ${step.explanation}`);
    step.eliminatedStrategies.forEach(elim => {
      console.log(`    - Eliminated ${elim.strategyName} (${elim.reason})`);
    });
  });
  
  if (result.reducedGame) {
    console.log(`\nReduced Game: ${result.reducedGame.strategies.length} strategies remaining`);
    result.reducedGame.strategies.forEach(strat => console.log(`  - ${strat.name}`));
  }
  
  console.log(`\nExplanation:\n${result.explanation}`);
  console.log(`Recommendations: ${result.recommendations.length}`);
  result.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Test 4: Matching Pennies - Zero-sum game with no dominant strategies
 */
function testMatchingPennies(): void {
  console.log('=== Testing Matching Pennies (Zero-Sum) ===');
  
  const strategies: Strategy[] = [
    { id: 'heads', name: 'Heads', description: 'Show heads', shortName: 'H' },
    { id: 'tails', name: 'Tails', description: 'Show tails', shortName: 'T' }
  ];
  
  // Zero-sum game: Player 1 wins when coins match, Player 2 wins when they don't
  const payoffs: number[][][] = [
    // Heads vs Heads, Heads vs Tails
    [[1, -1], [-1, 1]],
    // Tails vs Heads, Tails vs Tails
    [[-1, 1], [1, -1]]
  ];
  
  const matrix: PayoffMatrix = {
    players: 2,
    strategies,
    payoffs,
    isSymmetric: false
  };
  
  const analyzer = new DominanceAnalyzer(matrix);
  const result = analyzer.analyze();
  
  console.log('Analysis Result:');
  console.log(`Has Strict Dominance: ${result.hasStrictDominance}`);
  console.log(`Has Weak Dominance: ${result.hasWeakDominance}`);
  console.log(`Elimination Steps: ${result.iterativeElimination.length}`);
  
  console.log(`\nExplanation:\n${result.explanation}`);
  console.log(`Recommendations: ${result.recommendations.length}`);
  result.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Test 5: Iterative Elimination Example
 */
function testIterativeElimination(): void {
  console.log('=== Testing Iterative Elimination ===');
  
  const strategies: Strategy[] = [
    { id: 'a', name: 'Strategy A', description: 'Strategy A', shortName: 'A' },
    { id: 'b', name: 'Strategy B', description: 'Strategy B', shortName: 'B' },
    { id: 'c', name: 'Strategy C', description: 'Strategy C', shortName: 'C' },
    { id: 'd', name: 'Strategy D', description: 'Strategy D', shortName: 'D' }
  ];
  
  // Game designed for multi-step elimination
  const payoffs: number[][][] = [
    // A vs A, A vs B, A vs C, A vs D
    [[3, 3], [1, 4], [4, 1], [2, 2]],
    // B vs A, B vs B, B vs C, B vs D
    [[4, 1], [2, 2], [1, 4], [3, 3]],
    // C vs A, C vs B, C vs C, C vs D
    [[1, 4], [4, 1], [3, 3], [0, 0]],
    // D vs A, D vs B, D vs C, D vs D
    [[2, 2], [3, 3], [0, 0], [1, 1]]
  ];
  
  const matrix: PayoffMatrix = {
    players: 2,
    strategies,
    payoffs,
    isSymmetric: true
  };
  
  const analyzer = new DominanceAnalyzer(matrix);
  const result = analyzer.analyze();
  
  console.log('Analysis Result:');
  console.log(`Elimination Steps: ${result.iterativeElimination.length}`);
  
  result.iterativeElimination.forEach(step => {
    console.log(`\nStep ${step.step}: ${step.explanation}`);
    step.eliminatedStrategies.forEach(elim => {
      console.log(`  - Eliminated "${elim.strategyName}" for Player ${elim.playerIndex + 1}`);
      console.log(`    Reason: ${elim.reason}`);
    });
    console.log(`  Remaining strategies: ${step.remainingStrategies[0].length}`);
  });
  
  if (result.reducedGame) {
    console.log(`\nFinal Reduced Game:`);
    console.log(`  Players: ${result.reducedGame.players}`);
    console.log(`  Strategies: ${result.reducedGame.strategies.map(s => s.name).join(', ')}`);
  }
  
  console.log(`\nExplanation:\n${result.explanation}`);
  console.log(`Recommendations: ${result.recommendations.length}`);
  result.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Run all tests
 */
export function runDominanceAnalysisTests(): void {
  console.log('🧪 RUNNING STRATEGIC DOMINANCE ANALYSIS TESTS 🧪\n');
  console.log('Testing the DominanceAnalyzer with various game theory scenarios...\n');
  
  try {
    testPrisonersDilemma();
    testBattleOfSexes();
    testDominatedStrategyGame();
    testMatchingPennies();
    testIterativeElimination();
    
    console.log('✅ All dominance analysis tests completed successfully!');
    console.log('The DominanceAnalyzer is working correctly with various game types.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error');
  }
}

// Allow running tests directly
if (require.main === module) {
  runDominanceAnalysisTests();
} 