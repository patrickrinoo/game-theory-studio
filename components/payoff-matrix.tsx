"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect, useMemo } from "react"
import { 
  RotateCcw, 
  AlertCircle, 
  CheckCircle, 
  Crown, 
  Target,
  Shuffle,
  TrendingUp,
  Info,
  Download,
  Upload,
  Plus,
  Minus,
  Move,
  Eye,
  EyeOff
} from "lucide-react"
import { GameTheoryUtils } from "@/lib/game-theory-utils"

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

interface PayoffMatrixProps {
  game: UIGameScenario
  matrix: number[][][]
  onMatrixChange: (matrix: number[][][]) => void
}

interface ValidationResult {
  isValid: boolean
  warnings: string[]
  suggestions: string[]
}

interface StrategicAnalysis {
  nashEquilibria: any[]
  dominantStrategies: any[]
  pareto: { row: number; col: number; payoffs: number[] }[]
  zeroSum: boolean
  symmetry: boolean
}

const PRESET_TEMPLATES = {
  'prisoners-dilemma': {
    name: "Prisoner's Dilemma",
    matrix: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
    description: "Classic cooperation vs defection scenario"
  },
  'chicken-game': {
    name: "Chicken Game",
    matrix: [[[0, 0], [2, -1]], [[-1, 2], [1, 1]]],
    description: "High-stakes confrontation game"
  },
  'battle-of-sexes': {
    name: "Battle of the Sexes",
    matrix: [[[2, 1], [0, 0]], [[0, 0], [1, 2]]],
    description: "Coordination with conflicting preferences"
  },
  'zero-sum': {
    name: "Zero-Sum Game",
    matrix: [[[1, -1], [-1, 1]], [[-1, 1], [1, -1]]],
    description: "Pure competition scenario"
  },
  'coordination': {
    name: "Pure Coordination",
    matrix: [[[1, 1], [0, 0]], [[0, 0], [1, 1]]],
    description: "Mutual benefit coordination"
  }
}

