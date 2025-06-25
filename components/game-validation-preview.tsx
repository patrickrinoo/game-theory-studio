"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect, useMemo } from "react"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Target, 
  TrendingUp, 
  Scale, 
  Crown,
  Eye,
  RefreshCw,
  Calculator,
  BarChart3,
  Shield,
  Zap
} from "lucide-react"
import { GameTheoryUtils } from "@/lib/game-theory-utils"
import type { GameScenario } from "@/lib/game-theory-types"
import type { PlayerConfig } from "./player-configuration"

// UI-compatible game interface for validation
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

// Helper functions for game analysis
function findSimpleNashEquilibria(payoffMatrix: number[][][]) {
  const equilibria: { strategies: number[], payoffs: number[] }[] = []
  
  if (!payoffMatrix || payoffMatrix.length === 0) return equilibria
  
  // Check for pure strategy Nash equilibria (2x2 games)
  for (let i = 0; i < payoffMatrix.length; i++) {
    for (let j = 0; j < payoffMatrix[i].length; j++) {
      if (isPureNashEquilibrium(payoffMatrix, i, j)) {
        equilibria.push({
          strategies: [i, j],
          payoffs: payoffMatrix[i][j]
        })
      }
    }
  }
  
  return equilibria
}

function isPureNashEquilibrium(matrix: number[][][], row: number, col: number): boolean {
  const currentPayoffs = matrix[row][col]
  
  // Check if player 1 wants to deviate
  for (let i = 0; i < matrix.length; i++) {
    if (i !== row && matrix[i][col][0] > currentPayoffs[0]) {
      return false
    }
  }
  
  // Check if player 2 wants to deviate  
  for (let j = 0; j < matrix[row].length; j++) {
    if (j !== col && matrix[row][j][1] > currentPayoffs[1]) {
      return false
    }
  }
  
  return true
}

function findSimpleDominantStrategies(payoffMatrix: number[][][]) {
  const strategies: { player: number, strategy: number, type: 'strict' | 'weak' }[] = []
  
  if (!payoffMatrix || payoffMatrix.length === 0) return strategies
  
  // Check dominant strategies for each player
  for (let player = 0; player < 2; player++) {
    for (let strategy = 0; strategy < payoffMatrix.length; strategy++) {
      if (isDominantStrategy(payoffMatrix, player, strategy)) {
        strategies.push({ player, strategy, type: 'strict' })
      }
    }
  }
  
  return strategies
}

function isDominantStrategy(matrix: number[][][], player: number, strategy: number): boolean {
  if (player === 0) {
    // Check if this row dominates all other rows
    for (let otherRow = 0; otherRow < matrix.length; otherRow++) {
      if (otherRow !== strategy) {
        for (let col = 0; col < matrix[strategy].length; col++) {
          if (matrix[strategy][col][player] <= matrix[otherRow][col][player]) {
            return false
          }
        }
      }
    }
  } else {
    // Check if this column dominates all other columns
    for (let otherCol = 0; otherCol < matrix[0].length; otherCol++) {
      if (otherCol !== strategy) {
        for (let row = 0; row < matrix.length; row++) {
          if (matrix[row][strategy][player] <= matrix[row][otherCol][player]) {
            return false
          }
        }
      }
    }
  }
  
  return true
}

function findSimpleParetoOptimal(payoffMatrix: number[][][]) {
  const optimal: { strategies: number[], payoffs: number[] }[] = []
  
  if (!payoffMatrix || payoffMatrix.length === 0) return optimal
  
  // Get all outcomes
  const outcomes: { strategies: number[], payoffs: number[] }[] = []
  for (let i = 0; i < payoffMatrix.length; i++) {
    for (let j = 0; j < payoffMatrix[i].length; j++) {
      outcomes.push({
        strategies: [i, j],
        payoffs: payoffMatrix[i][j]
      })
    }
  }
  
  // Check each outcome for Pareto optimality
  outcomes.forEach(outcome => {
    let isParetoOptimal = true
    
    outcomes.forEach(other => {
      if (other !== outcome) {
        // Check if other dominates outcome
        let dominates = true
        let strictlyBetter = false
        
        for (let p = 0; p < outcome.payoffs.length; p++) {
          if (other.payoffs[p] < outcome.payoffs[p]) {
            dominates = false
            break
          }
          if (other.payoffs[p] > outcome.payoffs[p]) {
            strictlyBetter = true
          }
        }
        
        if (dominates && strictlyBetter) {
          isParetoOptimal = false
        }
      }
    })
    
    if (isParetoOptimal) {
      optimal.push(outcome)
    }
  })
  
  return optimal
}

