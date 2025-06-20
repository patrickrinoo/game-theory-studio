"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GameSelector } from "@/components/game-selector"
import { PayoffMatrix } from "@/components/payoff-matrix"
import { PlayerConfiguration, type PlayerConfig } from "@/components/player-configuration"
import { GameValidationPreview } from "@/components/game-validation-preview"
import { SimulationControls } from "@/components/simulation-controls"
import { ResultsVisualization } from "@/components/results-visualization"
import { TournamentMode } from "@/components/tournament-mode"
import { EvolutionaryDynamics } from "@/components/evolutionary-dynamics"
import { LearningMode } from "@/components/learning-mode"
import { StrategyComparison } from "@/components/strategy-comparison"
import { AIOpponent } from "@/components/ai-opponent"
import { CustomGameBuilder } from "@/components/custom-game-builder"
import { MonteCarloEngine } from "@/lib/monte-carlo-engine"
import { GameTheoryUtils } from "@/lib/game-theory-utils"
import { Play, BarChart3, Settings, Trophy, TrendingUp, GraduationCap, Zap, Bot, Wrench, Sparkles } from "lucide-react"

// UI-specific interface for game scenarios (matching the one in GameSelector)
interface UIGameScenario {
  id: string
  name: string
  description: string
  playerCount: number
  strategies: string[]
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  payoffMatrix: number[][][]
  realWorldApplications: string[]
  educationalFocus: string[]
  learningObjectives: string[]
  nashEquilibria: any[]
  dominantStrategies: any[]
}

export interface SimulationResult {
  iterations: number
  outcomes: { [key: string]: number }
  strategyFrequencies: { [key: string]: number }
  expectedPayoffs: number[]
  convergenceData: Array<{ iteration: number; strategies: number[] }>
  nashEquilibrium?: { strategies: number[]; payoffs: number[] }
  dominantStrategies?: string[]
  timestamp: number
  gameId: string
}

