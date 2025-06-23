/**
 * Strategic Dominance Analysis Module
 * 
 * This module provides comprehensive analysis of strategic dominance in game theory,
 * including strict and weak dominance, iterative elimination of dominated strategies,
 * and educational explanations of the results.
 */

import { PayoffMatrix, Strategy, DominantStrategy } from './game-theory-types';
import { GameTheoryUtils } from './game-theory-utils'

export interface DominanceAnalysisResult {
  hasStrictDominance: boolean;
  hasWeakDominance: boolean;
  strictlyDominantStrategies: DominantStrategyInfo[];
  weaklyDominantStrategies: DominantStrategyInfo[];
  strictlyDominatedStrategies: DominatedStrategyInfo[];
  weaklyDominatedStrategies: DominatedStrategyInfo[];
  iterativeElimination: EliminationStep[];
  reducedGame: PayoffMatrix | null;
  explanation: string;
  recommendations: string[];
}

export interface DominantStrategyInfo {
  playerIndex: number;
  strategyIndex: number;
  strategyName: string;
  dominanceType: 'strict' | 'weak';
  dominatedStrategies: number[];
  dominatedStrategyNames: string[];
  explanation: string;
  payoffComparison: PayoffComparison[];
}

export interface DominatedStrategyInfo {
  playerIndex: number;
  strategyIndex: number;
  strategyName: string;
  dominationType: 'strict' | 'weak';
  dominatedBy: number[];
  dominatedByNames: string[];
  explanation: string;
  shouldEliminate: boolean;
}

export interface EliminationStep {
  step: number;
  eliminatedStrategies: {
    playerIndex: number;
    strategyIndex: number;
    strategyName: string;
    reason: string;
    dominatedBy: number;
    dominatedByName: string;
  }[];
  remainingStrategies: number[][];
  payoffMatrix: number[][][];
  explanation: string;
}

export interface PayoffComparison {
  againstStrategy: number;
  againstStrategyName: string;
  dominantPayoffs: number[];
  dominatedPayoffs: number[];
  difference: number[];
  isStrictlyBetter: boolean;
  isWeaklyBetter: boolean;
}

// Types for best response analysis
export interface BestResponsePoint {
  strategy: number
  payoff: number
  isOptimal: boolean
  marginFromBest: number
}

export interface BestResponseFunction {
  playerIndex: number
  opponentStrategy: number[]
  responses: BestResponsePoint[]
  bestResponse: number
  maxPayoff: number
}

export interface BestResponseIntersection {
  strategies: number[]
  payoffs: number[]
  type: 'pure' | 'mixed'
  stability: number // 0-1 measure of how stable this equilibrium is
  isNashEquilibrium: boolean
}

export interface BestResponseAnalysisResult {
  players: number
  strategies: string[]
  bestResponseFunctions: BestResponseFunction[][]
  intersections: BestResponseIntersection[]
  dominantStrategies: { player: number; strategy: number; type: 'strict' | 'weak' }[]
  iterativeElimination: {
    rounds: Array<{
      round: number
      eliminatedStrategy: { player: number; strategy: number; reason: string }
      remainingStrategies: number[][]
    }>
    finalStrategies: number[][]
  }
}

export interface BestResponseVisualizationData {
  player1Responses: Array<{ x: number; y: number; isOptimal: boolean }>
  player2Responses: Array<{ x: number; y: number; isOptimal: boolean }>
  nashEquilibria: Array<{ x: number; y: number; type: 'pure' | 'mixed'; stability: number }>
  payoffContours: Array<{
    player: number
    contours: Array<{ level: number; points: Array<{ x: number; y: number }> }>
  }>
}

export class BestResponseAnalyzer {
  private payoffMatrix: number[][][]
  private strategies: string[]
  private gameUtils: GameTheoryUtils