function checkZeroSum(payoffMatrix: number[][][]): boolean {
  if (!payoffMatrix || payoffMatrix.length === 0) return false
  
  for (let i = 0; i < payoffMatrix.length; i++) {
    for (let j = 0; j < payoffMatrix[i].length; j++) {
      const sum = payoffMatrix[i][j].reduce((a, b) => a + b, 0)
      if (Math.abs(sum) > 0.001) return false
    }
  }
  
  return true
}

function checkSymmetric(payoffMatrix: number[][][]): boolean {
  if (!payoffMatrix || payoffMatrix.length === 0) return false
  if (payoffMatrix.length !== payoffMatrix[0].length) return false
  
  for (let i = 0; i < payoffMatrix.length; i++) {
    for (let j = 0; j < payoffMatrix[i].length; j++) {
      if (payoffMatrix[i][j][0] !== payoffMatrix[j][i][1] || 
          payoffMatrix[i][j][1] !== payoffMatrix[j][i][0]) {
        return false
      }
    }
  }
  
  return true
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  score: number
}

interface GameAnalysis {
  nashEquilibria: { strategies: number[], payoffs: number[] }[]
  dominantStrategies: { player: number, strategy: number, type: 'strict' | 'weak' }[]
  paretoOptimal: { strategies: number[], payoffs: number[] }[]
  isZeroSum: boolean
  isSymmetric: boolean
  gameBalance: number
  strategicDepth: number
}

interface GameValidationPreviewProps {
  game: UIGameScenario | null
  payoffMatrix: number[][][]
  players: PlayerConfig[]
  onValidationChange?: (isValid: boolean) => void
}