export function PayoffMatrix({ game, matrix, onMatrixChange }: PayoffMatrixProps) {
  const [activeTemplate, setActiveTemplate] = useState<string>('')
  const [matrixSize, setMatrixSize] = useState(game.strategies.length)
  const [showAnalysis, setShowAnalysis] = useState(true)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [draggedStrategy, setDraggedStrategy] = useState<number | null>(null)

  // Initialize utils for strategic analysis
  const utils = useMemo(() => new GameTheoryUtils(), [])

  // Validate matrix values and provide feedback
  const validateMatrix = (): ValidationResult => {
    const warnings: string[] = []
    const suggestions: string[] = []
    let isValid = true

    if (!matrix || matrix.length === 0) {
      return { isValid: false, warnings: ['Matrix is not initialized'], suggestions: [] }
    }

    // Check for incomplete entries
    for (let i = 0; i < matrixSize; i++) {
      for (let j = 0; j < matrixSize; j++) {
        if (!matrix[i] || !matrix[i][j] || !Array.isArray(matrix[i][j]) || matrix[i][j].some((val: number) => isNaN(val))) {
          warnings.push(`Incomplete payoff at position (${i+1}, ${j+1})`)
          isValid = false
        }
      }
    }

    // Strategic analysis warnings
    if (isValid) {
      try {
        const nashEquilibria = utils.findNashEquilibrium(matrix, game.strategies)
        if (!nashEquilibria) {
          warnings.push('No pure strategy Nash equilibrium found')
          suggestions.push('Consider mixed strategy analysis')
        }

        const dominantStrategies = utils.findDominantStrategies(matrix, game.strategies)
        if (dominantStrategies.length === 0) {
          suggestions.push('No dominant strategies - players need mixed strategies')
        }

        // Check for zero-sum
        let isZeroSum = true
        for (let i = 0; i < matrixSize && isZeroSum; i++) {
          for (let j = 0; j < matrixSize && isZeroSum; j++) {
            if (matrix[i][j][0] + matrix[i][j][1] !== 0) {
              isZeroSum = false
            }
          }
        }
        
        if (isZeroSum) {
          suggestions.push('This is a zero-sum game - purely competitive')
        } else {
          suggestions.push('Non-zero-sum game allows for mutual benefit')
        }
      } catch (error) {
        warnings.push('Error in strategic analysis')
      }
    }

    return { isValid, warnings, suggestions }
  }

  // Perform strategic analysis
  const analyzeStrategies = (): StrategicAnalysis => {
    if (!matrix || matrix.length === 0) {
      return {
        nashEquilibria: [],
        dominantStrategies: [],
        pareto: [],
        zeroSum: false,
        symmetry: false
      }
    }

    try {
      const nashEquilibria = utils.findNashEquilibrium([matrix], game.strategies) || []
      const dominantStrategies = utils.findDominantStrategies([matrix], game.strategies) || []
      
      // Find Pareto optimal outcomes
      const pareto: { row: number; col: number; payoffs: number[] }[] = []
      for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
          const currentPayoffs = matrix[i][j]
          let isPareto = true
          
          // Check if any other outcome dominates this one
          for (let x = 0; x < matrixSize && isPareto; x++) {
            for (let y = 0; y < matrixSize && isPareto; y++) {
              if (x === i && y === j) continue
              const otherPayoffs = matrix[x][y]
              if (otherPayoffs[0] >= currentPayoffs[0] && otherPayoffs[1] >= currentPayoffs[1] &&
                  (otherPayoffs[0] > currentPayoffs[0] || otherPayoffs[1] > currentPayoffs[1])) {
                isPareto = false
              }
            }
          }
          
          if (isPareto) {
            pareto.push({ row: i, col: j, payoffs: currentPayoffs })
          }
        }
      }

      // Check if zero-sum
      let zeroSum = true
      for (let i = 0; i < matrixSize && zeroSum; i++) {
        for (let j = 0; j < matrixSize && zeroSum; j++) {
          if (Math.abs(matrix[i][j][0] + matrix[i][j][1]) > 0.001) {
            zeroSum = false
          }
        }
      }

      // Check symmetry
      let symmetry = true
      for (let i = 0; i < matrixSize && symmetry; i++) {
        for (let j = 0; j < matrixSize && symmetry; j++) {
          if (matrix[i][j][0] !== matrix[j][i][1] || 
              matrix[i][j][1] !== matrix[j][i][0]) {
            symmetry = false
          }
        }
      }

      return {
        nashEquilibria: Array.isArray(nashEquilibria) ? nashEquilibria : [],
        dominantStrategies: Array.isArray(dominantStrategies) ? dominantStrategies : [],
        pareto,
        zeroSum,
        symmetry
      }
    } catch (error) {
      console.error('Analysis error:', error)
      return {
        nashEquilibria: [],
        dominantStrategies: [],
        pareto: [],
        zeroSum: false,
        symmetry: false
      }
    }
  }

  const validation = validateMatrix()
  const analysis = analyzeStrategies()

  const updatePayoff = (row: number, col: number, player: number, value: number) => {
    if (isNaN(value)) return
    
    const newMatrix = [...matrix]
    if (!newMatrix[row]) newMatrix[row] = []
    if (!newMatrix[row][col]) newMatrix[row][col] = [0, 0]
    
    newMatrix[row][col][player] = value
    onMatrixChange(newMatrix)
    
    // Clear validation error for this cell
    const errorKey = `${row}-${col}-${player}`
    if (validationErrors[errorKey]) {
      const newErrors = { ...validationErrors }
      delete newErrors[errorKey]
      setValidationErrors(newErrors)
    }
  }

  const applyTemplate = (templateKey: string) => {
    const template = PRESET_TEMPLATES[templateKey as keyof typeof PRESET_TEMPLATES]
    if (template) {
      const newMatrix = [template.matrix]
      onMatrixChange(newMatrix)
      setActiveTemplate(templateKey)
    }
  }

  const resetToDefault = () => {
    onMatrixChange(game.payoffMatrix)
    setActiveTemplate('')
  }

  const randomizeMatrix = () => {
    const newMatrix = [[]]
    for (let i = 0; i < matrixSize; i++) {
      newMatrix[0][i] = []
      for (let j = 0; j < matrixSize; j++) {
        newMatrix[0][i][j] = [
          Math.floor(Math.random() * 10) - 2, // Random values from -2 to 7
          Math.floor(Math.random() * 10) - 2
        ]
      }
    }
    onMatrixChange(newMatrix)
    setActiveTemplate('')
  }

  const getCellClass = (row: number, col: number) => {
    let baseClass = "border p-2 transition-all duration-200"
    
    // Highlight Nash equilibria
    const isNash = analysis.nashEquilibria.some((nash: any) => 
      nash.strategies && nash.strategies[0] === row && nash.strategies[1] === col
    )
    if (isNash) {
      baseClass += " bg-blue-50 border-blue-300 shadow-sm"
    }
    
    // Highlight Pareto optimal
    const isPareto = analysis.pareto.some(p => p.row === row && p.col === col)
    if (isPareto) {
      baseClass += " bg-green-50 border-green-300"
    }
    
    return baseClass
  }

  const getStrategyBadge = (strategy: string, index: number) => {
    const isDominant = analysis.dominantStrategies.some((dom: any) => 
      dom.strategy === strategy || dom.player === index
    )
    
    return (
      <div className="flex items-center gap-2">
        <span>{strategy}</span>
        {isDominant && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Crown className="w-4 h-4 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Dominant Strategy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  if (!matrix[0]) return null

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Dynamic Payoff Matrix Editor
              </CardTitle>
              <CardDescription>
                Customize payoffs and analyze strategic implications in real-time
              </CardDescription>
          </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="bg-white/50"
              >
                {showAnalysis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={randomizeMatrix} className="bg-white/50">
                <Shuffle className="w-4 h-4 mr-2" />
                Random
              </Button>
              <Button variant="outline" size="sm" onClick={resetToDefault} className="bg-white/50">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
            </div>
        </div>
      </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESET_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant={activeTemplate === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyTemplate(key)}
                  className="text-xs"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Validation Status */}
          {validation.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Validation Issues</span>
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Matrix Editor */}
        <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Format: (Player 1 payoff, Player 2 payoff)
            </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                    <th className="border p-3 bg-gray-50 font-medium">
                      <div className="flex items-center gap-2">
                        <span>Player 1 \ Player 2</span>
                        <Info className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                    {game.strategies.slice(0, matrixSize).map((strategy, index) => (
                      <th key={index} className="border p-3 bg-gray-50 font-medium">
                        {getStrategyBadge(strategy, index)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {game.strategies.slice(0, matrixSize).map((rowStrategy, row) => (
                  <tr key={row}>
                      <td className="border p-3 bg-gray-50 font-medium">
                        {getStrategyBadge(rowStrategy, row)}
                      </td>
                      {game.strategies.slice(0, matrixSize).map((colStrategy, col) => (
                        <td key={col} className={getCellClass(row, col)}>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-blue-600 font-medium">P1</Label>
                              <Input
                                type="number"
                                  step="0.1"
                                value={matrix[0]?.[row]?.[col]?.[0] || 0}
                                onChange={(e) => updatePayoff(row, col, 0, Number.parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm"
                              />
                            </div>
                              <div>
                                <Label className="text-xs text-red-600 font-medium">P2</Label>
                              <Input
                                type="number"
                                  step="0.1"
                                value={matrix[0]?.[row]?.[col]?.[1] || 0}
                                onChange={(e) => updatePayoff(row, col, 1, Number.parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                            <div className="text-xs text-center font-mono bg-gray-50 rounded px-2 py-1">
                            ({matrix[0]?.[row]?.[col]?.[0] || 0}, {matrix[0]?.[row]?.[col]?.[1] || 0})
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {/* Strategic Analysis */}
          {showAnalysis && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Strategic Analysis</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Nash Equilibria</Label>
                  {analysis.nashEquilibria.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.nashEquilibria.map((nash: any, index: number) => (
                        <Badge key={index} variant="default" className="text-xs">
                          ({nash.strategies?.[0] || 0}, {nash.strategies?.[1] || 0})
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">None found</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Dominant Strategies</Label>
                  {analysis.dominantStrategies.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.dominantStrategies.map((dom: any, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {dom.strategy || `Player ${dom.player + 1}`}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">None found</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Pareto Optimal</Label>
                  {analysis.pareto.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.pareto.slice(0, 3).map((pareto, index) => (
                        <Badge key={index} variant="default" className="text-xs bg-green-100 text-green-800">
                          ({pareto.row}, {pareto.col})
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">None found</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Game Properties</Label>
                  <div className="space-y-1">
                    <Badge 
                      variant={analysis.zeroSum ? "destructive" : "default"} 
                      className="text-xs"
                    >
                      {analysis.zeroSum ? "Zero-Sum" : "Non-Zero-Sum"}
                    </Badge>
                    {analysis.symmetry && (
                      <Badge variant="secondary" className="text-xs">
                        Symmetric
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {validation.suggestions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Strategic Insights</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {validation.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
      </CardContent>
    </Card>
    </div>
  )
}
