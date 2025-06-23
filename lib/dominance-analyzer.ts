/**
 * Strategic Dominance Analysis Module
 * 
 * This module provides comprehensive analysis of strategic dominance in game theory,
 * including strict and weak dominance, iterative elimination of dominated strategies,
 * and educational explanations of the results.
 */

import { PayoffMatrix, Strategy, DominantStrategy } from './game-theory-types';

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

export class DominanceAnalyzer {
  private payoffMatrix: PayoffMatrix;
  private originalStrategies: Strategy[];

  constructor(payoffMatrix: PayoffMatrix) {
    this.payoffMatrix = payoffMatrix;
    this.originalStrategies = [...payoffMatrix.strategies];
  }

  /**
   * Performs comprehensive dominance analysis
   */
  public analyze(): DominanceAnalysisResult {
    const strictlyDominantStrategies = this.findStrictlyDominantStrategies();
    const weaklyDominantStrategies = this.findWeaklyDominantStrategies();
    const strictlyDominatedStrategies = this.findStrictlyDominatedStrategies();
    const weaklyDominatedStrategies = this.findWeaklyDominatedStrategies();
    
    const iterativeElimination = this.performIterativeElimination();
    const reducedGame = this.createReducedGame(iterativeElimination);
    
    const result: DominanceAnalysisResult = {
      hasStrictDominance: strictlyDominantStrategies.length > 0,
      hasWeakDominance: weaklyDominantStrategies.length > 0,
      strictlyDominantStrategies,
      weaklyDominantStrategies,
      strictlyDominatedStrategies,
      weaklyDominatedStrategies,
      iterativeElimination,
      reducedGame,
      explanation: this.generateExplanation(strictlyDominantStrategies, weaklyDominantStrategies, iterativeElimination),
      recommendations: this.generateRecommendations(strictlyDominantStrategies, weaklyDominantStrategies, iterativeElimination)
    };

    return result;
  }

  /**
   * Finds strictly dominant strategies for all players
   */
  private findStrictlyDominantStrategies(): DominantStrategyInfo[] {
    const dominantStrategies: DominantStrategyInfo[] = [];
    
    for (let playerIndex = 0; playerIndex < this.payoffMatrix.players; playerIndex++) {
      const playerStrategies = this.payoffMatrix.strategies.length;
      
      for (let strategyIndex = 0; strategyIndex < playerStrategies; strategyIndex++) {
        const dominatedStrategies: number[] = [];
        const payoffComparisons: PayoffComparison[] = [];
        
        // Compare this strategy against all other strategies for this player
        for (let otherStrategy = 0; otherStrategy < playerStrategies; otherStrategy++) {
          if (strategyIndex === otherStrategy) continue;
          
          const comparison = this.compareStrategies(playerIndex, strategyIndex, otherStrategy);
          payoffComparisons.push(comparison);
          
          if (comparison.isStrictlyBetter) {
            dominatedStrategies.push(otherStrategy);
          }
        }
        
        // If this strategy strictly dominates at least one other strategy
        if (dominatedStrategies.length > 0) {
          // Check if it strictly dominates ALL other strategies (globally dominant)
          const isGloballyDominant = dominatedStrategies.length === playerStrategies - 1;
          
          dominantStrategies.push({
            playerIndex,
            strategyIndex,
            strategyName: this.payoffMatrix.strategies[strategyIndex].name,
            dominanceType: 'strict',
            dominatedStrategies,
            dominatedStrategyNames: dominatedStrategies.map(idx => this.payoffMatrix.strategies[idx].name),
            explanation: isGloballyDominant 
              ? `Strategy "${this.payoffMatrix.strategies[strategyIndex].name}" strictly dominates all other strategies for Player ${playerIndex + 1}.`
              : `Strategy "${this.payoffMatrix.strategies[strategyIndex].name}" strictly dominates ${dominatedStrategies.length} other strategies for Player ${playerIndex + 1}.`,
            payoffComparison: payoffComparisons.filter(comp => comp.isStrictlyBetter)
          });
        }
      }
    }
    
    return dominantStrategies;
  }

