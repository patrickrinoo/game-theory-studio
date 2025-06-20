"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import type { GameScenario } from "@/app/page"
import { Wrench, Plus, Trash2, Save } from "lucide-react"

interface CustomGameBuilderProps {
  onGameCreated: (game: GameScenario) => void
}

export function CustomGameBuilder({ onGameCreated }: CustomGameBuilderProps) {
  const [gameName, setGameName] = useState("")
  const [gameDescription, setGameDescription] = useState("")
  const [playerCount, setPlayerCount] = useState(2)
  const [strategies, setStrategies] = useState<string[]>(["Strategy 1", "Strategy 2"])
  const [category, setCategory] = useState("Custom")
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner")
  const [realWorldExample, setRealWorldExample] = useState("")
  const [payoffMatrix, setPayoffMatrix] = useState<number[][][]>([])

  const addStrategy = () => {
    if (strategies.length < 5) {
      setStrategies([...strategies, `Strategy ${strategies.length + 1}`])
    }
  }

  const removeStrategy = (index: number) => {
    if (strategies.length > 2) {
      const newStrategies = strategies.filter((_, i) => i !== index)
      setStrategies(newStrategies)
    }
  }

  const updateStrategy = (index: number, value: string) => {
    const newStrategies = [...strategies]
    newStrategies[index] = value
    setStrategies(newStrategies)
  }

  const initializeMatrix = () => {
    const matrix = Array(strategies.length)
      .fill(null)
      .map(() =>
        Array(strategies.length)
          .fill(null)
          .map(() => [0, 0]),
      )
    setPayoffMatrix([matrix])
  }

  const updatePayoff = (row: number, col: number, player: number, value: number) => {
    const newMatrix = [...payoffMatrix]
    if (!newMatrix[0]) newMatrix[0] = []
    if (!newMatrix[0][row]) newMatrix[0][row] = []
    if (!newMatrix[0][row][col]) newMatrix[0][row][col] = [0, 0]
    newMatrix[0][row][col][player] = value
    setPayoffMatrix(newMatrix)
  }

  const createGame = () => {
    if (!gameName || !gameDescription || payoffMatrix.length === 0) return

    const customGame: GameScenario = {
      id: `custom-${Date.now()}`,
      name: gameName,
      description: gameDescription,
      playerCount,
      strategies,
      category,
      difficulty,
      realWorldExample,
      defaultMatrix: payoffMatrix,
    }

    onGameCreated(customGame)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            Custom Game Builder
          </CardTitle>
          <CardDescription>Create your own game theory scenarios with custom rules and payoffs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Game Name</Label>
              <Input
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name..."
                className="mt-2 bg-white/50 border-white/20 rounded-xl"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2 bg-white/50 border-white/20 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Custom">Custom</SelectItem>
                  <SelectItem value="Coordination">Coordination</SelectItem>
                  <SelectItem value="Conflict">Conflict</SelectItem>
                  <SelectItem value="Zero-Sum">Zero-Sum</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                <SelectTrigger className="mt-2 bg-white/50 border-white/20 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Players</Label>
              <Input
                type="number"
                value={playerCount}
                onChange={(e) => setPlayerCount(Math.min(4, Math.max(2, Number.parseInt(e.target.value) || 2)))}
                min={2}
                max={4}
                className="mt-2 bg-white/50 border-white/20 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={gameDescription}
              onChange={(e) => setGameDescription(e.target.value)}
              placeholder="Describe your game scenario..."
              className="mt-2 bg-white/50 border-white/20 rounded-xl"
              rows={3}
            />
          </div>

          <div>
            <Label>Real-world Examples</Label>
            <Input
              value={realWorldExample}
              onChange={(e) => setRealWorldExample(e.target.value)}
              placeholder="Where might this game apply in real life?"
              className="mt-2 bg-white/50 border-white/20 rounded-xl"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Strategies</Label>
              <Button
                onClick={addStrategy}
                disabled={strategies.length >= 5}
                size="sm"
                variant="outline"
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Strategy
              </Button>
            </div>
            <div className="space-y-2">
              {strategies.map((strategy, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={strategy}
                    onChange={(e) => updateStrategy(index, e.target.value)}
                    className="bg-white/50 border-white/20 rounded-xl"
                  />
                  <Button
                    onClick={() => removeStrategy(index)}
                    disabled={strategies.length <= 2}
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={initializeMatrix} variant="outline" className="rounded-xl">
              Initialize Payoff Matrix
            </Button>
            <Button
              onClick={createGame}
              disabled={!gameName || !gameDescription || payoffMatrix.length === 0}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Game
            </Button>
          </div>
        </CardContent>
      </Card>

      {payoffMatrix.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>Payoff Matrix</CardTitle>
            <CardDescription>Set the payoffs for each strategy combination</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 rounded-tl-lg"></th>
                    {strategies.map((strategy, index) => (
                      <th key={index} className="border p-2 bg-gray-50 font-medium">
                        Player 2: {strategy}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((rowStrategy, row) => (
                    <tr key={row}>
                      <td className="border p-2 bg-gray-50 font-medium">Player 1: {rowStrategy}</td>
                      {strategies.map((colStrategy, col) => (
                        <td key={col} className="border p-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={payoffMatrix[0]?.[row]?.[col]?.[0] || 0}
                              onChange={(e) => updatePayoff(row, col, 0, Number.parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm bg-blue-50"
                              placeholder="P1"
                            />
                            <Input
                              type="number"
                              value={payoffMatrix[0]?.[row]?.[col]?.[1] || 0}
                              onChange={(e) => updatePayoff(row, col, 1, Number.parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm bg-red-50"
                              placeholder="P2"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
