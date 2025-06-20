"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { GameScenario } from "@/app/page"
import { Play, Loader2 } from "lucide-react"

interface SimulationControlsProps {
  game: GameScenario
  params: {
    iterations: number
    playerStrategies: string[]
    mixedStrategies: number[][]
  }
  onParamsChange: (params: any) => void
  onRunSimulation: () => void
  isSimulating: boolean
}

export function SimulationControls({
  game,
  params,
  onParamsChange,
  onRunSimulation,
  isSimulating,
}: SimulationControlsProps) {
  const updateIterations = (iterations: number) => {
    onParamsChange({ ...params, iterations })
  }

  const updatePlayerStrategy = (playerIndex: number, strategy: string) => {
    const newStrategies = [...params.playerStrategies]
    newStrategies[playerIndex] = strategy
    onParamsChange({ ...params, playerStrategies: newStrategies })
  }

  const updateMixedStrategy = (playerIndex: number, strategyIndex: number, probability: number) => {
    const newMixedStrategies = [...params.mixedStrategies]
    if (!newMixedStrategies[playerIndex]) {
      newMixedStrategies[playerIndex] = new Array(game.strategies.length).fill(0)
    }
    newMixedStrategies[playerIndex][strategyIndex] = probability / 100

    // Normalize probabilities to sum to 1
    const sum = newMixedStrategies[playerIndex].reduce((a, b) => a + b, 0)
    if (sum > 0) {
      newMixedStrategies[playerIndex] = newMixedStrategies[playerIndex].map((p) => p / sum)
    }

    onParamsChange({ ...params, mixedStrategies: newMixedStrategies })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Parameters</CardTitle>
        <CardDescription>Configure the simulation settings and player strategies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="iterations">Number of Iterations</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="iterations"
              type="number"
              value={params.iterations}
              onChange={(e) => updateIterations(Number.parseInt(e.target.value) || 1000)}
              min={100}
              max={100000}
              step={100}
              className="flex-1"
            />
            <Select
              value={params.iterations.toString()}
              onValueChange={(value) => updateIterations(Number.parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1K</SelectItem>
                <SelectItem value="5000">5K</SelectItem>
                <SelectItem value="10000">10K</SelectItem>
                <SelectItem value="50000">50K</SelectItem>
                <SelectItem value="100000">100K</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Player Strategies</Label>
          {Array.from({ length: game.playerCount }, (_, playerIndex) => (
            <div key={playerIndex} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Player {playerIndex + 1}</h4>
                <Select
                  value={params.playerStrategies[playerIndex] || "mixed"}
                  onValueChange={(value) => updatePlayerStrategy(playerIndex, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    {game.strategies.map((strategy, index) => (
                      <SelectItem key={index} value={strategy.toLowerCase()}>
                        {strategy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {params.playerStrategies[playerIndex] === "mixed" && (
                <div className="space-y-3">
                  <Label className="text-sm">Mixed Strategy Probabilities</Label>
                  {game.strategies.map((strategy, strategyIndex) => (
                    <div key={strategyIndex} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{strategy}</span>
                        <span>{((params.mixedStrategies[playerIndex]?.[strategyIndex] || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[(params.mixedStrategies[playerIndex]?.[strategyIndex] || 0) * 100]}
                        onValueChange={([value]) => updateMixedStrategy(playerIndex, strategyIndex, value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button onClick={onRunSimulation} disabled={isSimulating} className="w-full" size="lg">
          {isSimulating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Monte Carlo Simulation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