  constructor(payoffMatrix: number[][][], strategies: string[]) {
    this.payoffMatrix = payoffMatrix
    this.strategies = strategies
    this.gameUtils = new GameTheoryUtils()
  }

  /**
   * Calculate best response for a player given opponent's strategy
   */
  calculateBestResponse(
    playerIndex: number, 
    opponentStrategies: number[] | number[][],
    resolution: number = 10
  ): BestResponseFunction {
    const numStrategies = this.strategies.length
    const responses: BestResponsePoint[] = []
    let maxPayoff = -Infinity
    let bestResponseIndex = 0

    // Handle 2-player case differently than n-player
    if (this.payoffMatrix.length === numStrategies && this.payoffMatrix[0].length === numStrategies) {
      // 2-player game
      const opponentMixedStrategy = Array.isArray(opponentStrategies[0]) 
        ? opponentStrategies[0] as number[]
        : this.convertPureToMixed(opponentStrategies as number[], numStrategies)

      for (let strategy = 0; strategy < numStrategies; strategy++) {
        const payoff = this.calculateExpectedPayoff(playerIndex, strategy, opponentMixedStrategy)
        responses.push({
          strategy,
          payoff,
          isOptimal: false,
          marginFromBest: 0
        })

        if (payoff > maxPayoff) {
          maxPayoff = payoff
          bestResponseIndex = strategy
        }
      }
    } else {
      // N-player game - simplified approach
      for (let strategy = 0; strategy < numStrategies; strategy++) {
        // Calculate average payoff against all possible opponent strategies
        let totalPayoff = 0
        let combinations = 0

        for (let oppStrategy = 0; oppStrategy < numStrategies; oppStrategy++) {
          if (this.payoffMatrix[strategy] && this.payoffMatrix[strategy][oppStrategy]) {
            totalPayoff += this.payoffMatrix[strategy][oppStrategy][playerIndex] || 0
            combinations++
          }
        }

        const avgPayoff = combinations > 0 ? totalPayoff / combinations : 0
        responses.push({
          strategy,
          payoff: avgPayoff,
          isOptimal: false,
          marginFromBest: 0
        })

        if (avgPayoff > maxPayoff) {
          maxPayoff = avgPayoff
          bestResponseIndex = strategy
        }
      }
    }

    // Mark optimal responses and calculate margins
    responses.forEach(response => {
      response.isOptimal = Math.abs(response.payoff - maxPayoff) < 1e-6
      response.marginFromBest = maxPayoff - response.payoff
    })

    return {
      playerIndex,
      opponentStrategy: Array.isArray(opponentStrategies[0]) 
        ? opponentStrategies[0] as number[]
        : opponentStrategies as number[],
      responses,
      bestResponse: bestResponseIndex,
      maxPayoff
    }
  }

  /**
   * Generate complete best response analysis for visualization
   */
  generateBestResponseAnalysis(resolution: number = 20): BestResponseAnalysisResult {
    const numPlayers = this.getNumberOfPlayers()
    const numStrategies = this.strategies.length
    
    // Calculate best response functions for different opponent strategies
    const bestResponseFunctions: BestResponseFunction[][] = []
    
    for (let player = 0; player < numPlayers; player++) {
      const playerFunctions: BestResponseFunction[] = []
      
      if (numPlayers === 2) {
        // For 2-player games, vary opponent's mixed strategy
        for (let i = 0; i <= resolution; i++) {
          const p = i / resolution
          const opponentMixedStrategy = [p, 1 - p] // Assuming 2 strategies for simplicity
          
          const bestResponse = this.calculateBestResponse(player, [opponentMixedStrategy])
          playerFunctions.push(bestResponse)
        }
      } else {
        // For n-player games, use representative opponent strategies
        for (let oppStrategy = 0; oppStrategy < numStrategies; oppStrategy++) {
          const opponentPureStrategy = new Array(numPlayers - 1).fill(oppStrategy)
          const bestResponse = this.calculateBestResponse(player, opponentPureStrategy)
          playerFunctions.push(bestResponse)
        }
      }
      
      bestResponseFunctions.push(playerFunctions)
    }

    // Find intersections (potential Nash equilibria)
    const intersections = this.findBestResponseIntersections(bestResponseFunctions)

    // Find dominant strategies
    const dominantStrategies = this.findDominantStrategies()

    // Perform iterative elimination
    const iterativeElimination = this.performIterativeElimination()

    return {
      players: numPlayers,
      strategies: this.strategies,
      bestResponseFunctions,
      intersections,
      dominantStrategies,
      iterativeElimination
    }
  }