  /**
   * Finds weakly dominant strategies for all players
   */
  private findWeaklyDominantStrategies(): DominantStrategyInfo[] {
    const weaklyDominantStrategies: DominantStrategyInfo[] = [];
    
    // Only look for weak dominance if no strict dominance exists for that player
    const strictlyDominantPlayers = new Set(
      this.findStrictlyDominantStrategies().map(ds => ds.playerIndex)
    );
    
    for (let playerIndex = 0; playerIndex < this.payoffMatrix.players; playerIndex++) {
      if (strictlyDominantPlayers.has(playerIndex)) continue;
      
      const playerStrategies = this.payoffMatrix.strategies.length;
      
      for (let strategyIndex = 0; strategyIndex < playerStrategies; strategyIndex++) {
        const dominatedStrategies: number[] = [];
        const payoffComparisons: PayoffComparison[] = [];
        
        for (let otherStrategy = 0; otherStrategy < playerStrategies; otherStrategy++) {
          if (strategyIndex === otherStrategy) continue;
          
          const comparison = this.compareStrategies(playerIndex, strategyIndex, otherStrategy);
          payoffComparisons.push(comparison);
          
          if (comparison.isWeaklyBetter && !comparison.isStrictlyBetter) {
            dominatedStrategies.push(otherStrategy);
          }
        }
        
        if (dominatedStrategies.length > 0) {
          weaklyDominantStrategies.push({
            playerIndex,
            strategyIndex,
            strategyName: this.payoffMatrix.strategies[strategyIndex].name,
            dominanceType: 'weak',
            dominatedStrategies,
            dominatedStrategyNames: dominatedStrategies.map(idx => this.payoffMatrix.strategies[idx].name),
            explanation: `Strategy "${this.payoffMatrix.strategies[strategyIndex].name}" weakly dominates ${dominatedStrategies.length} other strategies for Player ${playerIndex + 1}.`,
            payoffComparison: payoffComparisons.filter(comp => comp.isWeaklyBetter)
          });
        }
      }
    }
    
    return weaklyDominantStrategies;
  }

  /**
   * Finds strictly dominated strategies for all players
   */
  private findStrictlyDominatedStrategies(): DominatedStrategyInfo[] {
    const dominatedStrategies: DominatedStrategyInfo[] = [];
    
    for (let playerIndex = 0; playerIndex < this.payoffMatrix.players; playerIndex++) {
      const playerStrategies = this.payoffMatrix.strategies.length;
      
      for (let strategyIndex = 0; strategyIndex < playerStrategies; strategyIndex++) {
        const dominatedBy: number[] = [];
        
        // Check if this strategy is dominated by any other strategy
        for (let otherStrategy = 0; otherStrategy < playerStrategies; otherStrategy++) {
          if (strategyIndex === otherStrategy) continue;
          
          const comparison = this.compareStrategies(playerIndex, otherStrategy, strategyIndex);
          
          if (comparison.isStrictlyBetter) {
            dominatedBy.push(otherStrategy);
          }
        }
        
        if (dominatedBy.length > 0) {
          dominatedStrategies.push({
            playerIndex,
            strategyIndex,
            strategyName: this.payoffMatrix.strategies[strategyIndex].name,
            dominationType: 'strict',
            dominatedBy,
            dominatedByNames: dominatedBy.map(idx => this.payoffMatrix.strategies[idx].name),
            explanation: `Strategy "${this.payoffMatrix.strategies[strategyIndex].name}" is strictly dominated by ${dominatedBy.length} other strategies for Player ${playerIndex + 1}.`,
            shouldEliminate: true
          });
        }
      }
    }
    
    return dominatedStrategies;
  }

  /**
   * Finds weakly dominated strategies for all players
   */
  private findWeaklyDominatedStrategies(): DominatedStrategyInfo[] {
    const weaklyDominatedStrategies: DominatedStrategyInfo[] = [];
    
    for (let playerIndex = 0; playerIndex < this.payoffMatrix.players; playerIndex++) {
      const playerStrategies = this.payoffMatrix.strategies.length;
      
      for (let strategyIndex = 0; strategyIndex < playerStrategies; strategyIndex++) {
        const dominatedBy: number[] = [];
        
        for (let otherStrategy = 0; otherStrategy < playerStrategies; otherStrategy++) {
          if (strategyIndex === otherStrategy) continue;
          
          const comparison = this.compareStrategies(playerIndex, otherStrategy, strategyIndex);
          
          if (comparison.isWeaklyBetter && !comparison.isStrictlyBetter) {
            dominatedBy.push(otherStrategy);
          }
        }
        
        if (dominatedBy.length > 0) {
          weaklyDominatedStrategies.push({
            playerIndex,
            strategyIndex,
            strategyName: this.payoffMatrix.strategies[strategyIndex].name,
            dominationType: 'weak',
            dominatedBy,
            dominatedByNames: dominatedBy.map(idx => this.payoffMatrix.strategies[idx].name),
            explanation: `Strategy "${this.payoffMatrix.strategies[strategyIndex].name}" is weakly dominated by ${dominatedBy.length} other strategies for Player ${playerIndex + 1}.`,
            shouldEliminate: false // Weak dominance doesn't guarantee elimination
          });
        }
      }
    }
    
    return weaklyDominatedStrategies;
  }

