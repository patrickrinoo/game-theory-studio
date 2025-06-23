import { 
  GameScenario, 
  PayoffMatrix, 
  Player, 
  NashEquilibrium, 
  DominantStrategy, 
  ValidationResult,
  ValidationError,
  SimulationStatistics,
  ConfidenceInterval,
  StrategyType,
  GameType
} from './game-theory-types'
import { NashEquilibriumCalculator } from './nash-equilibrium-calculator'

export class GameTheoryUtils {
  private nashCalculator: NashEquilibriumCalculator

  constructor() {
    this.nashCalculator = new NashEquilibriumCalculator()
  }

  /**
   * Find Nash equilibria for a given game scenario (Enhanced version)
   */
  findNashEquilibria(scenario: GameScenario): NashEquilibrium[] {
    // Use the enhanced Nash equilibrium calculator
    return this.nashCalculator.findAllNashEquilibria(scenario)
  }

  /**
   * Find validated Nash equilibria with comprehensive analysis
   */
  findValidatedNashEquilibria(scenario: GameScenario): Array<{
    equilibrium: NashEquilibrium
    validation: any
  }> {
    return this.nashCalculator.findValidatedEquilibria(scenario)
  }

  /**
   * Get recommended Nash equilibria with quality analysis
   */
  getRecommendedNashEquilibria(scenario: GameScenario): Array<{
    equilibrium: NashEquilibrium
    validation: any
    recommendation: string
  }> {
    return this.nashCalculator.getRecommendedEquilibria(scenario)
  }

  /**
   * Validate a specific Nash equilibrium
   */
  validateEquilibrium(equilibrium: NashEquilibrium, payoffMatrix: PayoffMatrix): any {
    return this.nashCalculator.validateEquilibrium(equilibrium, payoffMatrix)
  }

  /**
   * Find Nash equilibria for a given game scenario (Legacy version)
   */
  findNashEquilibriaLegacy(scenario: GameScenario): NashEquilibrium[] {
    const { payoffMatrix } = scenario
    const equilibria: NashEquilibrium[] = []

    // Find pure strategy Nash equilibria
    const pureEquilibria = this.findPureStrategyNashEquilibria(payoffMatrix)
    equilibria.push(...pureEquilibria)

    // For 2x2 games, also check for mixed strategy equilibria
    if (payoffMatrix.strategies.length === 2 && payoffMatrix.players === 2) {
      const mixedEquilibrium = this.findMixedStrategyNashEquilibrium(payoffMatrix)
      if (mixedEquilibrium) {
        equilibria.push(mixedEquilibrium)
      }
    }

    return equilibria
  }

  /**
   * Legacy method for backward compatibility
   */
  findNashEquilibrium(payoffMatrix: number[][][], strategies: string[]) {
    if (!payoffMatrix || payoffMatrix.length === 0 || !payoffMatrix[0] || payoffMatrix[0].length === 0) return null

    const matrix = payoffMatrix
    const numStrategies = strategies.length

    // Check all pure strategy combinations for Nash equilibrium
    for (let i = 0; i < numStrategies; i++) {
      for (let j = 0; j < numStrategies; j++) {
        if (this.isPureNashEquilibrium(matrix, i, j, numStrategies)) {
          return {
            strategies: [i, j],
            payoffs: matrix[i][j],
          }
        }
      }
    }

    return null // No pure strategy Nash equilibrium found
  }

  /**
   * Legacy method for backward compatibility
   */
  findDominantStrategies(payoffMatrix: number[][][], strategies: string[]): string[] {
    if (!payoffMatrix || payoffMatrix.length === 0) return []

    const matrix = payoffMatrix
    const dominantStrategies: string[] = []

    // Check for dominant strategies for player 1
    for (let i = 0; i < strategies.length; i++) {
      let isDominant = true
      for (let k = 0; k < strategies.length; k++) {
        if (k !== i) {
          let dominatesK = true
          for (let j = 0; j < strategies.length; j++) {
            if (matrix[i][j][0] <= matrix[k][j][0]) {
              dominatesK = false
              break
            }
          }
          if (!dominatesK) {
            isDominant = false
            break
          }
        }
      }
      if (isDominant) {
        dominantStrategies.push(`Player 1: ${strategies[i]}`)
      }
    }

    // Check for dominant strategies for player 2
    for (let j = 0; j < strategies.length; j++) {
      let isDominant = true
      for (let k = 0; k < strategies.length; k++) {
        if (k !== j) {
          let dominatesK = true
          for (let i = 0; i < strategies.length; i++) {
            if (matrix[i][j][1] <= matrix[i][k][1]) {
              dominatesK = false
              break
            }
          }
          if (!dominatesK) {
            isDominant = false
            break
          }
        }
      }
      if (isDominant) {
        dominantStrategies.push(`Player 2: ${strategies[j]}`)
      }
    }

    return dominantStrategies
  }

  /**
   * Find pure strategy Nash equilibria
   */
  private findPureStrategyNashEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    const equilibria: NashEquilibrium[] = []
    const numStrategies = payoffMatrix.strategies.length