export default function GameTheorySimulator() {
  const [selectedGame, setSelectedGame] = useState<UIGameScenario | null>(null)
  const [payoffMatrix, setPayoffMatrix] = useState<number[][][]>([])
  const [players, setPlayers] = useState<PlayerConfig[]>([])
  const [playerCount, setPlayerCount] = useState(2)
  const [isGameValid, setIsGameValid] = useState(false)
  const [simulationParams, setSimulationParams] = useState({
    iterations: 10000,
    playerStrategies: [] as string[],
    mixedStrategies: [] as number[][],
  })
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [results, setResults] = useState<SimulationResult | null>(null)
  const [activeTab, setActiveTab] = useState("setup")
  const [simulationHistory, setSimulationHistory] = useState<SimulationResult[]>([])
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    // Load simulation history from localStorage
    const saved = localStorage.getItem("gameTheoryHistory")
    if (saved) {
      setSimulationHistory(JSON.parse(saved))
    }
  }, [])

  const handleGameSelect = (game: UIGameScenario) => {
    setSelectedGame(game)
    // Use the payoff matrix directly from the UI game scenario
    const matrix = game.payoffMatrix || []
    setPayoffMatrix(matrix)
    
    // Update player count to match the game
    setPlayerCount(game.playerCount)
    
    setSimulationParams((prev) => ({
      ...prev,
      playerStrategies: new Array(game.playerCount).fill("mixed"),
      mixedStrategies: new Array(game.playerCount)
        .fill(null)
        .map(() => new Array(game.strategies.length).fill(1 / game.strategies.length)),
    }))
    setResults(null)
    setShowWelcome(false)
  }

  const runSimulation = async () => {
    if (!selectedGame || payoffMatrix.length === 0) return

    setIsSimulating(true)
    setSimulationProgress(0)
    setActiveTab("results")

    try {
      const engine = new MonteCarloEngine()
      const result = await engine.runSimulation({
        game: selectedGame,
        payoffMatrix,
        iterations: simulationParams.iterations,
        playerStrategies: simulationParams.playerStrategies,
        mixedStrategies: simulationParams.mixedStrategies,
        onProgress: (progress) => setSimulationProgress(progress),
      })

      // Calculate Nash equilibrium and dominant strategies
      const utils = new GameTheoryUtils()
      const nashEquilibrium = utils.findNashEquilibrium(payoffMatrix, selectedGame.strategies)
      const dominantStrategies = utils.findDominantStrategies(payoffMatrix, selectedGame.strategies)

      const finalResult: SimulationResult = {
        ...result,
        nashEquilibrium: nashEquilibrium || undefined,
        dominantStrategies,
        timestamp: Date.now(),
        gameId: selectedGame.id,
      }

      setResults(finalResult)

      // Save to history
      const newHistory = [finalResult, ...simulationHistory.slice(0, 9)] // Keep last 10
      setSimulationHistory(newHistory)
      localStorage.setItem("gameTheoryHistory", JSON.stringify(newHistory))
    } catch (error) {
      console.error("Simulation error:", error)
    } finally {
      setIsSimulating(false)
      setSimulationProgress(100)
    }
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/25">
                <Sparkles className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Game Theory Studio
              </h1>

              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Explore strategic decision-making through advanced Monte Carlo simulations. Discover Nash equilibria,
                analyze dominant strategies, and understand the mathematics of competition.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="group p-6 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Monte Carlo Simulations</h3>
                <p className="text-gray-600 text-sm">
                  Run thousands of iterations to discover optimal strategies and equilibrium points.
                </p>
              </div>

              <div className="group p-6 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600 text-sm">
                  Deep strategic analysis with Nash equilibrium detection and evolutionary dynamics.
                </p>
              </div>

              <div className="group p-6 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Learning</h3>
                <p className="text-gray-600 text-sm">
                  Learn game theory concepts through hands-on experimentation and guided tutorials.
                </p>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => setShowWelcome(false)}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Game Theory Studio
              </h1>
              <p className="text-gray-600">Advanced strategic analysis platform</p>
            </div>
          </div>

          {simulationHistory.length > 0 && (
            <Badge variant="secondary" className="bg-white/70 backdrop-blur-sm border-white/20">
              {simulationHistory.length} simulations completed
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-8 bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl p-1">
              <TabsTrigger
                value="setup"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Setup</span>
              </TabsTrigger>
              <TabsTrigger
                value="simulation"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">Simulate</span>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                disabled={!results}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Results</span>
              </TabsTrigger>
              <TabsTrigger
                value="tournament"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Tournament</span>
              </TabsTrigger>
              <TabsTrigger
                value="evolution"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Evolution</span>
              </TabsTrigger>
              <TabsTrigger
                value="learning"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Learn</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger
                value="builder"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
              >
                <Wrench className="w-4 h-4" />
                <span className="hidden sm:inline">Builder</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="setup" className="space-y-6">
            <div className="space-y-6">
              <GameSelector onGameSelect={handleGameSelect} selectedGame={selectedGame} />
              
              {selectedGame && (
                <>
                  <PlayerConfiguration
                    playerCount={playerCount}
                    strategies={selectedGame.strategies}
                    players={players}
                    onPlayersChange={setPlayers}
                    onPlayerCountChange={setPlayerCount}
                    gameType={selectedGame.name}
                    maxPlayers={5}
                  />
                  
                  <PayoffMatrix 
                    game={selectedGame} 
                    matrix={payoffMatrix} 
                    onMatrixChange={setPayoffMatrix} 
                  />
                  
                  <GameValidationPreview
                    game={selectedGame}
                    payoffMatrix={payoffMatrix}
                    players={players}
                    onValidationChange={setIsGameValid}
                  />
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-6">
            {selectedGame ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SimulationControls
                    game={selectedGame}
                    params={simulationParams}
                    onParamsChange={setSimulationParams}
                    onRunSimulation={runSimulation}
                    isSimulating={isSimulating}
                  />
                </div>
                <div className="space-y-4">
                  <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-500" />
                        Simulation Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isSimulating && (
                        <>
                          <div>
                            <Label>Progress</Label>
                            <Progress value={simulationProgress} className="mt-2 h-2" />
                            <p className="text-sm text-gray-600 mt-1">{simulationProgress.toFixed(1)}% Complete</p>
                          </div>
                          <div className="text-sm text-gray-600">
                            Running {simulationParams.iterations.toLocaleString()} iterations...
                          </div>
                        </>
                      )}
                      {results && !isSimulating && (
                        <div className="space-y-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Simulation Complete
                          </Badge>
                          <p className="text-sm text-gray-600">
                            {results.iterations.toLocaleString()} iterations completed
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {simulationHistory.length > 0 && <StrategyComparison history={simulationHistory} />}
                </div>
              </div>
            ) : (
              <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Please select a game scenario from the Setup tab to begin simulation.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results && selectedGame ? (
              <ResultsVisualization results={results} game={selectedGame} />
            ) : (
              <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Run a simulation to view detailed results and analysis.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tournament" className="space-y-6">
            <TournamentMode selectedGame={selectedGame} />
          </TabsContent>

          <TabsContent value="evolution" className="space-y-6">
            <EvolutionaryDynamics selectedGame={selectedGame} />
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <LearningMode onGameSelect={handleGameSelect} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIOpponent selectedGame={selectedGame} />
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <CustomGameBuilder onGameCreated={handleGameSelect} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
