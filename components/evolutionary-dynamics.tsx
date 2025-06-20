"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import type { GameScenario } from "@/app/page"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp, Play, Pause, RotateCcw, Zap } from "lucide-react"

interface PopulationData {
  generation: number
  [key: string]: number
}

interface EvolutionaryDynamicsProps {
  selectedGame: GameScenario | null
}

export function EvolutionaryDynamics({ selectedGame }: EvolutionaryDynamicsProps) {
  const [populationSize, setPopulationSize] = useState(1000)
  const [generations, setGenerations] = useState(100)
  const [mutationRate, setMutationRate] = useState(0.01)
  const [selectionPressure, setSelectionPressure] = useState(1.0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentGeneration, setCurrentGeneration] = useState(0)
  const [populationData, setPopulationData] = useState<PopulationData[]>([])
  const [finalDistribution, setFinalDistribution] = useState<{ [key: string]: number }>({})

  const runEvolution = async () => {
    if (!selectedGame) return

    setIsRunning(true)
    setIsPaused(false)
    setCurrentGeneration(0)
    setPopulationData([])

    // Initialize population with equal distribution
    const strategies = selectedGame.strategies
    const population: { [key: string]: number } = {}
    strategies.forEach((strategy) => {
      population[strategy] = populationSize / strategies.length
    })

    const data: PopulationData[] = []

    for (let gen = 0; gen <= generations; gen++) {
      if (isPaused) {
        await new Promise((resolve) => {
          const checkPause = () => {
            if (!isPaused) resolve(undefined)
            else setTimeout(checkPause, 100)
          }
          checkPause()
        })
      }

      // Record current population
      const dataPoint: PopulationData = { generation: gen }
      strategies.forEach((strategy) => {
        dataPoint[strategy] = population[strategy]
      })
      data.push(dataPoint)
      setPopulationData([...data])
      setCurrentGeneration(gen)

      if (gen < generations) {
        // Calculate fitness for each strategy
        const fitness: { [key: string]: number } = {}

        strategies.forEach((strategy1, i) => {
          let totalFitness = 0
          strategies.forEach((strategy2, j) => {
            const payoff = selectedGame.defaultMatrix[0][i][j][0]
            totalFitness += payoff * population[strategy2]
          })
          fitness[strategy1] = totalFitness / populationSize
        })

        // Apply selection and mutation
        const newPopulation: { [key: string]: number } = {}
        const totalFitness = Object.values(fitness).reduce((sum, f) => sum + Math.max(0, f), 0)

        if (totalFitness > 0) {
          strategies.forEach((strategy) => {
            const relativeFitness = Math.max(0, fitness[strategy]) / totalFitness
            let newSize = relativeFitness * populationSize * selectionPressure

            // Add mutation
            strategies.forEach((otherStrategy) => {
              if (strategy !== otherStrategy) {
                const mutationFlow = (population[strategy] * mutationRate) / (strategies.length - 1)
                newSize -= mutationFlow
                newPopulation[otherStrategy] = (newPopulation[otherStrategy] || 0) + mutationFlow
              }
            })

            newPopulation[strategy] = Math.max(0, newSize)
          })

          // Normalize to maintain population size
          const totalNew = Object.values(newPopulation).reduce((sum, n) => sum + n, 0)
          if (totalNew > 0) {
            strategies.forEach((strategy) => {
              population[strategy] = (newPopulation[strategy] / totalNew) * populationSize
            })
          }
        }

        // Small delay for animation
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    setFinalDistribution(population)
    setIsRunning(false)
  }

  const pauseEvolution = () => {
    setIsPaused(!isPaused)
  }

  const resetEvolution = () => {
    setIsRunning(false)
    setIsPaused(false)
    setCurrentGeneration(0)
    setPopulationData([])
    setFinalDistribution({})
  }

  if (!selectedGame) {
    return (
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">Select a game scenario to explore evolutionary dynamics.</p>
        </CardContent>
      </Card>
    )
  }

  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"]

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Evolutionary Dynamics
          </CardTitle>
          <CardDescription>
            Simulate how strategies evolve over time through natural selection and mutation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Population Size</Label>
              <Input
                type="number"
                value={populationSize}
                onChange={(e) => setPopulationSize(Math.max(100, Number.parseInt(e.target.value) || 100))}
                min={100}
                max={10000}
                className="mt-2 bg-white/50 border-white/20 rounded-xl"
              />
            </div>

            <div>
              <Label>Generations</Label>
              <Input
                type="number"
                value={generations}
                onChange={(e) => setGenerations(Math.max(10, Number.parseInt(e.target.value) || 10))}
                min={10}
                max={500}
                className="mt-2 bg-white/50 border-white/20 rounded-xl"
              />
            </div>

            <div>
              <Label>Mutation Rate: {(mutationRate * 100).toFixed(1)}%</Label>
              <Slider
                value={[mutationRate * 100]}
                onValueChange={([value]) => setMutationRate(value / 100)}
                max={10}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Selection Pressure: {selectionPressure.toFixed(1)}x</Label>
              <Slider
                value={[selectionPressure]}
                onValueChange={([value]) => setSelectionPressure(value)}
                min={0.1}
                max={3}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={runEvolution}
              disabled={isRunning && !isPaused}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? "Running..." : "Start Evolution"}
            </Button>

            {isRunning && (
              <Button onClick={pauseEvolution} variant="outline" className="rounded-xl">
                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}

            <Button onClick={resetEvolution} variant="outline" className="rounded-xl">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {isRunning && (
            <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl">
              <Zap className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium">
                  Generation {currentGeneration} of {generations}
                </div>
                <div className="text-sm text-gray-600">
                  {((currentGeneration / generations) * 100).toFixed(1)}% complete
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {populationData.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>Population Evolution</CardTitle>
            <CardDescription>Strategy frequencies over generations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={populationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="generation" />
                <YAxis />
                <Tooltip />
                {selectedGame.strategies.map((strategy, index) => (
                  <Area
                    key={strategy}
                    type="monotone"
                    dataKey={strategy}
                    stackId="1"
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {Object.keys(finalDistribution).length > 0 && (
        <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>Final Distribution</CardTitle>
            <CardDescription>Strategy frequencies after evolution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(finalDistribution).map(([strategy, count], index) => {
                const percentage = (count / populationSize) * 100
                return (
                  <div key={strategy} className="p-4 bg-white/50 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{strategy}</span>
                      <Badge style={{ backgroundColor: colors[index % colors.length] }} className="text-white">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{Math.round(count)} individuals</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