  /**
   * Compares two strategies for a given player
   */
  private compareStrategies(playerIndex: number, strategy1: number, strategy2: number): PayoffComparison {
    const strategy1Payoffs: number[] = [];
    const strategy2Payoffs: number[] = [];
    
    // Get all possible payoffs for both strategies against all opponent strategy combinations
    const opponentCombinations = this.generateOpponentCombinations(playerIndex);
    
    for (const opponentStrategies of opponentCombinations) {
      const fullProfile1 = [...opponentStrategies];
      fullProfile1[playerIndex] = strategy1;
      
      const fullProfile2 = [...opponentStrategies];
      fullProfile2[playerIndex] = strategy2;
      
      strategy1Payoffs.push(this.getPayoff(fullProfile1, playerIndex));
      strategy2Payoffs.push(this.getPayoff(fullProfile2, playerIndex));
    }
    
    const differences = strategy1Payoffs.map((p1, i) => p1 - strategy2Payoffs[i]);
    const isStrictlyBetter = differences.every(diff => diff > 0);
    const isWeaklyBetter = differences.every(diff => diff >= 0) && differences.some(diff => diff > 0);
    
    return {
      againstStrategy: strategy2,
      againstStrategyName: this.payoffMatrix.strategies[strategy2].name,
      dominantPayoffs: strategy1Payoffs,
      dominatedPayoffs: strategy2Payoffs,
      difference: differences,
      isStrictlyBetter,
      isWeaklyBetter: isWeaklyBetter || isStrictlyBetter
    };
  }

  /**
   * Generates all possible opponent strategy combinations
   */
  private generateOpponentCombinations(excludePlayerIndex: number): number[][] {
    const combinations: number[][] = [];
    const numStrategies = this.payoffMatrix.strategies.length;
    const numPlayers = this.payoffMatrix.players;
    
    if (numPlayers === 2) {
      // For 2-player games, opponent has simple strategy choices
      for (let opponentStrategy = 0; opponentStrategy < numStrategies; opponentStrategy++) {
        const combination = new Array(numPlayers).fill(0);
        const opponentIndex = excludePlayerIndex === 0 ? 1 : 0;
        combination[opponentIndex] = opponentStrategy;
        combinations.push(combination);
      }
    } else {
      // For n-player games, generate all combinations of opponent strategies
      const opponentIndices = Array.from({ length: numPlayers }, (_, i) => i)
        .filter(i => i !== excludePlayerIndex);
      
      const generateCombinations = (indices: number[], currentCombination: number[]): void => {
        if (indices.length === 0) {
          const fullCombination = new Array(numPlayers).fill(0);
          let opponentIndex = 0;
          for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
            if (playerIndex !== excludePlayerIndex) {
              fullCombination[playerIndex] = currentCombination[opponentIndex];
              opponentIndex++;
            }
          }
          combinations.push(fullCombination);
          return;
        }
        
        const [firstIndex, ...restIndices] = indices;
        for (let strategy = 0; strategy < numStrategies; strategy++) {
          generateCombinations(restIndices, [...currentCombination, strategy]);
        }
      };
      
      generateCombinations(opponentIndices, []);
    }
    
