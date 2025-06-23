import { MixedStrategySolver } from './mixed-strategy-solver'
import { PayoffMatrix, Strategy } from './game-theory-types'

/**
 * Test suite specifically for Mixed Strategy Nash Equilibrium Solver
 */

function createPayoffMatrix(strategies: Strategy[], payoffs: number[][][], players: number = 2): PayoffMatrix {
  return {
    players,
    strategies,
    payoffs,
    isSymmetric: false
  }
}

export function testMixedStrategySolver(): void {
  const solver = new MixedStrategySolver()
  
  console.log('🎯 Testing Enhanced Mixed Strategy Nash Equilibrium Solver...\n')
  
  // Test 1: Battle of Sexes (known mixed equilibrium)
  console.log('Test 1: Battle of Sexes Mixed Equilibrium')
  testBattleOfSexesMixed(solver)
  
  // Test 2: Matching Pennies (pure mixed strategy game)
  console.log('\nTest 2: Matching Pennies Pure Mixed Strategy')
  testMatchingPenniesMixed(solver)
  
  // Test 3: Rock Paper Scissors (3x3 mixed equilibrium)
  console.log('\nTest 3: Rock Paper Scissors 3x3 Game')
  testRockPaperScissors(solver)
  
  console.log('\n✅ Mixed Strategy Solver tests completed!')
}

function testBattleOfSexesMixed(solver: MixedStrategySolver): void {
  const strategies: Strategy[] = [
    { id: 'opera', name: 'Opera', description: 'Go to opera', shortName: 'O' },
    { id: 'football', name: 'Football', description: 'Go to football', shortName: 'F' }
  ]
  
  // Battle of Sexes: Two pure equilibria + one mixed equilibrium
  const payoffs: number[][][] = [
    [[2, 1], [0, 0]], // Opera: (O,O)=(2,1), (O,F)=(0,0)
    [[0, 0], [1, 2]]  // Football: (F,O)=(0,0), (F,F)=(1,2)
  ]
  
  const payoffMatrix = createPayoffMatrix(strategies, payoffs)
  const equilibria = solver.findMixedEquilibria(payoffMatrix)
  
  console.log(`  Found ${equilibria.length} mixed equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    const mixedStrategies = eq.strategies as number[][]
    console.log(`    ${index + 1}. Strategies: Player 1: [${mixedStrategies[0].map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`                   Player 2: [${mixedStrategies[1].map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Expected Payoffs: [${eq.payoffs.map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}`)
  })
  
  // Expected: One mixed equilibrium where both players randomize
  if (equilibria.length > 0) {
    console.log('  ✅ Mixed equilibrium found for Battle of Sexes!')
  } else {
    console.log('  ❌ Expected mixed equilibrium NOT found!')
  }
}

function testMatchingPenniesMixed(solver: MixedStrategySolver): void {
  const strategies: Strategy[] = [
    { id: 'heads', name: 'Heads', description: 'Show heads', shortName: 'H' },
    { id: 'tails', name: 'Tails', description: 'Show tails', shortName: 'T' }
  ]
  
  // Matching Pennies: Zero-sum game with only mixed equilibrium
  const payoffs: number[][][] = [
    [[1, -1], [-1, 1]], // Heads: (H,H)=(1,-1), (H,T)=(-1,1)
    [[-1, 1], [1, -1]]  // Tails: (T,H)=(-1,1), (T,T)=(1,-1)
  ]
  
  const payoffMatrix = createPayoffMatrix(strategies, payoffs)
  const equilibria = solver.findMixedEquilibria(payoffMatrix)
  
  console.log(`  Found ${equilibria.length} mixed equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    const mixedStrategies = eq.strategies as number[][]
    console.log(`    ${index + 1}. Strategies: Player 1: [${mixedStrategies[0].map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`                   Player 2: [${mixedStrategies[1].map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Expected Payoffs: [${eq.payoffs.map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}`)
  })
  
  // Expected: One mixed equilibrium with (0.5, 0.5) for both players
  const hasUniformMixing = equilibria.some(eq => {
    const mixedStrats = eq.strategies as number[][]
    return Array.isArray(mixedStrats[0]) && Array.isArray(mixedStrats[1]) &&
      Math.abs(mixedStrats[0][0] - 0.5) < 0.1 &&
      Math.abs(mixedStrats[1][0] - 0.5) < 0.1
  })
  
  if (hasUniformMixing) {
    console.log('  ✅ Expected uniform mixing equilibrium found!')
  } else {
    console.log('  ❌ Expected uniform mixing equilibrium NOT found!')
  }
}

function testRockPaperScissors(solver: MixedStrategySolver): void {
  const strategies: Strategy[] = [
    { id: 'rock', name: 'Rock', description: 'Play rock', shortName: 'R' },
    { id: 'paper', name: 'Paper', description: 'Play paper', shortName: 'P' },
    { id: 'scissors', name: 'Scissors', description: 'Play scissors', shortName: 'S' }
  ]
  
  // Rock Paper Scissors: 3x3 zero-sum game
  const payoffs: number[][][] = [
    [[0, 0], [-1, 1], [1, -1]], // Rock: (R,R)=(0,0), (R,P)=(-1,1), (R,S)=(1,-1)
    [[1, -1], [0, 0], [-1, 1]], // Paper: (P,R)=(1,-1), (P,P)=(0,0), (P,S)=(-1,1)
    [[-1, 1], [1, -1], [0, 0]]  // Scissors: (S,R)=(-1,1), (S,P)=(1,-1), (S,S)=(0,0)
  ]
  
  const payoffMatrix = createPayoffMatrix(strategies, payoffs)
  const equilibria = solver.findMixedEquilibria(payoffMatrix)
  
  console.log(`  Found ${equilibria.length} mixed equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    const mixedStrategies = eq.strategies as number[][]
    console.log(`    ${index + 1}. Strategies: Player 1: [${mixedStrategies[0].map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`                   Player 2: [${mixedStrategies[1].map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Expected Payoffs: [${eq.payoffs.map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}`)
  })
  
  // Expected: One mixed equilibrium with (1/3, 1/3, 1/3) for both players
  const hasUniformMixing = equilibria.some(eq => {
    const mixedStrats = eq.strategies as number[][]
    return Array.isArray(mixedStrats[0]) && Array.isArray(mixedStrats[1]) &&
      mixedStrats[0].length === 3 && mixedStrats[1].length === 3 &&
      mixedStrats[0].every(p => Math.abs(p - 1/3) < 0.1) &&
      mixedStrats[1].every(p => Math.abs(p - 1/3) < 0.1)
  })
  
  if (hasUniformMixing) {
    console.log('  ✅ Expected uniform (1/3, 1/3, 1/3) equilibrium found!')
  } else {
    console.log('  ❌ Expected uniform (1/3, 1/3, 1/3) equilibrium NOT found!')
  }
} 