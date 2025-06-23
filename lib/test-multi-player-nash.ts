import { MultiPlayerNashSolver } from './multi-player-nash-solver'
import { PayoffMatrix, Strategy, NashEquilibrium } from './game-theory-types'

/**
 * Test suite for Multi-Player Nash Equilibrium Solver
 * Tests classic 3+ player game theory examples
 */

function createMultiPlayerPayoffMatrix(
  strategies: Strategy[], 
  payoffs: number[][][], 
  players: number
): PayoffMatrix {
  return {
    players,
    strategies,
    payoffs,
    isSymmetric: true // Most test cases will be symmetric for simplicity
  }
}

export function testMultiPlayerNashSolver(): void {
  const solver = new MultiPlayerNashSolver()
  
  console.log('🎲 Testing Multi-Player Nash Equilibrium Solver...\n')
  
  // Test 1: 3-Player Public Goods Game
  console.log('Test 1: 3-Player Public Goods Game')
  testThreePlayerPublicGoods(solver)
  
  // Test 2: 3-Player Coordination Game
  console.log('\nTest 2: 3-Player Coordination Game')  
  testThreePlayerCoordination(solver)
  
  // Test 3: 4-Player Symmetric Game
  console.log('\nTest 3: 4-Player Symmetric Game')
  testFourPlayerSymmetric(solver)
  
  console.log('\n✅ Multi-Player Nash Solver tests completed!')
}

function testThreePlayerPublicGoods(solver: MultiPlayerNashSolver): void {
  const strategies: Strategy[] = [
    { id: 'contribute', name: 'Contribute', description: 'Contribute to public good', shortName: 'C' },
    { id: 'free_ride', name: 'Free Ride', description: 'Do not contribute', shortName: 'F' }
  ]
  
  // 3-Player Public Goods Game
  // Payoff structure: benefit from public good minus individual cost
  // Each contribution costs 2, each person benefits 1.5 per contribution
  const payoffs: number[][][] = [
    [[2.5, 2.5], [1, 3]], // Contribute: (C,C)=(2.5,2.5), (C,F)=(1,3)
    [[3, 1], [0, 1.5]]    // Free Ride: (F,C)=(3,1), (F,F)=(0,1.5)
  ]
  
  const payoffMatrix = createMultiPlayerPayoffMatrix(strategies, payoffs, 3)
  const equilibria = solver.findMultiPlayerEquilibria(payoffMatrix)
  
  console.log(`  Found ${equilibria.length} equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    console.log(`    ${index + 1}. Type: ${eq.type}`)
    if (eq.type === 'pure') {
      const pureStrategies = eq.strategies as number[]
      console.log(`       Strategies: [${pureStrategies.map(s => strategies[s].shortName).join(', ')}]`)
    } else {
      const mixedStrategies = eq.strategies as number[][]
      console.log(`       Mixed Strategies:`)
      mixedStrategies.forEach((playerStrat, playerIdx) => {
        const probStr = playerStrat.map(p => p.toFixed(3)).join(', ')
        console.log(`         Player ${playerIdx + 1}: [${probStr}]`)
      })
    }
    console.log(`       Payoffs: [${eq.payoffs.map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}`)
  })
  
  // Expected: Typically one equilibrium where all players free ride (F,F,F)
  // This is the classic tragedy of the commons
  const allFreeRideEquilibrium = equilibria.find(eq => 
    eq.type === 'pure' && 
    Array.isArray(eq.strategies) &&
    (eq.strategies as number[]).every(s => s === 1) // All choose Free Ride (index 1)
  )
  
  if (allFreeRideEquilibrium) {
    console.log('  ✅ Expected "tragedy of commons" equilibrium (all free ride) found!')
  } else {
    console.log('  ⚠️  Classic "tragedy of commons" equilibrium not found (but other equilibria may exist)')
  }
}

function testThreePlayerCoordination(solver: MultiPlayerNashSolver): void {
  const strategies: Strategy[] = [
    { id: 'high', name: 'High Effort', description: 'Put in high effort', shortName: 'H' },
    { id: 'low', name: 'Low Effort', description: 'Put in low effort', shortName: 'L' }
  ]
  
  // 3-Player Coordination Game
  // Players benefit when they coordinate (all choose same strategy)
  // High effort coordination gives higher payoff but requires all to participate
  const payoffs: number[][][] = [
    [[5, 5], [0, 2]], // High: (H,H)=(5,5), (H,L)=(0,2)
    [[2, 0], [2, 2]]  // Low: (L,H)=(2,0), (L,L)=(2,2)
  ]
  
  const payoffMatrix = createMultiPlayerPayoffMatrix(strategies, payoffs, 3)
  const equilibria = solver.findMultiPlayerEquilibria(payoffMatrix)
  
  console.log(`  Found ${equilibria.length} equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    console.log(`    ${index + 1}. Type: ${eq.type}`)
    if (eq.type === 'pure') {
      const pureStrategies = eq.strategies as number[]
      console.log(`       Strategies: [${pureStrategies.map(s => strategies[s].shortName).join(', ')}]`)
    } else {
      const mixedStrategies = eq.strategies as number[][]
      console.log(`       Mixed Strategies:`)
      mixedStrategies.forEach((playerStrat, playerIdx) => {
        const probStr = playerStrat.map(p => p.toFixed(3)).join(', ')
        console.log(`         Player ${playerIdx + 1}: [${probStr}]`)
      })
    }
    console.log(`       Payoffs: [${eq.payoffs.map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}`)
  })
  
  // Expected: Two pure equilibria (H,H,H) and (L,L,L)
  const allHighEquilibrium = equilibria.find(eq => 
    eq.type === 'pure' && 
    Array.isArray(eq.strategies) &&
    (eq.strategies as number[]).every(s => s === 0) // All choose High (index 0)
  )
  
  const allLowEquilibrium = equilibria.find(eq => 
    eq.type === 'pure' && 
    Array.isArray(eq.strategies) &&
    (eq.strategies as number[]).every(s => s === 1) // All choose Low (index 1)
  )
  
  if (allHighEquilibrium && allLowEquilibrium) {
    console.log('  ✅ Expected coordination equilibria (all high, all low) found!')
  } else if (allHighEquilibrium || allLowEquilibrium) {
    console.log('  ✅ At least one coordination equilibrium found!')
  } else {
    console.log('  ⚠️  Expected coordination equilibria not found')
  }
}

