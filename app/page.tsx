"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GameSelector } from "@/components/game-selector"
import { PayoffMatrix } from "@/components/payoff-matrix"
import { PlayerConfiguration, type PlayerConfig } from "@/components/player-configuration"
import { GameValidationPreview } from "@/components/game-validation-preview"
import { SimulationControls } from "@/components/simulation-controls"
import { SimulationParameters } from "@/components/simulation-parameters"
import { ConfigManager } from "@/components/config-manager"
import { ResultsVisualization } from "@/components/results-visualization"
import { VisualizationDashboard } from "@/components/visualization-dashboard"
import { TournamentMode } from "@/components/tournament-mode"
import { EvolutionaryDynamics } from "@/components/evolutionary-dynamics"
import { LearningMode } from "@/components/learning-mode"
import { StrategyComparison } from "@/components/strategy-comparison"
import { StrategyExperiment } from "@/components/strategy-experiment"
import { AIOpponent } from "@/components/ai-opponent"
import { CustomGameBuilder } from "@/components/custom-game-builder"
import { StrategicAnalysisDashboard } from "@/components/strategic-analysis-dashboard"
import { TestChart } from "@/components/charts/test-chart"
import { MonteCarloEngine } from "@/lib/monte-carlo-engine"
import { GameTheoryUtils } from "@/lib/game-theory-utils"
import { GameScenario, GameType, StrategyType, PlayerBehavior } from "@/lib/game-theory-types"
import { Play, BarChart3, Settings, Trophy, TrendingUp, GraduationCap, Zap, Bot, Wrench, Sparkles, Target, Library, HelpCircle, BookOpen } from "lucide-react"
import { LoadingSpinner, SimulationLoader, LoadingOverlay } from "@/components/ui/loading-spinner"
import { ErrorBoundary, ErrorDisplay } from "@/components/ui/error-boundary"
import { ResponsiveContainer, ResponsiveGrid, ResponsiveButtonStack } from "@/components/ui/responsive-layout"
import { Button } from "@/components/ui/button"
import ExportManager, { ShareableResultData } from '@/lib/export-manager'
import { ScenarioLibraryComponent } from "@/components/scenario-library"
import { ScenarioLibraryItem } from "@/lib/scenario-library"
import { TutorialSystem, useTutorialSystem } from "@/components/tutorial-system"
import { HelpPanel } from "@/components/help-panel"
import { ConceptText, ConceptIcon } from "@/components/ui/educational-tooltip"

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
  const [sharedResult, setSharedResult] = useState<ShareableResultData | null>(null)
  const tutorialSystem = useTutorialSystem()
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(false)

  // Convert UI game scenario to proper GameScenario format
  const convertToGameScenario = (uiGame: UIGameScenario): GameScenario => {
    return {
      id: uiGame.id,
      name: uiGame.name,
      description: uiGame.description,
      type: GameType.CUSTOM, // Default to CUSTOM type
      payoffMatrix: {
        players: uiGame.playerCount,
        strategies: uiGame.strategies.map((name, index) => ({
          id: `strategy-${index}`,
          name,
          description: `Strategy ${name}`,
          shortName: name.substring(0, 3).toUpperCase(),
        })),
        payoffs: uiGame.payoffMatrix,
        isSymmetric: false,
      },
      players: Array.from({ length: uiGame.playerCount }, (_, index) => ({
        id: `player-${index}`,
        name: `Player ${index + 1}`,
        strategyType: StrategyType.MIXED,
        behavior: PlayerBehavior.RATIONAL,
      })),
      realWorldExample: uiGame.realWorldApplications?.[0] || '',
      difficulty: uiGame.difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  useEffect(() => {
    // Load simulation history from localStorage
    const saved = localStorage.getItem("gameTheoryHistory")
    if (saved) {
      setSimulationHistory(JSON.parse(saved))
    }
  }, [])

  // Load shared result from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const shareParam = urlParams.get('share')
    
    if (shareParam) {
      const exportManager = ExportManager.getInstance()
      const sharedData = exportManager.parseSharedResult(shareParam)
      
      if (sharedData) {
        setSharedResult(sharedData)
        // You could also load the game scenario based on the shared data
        // and show the results in a special "shared result" view
      }
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
      // Simple Monte Carlo simulation for now
      const outcomes: { [key: string]: number } = {}
      const strategyFrequencies: { [key: string]: number } = {}
      const expectedPayoffs: number[] = new Array(selectedGame.playerCount).fill(0)
      const convergenceData: Array<{ iteration: number; strategies: number[] }> = []

      // Initialize tracking variables
      for (let p = 0; p < selectedGame.playerCount; p++) {
        for (let s = 0; s < selectedGame.strategies.length; s++) {
          const key = `P${p}_S${s}`
          strategyFrequencies[key] = 0
        }
      }

      // Run simulation iterations
      for (let i = 0; i < simulationParams.iterations; i++) {
        // Random strategy selection for each player
        const strategies: number[] = []
        for (let p = 0; p < selectedGame.playerCount; p++) {
          if (simulationParams.playerStrategies[p] === 'random') {
            strategies[p] = Math.floor(Math.random() * selectedGame.strategies.length)
          } else {
            // Use mixed strategy
            const probs = simulationParams.mixedStrategies[p] || []
            let cumProb = 0
            const rand = Math.random()
            strategies[p] = 0
            for (let s = 0; s < probs.length; s++) {
              cumProb += probs[s] || (1 / selectedGame.strategies.length)
              if (rand <= cumProb) {
                strategies[p] = s
                break
              }
            }
          }
        }

        // Calculate payoffs
        if (payoffMatrix && payoffMatrix.length > 0) {
          for (let p = 0; p < selectedGame.playerCount; p++) {
            const payoff = payoffMatrix[strategies[0]]?.[strategies[1]]?.[p] || 0
            expectedPayoffs[p] += payoff / simulationParams.iterations
          }
        }

        // Track strategy frequencies
        for (let p = 0; p < selectedGame.playerCount; p++) {
          const key = `P${p}_S${strategies[p]}`
          strategyFrequencies[key] = (strategyFrequencies[key] || 0) + 1
        }

        // Track outcomes
        const outcomeKey = strategies.join('-')
        outcomes[outcomeKey] = (outcomes[outcomeKey] || 0) + 1

        // Update progress
        if (i % Math.floor(simulationParams.iterations / 100) === 0) {
          setSimulationProgress((i / simulationParams.iterations) * 100)
        }

        // Store convergence data periodically
        if (i % Math.floor(simulationParams.iterations / 20) === 0) {
          convergenceData.push({
            iteration: i,
            strategies: [...strategies]
          })
        }
      }

      // Calculate Nash equilibrium using existing utils
      const utils = new GameTheoryUtils()
      const nashEquilibrium = utils.findNashEquilibrium(payoffMatrix, selectedGame.strategies)
      const dominantStrategies = utils.findDominantStrategies(payoffMatrix, selectedGame.strategies)

      const finalResult: SimulationResult = {
        iterations: simulationParams.iterations,
        outcomes,
        strategyFrequencies,
        expectedPayoffs,
        convergenceData,
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
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <ResponsiveContainer size="lg" className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/25">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-8 mb-6">
            Game Theory Studio
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Explore strategic decision-making through interactive Monte Carlo simulations and real-time visualizations
          </p>
          
          <ResponsiveGrid cols={{ sm: 1, md: 3 }} gap={6} className="max-w-3xl mx-auto">
            <div className="group bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Simulations</h3>
              <p className="text-gray-600">Run Monte Carlo simulations on classic game theory scenarios</p>
            </div>
            
            <div className="group bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Visualization</h3>
              <p className="text-gray-600">Dynamic charts and graphs showing strategy evolution</p>
            </div>
            
            <div className="group bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Strategic Analysis</h3>
              <p className="text-gray-600">Find Nash equilibria and optimal strategies</p>
            </div>
          </ResponsiveGrid>

          <ResponsiveButtonStack stack={{ base: false, md: false }} className="justify-center mt-12">
            <Button 
              onClick={() => setShowWelcome(false)} 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Get Started
              </span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => tutorialSystem.openTutorial('introduction-to-game-theory')}
              className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 rounded-2xl transition-all duration-300"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Start Tutorial
            </Button>
          </ResponsiveButtonStack>
        </ResponsiveContainer>

        {/* Tutorial System */}
        {tutorialSystem.isOpen && (
          <div className="fixed inset-0 z-50">
            <TutorialSystem
              isOpen={tutorialSystem.isOpen}
              onClose={() => tutorialSystem.closeTutorial()}
              tutorialId={tutorialSystem.tutorialId}
            />
          </div>
        )}
      </div>
    )
  }

  console.log('Rendering main app, showWelcome:', showWelcome, 'selectedGame:', selectedGame);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <LoadingOverlay 
        isVisible={isSimulating} 
        text={`Running simulation... ${simulationProgress}%`}
        variant="simulation"
      />
      
      <ResponsiveContainer size="xl" className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Game Theory Studio</h1>
              <p className="text-gray-600">Monte Carlo Simulation Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {results && (
              <Badge variant="outline" className="px-4 py-2">
                {results.iterations.toLocaleString()} iterations completed
              </Badge>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowWelcome(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Welcome
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9 bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl p-1">
            <TabsTrigger 
              value="setup" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Setup</span>
            </TabsTrigger>
            <TabsTrigger 
              value="simulate" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Simulate</span>
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
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
            <TabsTrigger 
              value="library" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Library className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger 
              value="help" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Help</span>
            </TabsTrigger>
          </TabsList>

          {/* Contextual Help Panel - shows contextual help for current tab */}
          <div className="mb-4">
            <HelpPanel 
              gameType={selectedGame?.category as any}
              context={activeTab as any}
              className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl"
            />
          </div>

          <TabsContent value="setup" className="space-y-6">
            <ErrorBoundary>
              <div className="space-y-6">
                <GameSelector onGameSelect={handleGameSelect} selectedGame={selectedGame} />
                
                {selectedGame && (
                  <ResponsiveGrid cols={{ sm: 1, lg: 3 }} gap={6}>
                    <div className="lg:col-span-2 space-y-6">
                      <ErrorBoundary>
                        <PayoffMatrix
                          game={selectedGame}
                          matrix={payoffMatrix}
                          onChange={setPayoffMatrix}
                          playerCount={playerCount}
                        />
                      </ErrorBoundary>
                      
                      <ErrorBoundary>
                        <PlayerConfiguration
                          players={players}
                          onChange={setPlayers}
                          playerCount={playerCount}
                          strategies={selectedGame.strategies}
                          onPlayerCountChange={setPlayerCount}
                          gameType={selectedGame.name}
                        />
                      </ErrorBoundary>
                    </div>

                    <div className="space-y-6">
                      <ErrorBoundary>
                        <GameValidationPreview
                          game={selectedGame}
                          payoffMatrix={payoffMatrix}
                          players={players}
                          onValidationChange={setIsGameValid}
                        />
                      </ErrorBoundary>
                      
                      <ErrorBoundary>
                        <ConfigManager
                          currentConfig={{
                            game: selectedGame,
                            payoffMatrix,
                            players,
                            simulationParams
                          }}
                          onConfigLoad={(config) => {
                            if (config.game) setSelectedGame(config.game)
                            if (config.payoffMatrix) setPayoffMatrix(config.payoffMatrix)
                            if (config.players) setPlayers(config.players)
                            if (config.simulationParams) setSimulationParams(config.simulationParams)
                          }}
                        />
                      </ErrorBoundary>
                    </div>
                  </ResponsiveGrid>
                )}

                {!selectedGame && (
                  <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                    <CardContent className="py-16">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Settings className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Game to Begin</h3>
                        <p className="text-gray-600">Choose from our collection of classic game theory scenarios to start your simulation.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="simulate" className="space-y-6">
            <ErrorBoundary>
              {selectedGame && isGameValid ? (
                <div className="space-y-6">
                  <SimulationParameters
                    parameters={simulationParams}
                    onChange={setSimulationParams}
                    gameStrategies={selectedGame.strategies}
                  />
                  
                  <SimulationControls
                    onRun={runSimulation}
                    isRunning={isSimulating}
                    progress={simulationProgress}
                    disabled={!isGameValid}
                    gameValid={isGameValid}
                  />
                </div>
              ) : (
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {!selectedGame ? "No Game Selected" : "Game Configuration Invalid"}
                      </h3>
                      <p className="text-gray-600">
                        {!selectedGame 
                          ? "Please select and configure a game in the Setup tab before running simulations."
                          : "Please review your game configuration in the Setup tab to resolve validation issues."
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results && selectedGame ? (
              <div className="space-y-6">
                {/* Strategic Analysis Dashboard - Primary Analysis Interface */}
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Strategic Analysis Dashboard
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive strategic analysis with dominance, equilibrium, and mixed strategy tools
                    </p>
                  </CardHeader>
                  <CardContent>
                    <StrategicAnalysisDashboard
                      simulationResults={results}
                      game={convertToGameScenario(selectedGame)}
                      payoffMatrix={selectedGame.payoffMatrix}
                      onAnalysisUpdate={(analysis) => {
                        console.log('Strategic analysis updated:', analysis);
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Enhanced Visualization Option */}
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      Advanced Analysis Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VisualizationDashboard
                      simulationData={{
                        strategyEvolution: {
                          // Convert convergence data to strategy evolution format
                          series: [{
                            name: 'Strategy Evolution',
                            data: results.convergenceData.map(point => ({
                              x: point.iteration,
                              y: point.strategies,
                              timestamp: Date.now()
                            }))
                          }]
                        },
                        payoffDistribution: {
                          // Create payoff distribution from results
                          bins: results.expectedPayoffs.map((payoff, index) => ({
                            range: `Player ${index + 1}`,
                            frequency: 1,
                            value: payoff,
                            cumulative: payoff
                          })),
                          statistics: {
                            mean: results.expectedPayoffs.reduce((a, b) => a + b, 0) / results.expectedPayoffs.length,
                            median: results.expectedPayoffs[Math.floor(results.expectedPayoffs.length / 2)],
                            std: Math.sqrt(results.expectedPayoffs.reduce((sum, val) => sum + Math.pow(val - (results.expectedPayoffs.reduce((a, b) => a + b, 0) / results.expectedPayoffs.length), 2), 0) / results.expectedPayoffs.length)
                          }
                        },
                        nashEquilibrium: {
                          // Create basic strategy space data
                          points: results.nashEquilibrium ? [{
                            x: 0.5,
                            y: 0.5,
                            type: 'equilibrium',
                            label: 'Nash Equilibrium',
                            strategies: results.nashEquilibrium.strategies,
                            payoffs: results.nashEquilibrium.payoffs
                          }] : [],
                          regions: []
                        },
                        performance: {
                          metrics: {
                            iterations: results.iterations,
                            convergence: 0.95,
                            efficiency: 0.85,
                            memory: 45
                          },
                          timeline: results.convergenceData.map(point => ({
                            timestamp: Date.now() - (results.iterations - point.iteration) * 100,
                            iterations: point.iteration,
                            convergence: point.iteration / results.iterations,
                            efficiency: 0.85,
                            memory: 45
                          }))
                        }
                      }}
                      scenario={undefined}
                      isSimulationRunning={isSimulating}
                      onSimulationControl={(action) => {
                        console.log('Simulation control:', action);
                      }}
                      className="mt-4"
                    />
                  </CardContent>
                </Card>
                
                {/* Traditional Results Visualization */}
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-gray-500" />
                      Traditional Results Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResultsVisualization results={results} game={selectedGame} />
                  </CardContent>
                </Card>
              </div>
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

          <TabsContent value="library" className="space-y-6">
            <ScenarioLibraryComponent 
              onLoadScenario={(scenario: ScenarioLibraryItem) => {
                // Convert ScenarioLibraryItem to UIGameScenario
                const uiGame: UIGameScenario = {
                  id: scenario.id,
                  name: scenario.name,
                  description: scenario.description,
                  playerCount: scenario.payoffMatrix.players,
                  strategies: scenario.payoffMatrix.strategies.map(s => s.name),
                  category: scenario.category,
                  difficulty: scenario.difficulty === 'beginner' ? 'Beginner' : 
                            scenario.difficulty === 'intermediate' ? 'Intermediate' : 'Advanced',
                  payoffMatrix: scenario.payoffMatrix.payoffs,
                  realWorldApplications: scenario.realWorldExample ? [scenario.realWorldExample] : [],
                  educationalFocus: [],
                  learningObjectives: [],
                  nashEquilibria: [],
                  dominantStrategies: []
                }
                handleGameSelect(uiGame)
                setActiveTab('setup') // Switch to setup tab after loading
              }}
              onCreateNew={() => {
                setActiveTab('builder') // Switch to builder tab for creating new scenarios
              }}
            />
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  Help & Educational Resources
                </CardTitle>
                <CardDescription>
                  Comprehensive guides, tutorials, and educational content for game theory concepts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tutorial Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Interactive Tutorials
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Step-by-step guided tutorials to learn game theory concepts and platform features.
                      </p>
                      <Button 
                        onClick={() => tutorialSystem.openTutorial('introduction-to-game-theory')}
                        className="w-full"
                      >
                        Start Learning
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ConceptIcon concept="nash-equilibrium" size="sm" />
                        Game Theory Concepts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 mb-3">
                        Learn key concepts with interactive examples:
                      </p>
                      <div className="space-y-2">
                        <ConceptText concept="nash-equilibrium" className="block text-sm" />
                        <ConceptText concept="dominant-strategy" className="block text-sm" />
                        <ConceptText concept="mixed-strategy" className="block text-sm" />
                        <ConceptText concept="pareto-efficiency" className="block text-sm" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Platform Guide */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Platform Guide</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Settings className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-sm mb-2">Setup Games</h4>
                        <p className="text-xs text-gray-600">Configure payoff matrices, player strategies, and game parameters</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Play className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-medium text-sm mb-2">Run Simulations</h4>
                        <p className="text-xs text-gray-600">Execute Monte Carlo simulations with customizable parameters</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                        <h4 className="font-medium text-sm mb-2">Analyze Results</h4>
                        <p className="text-xs text-gray-600">Interpret outcomes, find equilibria, and understand strategic dynamics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contextual Help Panel */}
                <HelpPanel 
                  gameType={selectedGame?.category as any}
                  context={activeTab as any}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ResponsiveContainer>
    </div>
  )
}
