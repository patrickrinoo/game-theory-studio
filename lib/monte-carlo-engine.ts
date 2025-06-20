export class MonteCarloEngine {
  async runSimulation(params: {
    game: any
    payoffMatrix: number[][][]
    iterations: number
    playerStrategies: string[]
    mixedStrategies: number[][]
    onProgress: (progress: number) => void
  }) {
    const { game, payoffMatrix, iterations, playerStrategies, mixedStrategies, onProgress } = params

    const outcomes: { [key: string]: number } = {}
    const strategyFrequencies: { [key: string]: number } = {}
    const convergenceData: Array<{ iteration: number; strategies: number[] }> = []
    const playerPayoffs: number[][] = Array(game.playerCount)
      .fill(null)
      .map(() => [])

    for (let i = 0; i < iterations; i++) {
      // Update progress every 1000 iterations
      if (i % 1000 === 0) {
        onProgress((i / iterations) * 100)
        // Allow UI to update
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      // Determine strategies for each player
      const chosenStrategies: number[] = []

      for (let playerIndex = 0; playerIndex < game.playerCount; playerIndex++) {
        const playerStrategy = playerStrategies[playerIndex]

        if (playerStrategy === "mixed") {
          // Use mixed strategy probabilities
          const probabilities =
            mixedStrategies[playerIndex] || new Array(game.strategies.length).fill(1 / game.strategies.length)
          chosenStrategies.push(this.selectStrategyByProbability(probabilities))
        } else {
          // Use pure strategy
          const strategyIndex = game.strategies.findIndex(
            (s: string) => s.toLowerCase() === playerStrategy.toLowerCase(),
          )
          chosenStrategies.push(strategyIndex >= 0 ? strategyIndex : 0)
        }
      }

      // Calculate payoffs for this iteration
      const iterationPayoffs = this.calculatePayoffs(chosenStrategies, payoffMatrix[0])

      // Record payoffs for each player
      iterationPayoffs.forEach((payoff, playerIndex) => {
        playerPayoffs[playerIndex].push(payoff)
      })

      // Record outcome
      const outcomeKey = chosenStrategies.map((s) => game.strategies[s]).join("-")
      outcomes[outcomeKey] = (outcomes[outcomeKey] || 0) + 1

      // Record strategy frequency
      const strategyKey = chosenStrategies.map((s) => game.strategies[s]).join("-")
      strategyFrequencies[strategyKey] = (strategyFrequencies[strategyKey] || 0) + 1

      // Record convergence data (sample every 100 iterations for performance)
      if (i % 100 === 0) {
        convergenceData.push({
          iteration: i,
          strategies: [...chosenStrategies],
        })
      }
    }

    // Calculate expected payoffs
    const expectedPayoffs = playerPayoffs.map(
      (payoffs) => payoffs.reduce((sum, payoff) => sum + payoff, 0) / payoffs.length,
    )

    onProgress(100)

    return {
      iterations,
      outcomes,
      strategyFrequencies,
      expectedPayoffs,
      convergenceData,
    }
  }

  private selectStrategyByProbability(probabilities: number[]): number {
    const random = Math.random()
    let cumulative = 0

    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i]
      if (random <= cumulative) {
        return i
      }
    }

    return probabilities.length - 1 // Fallback
  }

  private calculatePayoffs(strategies: number[], payoffMatrix: number[][][]): number[] {
    if (strategies.length === 2) {
      // 2-player game
      const [player1Strategy, player2Strategy] = strategies
      return payoffMatrix[player1Strategy][player2Strategy]
    }

    // For now, only support 2-player games
    // Could be extended for n-player games
    return [0, 0]
  }
}