function testFourPlayerSymmetric(solver: MultiPlayerNashSolver): void {
  const strategies: Strategy[] = [
    { id: 'cooperate', name: 'Cooperate', description: 'Work with others', shortName: 'C' },
    { id: 'defect', name: 'Defect', description: 'Work alone', shortName: 'D' }
  ]
  
  // 4-Player Symmetric Game
  // Simplified payoff structure for demonstration
  const payoffs: number[][][] = [
    [[3, 3], [1, 4]], // Cooperate: (C,C)=(3,3), (C,D)=(1,4)
    [[4, 1], [2, 2]]  // Defect: (D,C)=(4,1), (D,D)=(2,2)
  ]
  
  const payoffMatrix = createMultiPlayerPayoffMatrix(strategies, payoffs, 4)
  const equilibria = solver.findMultiPlayerEquilibria(payoffMatrix)
  
  console.log(`  Found ${equilibria.length} equilibrium(a):`)
  equilibria.forEach((eq, index) => {
    console.log(`    ${index + 1}. Type: ${eq.type}`)
    if (eq.type === 'pure') {
      const pureStrategies = eq.strategies as number[]
      console.log(`       Strategies: [${pureStrategies.map(s => strategies[s].shortName).join(', ')}]`)
    } else {
      const mixedStrategies = eq.strategies as number[][]
      console.log(`       Mixed Strategies:`)
      mixedStrategies.forEach((playerStrat, playerIdx) => {
        const probStr = playerStrat.map(p => p.toFixed(3)).join(', ')
        console.log(`         Player ${playerIdx + 1}: [${probStr}]`)
      })
    }
    console.log(`       Payoffs: [${eq.payoffs.map(p => p.toFixed(3)).join(', ')}]`)
    console.log(`       Stability: ${eq.stability.toFixed(3)}`)
  })
  
  // Expected: Likely equilibrium where all players defect (D,D,D,D)
  const allDefectEquilibrium = equilibria.find(eq => 
    eq.type === 'pure' && 
    Array.isArray(eq.strategies) &&
    (eq.strategies as number[]).every(s => s === 1) // All choose Defect (index 1)
  )
  
  if (allDefectEquilibrium) {
    console.log('  ✅ Expected all-defect equilibrium found in 4-player game!')
  } else {
    console.log('  ⚠️  All-defect equilibrium not found (other equilibria may exist)')
  }
  
  // Check if there are any mixed strategy equilibria
  const mixedEquilibria = equilibria.filter(eq => eq.type === 'mixed')
  if (mixedEquilibria.length > 0) {
    console.log(`  ✅ Found ${mixedEquilibria.length} mixed strategy equilibrium(a) in 4-player game!`)
  }
}

