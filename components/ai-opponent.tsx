"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import type { GameScenario } from "@/app/page"
import { Bot, Play, Brain, Zap, Target } from "lucide-react"

interface AIOpponentProps {
  selectedGame: GameScenario | null
}

const aiStrategies = [
  {
    id: "minimax",
    name: "Minimax",
    description: "Minimizes the maximum possible loss",
    difficulty: "Advanced",
    icon: Brain,
  },
  {
    id: "reinforcement",
    name: "Q-Learning",
    description: "Learns optimal strategies through trial and error",
    difficulty: "Expert",
    icon: Zap,
  },
  {
    id: "evolutionary",
    name: "Genetic Algorithm",
    description: "Evolves strategies over multiple generations",
    difficulty: "Advanced",
    icon: Target,
  },
  {
    id: "neural",
    name: "Neural Network",
    description: "Deep learning approach to strategy optimization",
    difficulty: "Expert",
    icon: Brain,
  },
]

export function AIOpponent({ selectedGame }: AIOpponentProps) {
  const [selectedAI, setSelectedAI] = useState("")
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [aiPerformance, setAiPerformance] = useState<{ [key: string]: number }>({})

  const trainAI = async () => {
    if (!selectedAI || !selectedGame) return

    setIsTraining(true)
    setTrainingProgress(0)

    // Simulate AI training
    for (let i = 0; i <= 100; i += 5) {
      setTrainingProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Simulate performance results
    const performance = {
      winRate: Math.random() * 40 + 60, // 60-100%
      avgPayoff: Math.random() * 2 + 2, // 2-4
      convergenceTime: Math.random() * 50 + 10, // 10-60 seconds
    }

    setAiPerformance(performance)
    setIsTraining(false)
  }

  if (!selectedGame) {
    return (
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">Select a game scenario to train AI opponents.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            AI Opponent Training
          </CardTitle>
          <CardDescription>Train artificial intelligence agents to play against in {selectedGame.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select AI Strategy</label>
            <Select value={selectedAI} onValueChange={setSelectedAI}>
              <SelectTrigger className="bg-white/50 border-white/20 rounded-xl">
                <SelectValue placeholder="Choose an AI strategy..." />
              </SelectTrigger>
              <SelectContent>
                {aiStrategies.map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.id}>
                    <div className="flex items-center gap-2">
                      <strategy.icon className="w-4 h-4" />
                      {strategy.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAI && (
            <div className="p-4 bg-blue-50/50 rounded-2xl">
              {(() => {
                const strategy = aiStrategies.find((s) => s.id === selectedAI)
                if (!strategy) return null
                const IconComponent = strategy.icon
                return (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{strategy.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">{strategy.difficulty}</Badge>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {isTraining && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Training Progress</span>
                <span>{trainingProgress}%</span>
              </div>
              <Progress value={trainingProgress} className="h-2" />
              <p className="text-sm text-gray-600">AI is learning optimal strategies through simulation...</p>
            </div>
          )}

          <Button
            onClick={trainAI}
            disabled={!selectedAI || isTraining}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl"
          >
            {isTraining ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Training AI...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start AI Training
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {Object.keys(aiPerformance).length > 0 && (
        <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>AI Performance Metrics</CardTitle>
            <CardDescription>Training results and performance statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50/50 rounded-2xl text-center">
                <div className="text-2xl font-bold text-green-600">{aiPerformance.winRate?.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Win Rate</div>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-2xl text-center">
                <div className="text-2xl font-bold text-blue-600">{aiPerformance.avgPayoff?.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Avg Payoff</div>
              </div>
              <div className="p-4 bg-purple-50/50 rounded-2xl text-center">
                <div className="text-2xl font-bold text-purple-600">{aiPerformance.convergenceTime?.toFixed(0)}s</div>
                <div className="text-sm text-gray-600">Training Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
