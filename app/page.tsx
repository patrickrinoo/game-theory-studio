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
import { SimulationParameters as SimulationParametersComponent } from "@/components/simulation-parameters"
import { ConfigManager } from "@/components/config-manager"
import { ResultsVisualization } from "@/components/results-visualization"
import { VisualizationDashboard } from "@/components/visualization-dashboard"
import { UnifiedResultsDashboard } from "@/components/unified-results-dashboard"
import { StrategicAnalysisDashboard } from "@/components/strategic-analysis-dashboard"
import { TournamentMode } from "@/components/tournament-mode"
import { EvolutionaryDynamics } from "@/components/evolutionary-dynamics"
import { LearningMode } from "@/components/learning-mode"
import { StrategyComparison } from "@/components/strategy-comparison"
import { StrategyExperiment } from "@/components/strategy-experiment"
import { AIOpponent } from "@/components/ai-opponent"
import { CustomGameBuilder } from "@/components/custom-game-builder"
import { TestChart } from "@/components/charts/test-chart"
import { MonteCarloEngine } from "@/lib/monte-carlo-engine"
import { GameTheoryUtils } from "@/lib/game-theory-utils"
import { 
  GameType, 
  StrategyType, 
  PlayerBehavior, 
  Player 
} from "@/lib/game-theory-types"
import { Play, BarChart3, Settings, Trophy, TrendingUp, GraduationCap, Zap, Bot, Wrench, Sparkles, Target, Library, HelpCircle, BookOpen, Users, ArrowRight, Clock } from "lucide-react"
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
    seed: undefined,
    convergenceCriteria: {
      enabled: false,
      tolerance: 0.01,
      windowSize: 100,
      metric: 'strategy_frequency'
    },
    batchSize: 1000,
    useWebWorkers: false,
    trackHistory: true,
    progressUpdateInterval: 100
  })
  const [legacyParams, setLegacyParams] = useState({
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
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  // Initialize tutorial system with error handling
  let tutorialSystem: {
    isOpen: boolean
    tutorialId?: string
    openTutorial: (id?: string) => void
    closeTutorial: () => void
  }

  try {
    tutorialSystem = useTutorialSystem()
  } catch (error) {
    console.error('Failed to initialize tutorial system:', error)
    tutorialSystem = {
      isOpen: false,
      openTutorial: () => console.warn('Tutorial system not available'),
      closeTutorial: () => console.warn('Tutorial system not available')
    }
  }

  // Convert UI game scenario to proper GameScenario format
  const convertToGameScenario = (uiGame: UIGameScenario): GameScenario => {
    try {
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
    } catch (error) {
      console.error('Error converting UI game scenario:', error)
      throw new Error('Failed to convert game scenario')
    }
  };

  useEffect(() => {
    // Load simulation history from localStorage
    try {
      const saved = localStorage.getItem("gameTheoryHistory")
      if (saved) {
        setSimulationHistory(JSON.parse(saved))
      }
    } catch (error) {
      console.warn('Failed to load simulation history:', error)
    }
  }, [])

  // Load shared result from URL on component mount
  useEffect(() => {
    try {
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
    } catch (error) {
      console.warn('Failed to load shared result:', error)
    }
  }, [])

  const handleGameSelect = (game: UIGameScenario) => {
    try {
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
    } catch (error) {
      console.error('Error selecting game:', error)
      alert('Failed to select game. Please try again.')
    }
  }

  // Convert PlayerConfig to Player for simulation engine
  const convertPlayersToGameTheoryType = (playerConfigs: PlayerConfig[]): Player[] => {
    return playerConfigs.map((config, index) => ({
      id: config.id,
      name: config.name,
      strategyType: config.strategy.type === 'pure' ? StrategyType.PURE : 
                   config.strategy.type === 'mixed' ? StrategyType.MIXED : 
                   StrategyType.ADAPTIVE,
      behavior: config.behavior === 'rational' ? PlayerBehavior.RATIONAL :
               config.behavior === 'aggressive' ? PlayerBehavior.AGGRESSIVE :
               config.behavior === 'cooperative' ? PlayerBehavior.COOPERATIVE :
               config.behavior === 'random' ? PlayerBehavior.RANDOM :
               PlayerBehavior.RATIONAL,
      pureStrategy: config.strategy.type === 'pure' ? config.strategy.purStrategy : undefined,
      mixedStrategy: config.strategy.type === 'mixed' ? config.strategy.mixedProbabilities : undefined,
      color: config.color
    }))
  }

  const runSimulation = async () => {
    if (!selectedGame || payoffMatrix.length === 0) return

    setIsSimulating(true)
    setSimulationProgress(0)
    setActiveTab("results")

    try {
      // Validate payoff matrix structure before proceeding
      if (!payoffMatrix || !Array.isArray(payoffMatrix) || payoffMatrix.length === 0) {
        throw new Error("Invalid payoff matrix: Matrix is empty or not properly initialized")
      }

      // Check matrix dimensions
      const numStrategies = selectedGame.strategies.length
      if (payoffMatrix.length !== numStrategies) {
        throw new Error(`Invalid payoff matrix: Expected ${numStrategies} rows, got ${payoffMatrix.length}`)
      }

      for (let i = 0; i < payoffMatrix.length; i++) {
        if (!Array.isArray(payoffMatrix[i]) || payoffMatrix[i].length !== numStrategies) {
          throw new Error(`Invalid payoff matrix: Row ${i} has incorrect dimensions`)
        }
        for (let j = 0; j < payoffMatrix[i].length; j++) {
          if (!Array.isArray(payoffMatrix[i][j]) || payoffMatrix[i][j].length !== selectedGame.playerCount) {
            throw new Error(`Invalid payoff matrix: Cell [${i}][${j}] does not have ${selectedGame.playerCount} player payoffs`)
          }
        }
      }

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

      // Validate simulation parameters
      if (!simulationParams.mixedStrategies || simulationParams.mixedStrategies.length !== selectedGame.playerCount) {
        throw new Error("Invalid mixed strategies configuration")
      }

      // Run simulation iterations
      for (let i = 0; i < simulationParams.iterations; i++) {
        // Random strategy selection for each player
        const strategies: number[] = []
        for (let p = 0; p < selectedGame.playerCount; p++) {
          if (simulationParams.playerStrategies[p] === 'random') {
            strategies[p] = Math.floor(Math.random() * selectedGame.strategies.length)
          } else {
            // Use mixed strategy with proper validation
            const probs = simulationParams.mixedStrategies[p]
            if (!probs || probs.length !== selectedGame.strategies.length) {
              // Fallback to uniform distribution
              const uniformProb = 1 / selectedGame.strategies.length
              strategies[p] = Math.floor(Math.random() * selectedGame.strategies.length)
            } else {
              let cumProb = 0
              const rand = Math.random()
              strategies[p] = 0
              for (let s = 0; s < probs.length; s++) {
                const prob = probs[s] || (1 / selectedGame.strategies.length)
                cumProb += prob
                if (rand <= cumProb) {
                  strategies[p] = s
                  break
                }
              }
            }
          }
        }

        // Calculate payoffs with bounds checking
        try {
          for (let p = 0; p < selectedGame.playerCount; p++) {
            const row = strategies[0]
            const col = strategies[1]
            
            if (row >= 0 && row < payoffMatrix.length && 
                col >= 0 && col < payoffMatrix[row].length &&
                p >= 0 && p < payoffMatrix[row][col].length) {
              const payoff = payoffMatrix[row][col][p] || 0
              expectedPayoffs[p] += payoff / simulationParams.iterations
            }
          }
        } catch (error) {
          console.warn(`Payoff calculation error at iteration ${i}:`, error)
          // Continue simulation with zero payoff for this iteration
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

      // Calculate Nash equilibrium using existing utils with error handling
      let nashEquilibrium = null
      let dominantStrategies: string[] = []

      try {
        const utils = new GameTheoryUtils()
        nashEquilibrium = utils.findNashEquilibrium(payoffMatrix, selectedGame.strategies)
        dominantStrategies = utils.findDominantStrategies(payoffMatrix, selectedGame.strategies)
      } catch (error) {
        console.warn("Nash equilibrium calculation failed:", error)
        // Continue without Nash equilibrium data
      }

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
      try {
        localStorage.setItem("gameTheoryHistory", JSON.stringify(newHistory))
      } catch (error) {
        console.warn("Failed to save simulation history:", error)
      }
    } catch (error) {
      console.error("Simulation error:", error)
      // Show user-friendly error message
      alert(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    } finally {
      setIsSimulating(false)
      setSimulationProgress(100)
    }
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/25 mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Game Theory Studio
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Explore strategic decision-making through interactive Monte Carlo simulations and real-time visualizations
          </p>
          
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => {
                console.log('Get Started button clicked!')
                setShowWelcome(false)
              }}
              className="interactive-fix bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 font-medium"
            >
              <Play className="w-5 h-5" />
              Get Started
            </button>
            
            <button 
              onClick={() => {
                console.log('Tutorial button clicked!')
                try {
                  if (tutorialSystem && tutorialSystem.openTutorial) {
                    tutorialSystem.openTutorial('introduction-to-game-theory')
                  } else {
                    console.warn('Tutorial system not available, proceeding to main app')
                    setShowWelcome(false)
                  }
                } catch (error) {
                  console.error('Tutorial system error:', error)
                  setShowWelcome(false)
                }
              }}
              className="interactive-fix border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-2 font-medium"
            >
              <BookOpen className="w-5 h-5" />
              Start Tutorial
            </button>
          </div>
          
          {/* Debug Information */}
          <div className="mt-8 p-4 bg-white/50 rounded-lg text-left text-sm max-w-md mx-auto">
            <strong>Status:</strong><br />
            Welcome Screen: Active<br />
            Tutorial System: {tutorialSystem ? 'Available' : 'Not Available'}<br />
            Click Test: Try clicking the buttons above
          </div>
        </div>

        {/* Tutorial System Modal */}
        {tutorialSystem && tutorialSystem.isOpen && (
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
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('Main application error:', error, errorInfo)
    }}>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-500" />
                      Game Selection
                    </CardTitle>
                    <CardDescription>
                      Choose a game scenario to simulate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GameSelector onGameSelect={handleGameSelect} />
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      Game Validation
                    </CardTitle>
                    <CardDescription>
                      Review game configuration and readiness
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GameValidationPreview 
                      game={selectedGame} 
                      payoffMatrix={payoffMatrix}
                      players={players}
                      onValidationChange={setIsGameValid}
                    />
                  </CardContent>
                </Card>
              </div>

              {selectedGame && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-orange-500" />
                        Payoff Matrix
                      </CardTitle>
                      <CardDescription>
                        Configure rewards and penalties for each strategy combination
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PayoffMatrix 
                        game={selectedGame} 
                        matrix={payoffMatrix} 
                        onMatrixChange={setPayoffMatrix} 
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        Player Configuration
                      </CardTitle>
                      <CardDescription>
                        Set up player behaviors and strategies
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PlayerConfiguration 
                        players={players} 
                        onPlayersChange={setPlayers} 
                        playerCount={playerCount} 
                        strategies={selectedGame.strategies} 
                        onPlayerCountChange={setPlayerCount} 
                        gameType={selectedGame.category} 
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedGame && (
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Configuration Management
                    </CardTitle>
                    <CardDescription>
                      Save, load, and manage your game configurations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConfigManager 
                      currentConfig={{
                        game: selectedGame,
                        payoffMatrix,
                        players,
                        simulationParams
                      }}
                      onConfigLoad={(config: any) => {
                        if (config.game) handleGameSelect(config.game)
                        if (config.payoffMatrix) setPayoffMatrix(config.payoffMatrix)
                        if (config.players) setPlayers(config.players)
                        if (config.simulationParams) setSimulationParams(config.simulationParams)
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="simulate" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-500" />
                      Simulation Parameters
                    </CardTitle>
                    <CardDescription>
                      Configure Monte Carlo simulation settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SimulationParametersComponent 
                      parameters={{
                        ...simulationParams,
                        batchSize: 1000,
                        useWebWorkers: false,
                        trackHistory: true,
                        progressUpdateInterval: 100
                      }}
                      onParametersChange={setSimulationParams}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-green-500" />
                      Simulation Controls
                    </CardTitle>
                    <CardDescription>
                      Run and monitor your Monte Carlo simulation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedGame ? (
                      <SimulationControls 
                        gameScenario={convertToGameScenario(selectedGame)}
                        players={convertPlayersToGameTheoryType(players)}
                        payoffMatrix={payoffMatrix}
                        parameters={{
                          ...simulationParams,
                          convergenceCriteria: {
                            ...simulationParams.convergenceCriteria,
                            metric: 'strategy_frequency' as const
                          }
                        }}
                        onResultsUpdate={(results: any) => {
                          setResults(results)
                          setIsSimulating(false)
                        }}
                        onProgressUpdate={(progress: number) => {
                          setSimulationProgress(progress)
                        }}
                        onStatusChange={(status: any) => {
                          setIsSimulating(status === 'running')
                        }}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Select a game scenario to configure simulation</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {results && selectedGame ? (
                <div className="space-y-6">
                  <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-500" />
                        Simulation Results
                      </CardTitle>
                      <CardDescription>
                        View and analyze Monte Carlo simulation outcomes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResultsVisualization results={results} game={selectedGame} />
                    </CardContent>
                  </Card>
                  
                  <VisualizationDashboard results={results} game={selectedGame} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Yet</h3>
                  <p className="text-gray-600">Run a simulation to see results and visualizations</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tournament" className="space-y-6">
              <TournamentMode 
                scenarios={selectedGame ? [selectedGame] : []} 
                onTournamentComplete={(results: any) => {
                  console.log('Tournament completed:', results)
                }}
              />
            </TabsContent>

            <TabsContent value="evolution" className="space-y-6">
              <EvolutionaryDynamics 
                game={selectedGame} 
                onEvolutionComplete={(results: any) => {
                  console.log('Evolution completed:', results)
                }}
              />
            </TabsContent>

            <TabsContent value="learning" className="space-y-6">
              <LearningMode 
                currentGame={selectedGame}
                onProgressUpdate={(progress: any) => {
                  console.log('Learning progress:', progress)
                }}
              />
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-500" />
                      AI Opponent
                    </CardTitle>
                    <CardDescription>
                      Configure AI opponent strategies and behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AIOpponent 
                      game={selectedGame}
                      onAIConfigChange={(config: any) => {
                        console.log('AI config changed:', config)
                      }}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-500" />
                      Strategy Analysis
                    </CardTitle>
                    <CardDescription>
                      Analyze and compare different strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StrategyComparison 
                      strategies={selectedGame?.strategies || []}
                      payoffMatrix={payoffMatrix}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="builder" className="space-y-6">
              <CustomGameBuilder 
                onGameCreated={(game: UIGameScenario) => {
                  handleGameSelect(game)
                  setActiveTab('setup')
                }}
              />
            </TabsContent>

            <TabsContent value="library" className="space-y-6">
              <ScenarioLibraryComponent 
                onScenarioSelect={(scenario: ScenarioLibraryItem) => {
                  // Convert scenario to UIGameScenario and select it
                  const uiGame: UIGameScenario = {
                    id: scenario.id,
                    name: scenario.name,
                    description: scenario.description,
                    playerCount: scenario.playerCount,
                    strategies: scenario.strategies,
                    category: scenario.category,
                    difficulty: scenario.difficulty,
                    payoffMatrix: scenario.payoffMatrix,
                    realWorldApplications: scenario.realWorldApplications || [],
                    educationalFocus: scenario.educationalFocus || [],
                    learningObjectives: scenario.learningObjectives || [],
                    nashEquilibria: [],
                    dominantStrategies: []
                  }
                  handleGameSelect(uiGame)
                  setActiveTab('setup')
                }}
              />
            </TabsContent>

            <TabsContent value="help" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      Quick Start Guide
                    </CardTitle>
                    <CardDescription>
                      Get started with Game Theory Studio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <h4 className="font-semibold">Select a Game</h4>
                          <p className="text-sm text-gray-600">Choose from classic scenarios like Prisoner's Dilemma</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <h4 className="font-semibold">Configure Players</h4>
                          <p className="text-sm text-gray-600">Set up player strategies and behaviors</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <h4 className="font-semibold">Run Simulation</h4>
                          <p className="text-sm text-gray-600">Execute Monte Carlo simulations to find optimal strategies</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-green-500" />
                      Interactive Tutorials
                    </CardTitle>
                    <CardDescription>
                      Step-by-step learning experiences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => tutorialSystem.openTutorial('introduction-to-game-theory')}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Introduction to Game Theory
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => tutorialSystem.openTutorial('monte-carlo-methods')}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Monte Carlo Methods
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => tutorialSystem.openTutorial('nash-equilibrium')}
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Nash Equilibrium
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>

        {/* Tutorial System Modal */}
        {tutorialSystem && tutorialSystem.isOpen && (
          <div className="fixed inset-0 z-50">
            <TutorialSystem
              isOpen={tutorialSystem.isOpen}
              onClose={() => tutorialSystem.closeTutorial()}
              tutorialId={tutorialSystem.tutorialId}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
