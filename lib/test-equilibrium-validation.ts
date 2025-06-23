import { EquilibriumValidator, ValidationReport } from './equilibrium-validator'
import { NashEquilibriumCalculator } from './nash-equilibrium-calculator'
import { PayoffMatrix, Strategy, GameScenario, NashEquilibrium, GameType, StrategyType, PlayerBehavior } from './game-theory-types'

/**
 * Test suite for Equilibrium Validation and Analysis
 * Demonstrates comprehensive validation on various game types
 */

function createTestGameScenario(
  name: string,
  strategies: Strategy[],
  payoffs: number[][][],
  players: number = 2
): GameScenario {
  const payoffMatrix: PayoffMatrix = {
    players,
    strategies,
    payoffs,
    isSymmetric: false
  }

  return {
    id: `test-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    description: `Test scenario for ${name}`,
    type: GameType.SIMULTANEOUS,
    payoffMatrix,
    strategies: strategies.map(s => ({ 
      ...s, 
      type: StrategyType.PURE, 
      behavior: PlayerBehavior.RATIONAL 
    })),
    players: Array.from({ length: players }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      type: 'human',
      strategies: strategies.map(s => s.id)
    }))
  }
}

export function testEquilibriumValidation(): void {
  const validator = new EquilibriumValidator()
  const calculator = new NashEquilibriumCalculator()
  
  console.log('🔍 Testing Equilibrium Validation and Analysis System...\n')
  
  // Test 1: Prisoner's Dilemma (well-known equilibrium)
  console.log('Test 1: Prisoner\'s Dilemma - Classic Nash Equilibrium')
  testPrisonersDilemmaValidation(calculator, validator)
  
  // Test 2: Coordination Game (multiple equilibria)
  console.log('\nTest 2: Coordination Game - Multiple Equilibria Analysis')
  testCoordinationGameValidation(calculator, validator)
  
  // Test 3: Mixed Strategy Game (validation of mixing)
  console.log('\nTest 3: Battle of Sexes - Mixed Strategy Validation')
  testBattleOfSexesValidation(calculator, validator)
  
  // Test 4: Invalid Equilibrium (validation error detection)
  console.log('\nTest 4: Invalid Equilibrium - Error Detection')
  testInvalidEquilibriumValidation(validator)
  
  console.log('\n✅ Equilibrium validation tests completed!')
}

function testPrisonersDilemmaValidation(
  calculator: NashEquilibriumCalculator,
  validator: EquilibriumValidator
): void {
  const strategies: Strategy[] = [
    { id: 'cooperate', name: 'Cooperate', description: 'Cooperate with opponent', shortName: 'C' },
    { id: 'defect', name: 'Defect', description: 'Defect against opponent', shortName: 'D' }
  ]
  
  // Classic Prisoner's Dilemma payoffs
  const payoffs: number[][][] = [
    [[-1, -1], [-3, 0]], // Cooperate: (C,C)=(-1,-1), (C,D)=(-3,0)
    [[0, -3], [-2, -2]]  // Defect: (D,C)=(0,-3), (D,D)=(-2,-2)
  ]
  
  const scenario = createTestGameScenario('Prisoner\'s Dilemma', strategies, payoffs)
  
  // Find equilibria and validate
  const recommendedEquilibria = calculator.getRecommendedEquilibria(scenario)
  
  console.log(`  Found ${recommendedEquilibria.length} recommended equilibrium(a):`)
  
  recommendedEquilibria.forEach((result, index) => {
    const { equilibrium, validation, recommendation } = result
    
    console.log(`\n    Equilibrium ${index + 1}: ${equilibrium.type} strategy`)
    
    if (equilibrium.type === 'pure') {
      const pureStrategies = equilibrium.strategies as number[]
      console.log(`      Strategy Profile: [${pureStrategies.map(s => strategies[s].shortName).join(', ')}]`)
    }
    
    console.log(`      Valid: ${validation.isValid ? '✅' : '❌'}`)
    console.log(`      Confidence: ${(validation.confidence * 100).toFixed(1)}%`)
    console.log(`      Stability Score: ${validation.stabilityAnalysis.overall.toFixed(3)}`)
    console.log(`      Efficiency: ${(validation.qualityMetrics.efficiency * 100).toFixed(1)}%`)
    console.log(`      Social Welfare: ${validation.qualityMetrics.social_welfare.toFixed(2)}`)
    console.log(`      Risk Profile: ${validation.qualityMetrics.risk_profile}`)
    console.log(`      Recommendation: ${recommendation}`)
    
    if (validation.errors.length > 0) {
      console.log(`      Errors: ${validation.errors.length}`)
      validation.errors.forEach(error => {
        console.log(`        - ${error.message}`)
      })
    }
    
    if (validation.warnings.length > 0) {
      console.log(`      Warnings: ${validation.warnings.length}`)
      validation.warnings.forEach(warning => {
        console.log(`        - ${warning.message}`)
      })
    }
    
    if (validation.recommendations.length > 0) {
      console.log(`      Analysis Recommendations:`)
      validation.recommendations.forEach(rec => {
        console.log(`        • ${rec}`)
      })
    }
  })
  
  // Expected: (Defect, Defect) should be the Nash equilibrium
  const defectDefectEquilibrium = recommendedEquilibria.find(result => {
    const eq = result.equilibrium
    return eq.type === 'pure' && 
           Array.isArray(eq.strategies) &&
           (eq.strategies as number[]).every(s => s === 1) // Both defect (index 1)
  })
  
  if (defectDefectEquilibrium) {
    console.log('\n  ✅ Expected (Defect, Defect) equilibrium found and validated!')
  } else {
    console.log('\n  ❌ Expected (Defect, Defect) equilibrium not found')
  }
}

function testCoordinationGameValidation(
  calculator: NashEquilibriumCalculator,
  validator: EquilibriumValidator
): void {
  const strategies: Strategy[] = [
    { id: 'technology_a', name: 'Technology A', description: 'Choose technology standard A', shortName: 'A' },
    { id: 'technology_b', name: 'Technology B', description: 'Choose technology standard B', shortName: 'B' }
  ]
  
  // Coordination game - players benefit from coordinating on same technology
  const payoffs: number[][][] = [
    [[5, 5], [0, 0]], // Tech A: (A,A)=(5,5), (A,B)=(0,0)
    [[0, 0], [3, 3]]  // Tech B: (B,A)=(0,0), (B,B)=(3,3)
  ]
  
  const scenario = createTestGameScenario('Technology Coordination', strategies, payoffs)
  
  const validatedEquilibria = calculator.findValidatedEquilibria(scenario)
  
  console.log(`  Found ${validatedEquilibria.length} total equilibrium(a):`)
  
  // Analyze each equilibrium
  validatedEquilibria.forEach((result, index) => {
    const { equilibrium, validation } = result
    
    console.log(`\n    Equilibrium ${index + 1}: ${equilibrium.type} strategy`)
    
    if (equilibrium.type === 'pure') {
      const pureStrategies = equilibrium.strategies as number[]
      console.log(`      Strategy Profile: [${pureStrategies.map(s => strategies[s].shortName).join(', ')}]`)
      
      // Analyze coordination efficiency
      const isCoordinated = (pureStrategies as number[]).every(s => s === pureStrategies[0])
      if (isCoordinated) {
        console.log(`      ✅ Successful coordination on ${strategies[pureStrategies[0]].name}`)
      } else {
        console.log(`      ❌ Failed coordination`)
      }
    }
    
    console.log(`      Stability: ${validation.stabilityAnalysis.overall.toFixed(3)}`)
    console.log(`      Efficiency: ${(validation.qualityMetrics.efficiency * 100).toFixed(1)}%`)
    console.log(`      Fairness: ${(validation.qualityMetrics.fairness * 100).toFixed(1)}%`)
    
    // Highlight stability factors
    if (validation.stabilityAnalysis.riskFactors.length > 0) {
      console.log(`      Risk Factors:`)
      validation.stabilityAnalysis.riskFactors.forEach(factor => {
        console.log(`        - ${factor}`)
      })
    }
  })
  
  // Expected: Two pure strategy equilibria (A,A) and (B,B)
  const pureEquilibria = validatedEquilibria.filter(result => result.equilibrium.type === 'pure')
  console.log(`\n  Found ${pureEquilibria.length} pure strategy equilibria (expected: 2)`)
  
  if (pureEquilibria.length >= 2) {
    console.log('  ✅ Multiple coordination equilibria found as expected!')
  }
}

function testBattleOfSexesValidation(
  calculator: NashEquilibriumCalculator,
  validator: EquilibriumValidator
): void {
  const strategies: Strategy[] = [
    { id: 'opera', name: 'Opera', description: 'Go to the opera', shortName: 'O' },
    { id: 'football', name: 'Football', description: 'Go to football game', shortName: 'F' }
  ]
  
  // Battle of Sexes - coordination with conflicting preferences
  const payoffs: number[][][] = [
    [[2, 1], [0, 0]], // Opera: (O,O)=(2,1), (O,F)=(0,0)
    [[0, 0], [1, 2]]  // Football: (F,O)=(0,0), (F,F)=(1,2)
  ]
  
  const scenario = createTestGameScenario('Battle of Sexes', strategies, payoffs)
  
  // Test mixed strategy equilibrium validation specifically
  const allEquilibria = calculator.findAllNashEquilibria(scenario)
  
  console.log(`  Found ${allEquilibria.length} total equilibrium(a):`)
  
  let mixedEquilibriumFound = false
  
  allEquilibria.forEach((equilibrium, index) => {
    const validation = validator.validateEquilibrium(equilibrium, scenario.payoffMatrix)
    
    console.log(`\n    Equilibrium ${index + 1}: ${equilibrium.type} strategy`)
    
    if (equilibrium.type === 'mixed') {
      mixedEquilibriumFound = true
      const mixedStrategies = equilibrium.strategies as number[][]
      
      console.log(`      Mixed Strategy Profile:`)
      mixedStrategies.forEach((playerStrat, playerIdx) => {
        const probStr = playerStrat.map((p, stratIdx) => 
          `${strategies[stratIdx].shortName}:${p.toFixed(3)}`
        ).join(', ')
        console.log(`        Player ${playerIdx + 1}: {${probStr}}`)
      })
      
      console.log(`      Validation Details:`)
      console.log(`        Valid: ${validation.isValid ? '✅' : '❌'}`)
      console.log(`        Confidence: ${(validation.confidence * 100).toFixed(1)}%`)
      console.log(`        Complexity: ${(validation.qualityMetrics.complexity * 100).toFixed(1)}%`)
      console.log(`        Interpretability: ${(validation.qualityMetrics.interpretability * 100).toFixed(1)}%`)
      
      // Check for indifference condition violations
      const indifferenceErrors = validation.errors.filter(e => e.type === 'indifference_violation')
      if (indifferenceErrors.length === 0) {
        console.log(`        ✅ Indifference conditions satisfied`)
      } else {
        console.log(`        ❌ Indifference violations: ${indifferenceErrors.length}`)
      }
      
      // Check mixing quality
      if (validation.qualityMetrics.complexity > 0.7) {
        console.log(`        ⚠️  High complexity may make implementation difficult`)
      }
    } else {
      const pureStrategies = equilibrium.strategies as number[]
      console.log(`      Strategy Profile: [${pureStrategies.map(s => strategies[s].shortName).join(', ')}]`)
    }
    
    console.log(`      Stability: ${validation.stabilityAnalysis.overall.toFixed(3)}`)
    console.log(`      Social Welfare: ${validation.qualityMetrics.social_welfare.toFixed(2)}`)
  })
  
  if (mixedEquilibriumFound) {
    console.log('\n  ✅ Mixed strategy equilibrium found and validated!')
  } else {
    console.log('\n  ⚠️  No mixed strategy equilibrium found (may be expected for this implementation)')
  }
}

function testInvalidEquilibriumValidation(validator: EquilibriumValidator): void {
  const strategies: Strategy[] = [
    { id: 'left', name: 'Left', description: 'Choose left', shortName: 'L' },
    { id: 'right', name: 'Right', description: 'Choose right', shortName: 'R' }
  ]
  
  const payoffs: number[][][] = [
    [[1, 1], [0, 0]],
    [[0, 0], [1, 1]]
  ]
  
  const payoffMatrix: PayoffMatrix = {
    players: 2,
    strategies,
    payoffs,
    isSymmetric: true
  }
  
  // Create an intentionally invalid equilibrium
  const invalidEquilibrium: NashEquilibrium = {
    type: 'mixed',
    strategies: [[0.7, 0.4], [0.5, 0.5]], // Invalid: probabilities don't sum to 1
    payoffs: [1.2, 1.2],
    stability: 0.8,
    isStrict: false
  }
  
  console.log('  Testing validation of intentionally invalid equilibrium...')
  
  const validation = validator.validateEquilibrium(invalidEquilibrium, payoffMatrix)
  
  console.log(`    Valid: ${validation.isValid ? '✅' : '❌'}`)
  console.log(`    Confidence: ${(validation.confidence * 100).toFixed(1)}%`)
  console.log(`    Errors Found: ${validation.errors.length}`)
  
  validation.errors.forEach((error, index) => {
    console.log(`      ${index + 1}. ${error.type}: ${error.message}`)
    console.log(`         Severity: ${error.severity}`)
  })
  
  console.log(`    Warnings: ${validation.warnings.length}`)
  validation.warnings.forEach((warning, index) => {
    console.log(`      ${index + 1}. ${warning.type}: ${warning.message}`)
  })
  
  if (!validation.isValid && validation.errors.length > 0) {
    console.log('\n  ✅ Invalid equilibrium correctly detected and analyzed!')
  } else {
    console.log('\n  ❌ Validation failed to detect invalid equilibrium')
  }
}

export function demonstrateEquilibriumAnalysis(): void {
  console.log('🎯 Demonstrating Comprehensive Equilibrium Analysis...\n')
  
  const calculator = new NashEquilibriumCalculator()
  
  // Create a complex 2x2 game for demonstration
  const strategies: Strategy[] = [
    { id: 'aggressive', name: 'Aggressive', description: 'Play aggressively', shortName: 'A' },
    { id: 'conservative', name: 'Conservative', description: 'Play conservatively', shortName: 'C' }
  ]
  
  const payoffs: number[][][] = [
    [[3, 3], [0, 5]], // Aggressive: (A,A)=(3,3), (A,C)=(0,5)
    [[5, 0], [2, 2]]  // Conservative: (C,A)=(5,0), (C,C)=(2,2)
  ]
  
  const scenario = createTestGameScenario('Strategic Choice Game', strategies, payoffs)
  
  console.log('Game Setup:')
  console.log('  Players: 2')
  console.log('  Strategies: Aggressive (A), Conservative (C)')
  console.log('  Payoff Matrix:')
  console.log('        |   A   |   C   |')
  console.log('    ----|-------|-------|')
  console.log('     A  | (3,3) | (0,5) |')
  console.log('     C  | (5,0) | (2,2) |')
  console.log('')
  
  const recommendedEquilibria = calculator.getRecommendedEquilibria(scenario)
  
  console.log(`Nash Equilibria Analysis (${recommendedEquilibria.length} recommended):`)
  
  recommendedEquilibria.forEach((result, index) => {
    const { equilibrium, validation, recommendation } = result
    
    console.log(`\n  Equilibrium ${index + 1}:`)
    console.log(`    Type: ${equilibrium.type}`)
    
    if (equilibrium.type === 'pure') {
      const pureStrategies = equilibrium.strategies as number[]
      console.log(`    Strategy Profile: (${pureStrategies.map(s => strategies[s].shortName).join(', ')})`)
    } else {
      const mixedStrategies = equilibrium.strategies as number[][]
      console.log(`    Mixed Strategy Profile:`)
      mixedStrategies.forEach((playerStrat, playerIdx) => {
        const probabilities = playerStrat.map((p, stratIdx) => 
          `${strategies[stratIdx].shortName}:${(p * 100).toFixed(1)}%`
        ).join(', ')
        console.log(`      Player ${playerIdx + 1}: {${probabilities}}`)
      })
    }
    
    console.log(`    Expected Payoffs: (${equilibrium.payoffs.map(p => p.toFixed(2)).join(', ')})`)
    console.log(`    Social Welfare: ${validation.qualityMetrics.social_welfare.toFixed(2)}`)
    
    console.log(`\n    Stability Analysis:`)
    console.log(`      Overall Score: ${(validation.stabilityAnalysis.overall * 100).toFixed(1)}%`)
    console.log(`      Robustness: ${(validation.stabilityAnalysis.components.robustness * 100).toFixed(1)}%`)
    console.log(`      Convergence: ${(validation.stabilityAnalysis.components.convergence * 100).toFixed(1)}%`)
    console.log(`      Description: ${validation.stabilityAnalysis.description}`)
    
    console.log(`\n    Quality Metrics:`)
    console.log(`      Efficiency: ${(validation.qualityMetrics.efficiency * 100).toFixed(1)}%`)
    console.log(`      Fairness: ${(validation.qualityMetrics.fairness * 100).toFixed(1)}%`)
    console.log(`      Risk Profile: ${validation.qualityMetrics.risk_profile}`)
    console.log(`      Complexity: ${(validation.qualityMetrics.complexity * 100).toFixed(1)}%`)
    console.log(`      Interpretability: ${(validation.qualityMetrics.interpretability * 100).toFixed(1)}%`)
    
    console.log(`\n    Recommendation: ${recommendation}`)
    
    if (validation.recommendations.length > 0) {
      console.log(`\n    Strategic Insights:`)
      validation.recommendations.forEach(rec => {
        console.log(`      • ${rec}`)
      })
    }
  })
  
  console.log('\n✅ Comprehensive equilibrium analysis completed!')
} 