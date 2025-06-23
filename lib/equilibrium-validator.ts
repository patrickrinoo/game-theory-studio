import { PayoffMatrix, NashEquilibrium, Strategy } from './game-theory-types'

/**
 * Comprehensive Nash Equilibrium Validator and Analyzer
 * Provides validation, stability analysis, and quality metrics for Nash equilibria
 */

export interface ValidationReport {
  isValid: boolean
  confidence: number // 0-1, how confident we are in the validation
  errors: ValidationError[]
  warnings: ValidationWarning[]
  stabilityAnalysis: StabilityAnalysis
  qualityMetrics: QualityMetrics
  recommendations: string[]
}

export interface ValidationError {
  type: 'best_response_violation' | 'probability_constraint' | 'indifference_violation' | 'payoff_calculation'
  player?: number
  strategy?: number
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  details: any
}

export interface ValidationWarning {
  type: 'numerical_precision' | 'boundary_equilibrium' | 'weak_dominance' | 'unstable_mixing'
  message: string
  suggestion: string
  impact: 'high' | 'medium' | 'low'
}

export interface StabilityAnalysis {
  overall: number // 0-1 stability score
  components: {
    robustness: number // resistance to small perturbations
    convergence: number // likelihood to converge to this equilibrium
    basin: number // size of attraction basin (estimated)
    trembling: number // stability under trembling hand perturbations
  }
  description: string
  riskFactors: string[]
}

export interface QualityMetrics {
  efficiency: number // 0-1, how close to Pareto optimal
  fairness: number // 0-1, how equal the payoffs are
  social_welfare: number // sum of all player payoffs
  risk_profile: 'low' | 'medium' | 'high'
  complexity: number // 0-1, how complex the strategy is
  interpretability: number // 0-1, how easy to understand/implement
}

export class EquilibriumValidator {
  private tolerance = 1e-8
  private relaxedTolerance = 1e-6

  /**
   * Validate and analyze a Nash equilibrium
   */
  validateEquilibrium(
    equilibrium: NashEquilibrium, 
    payoffMatrix: PayoffMatrix
  ): ValidationReport {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const recommendations: string[] = []

    // Step 1: Basic structural validation
    this.validateStructure(equilibrium, payoffMatrix, errors)

    // Step 2: Nash equilibrium conditions validation
    this.validateNashConditions(equilibrium, payoffMatrix, errors, warnings)

    // Step 3: Stability analysis
    const stabilityAnalysis = this.analyzeStability(equilibrium, payoffMatrix)

    // Step 4: Quality metrics calculation
    const qualityMetrics = this.calculateQualityMetrics(equilibrium, payoffMatrix)

    // Step 5: Generate recommendations
    this.generateRecommendations(equilibrium, stabilityAnalysis, qualityMetrics, recommendations)

    const isValid = errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0
    const confidence = this.calculateConfidence(errors, warnings)

    return {
      isValid,
      confidence,
      errors,
      warnings,
      stabilityAnalysis,
      qualityMetrics,
      recommendations
    }
  }

  /**
   * Validate basic structure of the equilibrium
   */
  private validateStructure(
    equilibrium: NashEquilibrium,
    payoffMatrix: PayoffMatrix,
    errors: ValidationError[]
  ): void {
    const numPlayers = payoffMatrix.players
    const numStrategies = payoffMatrix.strategies.length

    if (equilibrium.type === 'pure') {
      const strategies = equilibrium.strategies as number[]
      
      if (strategies.length !== numPlayers) {
        errors.push({
          type: 'probability_constraint',
          message: `Pure strategy vector has ${strategies.length} entries, expected ${numPlayers}`,
          severity: 'critical',
          details: { expected: numPlayers, actual: strategies.length }
        })
      }

      for (let i = 0; i < strategies.length; i++) {
        if (!Number.isInteger(strategies[i]) || strategies[i] < 0 || strategies[i] >= numStrategies) {
          errors.push({
            type: 'probability_constraint',
            player: i,
            strategy: strategies[i],
            message: `Invalid strategy index ${strategies[i]} for player ${i}`,
            severity: 'critical',
            details: { validRange: [0, numStrategies - 1] }
          })
        }
      }
    } else {
      const strategies = equilibrium.strategies as number[][]
      
      if (strategies.length !== numPlayers) {
        errors.push({
          type: 'probability_constraint',
          message: `Mixed strategy profile has ${strategies.length} players, expected ${numPlayers}`,
          severity: 'critical',
          details: { expected: numPlayers, actual: strategies.length }
        })
      }

      for (let playerIndex = 0; playerIndex < strategies.length; playerIndex++) {
        const playerStrategy = strategies[playerIndex]
        
        if (playerStrategy.length !== numStrategies) {
          errors.push({
            type: 'probability_constraint',
            player: playerIndex,
            message: `Player ${playerIndex} strategy has ${playerStrategy.length} probabilities, expected ${numStrategies}`,
            severity: 'critical',
            details: { expected: numStrategies, actual: playerStrategy.length }
          })
        }

        // Check probability constraints
        const sum = playerStrategy.reduce((acc, prob) => acc + prob, 0)
        if (Math.abs(sum - 1) > this.tolerance) {
          errors.push({
            type: 'probability_constraint',
            player: playerIndex,
            message: `Player ${playerIndex} probabilities sum to ${sum.toFixed(6)}, expected 1.0`,
            severity: 'high',
            details: { sum, expected: 1.0 }
          })
        }

        for (let strategyIndex = 0; strategyIndex < playerStrategy.length; strategyIndex++) {
          const prob = playerStrategy[strategyIndex]
          if (prob < -this.tolerance || prob > 1 + this.tolerance) {
            errors.push({
              type: 'probability_constraint',
              player: playerIndex,
              strategy: strategyIndex,
              message: `Invalid probability ${prob.toFixed(6)} for player ${playerIndex}, strategy ${strategyIndex}`,
              severity: 'high',
              details: { probability: prob, validRange: [0, 1] }
            })
          }
        }
      }
    }
  }

