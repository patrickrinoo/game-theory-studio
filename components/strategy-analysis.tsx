"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BestResponseChart } from "@/components/charts/best-response-chart"
import { MixedStrategyCalculator } from "@/components/mixed-strategy-calculator"
import type { GameScenario } from "@/lib/game-theory-types"
import type { SimulationResult } from "@/app/page"
import { TrendingUp, Target, AlertTriangle, CheckCircle } from "lucide-react"

interface StrategyAnalysisProps {
  results: SimulationResult
  game: GameScenario
  payoffMatrix: number[][][]
}

export function StrategyAnalysis({ results, game, payoffMatrix }: StrategyAnalysisProps) {
  const renderNashEquilibrium = () => {
    if (!results.nashEquilibrium) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No pure strategy Nash equilibrium found in this game.</AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-3">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Nash equilibrium found! This represents a stable strategy profile where no player can improve by
            unilaterally changing their strategy.
          </AlertDescription>
        </Alert>

        <div className="grid gap-2">
          {results.nashEquilibrium.strategies.map((strategyIndex, playerIndex) => (
            <div key={playerIndex} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Player {playerIndex + 1}</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-100">
                  {game.payoffMatrix.strategies[strategyIndex]?.name || `Strategy ${strategyIndex + 1}`}
                </Badge>
                <Badge variant="secondary">Payoff: {results.nashEquilibrium!.payoffs[playerIndex].toFixed(2)}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDominantStrategies = () => {
    if (!results.dominantStrategies || results.dominantStrategies.length === 0) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No dominant strategies found. Players must consider mixed strategies or game-specific tactics.
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-3">
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            Dominant strategies identified! These strategies perform well regardless of opponents' choices.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          {results.dominantStrategies.map((strategy, index) => (
            <div key={index} className="p-3 bg-blue-50 rounded-lg">
              <Badge variant="outline" className="bg-blue-100">
                {strategy}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getOptimalStrategy = () => {
    // Find the strategy with highest expected payoff
    const strategyPerformance = Object.entries(results.strategyFrequencies).map(([strategy, frequency]) => {
      const percentage = (frequency / results.iterations) * 100
      return { strategy, frequency, percentage }
    })

    return strategyPerformance.sort((a, b) => b.frequency - a.frequency)[0]
  }

  const optimalStrategy = getOptimalStrategy()

  const getGameInsights = () => {
    const insights = []

    // Check for cooperation vs defection patterns
    if (game.id === "prisoners-dilemma") {
      const cooperateFreq = results.strategyFrequencies["Cooperate-Cooperate"] || 0
      const defectFreq = results.strategyFrequencies["Defect-Defect"] || 0

      if (defectFreq > cooperateFreq) {
        insights.push(
          "The simulation shows the classic prisoner's dilemma outcome where mutual defection dominates, despite mutual cooperation yielding higher payoffs.",
        )
      } else {
        insights.push(
          "Interesting! The simulation shows more cooperation than expected, possibly due to mixed strategies or specific payoff values.",
        )
      }
    }

    // Check for coordination success
    if (game.id === "battle-of-sexes" || game.id === "stag-hunt") {
      const coordinationOutcomes = Object.entries(results.outcomes).filter(
        ([outcome]) =>
          outcome.includes("Opera-Opera") ||
          outcome.includes("Football-Football") ||
          outcome.includes("Stag-Stag") ||
          outcome.includes("Hare-Hare"),
      )

      const totalCoordination = coordinationOutcomes.reduce((sum, [, freq]) => sum + freq, 0)
      const coordinationRate = (totalCoordination / results.iterations) * 100

      insights.push(
        `Players successfully coordinated ${coordinationRate.toFixed(1)}% of the time, showing ${coordinationRate > 50 ? "good" : "poor"} coordination ability.`,
      )
    }

    // Payoff distribution analysis
    const payoffVariance =
      results.expectedPayoffs.reduce((sum, payoff, index, arr) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length
        return sum + Math.pow(payoff - mean, 2)
      }, 0) / results.expectedPayoffs.length

    if (payoffVariance < 0.1) {
      insights.push("The game shows balanced outcomes with similar expected payoffs for all players.")
    } else {
      insights.push("The game shows significant payoff differences between players, indicating asymmetric advantages.")
    }

    return insights
  }

  const insights = getGameInsights()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Strategy Analysis
        </CardTitle>
        <CardDescription>Game-theoretic analysis of simulation results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Nash Equilibrium
          </h4>
          {renderNashEquilibrium()}
        </div>

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Dominant Strategies
          </h4>
          {renderDominantStrategies()}
        </div>

        <div>
          <h4 className="font-semibold mb-3">Most Successful Strategy</h4>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{optimalStrategy.strategy}</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-yellow-100">
                  {optimalStrategy.frequency} occurrences
                </Badge>
                <Badge variant="secondary">{optimalStrategy.percentage.toFixed(1)}% of games</Badge>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Game Insights</h4>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <Alert key={index}>
                <AlertDescription>{insight}</AlertDescription>
              </Alert>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Best Response Analysis</h4>
          <BestResponseChart
            payoffMatrix={payoffMatrix}
            strategies={game.payoffMatrix.strategies.map(s => s.name)}
            interactive={true}
            showIntersections={true}
            className="mt-4"
          />
        </div>

        <div>
          <h4 className="font-semibold mb-3">Mixed Strategy Calculator</h4>
          <MixedStrategyCalculator
            game={game}
            className="mt-4"
            onStrategyChange={(config) => {
              // Handle strategy configuration changes if needed
              console.log('Mixed strategy configuration changed:', config);
            }}
          />
        </div>

        <div>
          <h4 className="font-semibold mb-3">Recommendations</h4>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <strong>For Players:</strong> Consider the Nash equilibrium strategies as a baseline, but adapt based on
              opponent behavior patterns observed in the simulation.
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <strong>For Further Analysis:</strong> Try adjusting payoff values or player strategies to see how
              equilibria change, or increase iterations for more precise probability estimates.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