export function GameValidationPreview({
  game,
  payoffMatrix,
  players,
  onValidationChange
}: GameValidationPreviewProps) {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: [],
    score: 0
  })
  
  const [analysis, setAnalysis] = useState<GameAnalysis>({
    nashEquilibria: [],
    dominantStrategies: [],
    paretoOptimal: [],
    isZeroSum: false,
    isSymmetric: false,
    gameBalance: 0,
    strategicDepth: 0
  })

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Validate game configuration
  const validateGame = useMemo(() => {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    let score = 0

    if (!game) {
      errors.push("No game scenario selected")
      return { isValid: false, errors, warnings, suggestions, score }
    }

    // Show loading state if matrix is being updated
    if (!payoffMatrix) {
      errors.push("Loading payoff matrix...")
      return { isValid: false, errors, warnings, suggestions, score }
    }

    if (payoffMatrix.length === 0) {
      errors.push("Payoff matrix is empty - please ensure the selected game has proper configuration")
      return { isValid: false, errors, warnings, suggestions, score }
    }

    if (players.length === 0) {
      warnings.push("No players configured yet - this will be set automatically")
      // Don't return here, continue validation
    }

    // Validate matrix dimensions
    const playerCount = game.playerCount || 2
    const strategyCount = game.strategies?.length || 2

    if (payoffMatrix.length !== strategyCount) {
      errors.push(`Payoff matrix should have ${strategyCount} strategy combinations (currently has ${payoffMatrix.length})`)
    } else {
      score += 20
    }

    // Check each strategy combination
    for (let i = 0; i < payoffMatrix.length; i++) {
      if (!payoffMatrix[i] || payoffMatrix[i].length !== strategyCount) {
        errors.push(`Strategy combination ${i + 1} has invalid dimensions (expected ${strategyCount} columns, got ${payoffMatrix[i]?.length || 0})`)
        continue
      }
      
      for (let j = 0; j < payoffMatrix[i].length; j++) {
        if (!payoffMatrix[i][j] || payoffMatrix[i][j].length !== playerCount) {
          errors.push(`Strategy combination [${i + 1}, ${j + 1}] missing player payoffs (expected ${playerCount} players, got ${payoffMatrix[i][j]?.length || 0})`)
          continue
        }
        
        // Check for valid numeric payoffs
        for (let p = 0; p < playerCount; p++) {
          const payoff = payoffMatrix[i][j][p]
          if (typeof payoff !== 'number' || isNaN(payoff)) {
            errors.push(`Invalid payoff for player ${p + 1} at [${i + 1}, ${j + 1}]: expected number, got ${typeof payoff} (${payoff})`)
          } else {
            // Valid payoff found
            score += 2
          }
        }
      }
    }

    if (errors.length === 0) {
      score += 30
    }

    // Validate player configurations
    if (players.length !== playerCount) {
      warnings.push(`Expected ${playerCount} players, but ${players.length} configured`)
    } else {
      score += 20
    }

    // Check player strategy validity
    players.forEach((player, index) => {
      if (!player.name || player.name.trim() === '') {
        warnings.push(`Player ${index + 1} has no name`)
      }
      
      if (!player.strategy) {
        warnings.push(`Player ${index + 1} has no strategy selected`)
      }
      
      if (player.strategy.type === 'mixed' && player.strategy.mixedProbabilities) {
        const sum = player.strategy.mixedProbabilities.reduce((a: number, b: number) => a + b, 0)
        if (Math.abs(sum - 1) > 0.01) {
          warnings.push(`Player ${index + 1} mixed strategy probabilities don't sum to 1`)
        } else {
          score += 10
        }
      }
    })

    // Validate game balance
    try {
      const flatPayoffs = payoffMatrix.flat().flat()
      const min = Math.min(...flatPayoffs)
      const max = Math.max(...flatPayoffs)
      const range = max - min
      
      if (range === 0) {
        warnings.push("All payoffs are identical - game may lack strategic interest")
      } else if (range > 100) {
        warnings.push("Large payoff range detected - consider normalizing values")
      } else {
        score += 10
      }
      
      // Check for degenerate cases
      const hasNegativePayoffs = flatPayoffs.some(p => p < 0)
      if (hasNegativePayoffs) {
        suggestions.push("Consider the interpretation of negative payoffs in your game context")
      }
      
      // Strategic diversity check
      const uniqueOutcomes = new Set(payoffMatrix.flat().map(outcome => JSON.stringify(outcome)))
      if (uniqueOutcomes.size < payoffMatrix.flat().length * 0.5) {
        warnings.push("Many identical outcomes detected - game may lack strategic diversity")
      } else {
        score += 10
      }
      
    } catch (error) {
      warnings.push("Could not analyze payoff distribution")
    }

    // Provide improvement suggestions
    if (warnings.length === 0 && errors.length === 0) {
      suggestions.push("Game configuration looks good! Ready for simulation.")
      score += 10
    }
    
    if (score >= 80) {
      suggestions.push("Excellent game setup - consider exploring advanced features")
    } else if (score >= 60) {
      suggestions.push("Good configuration - minor tweaks could improve balance")
    } else if (score < 40) {
      suggestions.push("Consider reviewing payoff values and player strategies")
    }

    const isValid = errors.length === 0
    return { isValid, errors, warnings, suggestions, score: Math.min(score, 100) }
  }, [game, payoffMatrix, players])

  // Perform strategic analysis
  const performAnalysis = useMemo(() => {
    if (!game || !payoffMatrix || payoffMatrix.length === 0) {
      return {
        nashEquilibria: [],
        dominantStrategies: [],
        paretoOptimal: [],
        isZeroSum: false,
        isSymmetric: false,
        gameBalance: 0,
        strategicDepth: 0
      }
    }

    try {
      // Simple analysis using basic algorithms
      const nashEquilibria = findSimpleNashEquilibria(payoffMatrix)
      const dominantStrategies = findSimpleDominantStrategies(payoffMatrix)
      const paretoOptimal = findSimpleParetoOptimal(payoffMatrix)
      const isZeroSum = checkZeroSum(payoffMatrix)
      const isSymmetric = checkSymmetric(payoffMatrix)
      
      // Calculate game balance (variance in payoffs)
      const allPayoffs = payoffMatrix.flat().flat()
      const mean = allPayoffs.reduce((a, b) => a + b, 0) / allPayoffs.length
      const variance = allPayoffs.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / allPayoffs.length
      const gameBalance = Math.sqrt(variance)
      
      // Calculate strategic depth
      const strategicDepth = nashEquilibria.length + dominantStrategies.length + (paretoOptimal.length > 1 ? 1 : 0)
      
      return {
        nashEquilibria,
        dominantStrategies,
        paretoOptimal,
        isZeroSum,
        isSymmetric,
        gameBalance,
        strategicDepth
      }
    } catch (error) {
      console.error("Analysis error:", error)
      return {
        nashEquilibria: [],
        dominantStrategies: [],
        paretoOptimal: [],
        isZeroSum: false,
        isSymmetric: false,
        gameBalance: 0,
        strategicDepth: 0
      }
    }
  }, [game, payoffMatrix])

  // Update state when validation changes
  useEffect(() => {
    setValidation(validateGame)
    onValidationChange?.(validateGame.isValid)
  }, [validateGame, onValidationChange])

  useEffect(() => {
    setIsAnalyzing(true)
    const timer = setTimeout(() => {
      setAnalysis(performAnalysis)
      setIsAnalyzing(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [performAnalysis])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  if (!game) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Game Validation & Preview
          </CardTitle>
          <CardDescription>
            Select a game scenario to see validation and strategic analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No game selected for analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Game Validation & Preview
              </CardTitle>
              <CardDescription>
                Configuration analysis for "{game.name}"
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getScoreBadgeVariant(validation.score)} className="text-lg px-3 py-1">
                {validation.score}%
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Calculator className="h-4 w-4 mr-1" />
                Advanced
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Validation Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {validation.errors.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <h4 className="font-semibold">Validation</h4>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Errors</span>
                  <span className="text-red-600">{validation.errors.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Warnings</span>
                  <span className="text-yellow-600">{validation.warnings.length}</span>
                </div>
                <Progress value={validation.score} className="mt-2" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">Analysis</h4>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Nash Equilibria</span>
                  <span className="font-mono">{analysis.nashEquilibria.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dominant Strategies</span>
                  <span className="font-mono">{analysis.dominantStrategies.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Strategic Depth</span>
                  <span className="font-mono">{analysis.strategicDepth}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold">Properties</h4>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Zero-Sum</span>
                  {analysis.isZeroSum ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Symmetric</span>
                  {analysis.isSymmetric ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span>Balance</span>
                  <span className="font-mono">{analysis.gameBalance.toFixed(1)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Issues and Suggestions */}
          {(validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
            <div className="space-y-3">
              {validation.errors.map((error, index) => (
                <Alert key={`error-${index}`} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
              
              {validation.warnings.map((warning, index) => (
                <Alert key={`warning-${index}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
              
              {validation.suggestions.map((suggestion, index) => (
                <Alert key={`suggestion-${index}`} className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">{suggestion}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Advanced Analysis */}
          {showAdvanced && (
            <Tabs defaultValue="equilibria" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="equilibria">Nash Equilibria</TabsTrigger>
                <TabsTrigger value="strategies">Dominant Strategies</TabsTrigger>
                <TabsTrigger value="pareto">Pareto Optimal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="equilibria" className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <h4 className="font-semibold">Nash Equilibria Analysis</h4>
                  {isAnalyzing && <RefreshCw className="h-4 w-4 animate-spin" />}
                </div>
                {analysis.nashEquilibria.length === 0 ? (
                  <p className="text-muted-foreground">No pure strategy Nash equilibria found</p>
                ) : (
                  <div className="space-y-2">
                    {analysis.nashEquilibria.map((equilibrium, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">Equilibrium {index + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Strategies:</span>
                            <div className="font-mono">
                              [{equilibrium.strategies.join(", ")}]
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payoffs:</span>
                            <div className="font-mono">
                              [{equilibrium.payoffs.join(", ")}]
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="strategies" className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <h4 className="font-semibold">Dominant Strategies</h4>
                </div>
                {analysis.dominantStrategies.length === 0 ? (
                  <p className="text-muted-foreground">No dominant strategies detected</p>
                ) : (
                  <div className="space-y-2">
                    {analysis.dominantStrategies.map((strategy, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Player {strategy.player + 1}</span>
                            <span className="text-muted-foreground ml-2">
                              Strategy {strategy.strategy + 1}
                            </span>
                          </div>
                          <Badge variant={strategy.type === 'strict' ? 'default' : 'secondary'}>
                            {strategy.type} dominance
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pareto" className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <h4 className="font-semibold">Pareto Optimal Outcomes</h4>
                </div>
                {analysis.paretoOptimal.length === 0 ? (
                  <p className="text-muted-foreground">No Pareto optimal outcomes identified</p>
                ) : (
                  <div className="space-y-2">
                    {analysis.paretoOptimal.map((outcome, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Outcome {index + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Strategies:</span>
                            <div className="font-mono">
                              [{outcome.strategies.join(", ")}]
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payoffs:</span>
                            <div className="font-mono">
                              [{outcome.payoffs.join(", ")}]
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
 