    // Check all pure strategy combinations
    for (let i = 0; i < numStrategies; i++) {
      for (let j = 0; j < numStrategies; j++) {
        if (this.isPureNashEquilibrium(payoffMatrix.payoffs, i, j, numStrategies)) {
          const payoffs = payoffMatrix.payoffs[i][j]
          equilibria.push({
            type: 'pure',
            strategies: [i, j],
            payoffs,
            stability: this.calculateStability(payoffMatrix.payoffs, [i, j]),
            isStrict: this.isStrictEquilibrium(payoffMatrix.payoffs, i, j, numStrategies)
          })
        }
      }
    }

    return equilibria
  }

  /**
   * Check if a strategy profile is a pure strategy Nash equilibrium
   */
  private isPureNashEquilibrium(matrix: number[][][], row: number, col: number, numStrategies: number): boolean {
    const currentPayoffs = matrix[row][col]

    // Check if player 1 wants to deviate
    for (let i = 0; i < numStrategies; i++) {
      if (i !== row && matrix[i][col][0] > currentPayoffs[0]) {
        return false
      }
    }

    // Check if player 2 wants to deviate
    for (let j = 0; j < numStrategies; j++) {
      if (j !== col && matrix[row][j][1] > currentPayoffs[1]) {
        return false
      }
    }

    return true
  }

  /**
   * Find mixed strategy Nash equilibrium for 2x2 games
   */
  private findMixedStrategyNashEquilibrium(payoffMatrix: PayoffMatrix): NashEquilibrium | null {
    const matrix = payoffMatrix.payoffs
    
    // For 2x2 games: calculate mixed strategy probabilities
    const a = matrix[0][0][1] // Player 2's payoff when both play strategy 0
    const b = matrix[0][1][1] // Player 2's payoff when P1=0, P2=1
    const c = matrix[1][0][1] // Player 2's payoff when P1=1, P2=0
    const d = matrix[1][1][1] // Player 2's payoff when both play strategy 1

    const e = matrix[0][0][0] // Player 1's payoff when both play strategy 0
    const f = matrix[0][1][0] // Player 1's payoff when P1=0, P2=1
    const g = matrix[1][0][0] // Player 1's payoff when P1=1, P2=0
    const h = matrix[1][1][0] // Player 1's payoff when both play strategy 1

    const denomP1 = (c - a) - (d - b)
    const denomP2 = (f - e) - (h - g)

    if (denomP1 === 0 || denomP2 === 0) return null

    const p = (d - b) / denomP1 // Player 1's probability of playing strategy 0
    const q = (h - g) / denomP2 // Player 2's probability of playing strategy 0

    // Check if probabilities are valid (between 0 and 1)
    if (p >= 0 && p <= 1 && q >= 0 && q <= 1) {
      const mixedStrategies = [[p, 1-p], [q, 1-q]]
      const expectedPayoffs = this.calculateMixedStrategyPayoffs(matrix, mixedStrategies)
      
      return {
        type: 'mixed',
        strategies: mixedStrategies,
        payoffs: expectedPayoffs,
        stability: 0.5,
        isStrict: false
      }
    }

    return null
  }

  /**
   * Calculate expected payoffs for mixed strategies
   */
  private calculateMixedStrategyPayoffs(matrix: number[][][], strategies: number[][]): number[] {
    const [p1Probs, p2Probs] = strategies
    let expectedPayoffs = [0, 0]

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        const probability = p1Probs[i] * p2Probs[j]
        expectedPayoffs[0] += probability * matrix[i][j][0]
        expectedPayoffs[1] += probability * matrix[i][j][1]
      }
    }

    return expectedPayoffs
  }

  /**
   * Calculate stability measure for an equilibrium
   */
  private calculateStability(matrix: number[][][], strategies: number[]): number {
    const [row, col] = strategies
    const currentPayoffs = matrix[row][col]
    let minDeviation = Infinity

    // Check deviations for both players
    for (let i = 0; i < matrix.length; i++) {
      if (i !== row) {
        const deviation = currentPayoffs[0] - matrix[i][col][0]
        minDeviation = Math.min(minDeviation, deviation)
      }
    }

    for (let j = 0; j < matrix[0].length; j++) {
      if (j !== col) {
        const deviation = currentPayoffs[1] - matrix[row][j][1]
        minDeviation = Math.min(minDeviation, deviation)
      }
    }

    return Math.max(0, Math.min(1, minDeviation / 10))
  }

  /**
   * Check if equilibrium is strict
   */
  private isStrictEquilibrium(matrix: number[][][], row: number, col: number, numStrategies: number): boolean {
    const currentPayoffs = matrix[row][col]

    for (let i = 0; i < numStrategies; i++) {
      if (i !== row && matrix[i][col][0] >= currentPayoffs[0]) {
        return false
      }
    }

    for (let j = 0; j < numStrategies; j++) {
      if (j !== col && matrix[row][j][1] >= currentPayoffs[1]) {
        return false
      }
    }

    return true
  }

  /**
   * Find dominant strategies for a scenario
   */
  findDominantStrategiesForScenario(scenario: GameScenario): DominantStrategy[] {
    const matrix = scenario.payoffMatrix.payoffs
    const strategies = scenario.payoffMatrix.strategies
    const dominantStrategies: DominantStrategy[] = []

    // Check for dominant strategies for each player
    for (let playerIndex = 0; playerIndex < scenario.payoffMatrix.players; playerIndex++) {
      for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
        const dominance = this.checkStrategyDominance(matrix, playerIndex, strategyIndex)
        if (dominance) {
          dominantStrategies.push({
            playerIndex,
            strategyIndex,
            strategyName: strategies[strategyIndex].name,
            dominanceType: dominance.type,
            dominatedStrategies: dominance.dominated
          })
        }
      }
    }

    return dominantStrategies
  }

  /**
   * Check if a strategy is dominant for a player
   */
  private checkStrategyDominance(matrix: number[][][], playerIndex: number, strategyIndex: number): 
    { type: 'strict' | 'weak', dominated: number[] } | null {
    
    const numStrategies = matrix.length
    const dominatedStrategies: number[] = []
    let isStrictlyDominant = true

    for (let otherStrategy = 0; otherStrategy < numStrategies; otherStrategy++) {
      if (otherStrategy === strategyIndex) continue

      let strictlyDominatesOther = true

      // Check across all opponent strategy profiles
      for (let opponentStrategy = 0; opponentStrategy < matrix[0].length; opponentStrategy++) {
        const payoffFromStrategy = playerIndex === 0 ? 
          matrix[strategyIndex][opponentStrategy][playerIndex] :
          matrix[opponentStrategy][strategyIndex][playerIndex]
        
        const payoffFromOther = playerIndex === 0 ?
          matrix[otherStrategy][opponentStrategy][playerIndex] :
          matrix[opponentStrategy][otherStrategy][playerIndex]

        if (payoffFromStrategy <= payoffFromOther) {
          strictlyDominatesOther = false
          break
        }
      }

      if (strictlyDominatesOther) {
        dominatedStrategies.push(otherStrategy)
      } else {
        isStrictlyDominant = false
      }
    }

    if (isStrictlyDominant && dominatedStrategies.length > 0) {
      return { type: 'strict', dominated: dominatedStrategies }
    }

    return null
  }

  /**
   * Validate a game scenario
   */
  validateGameScenario(scenario: GameScenario): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: any[] = []

    // Check basic structure
    if (!scenario.payoffMatrix || !scenario.players) {
      errors.push({
        field: 'structure',
        message: 'Game scenario must have payoff matrix and players',
        code: 'MISSING_REQUIRED_FIELDS'
      })
    }

          // Validate payoff matrix
      if (scenario.payoffMatrix) {
        const matrixValidation = this.validatePayoffMatrix(scenario.payoffMatrix)
        errors.push(...matrixValidation.errors)
        if (matrixValidation.warnings) {
          warnings.push(...matrixValidation.warnings)
        }
      }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate payoff matrix structure
   */
  private validatePayoffMatrix(matrix: PayoffMatrix): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: any[] = []

    if (!matrix.strategies || matrix.strategies.length < 2) {
      errors.push({
        field: 'strategies',
        message: 'Must have at least 2 strategies',
        code: 'INSUFFICIENT_STRATEGIES'
      })
    }

    if (!matrix.payoffs || matrix.payoffs.length === 0) {
      errors.push({
        field: 'payoffs',
        message: 'Payoff matrix cannot be empty',
        code: 'EMPTY_PAYOFF_MATRIX'
      })
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Calculate comprehensive statistics for simulation results
   */
  calculateSimulationStatistics(payoffs: number[][], confidenceLevel: number = 0.95): SimulationStatistics {
    const numPlayers = payoffs.length
    const mean: number[] = []
    const variance: number[] = []
    const standardDeviation: number[] = []
    const confidenceInterval: ConfidenceInterval[] = []

    for (let i = 0; i < numPlayers; i++) {
      const playerPayoffs = payoffs[i]
      const n = playerPayoffs.length

      // Calculate mean
      const playerMean = playerPayoffs.reduce((sum, payoff) => sum + payoff, 0) / n
      mean.push(playerMean)

      // Calculate variance
      const playerVariance = playerPayoffs.reduce((sum, payoff) => sum + Math.pow(payoff - playerMean, 2), 0) / (n - 1)
      variance.push(playerVariance)

      // Calculate standard deviation
      const playerStdDev = Math.sqrt(playerVariance)
      standardDeviation.push(playerStdDev)

      // Calculate confidence interval
      const standardError = playerStdDev / Math.sqrt(n)
      const margin = 1.96 * standardError // 95% confidence

      confidenceInterval.push({
        playerIndex: i,
        lower: playerMean - margin,
        upper: playerMean + margin,
        confidence: confidenceLevel
      })
    }

    return {
      mean,
      variance,
      standardDeviation,
      confidenceInterval,
      correlations: [],
      entropy: 0,
      giniCoefficient: 0
    }
  }
}
