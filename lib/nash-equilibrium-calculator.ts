import { 
  GameScenario, 
  PayoffMatrix, 
  NashEquilibrium, 
  Player,
  Strategy
} from './game-theory-types'
import { MixedStrategySolver } from './mixed-strategy-solver'
import { MultiPlayerNashSolver } from './multi-player-nash-solver'
import { EquilibriumValidator, ValidationReport } from './equilibrium-validator'

/**
 * Advanced Nash Equilibrium Calculator
 * Provides comprehensive algorithms for finding Nash equilibria in game theory scenarios
 */
export class NashEquilibriumCalculator {
  private mixedSolver: MixedStrategySolver
  private multiPlayerSolver: MultiPlayerNashSolver
  private validator: EquilibriumValidator

  constructor() {
    try {
      this.mixedSolver = new MixedStrategySolver()
      this.multiPlayerSolver = new MultiPlayerNashSolver()
      this.validator = new EquilibriumValidator()
    } catch (error) {
      console.error('Error initializing Nash Equilibrium Calculator:', error)
      // Initialize with fallback implementations or null values
      this.mixedSolver = new MixedStrategySolver()
      this.multiPlayerSolver = new MultiPlayerNashSolver()
      this.validator = new EquilibriumValidator()
    }
  }
  
  /**
   * Find all Nash equilibria for a given game scenario
   */
  findAllNashEquilibria(scenario: GameScenario): NashEquilibrium[] {
    const numPlayers = scenario.payoffMatrix.players
    
    if (numPlayers >= 3) {
      // Use specialized multi-player solver for games with 3+ players
      return this.multiPlayerSolver.findMultiPlayerEquilibria(scenario.payoffMatrix)
    } else {
      // Use enhanced 2-player approach for 2-player games
      const equilibria: NashEquilibrium[] = []
      
      // Find pure strategy Nash equilibria
      const pureEquilibria = this.findPureStrategyEquilibria(scenario.payoffMatrix)
      equilibria.push(...pureEquilibria)
      
      // Find mixed strategy Nash equilibria using the enhanced solver
      const mixedEquilibria = this.mixedSolver.findMixedEquilibria(scenario.payoffMatrix)
      equilibria.push(...mixedEquilibria)
      
      return equilibria
    }
  }
  
  /**
   * Find pure strategy Nash equilibria using best response analysis
   */
  findPureStrategyEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    const equilibria: NashEquilibrium[] = []
    const numStrategies = payoffMatrix.strategies.length
    const numPlayers = payoffMatrix.players
    
    // Generate all possible strategy profiles
    const strategyProfiles = this.generateStrategyProfiles(numStrategies, numPlayers)
    
    for (const profile of strategyProfiles) {
      if (this.isPureNashEquilibrium(payoffMatrix, profile)) {
        const payoffs = this.getPayoffs(payoffMatrix, profile)
        const stability = this.calculateStabilityScore(payoffMatrix, profile)
        const isStrict = this.isStrictEquilibrium(payoffMatrix, profile)
        
        equilibria.push({
          type: 'pure',
          strategies: profile,
          payoffs,
          stability,
          isStrict
        })
      }
    }
    