  /**
   * Validate Nash equilibrium conditions
   */
  private validateNashConditions(
    equilibrium: NashEquilibrium,
    payoffMatrix: PayoffMatrix,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (equilibrium.type === 'pure') {
      this.validatePureNash(equilibrium, payoffMatrix, errors, warnings)
    } else {
      this.validateMixedNash(equilibrium, payoffMatrix, errors, warnings)
    }
  }

  /**
   * Validate pure strategy Nash equilibrium
   */
  private validatePureNash(
    equilibrium: NashEquilibrium,
    payoffMatrix: PayoffMatrix,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const strategies = equilibrium.strategies as number[]
    const numStrategies = payoffMatrix.strategies.length

    for (let playerIndex = 0; playerIndex < strategies.length; playerIndex++) {
      const currentStrategy = strategies[playerIndex]
      const currentPayoff = this.calculatePlayerPayoff(payoffMatrix, strategies, playerIndex)

      let hasHigherPayoff = false
      let maxAlternativePayoff = -Infinity

      for (let altStrategy = 0; altStrategy < numStrategies; altStrategy++) {
        if (altStrategy === currentStrategy) continue

        const altStrategies = [...strategies]
        altStrategies[playerIndex] = altStrategy
        const altPayoff = this.calculatePlayerPayoff(payoffMatrix, altStrategies, playerIndex)

        maxAlternativePayoff = Math.max(maxAlternativePayoff, altPayoff)

        if (altPayoff > currentPayoff + this.tolerance) {
          hasHigherPayoff = true
          errors.push({
            type: 'best_response_violation',
            player: playerIndex,
            strategy: altStrategy,
            message: `Player ${playerIndex} can improve payoff from ${currentPayoff.toFixed(3)} to ${altPayoff.toFixed(3)} by switching to strategy ${altStrategy}`,
            severity: 'critical',
            details: {
              currentPayoff,
              alternativePayoff: altPayoff,
              improvement: altPayoff - currentPayoff
            }
          })
        }
      }

      // Check for weakly dominated strategies
      if (!hasHigherPayoff && maxAlternativePayoff > currentPayoff - this.relaxedTolerance) {
        warnings.push({
          type: 'weak_dominance',
          message: `Player ${playerIndex} strategy ${currentStrategy} is weakly dominated`,
          suggestion: 'Consider the stability of this equilibrium under small perturbations',
          impact: 'medium'
        })
      }
    }
  }