    return combinations;
  }

  /**
   * Gets the payoff for a specific strategy profile and player
   */
  private getPayoff(strategyProfile: number[], playerIndex: number): number {
    // Handle different payoff matrix structures based on number of players
    if (this.payoffMatrix.players === 2) {
      return this.payoffMatrix.payoffs[strategyProfile[0]][strategyProfile[1]][playerIndex];
    } else {
      // For n-player games, we need to map strategy profiles to payoff indices
      // This assumes a specific payoff matrix structure for multi-player games
      const [strategy1, strategy2] = strategyProfile;
      return this.payoffMatrix.payoffs[strategy1][strategy2][playerIndex];
    }
  }

  /**
   * Performs iterative elimination of dominated strategies
   */
  private performIterativeElimination(): EliminationStep[] {
    const steps: EliminationStep[] = [];
    let currentMatrix = JSON.parse(JSON.stringify(this.payoffMatrix));
    let activeStrategies = this.payoffMatrix.strategies.map((_, i) => i);
    let stepNumber = 1;
    
    while (true) {
      const eliminatedInThisStep: EliminationStep['eliminatedStrategies'] = [];
      
      // Find strictly dominated strategies in current reduced game
      for (let playerIndex = 0; playerIndex < currentMatrix.players; playerIndex++) {
        const playerActiveStrategies = activeStrategies.filter(s => s < currentMatrix.strategies.length);
        
        for (const strategyIndex of playerActiveStrategies) {
          // Check if this strategy is strictly dominated by any other active strategy
          for (const dominatingStrategy of playerActiveStrategies) {
            if (strategyIndex === dominatingStrategy) continue;
            
            const comparison = this.compareStrategiesInReducedGame(
              playerIndex, dominatingStrategy, strategyIndex, activeStrategies
            );
            
            if (comparison.isStrictlyBetter) {
              eliminatedInThisStep.push({
                playerIndex,
                strategyIndex,
                strategyName: this.payoffMatrix.strategies[strategyIndex].name,
                reason: `Strictly dominated by strategy "${this.payoffMatrix.strategies[dominatingStrategy].name}"`,
                dominatedBy: dominatingStrategy,
                dominatedByName: this.payoffMatrix.strategies[dominatingStrategy].name
              });
              
              // Remove from active strategies
              activeStrategies = activeStrategies.filter(s => s !== strategyIndex);
              break; // Move to next strategy
            }
          }
        }
      }
      
      if (eliminatedInThisStep.length === 0) {
        break; // No more eliminations possible
      }
      
      steps.push({
        step: stepNumber,
        eliminatedStrategies: eliminatedInThisStep,
        remainingStrategies: this.createRemainingStrategiesMatrix(activeStrategies),
        payoffMatrix: this.createReducedPayoffMatrix(activeStrategies),
        explanation: `Step ${stepNumber}: Eliminated ${eliminatedInThisStep.length} strictly dominated strategies.`
      });
      
      stepNumber++;
    }
    
    return steps;
  }

  /**
   * Compares strategies in a reduced game
   */
  private compareStrategiesInReducedGame(
    playerIndex: number, 
    strategy1: number, 
    strategy2: number, 
    activeStrategies: number[]
  ): PayoffComparison {
    const strategy1Payoffs: number[] = [];
    const strategy2Payoffs: number[] = [];
    
    // Only consider active strategies for opponents
    const activeOpponentCombinations = this.generateActiveOpponentCombinations(playerIndex, activeStrategies);
    
    for (const opponentStrategies of activeOpponentCombinations) {
      const fullProfile1 = [...opponentStrategies];
      fullProfile1[playerIndex] = strategy1;
      
      const fullProfile2 = [...opponentStrategies];
      fullProfile2[playerIndex] = strategy2;
      
      strategy1Payoffs.push(this.getPayoff(fullProfile1, playerIndex));
      strategy2Payoffs.push(this.getPayoff(fullProfile2, playerIndex));
    }
    
    const differences = strategy1Payoffs.map((p1, i) => p1 - strategy2Payoffs[i]);
    const isStrictlyBetter = differences.every(diff => diff > 0);
    const isWeaklyBetter = differences.every(diff => diff >= 0) && differences.some(diff => diff > 0);
    
    return {
      againstStrategy: strategy2,
      againstStrategyName: this.payoffMatrix.strategies[strategy2].name,
      dominantPayoffs: strategy1Payoffs,
      dominatedPayoffs: strategy2Payoffs,
      difference: differences,
      isStrictlyBetter,
      isWeaklyBetter: isWeaklyBetter || isStrictlyBetter
    };
  }

  /**
   * Generates opponent combinations considering only active strategies
   */
  private generateActiveOpponentCombinations(excludePlayerIndex: number, activeStrategies: number[]): number[][] {
    const combinations: number[][] = [];
    const numPlayers = this.payoffMatrix.players;
    
    if (numPlayers === 2) {
      for (const opponentStrategy of activeStrategies) {
        const combination = new Array(numPlayers).fill(0);
        const opponentIndex = excludePlayerIndex === 0 ? 1 : 0;
        combination[opponentIndex] = opponentStrategy;
        combinations.push(combination);
      }
    } else {
      // For n-player games with active strategies
      const opponentIndices = Array.from({ length: numPlayers }, (_, i) => i)
        .filter(i => i !== excludePlayerIndex);
      
      const generateCombinations = (indices: number[], currentCombination: number[]): void => {
        if (indices.length === 0) {
          const fullCombination = new Array(numPlayers).fill(0);
          let opponentIndex = 0;
          for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
            if (playerIndex !== excludePlayerIndex) {
              fullCombination[playerIndex] = currentCombination[opponentIndex];
              opponentIndex++;
            }
          }
          combinations.push(fullCombination);
          return;
        }
        
        for (const strategy of activeStrategies) {
          generateCombinations(indices.slice(1), [...currentCombination, strategy]);
        }
      };
      
      generateCombinations(opponentIndices, []);
    }
    
    return combinations;
  }

  /**
   * Creates remaining strategies matrix after elimination
   */
  private createRemainingStrategiesMatrix(activeStrategies: number[]): number[][] {
    return Array.from({ length: this.payoffMatrix.players }, () => [...activeStrategies]);
  }

  /**
   * Creates reduced payoff matrix with only active strategies
   */
  private createReducedPayoffMatrix(activeStrategies: number[]): number[][][] {
    const reducedPayoffs: number[][][] = [];
    
    for (const strategy1 of activeStrategies) {
      const row: number[][] = [];
      for (const strategy2 of activeStrategies) {
        row.push([...this.payoffMatrix.payoffs[strategy1][strategy2]]);
      }
      reducedPayoffs.push(row);
    }
    
    return reducedPayoffs;
  }

  /**
   * Creates the final reduced game after all eliminations
   */
  private createReducedGame(eliminationSteps: EliminationStep[]): PayoffMatrix | null {
    if (eliminationSteps.length === 0) return null;
    
    const lastStep = eliminationSteps[eliminationSteps.length - 1];
    const activeStrategies = lastStep.remainingStrategies[0]; // All players have same remaining strategies
    
    return {
      players: this.payoffMatrix.players,
      strategies: activeStrategies.map(i => this.payoffMatrix.strategies[i]),
      payoffs: lastStep.payoffMatrix,
      isSymmetric: this.payoffMatrix.isSymmetric
    };
  }

  /**
   * Generates explanation text for the analysis
   */
  private generateExplanation(
    strictlyDominant: DominantStrategyInfo[], 
    weaklyDominant: DominantStrategyInfo[], 
    elimination: EliminationStep[]
  ): string {
    let explanation = "Strategic Dominance Analysis Results:\n\n";
    
    if (strictlyDominant.length > 0) {
      explanation += `Found ${strictlyDominant.length} strictly dominant strategies:\n`;
      strictlyDominant.forEach(ds => {
        explanation += `• ${ds.explanation}\n`;
      });
      explanation += "\n";
    }
    
    if (weaklyDominant.length > 0) {
      explanation += `Found ${weaklyDominant.length} weakly dominant strategies:\n`;
      weaklyDominant.forEach(ds => {
        explanation += `• ${ds.explanation}\n`;
      });
      explanation += "\n";
    }
    
    if (elimination.length > 0) {
      explanation += `Iterative elimination process completed in ${elimination.length} steps:\n`;
      elimination.forEach(step => {
        explanation += `• Step ${step.step}: ${step.explanation}\n`;
      });
      explanation += "\n";
    }
    
    if (strictlyDominant.length === 0 && weaklyDominant.length === 0 && elimination.length === 0) {
      explanation += "No dominant strategies found. All strategies remain viable in the analysis.\n";
    }
    
    return explanation;
  }

  /**
   * Generates strategic recommendations based on analysis
   */
  private generateRecommendations(
    strictlyDominant: DominantStrategyInfo[], 
    weaklyDominant: DominantStrategyInfo[], 
    elimination: EliminationStep[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (strictlyDominant.length > 0) {
      recommendations.push("Players should strongly consider their strictly dominant strategies as they provide the best outcomes regardless of opponents' choices.");
      
      strictlyDominant.forEach(ds => {
        recommendations.push(`Player ${ds.playerIndex + 1} should choose "${ds.strategyName}" as it strictly dominates other available strategies.`);
      });
    }
    
    if (weaklyDominant.length > 0 && strictlyDominant.length === 0) {
      recommendations.push("Consider weakly dominant strategies, but be aware that outcomes may depend on opponents' specific choices.");
    }
    
    if (elimination.length > 0) {
      const finalStep = elimination[elimination.length - 1];
      const remainingCount = finalStep.remainingStrategies[0].length;
      
      if (remainingCount < this.payoffMatrix.strategies.length) {
        recommendations.push(`After iterative elimination, focus analysis on the remaining ${remainingCount} strategies for each player.`);
        recommendations.push("Eliminated strategies are not rational choices and should not be considered in strategic planning.");
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push("No clear dominant strategies found. Consider using Nash equilibrium analysis for optimal strategy selection.");
      recommendations.push("All strategies remain potentially viable depending on the specific game context and opponent behavior.");
    }
    
    return recommendations;
  }
}
