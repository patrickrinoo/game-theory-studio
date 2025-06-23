import { NashEquilibriumCalculator } from './nash-equilibrium-calculator'
import { GameScenario, PayoffMatrix, Strategy, GameType, StrategyType, PlayerBehavior } from './game-theory-types'

/**
 * Test suite for Nash Equilibrium Calculator
 * Uses well-known game theory examples with verified equilibria
 */

// Test helper function to create a game scenario
function createGameScenario(
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
    type: GameType.CUSTOM,
    payoffMatrix,
    players: [],
    difficulty: 'intermediate',
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// Test the Nash equilibrium calculator
export function testNashEquilibriumCalculator(): void {
  const calculator = new NashEquilibriumCalculator()
  
  console.log('🧪 Running Nash Equilibrium Calculator Tests...\n')
  
  // Test 1: Prisoner's Dilemma (Classic example with one pure Nash equilibrium)
  console.log('Test 1: Prisoner\'s Dilemma')
  testPrisonersDilemma(calculator)
  
  // Test 2: Battle of Sexes (Example with multiple pure Nash equilibria)
  console.log('\nTest 2: Battle of Sexes')
  testBattleOfSexes(calculator)
  
  // Test 3: Matching Pennies (Example with only mixed Nash equilibrium)
  console.log('\nTest 3: Matching Pennies')
  testMatchingPennies(calculator)
  
  // Test 4: Coordination Game (Example with multiple equilibria)
  console.log('\nTest 4: Coordination Game')
  testCoordinationGame(calculator)
  
  // Test 5: Chicken Game (Example with mixed equilibrium)
  console.log('\nTest 5: Chicken Game')
  testChickenGame(calculator)
  
  console.log('\n✅ All Nash Equilibrium Calculator tests completed!')
}

function testPrisonersDilemma(calculator: NashEquilibriumCalculator): void {
  const strategies: Strategy[] = [
    { id: 'cooperate', name: 'Cooperate', description: 'Work together', shortName: 'C' },
    { id: 'defect', name: 'Defect', description: 'Betray the other', shortName: 'D' }
  ]
  
  // Classic Prisoner's Dilemma payoff matrix
  // Format: [strategy1][strategy2][player] where player 0 = row, player 1 = column
  const payoffs: number[][][] = [
    [[3, 3], [0, 5]], // Cooperate: (C,C)=(3,3), (C,D)=(0,5)
    [[5, 0], [1, 1]]  // Defect: (D,C)=(5,0), (D,D)=(1,1)
  ]
  
  const scenario = createGameScenario('Prisoner\'s Dilemma', strategies, payoffs)
  const equilibria = calculator.findAllNashEquilibria(scenario)
  
  console.log(`  Found ${equilibria.length} equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    console.log(`    ${index + 1}. ${eq.type} strategy: ${JSON.stringify(eq.strategies)}`)
    console.log(`       Payoffs: [${eq.payoffs.join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}, Strict: ${eq.isStrict}`)
  })
  
  // Expected: One pure Nash equilibrium at (Defect, Defect) = (1, 1)
  const expectedEquilibrium = equilibria.find(eq => 
    eq.type === 'pure' && 
    Array.isArray(eq.strategies) && 
    eq.strategies[0] === 1 && 
    eq.strategies[1] === 1
  )
  
  if (expectedEquilibrium) {
    console.log('  ✅ Expected pure Nash equilibrium (Defect, Defect) found!')
  } else {
    console.log('  ❌ Expected pure Nash equilibrium (Defect, Defect) NOT found!')
  }
}

function testBattleOfSexes(calculator: NashEquilibriumCalculator): void {
  const strategies: Strategy[] = [
    { id: 'opera', name: 'Opera', description: 'Go to opera', shortName: 'O' },
    { id: 'football', name: 'Football', description: 'Go to football', shortName: 'F' }
  ]
  
  // Battle of Sexes payoff matrix
  const payoffs: number[][][] = [
    [[2, 1], [0, 0]], // Opera: (O,O)=(2,1), (O,F)=(0,0)
    [[0, 0], [1, 2]]  // Football: (F,O)=(0,0), (F,F)=(1,2)
  ]
  
  const scenario = createGameScenario('Battle of Sexes', strategies, payoffs)
  const equilibria = calculator.findAllNashEquilibria(scenario)
  
  console.log(`  Found ${equilibria.length} equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    console.log(`    ${index + 1}. ${eq.type} strategy: ${JSON.stringify(eq.strategies)}`)
    console.log(`       Payoffs: [${eq.payoffs.join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}, Strict: ${eq.isStrict}`)
  })
  
  // Expected: Two pure Nash equilibria (Opera, Opera) and (Football, Football)
  // Plus potentially one mixed strategy equilibrium
  const pureEquilibria = equilibria.filter(eq => eq.type === 'pure')
  
  if (pureEquilibria.length >= 2) {
    console.log('  ✅ Expected multiple pure Nash equilibria found!')
  } else {
    console.log('  ❌ Expected multiple pure Nash equilibria NOT found!')
  }
}

function testMatchingPennies(calculator: NashEquilibriumCalculator): void {
  const strategies: Strategy[] = [
    { id: 'heads', name: 'Heads', description: 'Show heads', shortName: 'H' },
    { id: 'tails', name: 'Tails', description: 'Show tails', shortName: 'T' }
  ]
  
  // Matching Pennies (zero-sum game with no pure Nash equilibrium)
  const payoffs: number[][][] = [
    [[1, -1], [-1, 1]], // Heads: (H,H)=(1,-1), (H,T)=(-1,1)
    [[-1, 1], [1, -1]]  // Tails: (T,H)=(-1,1), (T,T)=(1,-1)
  ]
  
  const scenario = createGameScenario('Matching Pennies', strategies, payoffs)
  const equilibria = calculator.findAllNashEquilibria(scenario)
  
  console.log(`  Found ${equilibria.length} equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    console.log(`    ${index + 1}. ${eq.type} strategy: ${JSON.stringify(eq.strategies)}`)
    console.log(`       Payoffs: [${eq.payoffs.join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}, Strict: ${eq.isStrict}`)
  })
  
  // Expected: No pure Nash equilibria, one mixed strategy equilibrium (0.5, 0.5) for both players
  const pureEquilibria = equilibria.filter(eq => eq.type === 'pure')
  const mixedEquilibria = equilibria.filter(eq => eq.type === 'mixed')
  
  if (pureEquilibria.length === 0 && mixedEquilibria.length > 0) {
    console.log('  ✅ Expected no pure equilibria and at least one mixed equilibrium found!')
  } else {
    console.log('  ❌ Unexpected equilibrium configuration!')
  }
}

function testCoordinationGame(calculator: NashEquilibriumCalculator): void {
  const strategies: Strategy[] = [
    { id: 'cooperate', name: 'Cooperate', description: 'Work together', shortName: 'C' },
    { id: 'defect', name: 'Defect', description: 'Work alone', shortName: 'D' }
  ]
  
  // Pure coordination game
  const payoffs: number[][][] = [
    [[3, 3], [0, 0]], // Cooperate: (C,C)=(3,3), (C,D)=(0,0)
    [[0, 0], [2, 2]]  // Defect: (D,C)=(0,0), (D,D)=(2,2)
  ]
  
  const scenario = createGameScenario('Coordination Game', strategies, payoffs)
  const equilibria = calculator.findAllNashEquilibria(scenario)
  
  console.log(`  Found ${equilibria.length} equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    console.log(`    ${index + 1}. ${eq.type} strategy: ${JSON.stringify(eq.strategies)}`)
    console.log(`       Payoffs: [${eq.payoffs.join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}, Strict: ${eq.isStrict}`)
  })
  
  // Expected: Two pure Nash equilibria (Cooperate, Cooperate) and (Defect, Defect)
  const pureEquilibria = equilibria.filter(eq => eq.type === 'pure')
  
  if (pureEquilibria.length >= 2) {
    console.log('  ✅ Expected multiple pure Nash equilibria found!')
  } else {
    console.log('  ❌ Expected multiple pure Nash equilibria NOT found!')
  }
}

function testChickenGame(calculator: NashEquilibriumCalculator): void {
  const strategies: Strategy[] = [
    { id: 'swerve', name: 'Swerve', description: 'Avoid collision', shortName: 'S' },
    { id: 'straight', name: 'Straight', description: 'Keep going', shortName: 'St' }
  ]
  
  // Chicken Game payoff matrix
  const payoffs: number[][][] = [
    [[0, 0], [-1, 1]], // Swerve: (S,S)=(0,0), (S,St)=(-1,1)
    [[1, -1], [-10, -10]]  // Straight: (St,S)=(1,-1), (St,St)=(-10,-10)
  ]
  
  const scenario = createGameScenario('Chicken Game', strategies, payoffs)
  const equilibria = calculator.findAllNashEquilibria(scenario)
  
  console.log(`  Found ${equilibria.length} equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    console.log(`    ${index + 1}. ${eq.type} strategy: ${JSON.stringify(eq.strategies)}`)
    console.log(`       Payoffs: [${eq.payoffs.join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}, Strict: ${eq.isStrict}`)
  })
  
  // Expected: Two pure Nash equilibria (Swerve, Straight) and (Straight, Swerve)
  // Plus potentially one mixed strategy equilibrium
  const pureEquilibria = equilibria.filter(eq => eq.type === 'pure')
  
  if (pureEquilibria.length >= 2) {
    console.log('  ✅ Expected multiple equilibria found!')
  } else {
    console.log('  ❌ Expected multiple equilibria NOT found!')
  }
}

// Run the tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  testNashEquilibriumCalculator()
} 