    return equilibria
  }
  
  /**
   * Check if a strategy profile is a pure Nash equilibrium
   */
  private isPureNashEquilibrium(payoffMatrix: PayoffMatrix, profile: number[]): boolean {
    const numPlayers = payoffMatrix.players
    
    // Check if any player has a profitable deviation
    for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
      const currentPayoff = this.getPlayerPayoff(payoffMatrix, profile, playerIndex)
      
      // Check all alternative strategies for this player
      for (let strategyIndex = 0; strategyIndex < payoffMatrix.strategies.length; strategyIndex++) {
        if (strategyIndex === profile[playerIndex]) continue
        
        const deviationProfile = [...profile]
        deviationProfile[playerIndex] = strategyIndex
        const deviationPayoff = this.getPlayerPayoff(payoffMatrix, deviationProfile, playerIndex)
        
        // If player can improve by deviating, it's not a Nash equilibrium
        if (deviationPayoff > currentPayoff) {
          return false
        }
      }
    }
    
    return true
  }
  
  /**
   * Find mixed strategy Nash equilibria for 2-player games
   */
  findMixedStrategyEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    if (payoffMatrix.players !== 2) {
      return [] // Mixed strategy calculation only implemented for 2-player games
    }
    
    const equilibria: NashEquilibrium[] = []
    const numStrategies = payoffMatrix.strategies.length
    
    // For 2x2 games, use analytical solution
    if (numStrategies === 2) {
      const mixedEquilibrium = this.findMixedEquilibrium2x2(payoffMatrix)
      if (mixedEquilibrium) {
        equilibria.push(mixedEquilibrium)
      }
    } else {
      // For larger games, use iterative methods
      const mixedEquilibrium = this.findMixedEquilibriumGeneral(payoffMatrix)
      if (mixedEquilibrium) {
        equilibria.push(mixedEquilibrium)
      }
    }
    
    return equilibria
  }
  
  /**
   * Find mixed strategy Nash equilibrium for 2x2 games (analytical solution)
   */
  private findMixedEquilibrium2x2(payoffMatrix: PayoffMatrix): NashEquilibrium | null {
    const matrix = payoffMatrix.payoffs
    
    // Player 2's payoffs: matrix[i][j][1]
    const a = matrix[0][0][1] // Both play strategy 0
    const b = matrix[0][1][1] // P1=0, P2=1
    const c = matrix[1][0][1] // P1=1, P2=0
    const d = matrix[1][1][1] // Both play strategy 1
    
    // Player 1's payoffs: matrix[i][j][0]
    const e = matrix[0][0][0] // Both play strategy 0
    const f = matrix[0][1][0] // P1=0, P2=1
    const g = matrix[1][0][0] // P1=1, P2=0
    const h = matrix[1][1][0] // Both play strategy 1
    
    // Calculate mixed strategy probabilities
    const denomP1 = (c - a) - (d - b)
    const denomP2 = (f - e) - (h - g)
    
    // Check for existence of mixed strategy equilibrium
    if (Math.abs(denomP1) < 1e-10 || Math.abs(denomP2) < 1e-10) {
      return null // No mixed strategy equilibrium exists
    }
    
    const p = (d - b) / denomP1 // Player 1's probability of playing strategy 0
    const q = (h - g) / denomP2 // Player 2's probability of playing strategy 0
    
    // Validate probabilities are in [0,1]
    if (p >= 0 && p <= 1 && q >= 0 && q <= 1) {
      const mixedStrategies = [[p, 1-p], [q, 1-q]]
      const expectedPayoffs = this.calculateExpectedPayoffs(payoffMatrix, mixedStrategies)
      
      return {
        type: 'mixed',
        strategies: mixedStrategies,
        payoffs: expectedPayoffs,
        stability: this.calculateMixedStability(payoffMatrix, mixedStrategies),
        isStrict: false // Mixed equilibria are typically not strict
      }
    }
    
    return null
  }
  
  /**
   * Find mixed strategy equilibrium for general n×n games using support enumeration
   */
  private findMixedEquilibriumGeneral(payoffMatrix: PayoffMatrix): NashEquilibrium | null {
    // This is a simplified implementation for demonstration
    // A full implementation would use linear programming or support enumeration
    
    const numStrategies = payoffMatrix.strategies.length
    
    // For now, check if there's a symmetric mixed equilibrium
    // where both players use the same probability distribution
    
    // Try uniform mixing as a starting point
    const uniformProbs = Array(numStrategies).fill(1 / numStrategies)
    
    if (this.verifyMixedEquilibrium(payoffMatrix, [uniformProbs, uniformProbs])) {
      const expectedPayoffs = this.calculateExpectedPayoffs(payoffMatrix, [uniformProbs, uniformProbs])
      
      return {
        type: 'mixed',
        strategies: [uniformProbs, uniformProbs],
        payoffs: expectedPayoffs,
        stability: 0.5,
        isStrict: false
      }
    }
    
    return null
  }
  
  /**
   * Verify if a mixed strategy profile is a Nash equilibrium
   */
  private verifyMixedEquilibrium(payoffMatrix: PayoffMatrix, strategies: number[][]): boolean {
    const tolerance = 1e-6
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      const playerStrategy = strategies[playerIndex]
      const otherStrategies = strategies.slice()
      
      // Calculate expected payoffs for each pure strategy
      const expectedPayoffs: number[] = []
      
      for (let strategyIndex = 0; strategyIndex < payoffMatrix.strategies.length; strategyIndex++) {
        // Create a profile where this player plays pure strategy
        otherStrategies[playerIndex] = Array(payoffMatrix.strategies.length).fill(0)
        otherStrategies[playerIndex][strategyIndex] = 1
        
        const payoff = this.calculateExpectedPayoffForPlayer(payoffMatrix, otherStrategies, playerIndex)
        expectedPayoffs.push(payoff)
      }
      
      // In a mixed equilibrium, all strategies in the support must yield equal payoffs
      const supportStrategies = playerStrategy.map((prob, idx) => prob > tolerance ? idx : -1).filter(idx => idx >= 0)
      
      if (supportStrategies.length > 1) {
        const firstPayoff = expectedPayoffs[supportStrategies[0]]
        for (let i = 1; i < supportStrategies.length; i++) {
          if (Math.abs(expectedPayoffs[supportStrategies[i]] - firstPayoff) > tolerance) {
            return false
          }
        }
      }
    }
    
    return true
  }
  
  /**
   * Calculate expected payoffs for mixed strategies
   */
  private calculateExpectedPayoffs(payoffMatrix: PayoffMatrix, strategies: number[][]): number[] {
    const numPlayers = payoffMatrix.players
    const expectedPayoffs = new Array(numPlayers).fill(0)
    
    for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
      expectedPayoffs[playerIndex] = this.calculateExpectedPayoffForPlayer(payoffMatrix, strategies, playerIndex)
    }
    
    return expectedPayoffs
  }
  
  /**
   * Calculate expected payoff for a specific player
   */
  private calculateExpectedPayoffForPlayer(payoffMatrix: PayoffMatrix, strategies: number[][], playerIndex: number): number {
    let expectedPayoff = 0
    const numStrategies = payoffMatrix.strategies.length
    
    // Iterate over all possible strategy combinations
    const profiles = this.generateStrategyProfiles(numStrategies, payoffMatrix.players)
    
    for (const profile of profiles) {
      let probability = 1
      
      // Calculate the probability of this profile occurring
      for (let pIndex = 0; pIndex < payoffMatrix.players; pIndex++) {
        probability *= strategies[pIndex][profile[pIndex]]
      }
      
      if (probability > 0) {
        const payoff = this.getPlayerPayoff(payoffMatrix, profile, playerIndex)
        expectedPayoff += probability * payoff
      }
    }
    
    return expectedPayoff
  }
  
  /**
   * Generate all possible strategy profiles for n players with m strategies each
   */
  private generateStrategyProfiles(numStrategies: number, numPlayers: number): number[][] {
    const profiles: number[][] = []
    
    function generate(current: number[], playerIndex: number) {
      if (playerIndex === numPlayers) {
        profiles.push([...current])
        return
      }
      
      for (let strategyIndex = 0; strategyIndex < numStrategies; strategyIndex++) {
        current[playerIndex] = strategyIndex
        generate(current, playerIndex + 1)
      }
    }
    
    generate([], 0)
    return profiles
  }
  
  /**
   * Get payoffs for all players given a strategy profile
   */
  private getPayoffs(payoffMatrix: PayoffMatrix, profile: number[]): number[] {
    const payoffs: number[] = []
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      payoffs.push(this.getPlayerPayoff(payoffMatrix, profile, playerIndex))
    }
    
    return payoffs
  }
  
  /**
   * Get payoff for a specific player given a strategy profile
   */
  private getPlayerPayoff(payoffMatrix: PayoffMatrix, profile: number[], playerIndex: number): number {
    // For 2-player games
    if (payoffMatrix.players === 2) {
      return payoffMatrix.payoffs[profile[0]][profile[1]][playerIndex]
    }
    
    // For n-player games, we need a different payoff matrix structure
    // This is a simplified approach assuming symmetric games
    let payoff = 0
    const otherPlayers = profile.filter((_, idx) => idx !== playerIndex)
    const avgOtherStrategy = otherPlayers.reduce((sum, strat) => sum + strat, 0) / otherPlayers.length
    
    // Use 2-player payoff as approximation
    const roundedOtherStrategy = Math.round(avgOtherStrategy)
    return payoffMatrix.payoffs[profile[playerIndex]][roundedOtherStrategy][playerIndex]
  }
  
  /**
   * Calculate stability score for an equilibrium
   */
  private calculateStabilityScore(payoffMatrix: PayoffMatrix, profile: number[]): number {
    let minDeviation = Infinity
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      const currentPayoff = this.getPlayerPayoff(payoffMatrix, profile, playerIndex)
      
      for (let strategyIndex = 0; strategyIndex < payoffMatrix.strategies.length; strategyIndex++) {
        if (strategyIndex === profile[playerIndex]) continue
        
        const deviationProfile = [...profile]
        deviationProfile[playerIndex] = strategyIndex
        const deviationPayoff = this.getPlayerPayoff(payoffMatrix, deviationProfile, playerIndex)
        
        const deviationLoss = currentPayoff - deviationPayoff
        minDeviation = Math.min(minDeviation, deviationLoss)
      }
    }
    
    // Normalize to [0, 1] range
    return Math.max(0, Math.min(1, minDeviation / 10))
  }
  
  /**
   * Calculate stability for mixed strategy equilibrium
   */
  private calculateMixedStability(payoffMatrix: PayoffMatrix, strategies: number[][]): number {
    // Mixed equilibria are generally less stable than pure equilibria
    // This is a simplified stability measure
    return 0.5
  }
  
  /**
   * Check if equilibrium is strict (all deviations strictly decrease payoff)
   */
  private isStrictEquilibrium(payoffMatrix: PayoffMatrix, profile: number[]): boolean {
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      const currentPayoff = this.getPlayerPayoff(payoffMatrix, profile, playerIndex)
      
      for (let strategyIndex = 0; strategyIndex < payoffMatrix.strategies.length; strategyIndex++) {
        if (strategyIndex === profile[playerIndex]) continue
        
        const deviationProfile = [...profile]
        deviationProfile[playerIndex] = strategyIndex
        const deviationPayoff = this.getPlayerPayoff(payoffMatrix, deviationProfile, playerIndex)
        
        // If any deviation doesn't strictly decrease payoff, it's not strict
        if (deviationPayoff >= currentPayoff) {
          return false
        }
      }
    }
    
    return true
  }
  
  /**
   * Validate game configuration before calculating equilibria
   */
  validateGameConfiguration(scenario: GameScenario): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check if payoff matrix is properly defined
    if (!scenario.payoffMatrix || !scenario.payoffMatrix.payoffs) {
      errors.push('Payoff matrix is not defined')
    }
    
    // Check if number of players matches payoff structure
    if (scenario.payoffMatrix.payoffs.length === 0) {
      errors.push('Payoff matrix has no strategies')
    }
    
    // Check payoff matrix dimensions
    const numStrategies = scenario.payoffMatrix.strategies.length
    const payoffs = scenario.payoffMatrix.payoffs
    
    if (payoffs.length !== numStrategies) {
      errors.push('Payoff matrix dimensions do not match number of strategies')
    }
    
    for (let i = 0; i < payoffs.length; i++) {
      if (payoffs[i].length !== numStrategies) {
        errors.push(`Row ${i} of payoff matrix has incorrect length`)
      }
      
      for (let j = 0; j < payoffs[i].length; j++) {
        if (payoffs[i][j].length !== scenario.payoffMatrix.players) {
          errors.push(`Payoff entry [${i}][${j}] does not have correct number of player payoffs`)
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate a Nash equilibrium and provide detailed analysis
   */
  validateEquilibrium(
    equilibrium: NashEquilibrium, 
    payoffMatrix: PayoffMatrix
  ): ValidationReport {
    return this.validator.validateEquilibrium(equilibrium, payoffMatrix)
  }

  /**
   * Find and validate all Nash equilibria with comprehensive analysis
   */
  findValidatedEquilibria(scenario: GameScenario): Array<{
    equilibrium: NashEquilibrium
    validation: ValidationReport
  }> {
    const equilibria = this.findAllNashEquilibria(scenario)
    
    return equilibria.map(equilibrium => ({
      equilibrium,
      validation: this.validator.validateEquilibrium(equilibrium, scenario.payoffMatrix)
    }))
  }

  /**
   * Get the most stable and valid equilibria with recommendations
   */
  getRecommendedEquilibria(scenario: GameScenario): Array<{
    equilibrium: NashEquilibrium
    validation: ValidationReport
    recommendation: string
  }> {
    const validatedEquilibria = this.findValidatedEquilibria(scenario)
    
    // Filter to only valid equilibria and sort by quality
    const validEquilibria = validatedEquilibria
      .filter(result => result.validation.isValid)
      .sort((a, b) => {
        // Sort by stability, then efficiency, then social welfare
        if (Math.abs(a.validation.stabilityAnalysis.overall - b.validation.stabilityAnalysis.overall) > 0.1) {
          return b.validation.stabilityAnalysis.overall - a.validation.stabilityAnalysis.overall
        }
        if (Math.abs(a.validation.qualityMetrics.efficiency - b.validation.qualityMetrics.efficiency) > 0.1) {
          return b.validation.qualityMetrics.efficiency - a.validation.qualityMetrics.efficiency
        }
        return b.validation.qualityMetrics.social_welfare - a.validation.qualityMetrics.social_welfare
      })

    return validEquilibria.map((result, index) => {
      let recommendation = ''
      
      if (index === 0 && validEquilibria.length > 1) {
        recommendation = 'Most recommended equilibrium based on stability and efficiency'
      } else if (index === 0) {
        recommendation = 'Only valid equilibrium found'
      } else {
        const stability = result.validation.stabilityAnalysis.overall
        const efficiency = result.validation.qualityMetrics.efficiency
        
        if (stability > 0.8) {
          recommendation = 'Highly stable alternative equilibrium'
        } else if (efficiency > 0.8) {
          recommendation = 'Efficient alternative, but potentially less stable'
        } else {
          recommendation = 'Valid but suboptimal alternative'
        }
      }
      
      return {
        equilibrium: result.equilibrium,
        validation: result.validation,
        recommendation
      }
    })
  }
} 