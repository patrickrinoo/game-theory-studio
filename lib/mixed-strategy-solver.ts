import { PayoffMatrix, NashEquilibrium } from './game-theory-types'

/**
 * Advanced Mixed Strategy Nash Equilibrium Solver
 * Implements various algorithms for finding mixed strategy equilibria
 */
export class MixedStrategySolver {
  private tolerance = 1e-8
  private maxIterations = 1000

  /**
   * Find mixed strategy Nash equilibria using multiple approaches
   */
  findMixedEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    const equilibria: NashEquilibrium[] = []

    if (payoffMatrix.players !== 2) {
      // For n-player games (n > 2), the problem becomes much more complex
      // We'll implement a simplified approach for now
      return this.findNPlayerMixedEquilibria(payoffMatrix)
    }

    const numStrategies = payoffMatrix.strategies.length

    if (numStrategies === 2) {
      // For 2x2 games, use analytical solution
      const equilibrium = this.solve2x2Analytical(payoffMatrix)
      if (equilibrium) equilibria.push(equilibrium)
    } else {
      // For larger 2-player games, use support enumeration
      const supportEquilibria = this.solveBySupportEnumeration(payoffMatrix)
      equilibria.push(...supportEquilibria)
    }

    return equilibria
  }

  /**
   * Analytical solution for 2x2 games
   */
  private solve2x2Analytical(payoffMatrix: PayoffMatrix): NashEquilibrium | null {
    const matrix = payoffMatrix.payoffs

    // Payoff matrix notation: matrix[row][col][player]
    // Player 1 payoffs: matrix[i][j][0]
    // Player 2 payoffs: matrix[i][j][1]

    const p1_s1_s1 = matrix[0][0][0] // Player 1's payoff: (Strategy 1, Strategy 1)
    const p1_s1_s2 = matrix[0][1][0] // Player 1's payoff: (Strategy 1, Strategy 2)
    const p1_s2_s1 = matrix[1][0][0] // Player 1's payoff: (Strategy 2, Strategy 1)
    const p1_s2_s2 = matrix[1][1][0] // Player 1's payoff: (Strategy 2, Strategy 2)

    const p2_s1_s1 = matrix[0][0][1] // Player 2's payoff: (Strategy 1, Strategy 1)
    const p2_s1_s2 = matrix[0][1][1] // Player 2's payoff: (Strategy 1, Strategy 2)
    const p2_s2_s1 = matrix[1][0][1] // Player 2's payoff: (Strategy 2, Strategy 1)
    const p2_s2_s2 = matrix[1][1][1] // Player 2's payoff: (Strategy 2, Strategy 2)

    // For Player 1 to be indifferent between strategies:
    // q * p1_s1_s1 + (1-q) * p1_s1_s2 = q * p1_s2_s1 + (1-q) * p1_s2_s2
    // Solving for q (Player 2's probability of playing strategy 1):
    const denominator_q = (p1_s1_s1 - p1_s1_s2) - (p1_s2_s1 - p1_s2_s2)
    
    // For Player 2 to be indifferent between strategies:
    // p * p2_s1_s1 + (1-p) * p2_s2_s1 = p * p2_s1_s2 + (1-p) * p2_s2_s2
    // Solving for p (Player 1's probability of playing strategy 1):
    const denominator_p = (p2_s1_s1 - p2_s2_s1) - (p2_s1_s2 - p2_s2_s2)

    // Check if mixed equilibrium exists
    if (Math.abs(denominator_q) < this.tolerance || Math.abs(denominator_p) < this.tolerance) {
      return null // No interior mixed equilibrium
    }

    const q = (p1_s2_s2 - p1_s1_s2) / denominator_q
    const p = (p2_s2_s2 - p2_s2_s1) / denominator_p

    // Validate that probabilities are in [0,1]
    if (p >= 0 && p <= 1 && q >= 0 && q <= 1) {
      const mixedStrategies = [[p, 1-p], [q, 1-q]]
      const expectedPayoffs = this.calculateExpectedPayoffs(payoffMatrix, mixedStrategies)

      return {
        type: 'mixed',
        strategies: mixedStrategies,
        payoffs: expectedPayoffs,
        stability: this.calculateMixedStability(mixedStrategies),
        isStrict: false
      }
    }

    return null
  }

  /**
   * Support enumeration for larger 2-player games
   */
  private solveBySupportEnumeration(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    const equilibria: NashEquilibrium[] = []
    const numStrategies = payoffMatrix.strategies.length

    // Try different support sizes (number of strategies in mixed equilibrium)
    for (let supportSize = 2; supportSize <= Math.min(numStrategies, 4); supportSize++) {
      const supportEquilibria = this.findEquilibriaWithSupportSize(payoffMatrix, supportSize)
      equilibria.push(...supportEquilibria)
    }

    return equilibria
  }

  /**
   * Find equilibria with a specific support size
   */
  private findEquilibriaWithSupportSize(payoffMatrix: PayoffMatrix, supportSize: number): NashEquilibrium[] {
    const equilibria: NashEquilibrium[] = []
    const numStrategies = payoffMatrix.strategies.length

    // Generate all possible support combinations
    const supportCombinations = this.generateCombinations(numStrategies, supportSize)

    for (const p1Support of supportCombinations) {
      for (const p2Support of supportCombinations) {
        const equilibrium = this.solveForSupports(payoffMatrix, p1Support, p2Support)
        if (equilibrium) {
          equilibria.push(equilibrium)
        }
      }
    }

    return equilibria
  }

  /**
   * Solve for equilibrium given specific supports for both players
   */
  private solveForSupports(
    payoffMatrix: PayoffMatrix, 
    p1Support: number[], 
    p2Support: number[]
  ): NashEquilibrium | null {
    try {
      // Set up system of linear equations
      const p1Probs = this.solveMixedStrategyProbabilities(payoffMatrix, p1Support, p2Support, 0)
      const p2Probs = this.solveMixedStrategyProbabilities(payoffMatrix, p2Support, p1Support, 1)

      if (!p1Probs || !p2Probs) return null

      // Verify the solution
      if (this.verifyMixedEquilibrium(payoffMatrix, [p1Probs, p2Probs])) {
        const expectedPayoffs = this.calculateExpectedPayoffs(payoffMatrix, [p1Probs, p2Probs])
        
        return {
          type: 'mixed',
          strategies: [p1Probs, p2Probs],
          payoffs: expectedPayoffs,
          stability: this.calculateMixedStability([p1Probs, p2Probs]),
          isStrict: false
        }
      }
    } catch (error) {
      // Linear system might be singular or inconsistent
      return null
    }

    return null
  }

  /**
   * Solve for mixed strategy probabilities given supports
   */
  private solveMixedStrategyProbabilities(
    payoffMatrix: PayoffMatrix,
    playerSupport: number[],
    opponentSupport: number[],
    playerIndex: number
  ): number[] | null {
    const numStrategies = payoffMatrix.strategies.length
    const supportSize = playerSupport.length

    // Create system of equations: A * x = b
    // Where x is the vector of probabilities for strategies in support
    const A: number[][] = []
    const b: number[] = []

    // Indifference conditions: all strategies in support must yield equal payoff
    for (let i = 1; i < supportSize; i++) {
      const row: number[] = new Array(supportSize).fill(0)
      
      for (let j = 0; j < supportSize; j++) {
        // Difference in expected payoffs between strategy playerSupport[0] and playerSupport[i]
        const payoffDiff = this.getExpectedPayoffDifference(
          payoffMatrix,
          playerSupport[0],
          playerSupport[i],
          opponentSupport,
          playerIndex
        )
        row[j] = payoffDiff
      }
      
      A.push(row)
      b.push(0) // Equal payoffs means difference is 0
    }

    // Probability constraint: sum of probabilities = 1
    A.push(new Array(supportSize).fill(1))
    b.push(1)

    // Solve the linear system
    const solution = this.solveLinearSystem(A, b)
    if (!solution) return null

    // Check if solution is valid (all probabilities non-negative)
    if (solution.some(prob => prob < -this.tolerance)) return null

    // Construct full probability vector
    const fullProbs = new Array(numStrategies).fill(0)
    for (let i = 0; i < supportSize; i++) {
      fullProbs[playerSupport[i]] = Math.max(0, solution[i])
    }

    // Normalize to ensure probabilities sum to 1
    const sum = fullProbs.reduce((acc, prob) => acc + prob, 0)
    if (Math.abs(sum - 1) > this.tolerance) {
      return fullProbs.map(prob => prob / sum)
    }

    return fullProbs
  }

  /**
   * Calculate expected payoff difference between two strategies
   */
  private getExpectedPayoffDifference(
    payoffMatrix: PayoffMatrix,
    strategy1: number,
    strategy2: number,
    opponentSupport: number[],
    playerIndex: number
  ): number {
    let diff = 0

    for (const opponentStrategy of opponentSupport) {
      const payoff1 = playerIndex === 0 
        ? payoffMatrix.payoffs[strategy1][opponentStrategy][playerIndex]
        : payoffMatrix.payoffs[opponentStrategy][strategy1][playerIndex]
      
      const payoff2 = playerIndex === 0
        ? payoffMatrix.payoffs[strategy2][opponentStrategy][playerIndex]
        : payoffMatrix.payoffs[opponentStrategy][strategy2][playerIndex]

      diff += payoff1 - payoff2
    }

    return diff
  }

  /**
   * Simple linear system solver using Gaussian elimination
   */
  private solveLinearSystem(A: number[][], b: number[]): number[] | null {
    const n = A.length
    const m = A[0].length

    if (n !== b.length || n > m) return null

    // Augmented matrix
    const augmented = A.map((row, i) => [...row, b[i]])

    // Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k
        }
      }

      // Swap rows
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]

      // Check for singular matrix
      if (Math.abs(augmented[i][i]) < this.tolerance) return null

      // Eliminate column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i]
        for (let j = i; j <= m; j++) {
          augmented[k][j] -= factor * augmented[i][j]
        }
      }
    }

    // Back substitution
    const solution = new Array(m).fill(0)
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][m]
      for (let j = i + 1; j < m; j++) {
        solution[i] -= augmented[i][j] * solution[j]
      }
      solution[i] /= augmented[i][i]
    }

    return solution.slice(0, n)
  }

  /**
   * Generate all combinations of k elements from n
   */
  private generateCombinations(n: number, k: number): number[][] {
    const combinations: number[][] = []

    function backtrack(start: number, current: number[]) {
      if (current.length === k) {
        combinations.push([...current])
        return
      }

      for (let i = start; i < n; i++) {
        current.push(i)
        backtrack(i + 1, current)
        current.pop()
      }
    }

    backtrack(0, [])
    return combinations
  }

  /**
   * Calculate expected payoffs for mixed strategies
   */
  private calculateExpectedPayoffs(payoffMatrix: PayoffMatrix, strategies: number[][]): number[] {
    const numPlayers = payoffMatrix.players
    const expectedPayoffs = new Array(numPlayers).fill(0)

    for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
      for (let i = 0; i < payoffMatrix.strategies.length; i++) {
        for (let j = 0; j < payoffMatrix.strategies.length; j++) {
          const probability = strategies[0][i] * strategies[1][j]
          const payoff = payoffMatrix.payoffs[i][j][playerIndex]
          expectedPayoffs[playerIndex] += probability * payoff
        }
      }
    }

    return expectedPayoffs
  }

  /**
   * Verify that a mixed strategy profile is a Nash equilibrium
   */
  private verifyMixedEquilibrium(payoffMatrix: PayoffMatrix, strategies: number[][]): boolean {
    const tolerance = this.tolerance

    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      const playerStrategy = strategies[playerIndex]
      
      // Calculate expected payoffs for each pure strategy
      const expectedPayoffs: number[] = []
      
      for (let strategyIndex = 0; strategyIndex < payoffMatrix.strategies.length; strategyIndex++) {
        let expectedPayoff = 0
        
        for (let opponentStrategy = 0; opponentStrategy < payoffMatrix.strategies.length; opponentStrategy++) {
          const opponentProb = strategies[1 - playerIndex][opponentStrategy]
          const payoff = playerIndex === 0
            ? payoffMatrix.payoffs[strategyIndex][opponentStrategy][playerIndex]
            : payoffMatrix.payoffs[opponentStrategy][strategyIndex][playerIndex]
          
          expectedPayoff += opponentProb * payoff
        }
        
        expectedPayoffs.push(expectedPayoff)
      }

      // Check indifference condition: all strategies in support must yield equal payoffs
      const supportStrategies = playerStrategy
        .map((prob, idx) => prob > tolerance ? idx : -1)
        .filter(idx => idx >= 0)

      if (supportStrategies.length > 1) {
        const firstPayoff = expectedPayoffs[supportStrategies[0]]
        for (let i = 1; i < supportStrategies.length; i++) {
          if (Math.abs(expectedPayoffs[supportStrategies[i]] - firstPayoff) > tolerance) {
            return false
          }
        }
      }

      // Check that strategies outside support don't yield higher payoffs
      const maxSupportPayoff = Math.max(...supportStrategies.map(idx => expectedPayoffs[idx]))
      for (let strategyIndex = 0; strategyIndex < payoffMatrix.strategies.length; strategyIndex++) {
        if (playerStrategy[strategyIndex] <= tolerance) { // Not in support
          if (expectedPayoffs[strategyIndex] > maxSupportPayoff + tolerance) {
            return false
          }
        }
      }
    }

    return true
  }

  /**
   * Calculate stability measure for mixed equilibrium
   */
  private calculateMixedStability(strategies: number[][]): number {
    // Stability decreases with the number of strategies in support
    // More mixed equilibria are generally less stable
    const support1Size = strategies[0].filter(prob => prob > this.tolerance).length
    const support2Size = strategies[1].filter(prob => prob > this.tolerance).length
    
    const avgSupportSize = (support1Size + support2Size) / 2
    const maxSupportSize = strategies[0].length
    
    // Normalize to [0, 1] where 1 is most stable (pure strategy)
    return Math.max(0, 1 - (avgSupportSize - 1) / (maxSupportSize - 1))
  }

  /**
   * Simplified approach for n-player mixed equilibria
   */
  private findNPlayerMixedEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    // For n-player games, finding mixed equilibria is computationally complex
    // We implement a simple check for symmetric equilibria only
    
    const numStrategies = payoffMatrix.strategies.length
    const uniformProbs = Array(numStrategies).fill(1 / numStrategies)
    
    // Check if uniform mixing is an equilibrium
    const allPlayersUniform = Array(payoffMatrix.players).fill(uniformProbs)
    
    if (this.verifyNPlayerMixedEquilibrium(payoffMatrix, allPlayersUniform)) {
      const expectedPayoffs = this.calculateNPlayerExpectedPayoffs(payoffMatrix, allPlayersUniform)
      
      return [{
        type: 'mixed',
        strategies: allPlayersUniform,
        payoffs: expectedPayoffs,
        stability: 0.3, // Lower stability for n-player mixed equilibria
        isStrict: false
      }]
    }

    return []
  }

  /**
   * Verify mixed equilibrium for n-player games
   */
  private verifyNPlayerMixedEquilibrium(payoffMatrix: PayoffMatrix, strategies: number[][]): boolean {
    // Simplified verification for symmetric games
    const tolerance = this.tolerance
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      const playerStrategy = strategies[playerIndex]
      
      // Check if all strategies yield approximately equal payoffs
      const expectedPayoffs: number[] = []
      
      for (let strategyIndex = 0; strategyIndex < payoffMatrix.strategies.length; strategyIndex++) {
        const expectedPayoff = this.calculateNPlayerStrategyPayoff(
          payoffMatrix, strategies, playerIndex, strategyIndex
        )
        expectedPayoffs.push(expectedPayoff)
      }
      
      // For uniform mixing, all strategies should yield equal payoffs
      const avgPayoff = expectedPayoffs.reduce((sum, p) => sum + p, 0) / expectedPayoffs.length
      
      for (const payoff of expectedPayoffs) {
        if (Math.abs(payoff - avgPayoff) > tolerance * 10) { // Relaxed tolerance for n-player
          return false
        }
      }
    }
    
    return true
  }

  /**
   * Calculate expected payoff for a strategy in n-player game
   */
  private calculateNPlayerStrategyPayoff(
    payoffMatrix: PayoffMatrix,
    strategies: number[][],
    playerIndex: number,
    strategyIndex: number
  ): number {
    // Simplified calculation assuming symmetric game structure
    let expectedPayoff = 0
    const otherPlayers = strategies.filter((_, idx) => idx !== playerIndex)
    
    // For simplicity, average the opponent strategies
    const avgOpponentStrategy = otherPlayers.reduce((acc, playerStrat) => {
      return playerStrat.map((prob, idx) => acc[idx] + prob / otherPlayers.length)
    }, new Array(payoffMatrix.strategies.length).fill(0))
    
    // Use 2-player payoff structure as approximation
    for (let opponentStrategyIdx = 0; opponentStrategyIdx < payoffMatrix.strategies.length; opponentStrategyIdx++) {
      const probability = avgOpponentStrategy[opponentStrategyIdx]
      const payoff = payoffMatrix.payoffs[strategyIndex][opponentStrategyIdx][Math.min(playerIndex, 1)]
      expectedPayoff += probability * payoff
    }
    
    return expectedPayoff
  }

  /**
   * Calculate expected payoffs for n-player mixed strategies
   */
  private calculateNPlayerExpectedPayoffs(payoffMatrix: PayoffMatrix, strategies: number[][]): number[] {
    const expectedPayoffs: number[] = []
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      let payoff = 0
      
      for (let strategyIndex = 0; strategyIndex < payoffMatrix.strategies.length; strategyIndex++) {
        const strategyProb = strategies[playerIndex][strategyIndex]
        const strategyPayoff = this.calculateNPlayerStrategyPayoff(
          payoffMatrix, strategies, playerIndex, strategyIndex
        )
        payoff += strategyProb * strategyPayoff
      }
      
      expectedPayoffs.push(payoff)
    }
    
    return expectedPayoffs
  }
} 