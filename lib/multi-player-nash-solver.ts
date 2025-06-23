import { PayoffMatrix, NashEquilibrium, Strategy } from './game-theory-types'

/**
 * Multi-Player Nash Equilibrium Solver
 * Specialized algorithms for finding Nash equilibria in games with 3+ players
 */
export class MultiPlayerNashSolver {
  private tolerance = 1e-6
  private maxIterations = 1000

  /**
   * Find Nash equilibria for n-player games (n >= 3)
   */
  findMultiPlayerEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    if (payoffMatrix.players < 3) {
      throw new Error('Multi-player solver requires at least 3 players')
    }

    const equilibria: NashEquilibrium[] = []

    // 1. Find pure strategy Nash equilibria
    const pureEquilibria = this.findPureEquilibria(payoffMatrix)
    equilibria.push(...pureEquilibria)

    // 2. Find symmetric mixed equilibria (if the game is symmetric)
    if (payoffMatrix.isSymmetric) {
      const symmetricEquilibria = this.findSymmetricMixedEquilibria(payoffMatrix)
      equilibria.push(...symmetricEquilibria)
    }

    // 3. Find simple asymmetric equilibria (limited search)
    const asymmetricEquilibria = this.findSimpleAsymmetricEquilibria(payoffMatrix)
    equilibria.push(...asymmetricEquilibria)