  /**
   * Validate mixed strategy Nash equilibrium
   */
  private validateMixedNash(
    equilibrium: NashEquilibrium,
    payoffMatrix: PayoffMatrix,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const strategies = equilibrium.strategies as number[][]
    const numStrategies = payoffMatrix.strategies.length

    for (let playerIndex = 0; playerIndex < strategies.length; playerIndex++) {
      const playerStrategy = strategies[playerIndex]
      
      // Calculate expected payoffs for each pure strategy
      const expectedPayoffs: number[] = []
      for (let strategyIndex = 0; strategyIndex < numStrategies; strategyIndex++) {
        const expectedPayoff = this.calculateMixedExpectedPayoff(
          payoffMatrix, strategies, playerIndex, strategyIndex
        )
        expectedPayoffs.push(expectedPayoff)
      }

      // Identify support (strategies with positive probability)
      const support = playerStrategy
        .map((prob, idx) => prob > this.tolerance ? idx : -1)
        .filter(idx => idx >= 0)

      // Check indifference condition within support
      if (support.length > 1) {
        const supportPayoffs = support.map(idx => expectedPayoffs[idx])
        const avgPayoff = supportPayoffs.reduce((sum, p) => sum + p, 0) / supportPayoffs.length

        for (let i = 0; i < supportPayoffs.length; i++) {
          const diff = Math.abs(supportPayoffs[i] - avgPayoff)
          if (diff > this.tolerance) {
            errors.push({
              type: 'indifference_violation',
              player: playerIndex,
              strategy: support[i],
              message: `Indifference condition violated for player ${playerIndex}: strategy ${support[i]} payoff ${supportPayoffs[i].toFixed(6)} differs from average by ${diff.toFixed(6)}`,
              severity: 'high',
              details: {
                strategyPayoff: supportPayoffs[i],
                averagePayoff: avgPayoff,
                difference: diff
              }
            })
          }
        }
      }

      // Check that strategies outside support don't provide higher payoffs
      const maxSupportPayoff = support.length > 0 
        ? Math.max(...support.map(idx => expectedPayoffs[idx]))
        : -Infinity

      for (let strategyIndex = 0; strategyIndex < numStrategies; strategyIndex++) {
        if (playerStrategy[strategyIndex] <= this.tolerance) { // Not in support
          if (expectedPayoffs[strategyIndex] > maxSupportPayoff + this.tolerance) {
            errors.push({
              type: 'best_response_violation',
              player: playerIndex,
              strategy: strategyIndex,
              message: `Strategy ${strategyIndex} outside support provides higher payoff ${expectedPayoffs[strategyIndex].toFixed(6)} than support strategies`,
              severity: 'critical',
              details: {
                outsidePayoff: expectedPayoffs[strategyIndex],
                maxSupportPayoff,
                improvement: expectedPayoffs[strategyIndex] - maxSupportPayoff
              }
            })
          }
        }
      }

      // Check for numerical precision warnings
      for (let strategyIndex = 0; strategyIndex < numStrategies; strategyIndex++) {
        const prob = playerStrategy[strategyIndex]
        if (prob > 0 && prob < this.relaxedTolerance) {
          warnings.push({
            type: 'numerical_precision',
            message: `Very small probability ${prob.toFixed(8)} for player ${playerIndex}, strategy ${strategyIndex}`,
            suggestion: 'Consider if this is due to numerical precision issues',
            impact: 'low'
          })
        }
      }
    }
  }

  /**
   * Analyze stability of the equilibrium
   */
  private analyzeStability(
    equilibrium: NashEquilibrium,
    payoffMatrix: PayoffMatrix
  ): StabilityAnalysis {
    const robustness = this.calculateRobustness(equilibrium, payoffMatrix)
    const convergence = this.estimateConvergence(equilibrium, payoffMatrix)
    const basin = this.estimateBasinSize(equilibrium, payoffMatrix)
    const trembling = this.analyzeTremblingHand(equilibrium, payoffMatrix)

    const overall = (robustness + convergence + basin + trembling) / 4

    let description = ''
    const riskFactors: string[] = []

    if (overall > 0.8) {
      description = 'Highly stable equilibrium with strong robustness properties'
    } else if (overall > 0.6) {
      description = 'Moderately stable equilibrium with some vulnerability to perturbations'
    } else if (overall > 0.4) {
      description = 'Weakly stable equilibrium that may be sensitive to changes'
    } else {
      description = 'Unstable equilibrium with high sensitivity to perturbations'
      riskFactors.push('High sensitivity to strategy perturbations')
    }

    if (robustness < 0.4) {
      riskFactors.push('Low robustness to payoff changes')
    }
    if (convergence < 0.4) {
      riskFactors.push('Unlikely to be reached through adaptive learning')
    }
    if (basin < 0.4) {
      riskFactors.push('Small basin of attraction')
    }
    if (trembling < 0.4) {
      riskFactors.push('Vulnerable to trembling hand perturbations')
    }

    return {
      overall,
      components: { robustness, convergence, basin, trembling },
      description,
      riskFactors
    }
  }