// Test utility function to demonstrate comprehensive Nash equilibrium calculation
export function demonstrateMultiPlayerNash(): void {
  console.log('🎯 Demonstrating Multi-Player Nash Equilibrium Capabilities...\n')
  
  const solver = new MultiPlayerNashSolver()
  
  // Create a simple 3-player symmetric game
  const strategies: Strategy[] = [
    { id: 'a', name: 'Strategy A', description: 'First strategy', shortName: 'A' },
    { id: 'b', name: 'Strategy B', description: 'Second strategy', shortName: 'B' }
  ]
  
  const payoffs: number[][][] = [
    [[3, 3], [0, 4]], 
    [[4, 0], [1, 1]]
  ]
  
  const payoffMatrix = createMultiPlayerPayoffMatrix(strategies, payoffs, 3)
  
  console.log('Game Setup:')
  console.log('  Players: 3')
  console.log('  Strategies: A, B')
  console.log('  Payoff Matrix (simplified representation):')
  console.log('    (A,A) → (3,3)  |  (A,B) → (0,4)')
  console.log('    (B,A) → (4,0)  |  (B,B) → (1,1)')
  console.log('    Game Type: Symmetric\n')
  
  const equilibria = solver.findMultiPlayerEquilibria(payoffMatrix)
  
  console.log('Nash Equilibria Found:')
  if (equilibria.length === 0) {
    console.log('  No equilibria found (this may indicate limitations in the search algorithm)')
  } else {
    equilibria.forEach((eq, index) => {
      console.log(`\n  Equilibrium ${index + 1}:`)
      console.log(`    Type: ${eq.type}`)
      console.log(`    Strict: ${eq.isStrict ? 'Yes' : 'No'}`)
      console.log(`    Stability Score: ${eq.stability.toFixed(3)}`)
      
      if (eq.type === 'pure') {
        const pureStrategies = eq.strategies as number[]
        console.log(`    Strategy Profile: [${pureStrategies.map(s => strategies[s].shortName).join(', ')}]`)
      } else {
        const mixedStrategies = eq.strategies as number[][]
        console.log(`    Mixed Strategy Profile:`)
        mixedStrategies.forEach((playerStrat, playerIdx) => {
          const probabilities = playerStrat.map((p, stratIdx) => 
            `${strategies[stratIdx].shortName}:${p.toFixed(3)}`
          ).join(', ')
          console.log(`      Player ${playerIdx + 1}: {${probabilities}}`)
        })
      }
      
      console.log(`    Expected Payoffs: [${eq.payoffs.map(p => p.toFixed(3)).join(', ')}]`)
      
      // Interpretation
      if (eq.type === 'pure') {
        const allSame = (eq.strategies as number[]).every(s => s === (eq.strategies as number[])[0])
        if (allSame) {
          console.log(`    Interpretation: All players coordinate on strategy ${strategies[(eq.strategies as number[])[0]].name}`)
        } else {
          console.log(`    Interpretation: Players use different strategies (asymmetric equilibrium)`)
        }
      } else {
        console.log(`    Interpretation: Players randomize between strategies (mixed equilibrium)`)
      }
    })
  }
  
  console.log('\n✅ Multi-Player Nash demonstration completed!')
} 