    return this.removeDuplicateEquilibria(equilibria)
  }

  /**
   * Find pure strategy Nash equilibria for n-player games
   */
  private findPureEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    const equilibria: NashEquilibrium[] = []
    const numPlayers = payoffMatrix.players
    const numStrategies = payoffMatrix.strategies.length

    // Generate all possible pure strategy profiles
    const allProfiles = this.generateAllPureStrategyProfiles(numPlayers, numStrategies)

    for (const profile of allProfiles) {
      if (this.isPureNashEquilibrium(payoffMatrix, profile)) {
        const payoffs = this.calculatePureStrategyPayoffs(payoffMatrix, profile)
        const stability = this.calculatePureStability(payoffMatrix, profile)

        equilibria.push({
          type: 'pure',
          strategies: profile,
          payoffs,
          stability,
          isStrict: this.isStrictPureEquilibrium(payoffMatrix, profile)
        })
      }
    }

    return equilibria
  }

  /**
   * Check if a pure strategy profile is a Nash equilibrium
   */
  private isPureNashEquilibrium(payoffMatrix: PayoffMatrix, profile: number[]): boolean {
    const numPlayers = payoffMatrix.players
    const numStrategies = payoffMatrix.strategies.length

    for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
      const currentStrategy = profile[playerIndex]
      const currentPayoff = this.getPlayerPayoffForProfile(payoffMatrix, profile, playerIndex)

      // Check if any other strategy would give a higher payoff
      for (let alternativeStrategy = 0; alternativeStrategy < numStrategies; alternativeStrategy++) {
        if (alternativeStrategy === currentStrategy) continue

        const alternativeProfile = [...profile]
        alternativeProfile[playerIndex] = alternativeStrategy
        const alternativePayoff = this.getPlayerPayoffForProfile(
          payoffMatrix, 
          alternativeProfile, 
          playerIndex
        )

        if (alternativePayoff > currentPayoff + this.tolerance) {
          return false // Player has a profitable deviation
        }
      }
    }

    return true
  }

  /**
   * Find symmetric mixed strategy equilibria
   */
  private findSymmetricMixedEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    const equilibria: NashEquilibrium[] = []
    const numStrategies = payoffMatrix.strategies.length

    // Try uniform mixing first
    const uniformMixing = Array(numStrategies).fill(1 / numStrategies)
    if (this.isSymmetricMixedEquilibrium(payoffMatrix, uniformMixing)) {
      const allPlayersUniform = Array(payoffMatrix.players).fill(uniformMixing)
      const payoffs = this.calculateMixedStrategyPayoffs(payoffMatrix, allPlayersUniform)

      equilibria.push({
        type: 'mixed',
        strategies: allPlayersUniform,
        payoffs,
        stability: this.calculateMixedStability(allPlayersUniform),
        isStrict: false
      })
    }

    // Try other symmetric patterns (e.g., two-strategy mixing)
    if (numStrategies >= 2) {
      for (let i = 0; i < numStrategies - 1; i++) {
        for (let j = i + 1; j < numStrategies; j++) {
          const twoStrategyMixing = this.findTwoStrategySymmetricMixing(
            payoffMatrix, i, j
          )
          if (twoStrategyMixing) {
            equilibria.push(twoStrategyMixing)
          }
        }
      }
    }

    return equilibria
  }

  /**
   * Check if symmetric mixing is an equilibrium
   */
  private isSymmetricMixedEquilibrium(payoffMatrix: PayoffMatrix, mixing: number[]): boolean {
    const numPlayers = payoffMatrix.players
    const allPlayersMixing = Array(numPlayers).fill(mixing)

    // Calculate expected payoffs for each pure strategy
    const expectedPayoffs: number[] = []
    
    for (let strategyIndex = 0; strategyIndex < mixing.length; strategyIndex++) {
      const expectedPayoff = this.calculateStrategyExpectedPayoff(
        payoffMatrix, allPlayersMixing, 0, strategyIndex
      )
      expectedPayoffs.push(expectedPayoff)
    }

    // Check indifference condition: all strategies in support must yield equal payoffs
    const supportStrategies = mixing
      .map((prob, idx) => prob > this.tolerance ? idx : -1)
      .filter(idx => idx >= 0)

    if (supportStrategies.length > 1) {
      const firstPayoff = expectedPayoffs[supportStrategies[0]]
      for (let i = 1; i < supportStrategies.length; i++) {
        if (Math.abs(expectedPayoffs[supportStrategies[i]] - firstPayoff) > this.tolerance) {
          return false
        }
      }
    }

    // Check that strategies outside support don't yield higher payoffs
    const maxSupportPayoff = Math.max(...supportStrategies.map(idx => expectedPayoffs[idx]))
    for (let strategyIndex = 0; strategyIndex < mixing.length; strategyIndex++) {
      if (mixing[strategyIndex] <= this.tolerance) { // Not in support
        if (expectedPayoffs[strategyIndex] > maxSupportPayoff + this.tolerance) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Find two-strategy symmetric mixing equilibrium
   */
  private findTwoStrategySymmetricMixing(
    payoffMatrix: PayoffMatrix, 
    strategy1: number, 
    strategy2: number
  ): NashEquilibrium | null {
    // For symmetric games, use iterative approach to find mixing probability
    let p = 0.5 // Probability of playing strategy1
    
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const mixing = Array(payoffMatrix.strategies.length).fill(0)
      mixing[strategy1] = p
      mixing[strategy2] = 1 - p

      const allPlayersMixing = Array(payoffMatrix.players).fill(mixing)

      const payoff1 = this.calculateStrategyExpectedPayoff(
        payoffMatrix, allPlayersMixing, 0, strategy1
      )
      const payoff2 = this.calculateStrategyExpectedPayoff(
        payoffMatrix, allPlayersMixing, 0, strategy2
      )

      const payoffDiff = payoff1 - payoff2

      if (Math.abs(payoffDiff) < this.tolerance) {
        // Found equilibrium
        const payoffs = this.calculateMixedStrategyPayoffs(payoffMatrix, allPlayersMixing)
        
        return {
          type: 'mixed',
          strategies: allPlayersMixing,
          payoffs,
          stability: this.calculateMixedStability(allPlayersMixing),
          isStrict: false
        }
      }

      // Adjust p based on payoff difference
      const adjustment = payoffDiff * 0.01
      p = Math.max(0, Math.min(1, p - adjustment))
    }

    return null
  }

  /**
   * Find simple asymmetric equilibria (limited search for computational feasibility)
   */
  private findSimpleAsymmetricEquilibria(payoffMatrix: PayoffMatrix): NashEquilibrium[] {
    const equilibria: NashEquilibrium[] = []
    const numPlayers = payoffMatrix.players
    const numStrategies = payoffMatrix.strategies.length

    // Only search for equilibria where some players use pure strategies
    // and others use simple mixed strategies (at most 2 strategies in support)
    
    // Generate patterns: which players use pure strategies vs mixed
    const patterns = this.generateAsymmetricPatterns(numPlayers, 2) // Limit to 2 mixed players
    
    for (const pattern of patterns) {
      const equilibrium = this.searchForAsymmetricEquilibrium(payoffMatrix, pattern)
      if (equilibrium) {
        equilibria.push(equilibrium)
      }
    }

    return equilibria
  }

  /**
   * Search for equilibrium given an asymmetric pattern
   */
  private searchForAsymmetricEquilibrium(
    payoffMatrix: PayoffMatrix, 
    pattern: ('pure' | 'mixed')[]
  ): NashEquilibrium | null {
    // Simplified search - try a few representative strategy profiles
    const numStrategies = payoffMatrix.strategies.length
    
    // For pure strategy players, try each pure strategy
    const pureStrategyCombinations = this.generatePureStrategyCombinations(pattern, numStrategies)
    
    for (const pureCombo of pureStrategyCombinations) {
      // For mixed strategy players, try uniform mixing over 2 strategies
      const mixedCombinations = this.generateSimpleMixedCombinations(pattern, numStrategies)
      
      for (const mixedCombo of mixedCombinations) {
        const fullProfile = this.combineStrategies(pattern, pureCombo, mixedCombo)
        
        if (this.isAsymmetricEquilibrium(payoffMatrix, fullProfile, pattern)) {
          const payoffs = this.calculateMixedStrategyPayoffs(payoffMatrix, fullProfile)
          
          return {
            type: 'mixed',
            strategies: fullProfile,
            payoffs,
            stability: this.calculateMixedStability(fullProfile),
            isStrict: false
          }
        }
      }
    }

    return null
  }

  /**
   * Generate all pure strategy profiles for n players
   */
  private generateAllPureStrategyProfiles(numPlayers: number, numStrategies: number): number[][] {
    const profiles: number[][] = []
    
    function generateProfile(currentProfile: number[], playerIndex: number) {
      if (playerIndex === numPlayers) {
        profiles.push([...currentProfile])
        return
      }
      
      for (let strategy = 0; strategy < numStrategies; strategy++) {
        currentProfile[playerIndex] = strategy
        generateProfile(currentProfile, playerIndex + 1)
      }
    }
    
    generateProfile([], 0)
    return profiles
  }

  /**
   * Calculate payoff for a player given a pure strategy profile
   */
  private getPlayerPayoffForProfile(
    payoffMatrix: PayoffMatrix, 
    profile: number[], 
    playerIndex: number
  ): number {
    // For n-player games, we need to extend the 2-player payoff matrix structure
    // This is a simplified approach assuming the payoff can be calculated from
    // the player's strategy and some aggregation of opponent strategies
    
    const playerStrategy = profile[playerIndex]
    const opponentStrategies = profile.filter((_, idx) => idx !== playerIndex)
    
    // Use a simplified aggregation: average opponent strategy or most common strategy
    const avgOpponentStrategy = Math.round(
      opponentStrategies.reduce((sum, s) => sum + s, 0) / opponentStrategies.length
    )
    
    // Use the 2-player payoff matrix as approximation
    const matrixPlayerIndex = Math.min(playerIndex, 1)
    return payoffMatrix.payoffs[playerStrategy][avgOpponentStrategy][matrixPlayerIndex]
  }

  /**
   * Calculate expected payoff for a strategy in mixed play
   */
  private calculateStrategyExpectedPayoff(
    payoffMatrix: PayoffMatrix,
    allPlayerStrategies: number[][],
    playerIndex: number,
    strategyIndex: number
  ): number {
    let expectedPayoff = 0
    const numStrategies = payoffMatrix.strategies.length
    
    // Calculate expected payoff against all possible opponent strategy combinations
    const opponentIndices = Array.from({ length: payoffMatrix.players }, (_, i) => i)
      .filter(i => i !== playerIndex)
    
    // Simplification: use pairwise interaction model
    // Calculate average expected payoff against each opponent
    let totalExpectedPayoff = 0
    
    for (const opponentIndex of opponentIndices) {
      const opponentStrategy = allPlayerStrategies[opponentIndex]
      
      for (let opponentStrategyIndex = 0; opponentStrategyIndex < numStrategies; opponentStrategyIndex++) {
        const probability = opponentStrategy[opponentStrategyIndex]
        const matrixPlayerIndex = Math.min(playerIndex, 1)
        const payoff = payoffMatrix.payoffs[strategyIndex][opponentStrategyIndex][matrixPlayerIndex]
        
        totalExpectedPayoff += probability * payoff
      }
    }
    
    // Average across all opponents
    expectedPayoff = totalExpectedPayoff / opponentIndices.length
    
    return expectedPayoff
  }

  /**
   * Calculate payoffs for mixed strategy profile
   */
  private calculateMixedStrategyPayoffs(
    payoffMatrix: PayoffMatrix, 
    strategies: number[][]
  ): number[] {
    const payoffs: number[] = []
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      let expectedPayoff = 0
      const playerStrategy = strategies[playerIndex]
      
      for (let strategyIndex = 0; strategyIndex < playerStrategy.length; strategyIndex++) {
        const strategyProb = playerStrategy[strategyIndex]
        const strategyPayoff = this.calculateStrategyExpectedPayoff(
          payoffMatrix, strategies, playerIndex, strategyIndex
        )
        expectedPayoff += strategyProb * strategyPayoff
      }
      
      payoffs.push(expectedPayoff)
    }
    
    return payoffs
  }

  /**
   * Calculate pure strategy payoffs
   */
  private calculatePureStrategyPayoffs(payoffMatrix: PayoffMatrix, profile: number[]): number[] {
    const payoffs: number[] = []
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      const payoff = this.getPlayerPayoffForProfile(payoffMatrix, profile, playerIndex)
      payoffs.push(payoff)
    }
    
    return payoffs
  }

  /**
   * Calculate stability for pure equilibrium
   */
  private calculatePureStability(payoffMatrix: PayoffMatrix, profile: number[]): number {
    // Stability is based on how much better the equilibrium strategies are
    // compared to the best alternative strategies
    let minAdvantage = Infinity
    const numStrategies = payoffMatrix.strategies.length
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      const currentStrategy = profile[playerIndex]
      const currentPayoff = this.getPlayerPayoffForProfile(payoffMatrix, profile, playerIndex)
      
      for (let altStrategy = 0; altStrategy < numStrategies; altStrategy++) {
        if (altStrategy === currentStrategy) continue
        
        const altProfile = [...profile]
        altProfile[playerIndex] = altStrategy
        const altPayoff = this.getPlayerPayoffForProfile(payoffMatrix, altProfile, playerIndex)
        
        const advantage = currentPayoff - altPayoff
        minAdvantage = Math.min(minAdvantage, advantage)
      }
    }
    
    // Normalize to [0, 1] range
    return Math.max(0, Math.min(1, (minAdvantage + 10) / 20))
  }

  /**
   * Calculate stability for mixed equilibrium
   */
  private calculateMixedStability(strategies: number[][]): number {
    // Mixed equilibria are generally less stable than pure ones
    // Stability decreases with the number of players and strategies in support
    
    const avgSupportSize = strategies.reduce((sum, playerStrategy) => {
      const supportSize = playerStrategy.filter(prob => prob > this.tolerance).length
      return sum + supportSize
    }, 0) / strategies.length
    
    const maxSupportSize = strategies[0].length
    const numPlayers = strategies.length
    
    // Decrease stability with more players and larger supports
    const playerPenalty = Math.max(0, 1 - (numPlayers - 2) * 0.1)
    const supportPenalty = Math.max(0, 1 - (avgSupportSize - 1) / (maxSupportSize - 1))
    
    return playerPenalty * supportPenalty * 0.7 // Mixed equilibria are inherently less stable
  }

  /**
   * Check if pure equilibrium is strict
   */
  private isStrictPureEquilibrium(payoffMatrix: PayoffMatrix, profile: number[]): boolean {
    const numStrategies = payoffMatrix.strategies.length
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      const currentStrategy = profile[playerIndex]
      const currentPayoff = this.getPlayerPayoffForProfile(payoffMatrix, profile, playerIndex)
      
      for (let altStrategy = 0; altStrategy < numStrategies; altStrategy++) {
        if (altStrategy === currentStrategy) continue
        
        const altProfile = [...profile]
        altProfile[playerIndex] = altStrategy
        const altPayoff = this.getPlayerPayoffForProfile(payoffMatrix, altProfile, playerIndex)
        
        if (altPayoff >= currentPayoff - this.tolerance) {
          return false // Not strictly better
        }
      }
    }
    
    return true
  }

  /**
   * Remove duplicate equilibria (with tolerance for numerical precision)
   */
  private removeDuplicateEquilibria(equilibria: NashEquilibrium[]): NashEquilibrium[] {
    const unique: NashEquilibrium[] = []
    
    for (const eq of equilibria) {
      const isDuplicate = unique.some(existing => 
        this.areEquilibriaEqual(eq, existing)
      )
      
      if (!isDuplicate) {
        unique.push(eq)
      }
    }
    
    return unique
  }

  /**
   * Check if two equilibria are essentially the same
   */
  private areEquilibriaEqual(eq1: NashEquilibrium, eq2: NashEquilibrium): boolean {
    if (eq1.type !== eq2.type) return false
    
    // For pure equilibria, compare strategy indices
    if (eq1.type === 'pure') {
      const strategies1 = eq1.strategies as number[]
      const strategies2 = eq2.strategies as number[]
      
      if (strategies1.length !== strategies2.length) return false
      
      return strategies1.every((s, i) => s === strategies2[i])
    }
    
    // For mixed equilibria, compare probability distributions
    const strategies1 = eq1.strategies as number[][]
    const strategies2 = eq2.strategies as number[][]
    
    if (strategies1.length !== strategies2.length) return false
    
    return strategies1.every((playerStrat, playerIndex) => {
      const otherPlayerStrat = strategies2[playerIndex]
      if (playerStrat.length !== otherPlayerStrat.length) return false
      
      return playerStrat.every((prob, stratIndex) => 
        Math.abs(prob - otherPlayerStrat[stratIndex]) < this.tolerance
      )
    })
  }

  // Helper methods for asymmetric equilibrium search
  private generateAsymmetricPatterns(numPlayers: number, maxMixed: number): ('pure' | 'mixed')[][] {
    const patterns: ('pure' | 'mixed')[][] = []
    
    // Generate all combinations of up to maxMixed mixed players
    for (let numMixed = 1; numMixed <= Math.min(maxMixed, numPlayers); numMixed++) {
      const combinations = this.generatePlayerCombinations(numPlayers, numMixed)
      
      for (const mixedPlayers of combinations) {
        const pattern: ('pure' | 'mixed')[] = Array(numPlayers).fill('pure')
        for (const playerIndex of mixedPlayers) {
          pattern[playerIndex] = 'mixed'
        }
        patterns.push(pattern)
      }
    }
    
    return patterns
  }

  private generatePlayerCombinations(numPlayers: number, k: number): number[][] {
    const combinations: number[][] = []
    
    function backtrack(start: number, current: number[]) {
      if (current.length === k) {
        combinations.push([...current])
        return
      }
      
      for (let i = start; i < numPlayers; i++) {
        current.push(i)
        backtrack(i + 1, current)
        current.pop()
      }
    }
    
    backtrack(0, [])
    return combinations
  }

  private generatePureStrategyCombinations(
    pattern: ('pure' | 'mixed')[], 
    numStrategies: number
  ): number[][] {
    const purePlayerIndices = pattern
      .map((type, idx) => type === 'pure' ? idx : -1)
      .filter(idx => idx >= 0)
    
    if (purePlayerIndices.length === 0) return [[]]
    
    const combinations: number[][] = []
    
    function generate(playerIndex: number, current: number[]) {
      if (playerIndex === purePlayerIndices.length) {
        combinations.push([...current])
        return
      }
      
      for (let strategy = 0; strategy < numStrategies; strategy++) {
        current.push(strategy)
        generate(playerIndex + 1, current)
        current.pop()
      }
    }
    
    generate(0, [])
    return combinations
  }

  private generateSimpleMixedCombinations(
    pattern: ('pure' | 'mixed')[], 
    numStrategies: number
  ): number[][][] {
    const mixedPlayerIndices = pattern
      .map((type, idx) => type === 'mixed' ? idx : -1)
      .filter(idx => idx >= 0)
    
    if (mixedPlayerIndices.length === 0) return [[]]
    
    // For simplicity, only try uniform mixing between pairs of strategies
    const combinations: number[][][] = []
    
    for (let i = 0; i < numStrategies - 1; i++) {
      for (let j = i + 1; j < numStrategies; j++) {
        const mixing = Array(numStrategies).fill(0)
        mixing[i] = 0.5
        mixing[j] = 0.5
        
        // Apply this mixing to all mixed players (simplified)
        const fullMixing = Array(mixedPlayerIndices.length).fill(mixing)
        combinations.push(fullMixing)
      }
    }
    
    return combinations
  }

  private combineStrategies(
    pattern: ('pure' | 'mixed')[], 
    pureCombo: number[], 
    mixedCombo: number[][]
  ): number[][] {
    const result: number[][] = []
    let pureIndex = 0
    let mixedIndex = 0
    
    for (let playerIndex = 0; playerIndex < pattern.length; playerIndex++) {
      if (pattern[playerIndex] === 'pure') {
        const pureStrategy = pureCombo[pureIndex++]
        const strategyVector = Array(mixedCombo[0]?.length || 2).fill(0)
        strategyVector[pureStrategy] = 1
        result.push(strategyVector)
      } else {
        result.push(mixedCombo[mixedIndex++])
      }
    }
    
    return result
  }

  private isAsymmetricEquilibrium(
    payoffMatrix: PayoffMatrix, 
    strategies: number[][], 
    pattern: ('pure' | 'mixed')[]
  ): boolean {
    // Simplified equilibrium check - verify that each player's strategy is optimal
    // given the other players' strategies
    
    for (let playerIndex = 0; playerIndex < payoffMatrix.players; playerIndex++) {
      if (pattern[playerIndex] === 'pure') {
        // Check that the pure strategy is optimal
        const playerStrategy = strategies[playerIndex]
        const pureStrategyIndex = playerStrategy.findIndex(prob => prob > 0.5)
        
        const currentPayoff = this.calculateStrategyExpectedPayoff(
          payoffMatrix, strategies, playerIndex, pureStrategyIndex
        )
        
        // Check if any other pure strategy would be better
        for (let altStrategy = 0; altStrategy < playerStrategy.length; altStrategy++) {
          if (altStrategy === pureStrategyIndex) continue
          
          const altPayoff = this.calculateStrategyExpectedPayoff(
            payoffMatrix, strategies, playerIndex, altStrategy
          )
          
          if (altPayoff > currentPayoff + this.tolerance) {
            return false
          }
        }
      } else {
        // Check indifference condition for mixed strategy
        const playerStrategy = strategies[playerIndex]
        const supportStrategies = playerStrategy
          .map((prob, idx) => prob > this.tolerance ? idx : -1)
          .filter(idx => idx >= 0)
        
        if (supportStrategies.length > 1) {
          const expectedPayoffs = supportStrategies.map(stratIdx =>
            this.calculateStrategyExpectedPayoff(payoffMatrix, strategies, playerIndex, stratIdx)
          )
          
          const firstPayoff = expectedPayoffs[0]
          for (let i = 1; i < expectedPayoffs.length; i++) {
            if (Math.abs(expectedPayoffs[i] - firstPayoff) > this.tolerance) {
              return false
            }
          }
        }
      }
    }
    
    return true
  }
} 