  /**
   * Calculate quality metrics for the equilibrium
   */
  private calculateQualityMetrics(
    equilibrium: NashEquilibrium,
    payoffMatrix: PayoffMatrix
  ): QualityMetrics {
    const efficiency = this.calculateEfficiency(equilibrium, payoffMatrix)
    const fairness = this.calculateFairness(equilibrium)
    const social_welfare = equilibrium.payoffs.reduce((sum, payoff) => sum + payoff, 0)
    const complexity = this.calculateComplexity(equilibrium)
    const interpretability = this.calculateInterpretability(equilibrium)
    
    let risk_profile: 'low' | 'medium' | 'high'
    if (equilibrium.type === 'pure' && equilibrium.stability > 0.7) {
      risk_profile = 'low'
    } else if (equilibrium.stability > 0.5) {
      risk_profile = 'medium'
    } else {
      risk_profile = 'high'
    }

    return {
      efficiency,
      fairness,
      social_welfare,
      risk_profile,
      complexity,
      interpretability
    }
  }

  /**
   * Calculate expected payoff for a mixed strategy
   */
  private calculateMixedExpectedPayoff(
    payoffMatrix: PayoffMatrix,
    strategies: number[][],
    playerIndex: number,
    strategyIndex: number
  ): number {
    let expectedPayoff = 0
    const numStrategies = payoffMatrix.strategies.length

    if (payoffMatrix.players === 2) {
      // 2-player case
      const opponentIndex = 1 - playerIndex
      const opponentStrategy = strategies[opponentIndex]

      for (let opponentStrategyIndex = 0; opponentStrategyIndex < numStrategies; opponentStrategyIndex++) {
        const probability = opponentStrategy[opponentStrategyIndex]
        const payoff = playerIndex === 0
          ? payoffMatrix.payoffs[strategyIndex][opponentStrategyIndex][playerIndex]
          : payoffMatrix.payoffs[opponentStrategyIndex][strategyIndex][playerIndex]
        
        expectedPayoff += probability * payoff
      }
    } else {
      // Multi-player case (simplified)
      const otherPlayers = strategies.filter((_, idx) => idx !== playerIndex)
      
      // Use average opponent strategy as approximation
      const avgOpponentStrategy = Array(numStrategies).fill(0)
      for (const playerStrat of otherPlayers) {
        for (let i = 0; i < numStrategies; i++) {
          avgOpponentStrategy[i] += playerStrat[i] / otherPlayers.length
        }
      }

      for (let opponentStrategyIndex = 0; opponentStrategyIndex < numStrategies; opponentStrategyIndex++) {
        const probability = avgOpponentStrategy[opponentStrategyIndex]
        const matrixPlayerIndex = Math.min(playerIndex, 1)
        const payoff = payoffMatrix.payoffs[strategyIndex][opponentStrategyIndex][matrixPlayerIndex]
        
        expectedPayoff += probability * payoff
      }
    }

    return expectedPayoff
  }

  /**
   * Calculate payoff for pure strategy profile
   */
  private calculatePlayerPayoff(
    payoffMatrix: PayoffMatrix,
    strategies: number[],
    playerIndex: number
  ): number {
    if (payoffMatrix.players === 2) {
      const playerStrategy = strategies[playerIndex]
      const opponentStrategy = strategies[1 - playerIndex]
      
      return playerIndex === 0
        ? payoffMatrix.payoffs[playerStrategy][opponentStrategy][playerIndex]
        : payoffMatrix.payoffs[opponentStrategy][playerStrategy][playerIndex]
    } else {
      // Multi-player approximation
      const playerStrategy = strategies[playerIndex]
      const opponentStrategies = strategies.filter((_, idx) => idx !== playerIndex)
      const avgOpponentStrategy = Math.round(
        opponentStrategies.reduce((sum, s) => sum + s, 0) / opponentStrategies.length
      )
      
      const matrixPlayerIndex = Math.min(playerIndex, 1)
      return payoffMatrix.payoffs[playerStrategy][avgOpponentStrategy][matrixPlayerIndex]
    }
  }

  // Stability analysis helper methods
  private calculateRobustness(equilibrium: NashEquilibrium, payoffMatrix: PayoffMatrix): number {
    // Simplified robustness calculation
    if (equilibrium.type === 'pure') {
      return equilibrium.stability // Use existing stability measure
    } else {
      // For mixed strategies, robustness decreases with number of strategies in support
      const strategies = equilibrium.strategies as number[][]
      const avgSupportSize = strategies.reduce((sum, playerStrat) => {
        return sum + playerStrat.filter(prob => prob > this.tolerance).length
      }, 0) / strategies.length
      
      return Math.max(0, 1 - (avgSupportSize - 1) / (payoffMatrix.strategies.length - 1))
    }
  }