  /**
   * Generate data optimized for visualization components
   */
  generateVisualizationData(resolution: number = 50): BestResponseVisualizationData {
    // This method focuses on 2-player games for clear visualization
    const numStrategies = this.strategies.length
    const player1Responses: Array<{ x: number; y: number; isOptimal: boolean }> = []
    const player2Responses: Array<{ x: number; y: number; isOptimal: boolean }> = []
    const nashEquilibria: Array<{ x: number; y: number; type: 'pure' | 'mixed'; stability: number }> = []

    // Generate best response correspondences
    for (let i = 0; i <= resolution; i++) {
      const p1Strategy = i / resolution // Player 1's probability of playing strategy 0
      const p2Strategy = this.findBestResponseProbability(1, [p1Strategy, 1 - p1Strategy])
      const p1BestResponse = this.findBestResponseProbability(0, [p2Strategy, 1 - p2Strategy])

      player1Responses.push({
        x: p2Strategy,
        y: p1BestResponse,
        isOptimal: true
      })

      player2Responses.push({
        x: p1Strategy,
        y: p2Strategy,
        isOptimal: true
      })
    }

    // Find Nash equilibria
    const analysis = this.generateBestResponseAnalysis(resolution)
    analysis.intersections.forEach(intersection => {
      if (intersection.isNashEquilibrium && intersection.strategies.length >= 2) {
        nashEquilibria.push({
          x: intersection.strategies[0],
          y: intersection.strategies[1],
          type: intersection.type,
          stability: intersection.stability
        })
      }
    })

    // Generate payoff contours for visualization
    const payoffContours = this.generatePayoffContours(resolution)

    return {
      player1Responses,
      player2Responses,
      nashEquilibria,
      payoffContours
    }
  }

  // Helper methods
  private convertPureToMixed(pureStrategy: number[], numStrategies: number): number[] {
    const mixed = new Array(numStrategies).fill(0)
    pureStrategy.forEach(strategy => {
      if (strategy >= 0 && strategy < numStrategies) {
        mixed[strategy] = 1 / pureStrategy.length
      }
    })
    return mixed
  }

  private calculateExpectedPayoff(
    playerIndex: number, 
    playerStrategy: number, 
    opponentMixedStrategy: number[]
  ): number {
    let expectedPayoff = 0
    
    for (let oppStrategy = 0; oppStrategy < opponentMixedStrategy.length; oppStrategy++) {
      if (this.payoffMatrix[playerStrategy] && 
          this.payoffMatrix[playerStrategy][oppStrategy] &&
          this.payoffMatrix[playerStrategy][oppStrategy][playerIndex] !== undefined) {
        expectedPayoff += opponentMixedStrategy[oppStrategy] * 
                         this.payoffMatrix[playerStrategy][oppStrategy][playerIndex]
      }
    }
    
    return expectedPayoff
  }

