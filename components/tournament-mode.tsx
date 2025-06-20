"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import type { GameScenario } from "@/app/page"
import { Trophy, Play, Crown, Medal, Award } from "lucide-react"

interface TournamentResult {
  strategy: string
  wins: number
  losses: number
  draws: number
  totalScore: number
  winRate: number
}

interface TournamentModeProps {
  selectedGame: GameScenario | null
}

export function TournamentMode({ selectedGame }: TournamentModeProps) {
  const [tournamentType, setTournamentType] = useState("round-robin")
  const [participants, setParticipants] = useState(8)
  const [rounds, setRounds] = useState(100)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<TournamentResult[]>([])

  const strategies = [
    "Always Cooperate",
    "Always Defect",
    "Tit for Tat",
    "Generous Tit for Tat",
    "Random",
    "Grudger",
    "Pavlov",
    "Adaptive",
  ]

  const runTournament = async () => {
    if (!selectedGame) return

    setIsRunning(true)
    setProgress(0)
    setResults([])

    // Simulate tournament
    const tournamentResults: TournamentResult[] = strategies.slice(0, participants).map((strategy) => ({
      strategy,
      wins: 0,
      losses: 0,
      draws: 0,
      totalScore: 0,
      winRate: 0,
    }))

    const totalMatches =
      tournamentType === "round-robin" ? ((participants * (participants - 1)) / 2) * rounds : participants * rounds

    let completedMatches = 0

    // Simulate matches
    for (let round = 0; round < rounds; round++) {
      if (tournamentType === "round-robin") {
        for (let i = 0; i < participants; i++) {
          for (let j = i + 1; j < participants; j++) {
            // Simulate match between strategy i and j
            const result = simulateMatch(strategies[i], strategies[j], selectedGame)

            tournamentResults[i].totalScore += result.player1Score
            tournamentResults[j].totalScore += result.player2Score

            if (result.player1Score > result.player2Score) {
              tournamentResults[i].wins++
              tournamentResults[j].losses++
            } else if (result.player2Score > result.player1Score) {
              tournamentResults[j].wins++
              tournamentResults[i].losses++
            } else {
              tournamentResults[i].draws++
              tournamentResults[j].draws++
            }

            completedMatches++
            setProgress((completedMatches / totalMatches) * 100)

            // Allow UI to update
            if (completedMatches % 10 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 1))
            }
          }
        }
      }
    }

    // Calculate win rates
    tournamentResults.forEach((result) => {
      const totalGames = result.wins + result.losses + result.draws
      result.winRate = totalGames > 0 ? (result.wins / totalGames) * 100 : 0
    })

    // Sort by total score
    tournamentResults.sort((a, b) => b.totalScore - a.totalScore)

    setResults(tournamentResults)
    setIsRunning(false)
    setProgress(100)
  }

  const simulateMatch = (strategy1: string, strategy2: string, game: GameScenario) => {
    // Simplified match simulation
    const iterations = 50
    let player1Score = 0
    let player2Score = 0

    for (let i = 0; i < iterations; i++) {
      // Simple strategy logic
      const p1Action = getStrategyAction(strategy1, i)
      const p2Action = getStrategyAction(strategy2, i)

      // Get payoffs from game matrix
      const payoffs = game.defaultMatrix[0][p1Action][p2Action]
      player1Score += payoffs[0]
      player2Score += payoffs[1]
    }

    return { player1Score, player2Score }
  }

  const getStrategyAction = (strategy: string, round: number): number => {
    switch (strategy) {
      case "Always Cooperate":
        return 0
      case "Always Defect":
        return 1
      case "Random":
        return Math.random() < 0.5 ? 0 : 1
      case "Tit for Tat":
        return round === 0 ? 0 : Math.random() < 0.5 ? 0 : 1
      default:
        return Math.random() < 0.5 ? 0 : 1
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{index + 1}</span>
        )
    }
  }

  if (!selectedGame) {
    return (
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">Select a game scenario to run tournaments.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            Tournament Mode
          </CardTitle>
          <CardDescription>Pit different strategies against each other in competitive tournaments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tournament Type</Label>
              <Select value={tournamentType} onValueChange={setTournamentType}>
                <SelectTrigger className="mt-2 bg-white/50 border-white/20 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round-robin">Round Robin</SelectItem>
                  <SelectItem value="elimination">Single Elimination</SelectItem>
                  <SelectItem value="swiss">Swiss System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Participants</Label>
              <Input
                type="number"
                value={participants}
                onChange={(e) => setParticipants(Math.min(8, Math.max(2, Number.parseInt(e.target.value) || 2)))}
                min={2}
                max={8}
                className="mt-2 bg-white/50 border-white/20 rounded-xl"
              />
            </div>

            <div>
              <Label>Rounds per Match</Label>
              <Input
                type="number"
                value={rounds}
                onChange={(e) => setRounds(Math.max(1, Number.parseInt(e.target.value) || 1))}
                min={1}
                max={1000}
                className="mt-2 bg-white/50 border-white/20 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Participating Strategies</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {strategies.slice(0, participants).map((strategy, index) => (
                <Badge key={index} variant="outline" className="p-2 bg-white/50 justify-center">
                  {strategy}
                </Badge>
              ))}
            </div>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tournament Progress</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button
            onClick={runTournament}
            disabled={isRunning}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl shadow-lg"
          >
            {isRunning ? (
              <>
                <Play className="w-4 h-4 mr-2 animate-pulse" />
                Running Tournament...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Start Tournament
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Tournament Results
            </CardTitle>
            <CardDescription>Final standings and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={result.strategy}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg"
                      : "bg-white/50 border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRankIcon(index)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{result.strategy}</h3>
                        <p className="text-sm text-gray-600">
                          {result.wins}W - {result.losses}L - {result.draws}D
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{result.totalScore}</div>
                      <div className="text-sm text-gray-600">{result.winRate.toFixed(1)}% win rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