  private estimateConvergence(equilibrium: NashEquilibrium, payoffMatrix: PayoffMatrix): number {
    // Pure strategy equilibria generally have higher convergence probability
    return equilibrium.type === 'pure' ? 0.8 : 0.4
  }

  private estimateBasinSize(equilibrium: NashEquilibrium, payoffMatrix: PayoffMatrix): number {
    // Simplified estimation based on equilibrium type and stability
    const baseSize = equilibrium.type === 'pure' ? 0.7 : 0.3
    return baseSize * equilibrium.stability
  }

  private analyzeTremblingHand(equilibrium: NashEquilibrium, payoffMatrix: PayoffMatrix): number {
    // Trembling hand stability - simplified analysis
    if (equilibrium.type === 'pure') {
      return equilibrium.isStrict ? 0.9 : 0.6
    } else {
      // Mixed equilibria are generally less stable under trembling hand
      return 0.4
    }
  }

  // Quality metrics helper methods
  private calculateEfficiency(equilibrium: NashEquilibrium, payoffMatrix: PayoffMatrix): number {
    // Compare to maximum possible social welfare
    const currentWelfare = equilibrium.payoffs.reduce((sum, payoff) => sum + payoff, 0)
    
    // Calculate maximum possible welfare (approximation)
    let maxWelfare = -Infinity
    const numStrategies = payoffMatrix.strategies.length
    
    for (let i = 0; i < numStrategies; i++) {
      for (let j = 0; j < numStrategies; j++) {
        const welfare = payoffMatrix.payoffs[i][j].reduce((sum, payoff) => sum + payoff, 0)
        maxWelfare = Math.max(maxWelfare, welfare)
      }
    }
    
    return maxWelfare > 0 ? Math.max(0, Math.min(1, currentWelfare / maxWelfare)) : 0.5
  }

  private calculateFairness(equilibrium: NashEquilibrium): number {
    const payoffs = equilibrium.payoffs
    const mean = payoffs.reduce((sum, p) => sum + p, 0) / payoffs.length
    const variance = payoffs.reduce((sum, p) => sum + (p - mean) ** 2, 0) / payoffs.length
    
    // Normalize variance to [0,1] range and invert (low variance = high fairness)
    const normalizedVariance = Math.min(1, variance / (mean ** 2 + 1))
    return 1 - normalizedVariance
  }

  private calculateComplexity(equilibrium: NashEquilibrium): number {
    if (equilibrium.type === 'pure') {
      return 0 // Pure strategies are simple
    } else {
      const strategies = equilibrium.strategies as number[][]
      const totalSupport = strategies.reduce((sum, playerStrat) => {
        return sum + playerStrat.filter(prob => prob > this.tolerance).length
      }, 0)
      
      const maxPossibleSupport = strategies.length * strategies[0].length
      return totalSupport / maxPossibleSupport
    }
  }

  private calculateInterpretability(equilibrium: NashEquilibrium): number {
    if (equilibrium.type === 'pure') {
      return 1 // Pure strategies are easily interpretable
    } else {
      // Interpretability decreases with mixing complexity
      return 1 - this.calculateComplexity(equilibrium)
    }
  }

  private generateRecommendations(
    equilibrium: NashEquilibrium,
    stability: StabilityAnalysis,
    quality: QualityMetrics,
    recommendations: string[]
  ): void {
    if (stability.overall < 0.5) {
      recommendations.push('Consider mechanisms to stabilize this equilibrium or look for alternative solutions')
    }
    
    if (quality.efficiency < 0.6) {
      recommendations.push('This equilibrium may be inefficient; consider coordination mechanisms')
    }
    
    if (quality.fairness < 0.5) {
      recommendations.push('Large payoff differences suggest potential for redistribution mechanisms')
    }
    
    if (equilibrium.type === 'mixed' && quality.complexity > 0.7) {
      recommendations.push('High strategy complexity may make this equilibrium difficult to implement in practice')
    }
    
    if (quality.risk_profile === 'high') {
      recommendations.push('High risk profile suggests careful consideration of uncertainty and robustness')
    }
  }

  private calculateConfidence(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length
    const highErrors = errors.filter(e => e.severity === 'high').length
    const highWarnings = warnings.filter(w => w.impact === 'high').length
    
    let confidence = 1.0
    confidence -= criticalErrors * 0.3
    confidence -= highErrors * 0.2
    confidence -= highWarnings * 0.1
    
    return Math.max(0, confidence)
  }
} 