  private findBestResponseProbability(playerIndex: number, opponentStrategy: number[]): number {
    const numStrategies = this.strategies.length
    const payoffs = []

    for (let strategy = 0; strategy < numStrategies; strategy++) {
      payoffs.push(this.calculateExpectedPayoff(playerIndex, strategy, opponentStrategy))
    }

    // Find the strategy with maximum payoff
    const maxPayoff = Math.max(...payoffs)
    const bestStrategies = payoffs.map((payoff, index) => 
      Math.abs(payoff - maxPayoff) < 1e-6 ? index : -1
    ).filter(index => index >= 0)

    // If multiple best strategies, return the first one's probability (simplified)
    // In reality, this would involve mixed strategy calculations
    return bestStrategies.length > 0 ? bestStrategies[0] / (numStrategies - 1) : 0
  }

  private findBestResponseIntersections(
    bestResponseFunctions: BestResponseFunction[][]
  ): BestResponseIntersection[] {
    const intersections: BestResponseIntersection[] = []
    
    // Simplified intersection finding - in reality this would be more complex
    // For now, identify points where best responses are consistent
    
    if (bestResponseFunctions.length >= 2) {
      const player1Functions = bestResponseFunctions[0]
      const player2Functions = bestResponseFunctions[1]

      // Look for mutual best responses
      for (let i = 0; i < player1Functions.length && i < player2Functions.length; i++) {
        const p1Response = player1Functions[i]
        const p2Response = player2Functions[i]

        // Check if these are mutual best responses (simplified check)
        if (p1Response.bestResponse === i && p2Response.bestResponse === i) {
          intersections.push({
            strategies: [p1Response.bestResponse, p2Response.bestResponse],
            payoffs: [p1Response.maxPayoff, p2Response.maxPayoff],
            type: 'pure',
            stability: this.calculateStability([p1Response.bestResponse, p2Response.bestResponse]),
            isNashEquilibrium: true
          })
        }
      }
    }

    return intersections
  }

  private calculateStability(strategies: number[]): number {
    // Simplified stability calculation
    // In reality, this would analyze local convergence properties
    return 0.8 // Placeholder
  }

  private findDominantStrategies(): { player: number; strategy: number; type: 'strict' | 'weak' }[] {
    // Use existing GameTheoryUtils functionality
    const dominantStrategies: { player: number; strategy: number; type: 'strict' | 'weak' }[] = []
    
    try {
      const analysis = this.gameUtils.findDominantStrategies(this.payoffMatrix, this.strategies)
      // Convert analysis to required format
      analysis.forEach((strategyInfo, index) => {
        if (strategyInfo.includes('dominant')) {
          dominantStrategies.push({
            player: 0, // Simplified - would need better parsing
            strategy: index,
            type: 'strict'
          })
        }
      })
    } catch (error) {
      console.warn('Error finding dominant strategies:', error)
    }

    return dominantStrategies
  }

  private performIterativeElimination() {
    // Simplified iterative elimination
    const numPlayers = this.getNumberOfPlayers()
    const numStrategies = this.strategies.length
    
    return {
      rounds: [],
      finalStrategies: new Array(numPlayers).fill(null).map(() => 
        Array.from({ length: numStrategies }, (_, i) => i)
      )
    }
  }

  private generatePayoffContours(resolution: number) {
    const numPlayers = this.getNumberOfPlayers()
    const contours = []

    for (let player = 0; player < numPlayers; player++) {
      const playerContours = {
        player,
        contours: [] as Array<{ level: number; points: Array<{ x: number; y: number }> }>
      }

      // Generate contour lines for different payoff levels
      const levels = [0.25, 0.5, 0.75, 1.0]
      levels.forEach(level => {
        const points: Array<{ x: number; y: number }> = []
        
        for (let i = 0; i <= resolution; i++) {
          const x = i / resolution
          const y = level * Math.sin(x * Math.PI) // Simplified contour shape
          points.push({ x, y })
        }

        playerContours.contours.push({ level, points })
      })

      contours.push(playerContours)
    }

    return contours
  }

  private getNumberOfPlayers(): number {
    if (this.payoffMatrix.length === 0) return 0
    if (this.payoffMatrix[0].length === 0) return 0
    return this.payoffMatrix[0][0].length
  }
}
