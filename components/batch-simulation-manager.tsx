"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  RotateCcw, 
  Plus, 
  Minus, 
  Settings, 
  BarChart3, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Zap,
  Target,
  Activity,
  TrendingUp,
  Users,
  Layers,
  Grid,
  Archive,
  Filter,
  Eye,
  Trash2
} from "lucide-react"
import { MonteCarloEngine } from "@/lib/monte-carlo-engine"
import type { 
  SimulationParameters, 
  GameScenario, 
  Player,
  SimulationResult 
} from "@/lib/game-theory-types"

// Batch simulation types
interface BatchConfiguration {
  id: string
  name: string
  description: string
  baseParameters: SimulationParameters
  variations: ParameterVariation[]
  totalRuns: number
  createdAt: Date
  status: 'pending' | 'running' | 'completed' | 'paused' | 'error'
}

interface ParameterVariation {
  id: string
  parameterName: string
  parameterPath: string
  values: any[]
  variationType: 'discrete' | 'range' | 'custom'
  description: string
}

interface BatchRun {
  id: string
  batchId: string
  runIndex: number
  parameters: SimulationParameters
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: SimulationResult
  startTime?: Date
  endTime?: Date
  duration?: number
  error?: string
}

interface BatchResults {
  batchId: string
  totalRuns: number
  completedRuns: number
  failedRuns: number
  averageDuration: number
  totalDuration: number
  results: BatchRun[]
  summary: BatchSummary
}

interface BatchSummary {
  convergenceRate: number
  averageIterations: number
  bestResult: SimulationResult | null
  worstResult: SimulationResult | null
  parameterEffects: ParameterEffect[]
}

interface ParameterEffect {
  parameterName: string
  correlation: number
  significance: number
  description: string
}

export interface BatchSimulationManagerProps {
  gameScenario: GameScenario
  baseParameters: SimulationParameters
  onBatchComplete?: (results: BatchResults) => void
  onProgressUpdate?: (progress: BatchProgress) => void
  className?: string
}

interface BatchProgress {
  batchId: string
  totalRuns: number
  completedRuns: number
  currentRun: number
  overallProgress: number
  estimatedTimeRemaining: number
  currentRunProgress: number
}

export const BatchSimulationManager: React.FC<BatchSimulationManagerProps> = ({
  gameScenario,
  baseParameters,
  onBatchComplete,
  onProgressUpdate,
  className = ""
}) => {
  // State management
  const [batches, setBatches] = useState<BatchConfiguration[]>([])
  const [currentBatch, setCurrentBatch] = useState<BatchConfiguration | null>(null)
  const [batchResults, setBatchResults] = useState<Map<string, BatchResults>>(new Map())
  const [isRunning, setIsRunning] = useState(false)
  const [currentProgress, setCurrentProgress] = useState<BatchProgress | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('setup')

  // Batch configuration state
  const [batchName, setBatchName] = useState('')
  const [batchDescription, setBatchDescription] = useState('')
  const [variations, setVariations] = useState<ParameterVariation[]>([])

  // Refs for simulation management
  const engineRef = useRef<MonteCarloEngine | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize Monte Carlo Engine
  useEffect(() => {
    if (gameScenario && baseParameters) {
      engineRef.current = new MonteCarloEngine(gameScenario, baseParameters)
    }
  }, [gameScenario, baseParameters])

  // Create new batch configuration
  const createBatchConfiguration = useCallback((): BatchConfiguration => {
    const id = `batch_${Date.now()}`
    const totalRuns = calculateTotalRuns(variations)
    
    return {
      id,
      name: batchName || `Batch ${batches.length + 1}`,
      description: batchDescription || 'Auto-generated batch simulation',
      baseParameters,
      variations: [...variations],
      totalRuns,
      createdAt: new Date(),
      status: 'pending'
    }
  }, [batchName, batchDescription, baseParameters, variations, batches.length])

  // Calculate total number of runs for a batch
  const calculateTotalRuns = useCallback((variations: ParameterVariation[]): number => {
    if (variations.length === 0) return 1
    return variations.reduce((total, variation) => total * variation.values.length, 1)
  }, [])

  // Generate all parameter combinations
  const generateParameterCombinations = useCallback((
    baseParams: SimulationParameters, 
    variations: ParameterVariation[]
  ): SimulationParameters[] => {
    if (variations.length === 0) return [baseParams]

    const combinations: SimulationParameters[] = []
    
    const generateCombos = (index: number, currentParams: SimulationParameters) => {
      if (index >= variations.length) {
        combinations.push({ ...currentParams })
        return
      }

      const variation = variations[index]
      for (const value of variation.values) {
        const newParams = { ...currentParams }
        setNestedProperty(newParams, variation.parameterPath, value)
        generateCombos(index + 1, newParams)
      }
    }

    generateCombos(0, { ...baseParams })
    return combinations
  }, [])

  // Helper function to set nested properties
  const setNestedProperty = (obj: any, path: string, value: any) => {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) current[keys[i]] = {}
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
  }

  // Run batch simulation
  const runBatchSimulation = useCallback(async (batch: BatchConfiguration) => {
    if (!engineRef.current) return

    setIsRunning(true)
    setCurrentBatch(batch)
    abortControllerRef.current = new AbortController()

    try {
      // Update batch status
      setBatches(prev => prev.map(b => 
        b.id === batch.id ? { ...b, status: 'running' } : b
      ))

      // Generate all parameter combinations
      const parameterCombinations = generateParameterCombinations(
        batch.baseParameters, 
        batch.variations
      )

      const batchRuns: BatchRun[] = parameterCombinations.map((params, index) => ({
        id: `run_${batch.id}_${index}`,
        batchId: batch.id,
        runIndex: index,
        parameters: params,
        status: 'pending'
      }))

      const results: BatchRun[] = []
      const startTime = Date.now()

      // Run each simulation
      for (let i = 0; i < batchRuns.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break

        const run = batchRuns[i]
        const runStartTime = Date.now()

        // Update progress
        const progress: BatchProgress = {
          batchId: batch.id,
          totalRuns: batchRuns.length,
          completedRuns: i,
          currentRun: i + 1,
          overallProgress: (i / batchRuns.length) * 100,
          estimatedTimeRemaining: estimateTimeRemaining(i, batchRuns.length, startTime),
          currentRunProgress: 0
        }
        setCurrentProgress(progress)
        onProgressUpdate?.(progress)

        try {
          // Update run status
          run.status = 'running'
          run.startTime = new Date()

          // Configure engine with run parameters
          engineRef.current!.updateConfiguration(run.parameters)

          // Run simulation with progress callback
          const result = await engineRef.current!.runSimulation({
            onProgress: (iterationProgress) => {
              const updatedProgress = {
                ...progress,
                currentRunProgress: iterationProgress.percentage
              }
              setCurrentProgress(updatedProgress)
              onProgressUpdate?.(updatedProgress)
            }
          })

          // Update run with results
          run.status = 'completed'
          run.endTime = new Date()
          run.duration = Date.now() - runStartTime
          run.result = result

        } catch (error) {
          run.status = 'failed'
          run.endTime = new Date()
          run.duration = Date.now() - runStartTime
          run.error = error instanceof Error ? error.message : 'Unknown error'
        }

        results.push(run)
      }

      // Create batch results
      const batchResults: BatchResults = {
        batchId: batch.id,
        totalRuns: batchRuns.length,
        completedRuns: results.filter(r => r.status === 'completed').length,
        failedRuns: results.filter(r => r.status === 'failed').length,
        averageDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length,
        totalDuration: Date.now() - startTime,
        results,
        summary: generateBatchSummary(results, batch.variations)
      }

      // Store results
      setBatchResults(prev => new Map(prev).set(batch.id, batchResults))

      // Update batch status
      setBatches(prev => prev.map(b => 
        b.id === batch.id ? { ...b, status: 'completed' } : b
      ))

      onBatchComplete?.(batchResults)

    } catch (error) {
      console.error('Batch simulation error:', error)
      
      // Update batch status to error
      setBatches(prev => prev.map(b => 
        b.id === batch.id ? { ...b, status: 'error' } : b
      ))

    } finally {
      setIsRunning(false)
      setCurrentBatch(null)
      setCurrentProgress(null)
      abortControllerRef.current = null
    }
  }, [generateParameterCombinations, onProgressUpdate, onBatchComplete])

  // Estimate time remaining
  const estimateTimeRemaining = (completedRuns: number, totalRuns: number, startTime: number): number => {
    if (completedRuns === 0) return 0
    const elapsed = Date.now() - startTime
    const averageTime = elapsed / completedRuns
    return (totalRuns - completedRuns) * averageTime
  }

  // Generate batch summary
  const generateBatchSummary = (
    results: BatchRun[], 
    variations: ParameterVariation[]
  ): BatchSummary => {
    const completedResults = results.filter(r => r.status === 'completed' && r.result)
    
    if (completedResults.length === 0) {
      return {
        convergenceRate: 0,
        averageIterations: 0,
        bestResult: null,
        worstResult: null,
        parameterEffects: []
      }
    }

    const convergenceRate = completedResults.length / results.length * 100
    const averageIterations = completedResults.reduce(
      (sum, r) => sum + (r.result?.metadata?.totalIterations || 0), 0
    ) / completedResults.length

    // Find best and worst results (based on some metric, e.g., convergence confidence)
    const sortedResults = completedResults.sort((a, b) => 
      (b.result?.convergence?.confidence || 0) - (a.result?.convergence?.confidence || 0)
    )
    
    const bestResult = sortedResults[0]?.result || null
    const worstResult = sortedResults[sortedResults.length - 1]?.result || null

    // Analyze parameter effects (simplified correlation analysis)
    const parameterEffects: ParameterEffect[] = variations.map(variation => ({
      parameterName: variation.parameterName,
      correlation: 0, // Would need more sophisticated analysis
      significance: 0,
      description: `Effect of ${variation.parameterName} on simulation outcomes`
    }))

    return {
      convergenceRate,
      averageIterations,
      bestResult,
      worstResult,
      parameterEffects
    }
  }

  // Add parameter variation
  const addParameterVariation = useCallback(() => {
    const newVariation: ParameterVariation = {
      id: `var_${Date.now()}`,
      parameterName: '',
      parameterPath: '',
      values: [],
      variationType: 'discrete',
      description: ''
    }
    setVariations(prev => [...prev, newVariation])
  }, [])

  // Remove parameter variation
  const removeParameterVariation = useCallback((id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id))
  }, [])

  // Update parameter variation
  const updateParameterVariation = useCallback((id: string, updates: Partial<ParameterVariation>) => {
    setVariations(prev => prev.map(v => 
      v.id === id ? { ...v, ...updates } : v
    ))
  }, [])

  // Start batch simulation
  const startBatch = useCallback(() => {
    const batch = createBatchConfiguration()
    setBatches(prev => [...prev, batch])
    runBatchSimulation(batch)
  }, [createBatchConfiguration, runBatchSimulation])

  // Stop batch simulation
  const stopBatch = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  // Export batch results
  const exportBatchResults = useCallback((batchId: string, format: 'csv' | 'json') => {
    const results = batchResults.get(batchId)
    if (!results) return

    const data = format === 'json' 
      ? JSON.stringify(results, null, 2)
      : convertToCSV(results)

    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch_results_${batchId}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }, [batchResults])

  // Convert results to CSV format
  const convertToCSV = (results: BatchResults): string => {
    const headers = [
      'Run Index',
      'Status', 
      'Duration (ms)',
      'Iterations',
      'Convergence Confidence',
      'Final Payoff Player 1',
      'Final Payoff Player 2'
    ]

    const rows = results.results.map(run => [
      run.runIndex,
      run.status,
      run.duration || 0,
      run.result?.metadata?.totalIterations || 0,
      run.result?.convergence?.confidence || 0,
      run.result?.finalPayoffs?.[0] || 0,
      run.result?.finalPayoffs?.[1] || 0
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  // Format time duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  // Render batch setup interface
  const renderBatchSetup = () => (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Batch Configuration
          </CardTitle>
          <CardDescription>
            Set up parameters for running multiple simulations with variations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch-name">Batch Name</Label>
              <Input
                id="batch-name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Enter batch name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-runs">Estimated Total Runs</Label>
              <Input
                id="total-runs"
                value={calculateTotalRuns(variations)}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="batch-description">Description</Label>
            <Textarea
              id="batch-description"
              value={batchDescription}
              onChange={(e) => setBatchDescription(e.target.value)}
              placeholder="Describe the purpose of this batch simulation..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Parameter Variations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Grid className="w-5 h-5" />
              Parameter Variations
            </CardTitle>
            <CardDescription>
              Define parameter variations to explore different scenarios
            </CardDescription>
          </div>
          <Button onClick={addParameterVariation} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Variation
          </Button>
        </CardHeader>
        <CardContent>
          {variations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Grid className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No parameter variations defined</p>
              <p className="text-sm">Add variations to explore different scenarios</p>
            </div>
          ) : (
            <div className="space-y-4">
              {variations.map((variation, index) => (
                <Card key={variation.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Variation {index + 1}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeParameterVariation(variation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Parameter Name</Label>
                        <Input
                          value={variation.parameterName}
                          onChange={(e) => updateParameterVariation(variation.id, { 
                            parameterName: e.target.value 
                          })}
                          placeholder="e.g., Iteration Count"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Parameter Path</Label>
                        <Input
                          value={variation.parameterPath}
                          onChange={(e) => updateParameterVariation(variation.id, { 
                            parameterPath: e.target.value 
                          })}
                          placeholder="e.g., maxIterations"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Variation Type</Label>
                      <Select
                        value={variation.variationType}
                        onValueChange={(value: 'discrete' | 'range' | 'custom') => 
                          updateParameterVariation(variation.id, { variationType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discrete">Discrete Values</SelectItem>
                          <SelectItem value="range">Range</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Values (comma-separated)</Label>
                      <Input
                        value={variation.values.join(', ')}
                        onChange={(e) => {
                          const values = e.target.value.split(',').map(v => {
                            const trimmed = v.trim()
                            const num = parseFloat(trimmed)
                            return isNaN(num) ? trimmed : num
                          }).filter(v => v !== '')
                          updateParameterVariation(variation.id, { values })
                        }}
                        placeholder="e.g., 1000, 5000, 10000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={variation.description}
                        onChange={(e) => updateParameterVariation(variation.id, { 
                          description: e.target.value 
                        })}
                        placeholder="Describe this variation..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          onClick={() => {
            setBatchName('')
            setBatchDescription('')
            setVariations([])
          }}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button 
          onClick={startBatch}
          disabled={isRunning || variations.length === 0}
          className="min-w-32"
        >
          {isRunning ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Batch
            </>
          )}
        </Button>
      </div>
    </div>
  )

  // Render batch progress monitoring
  const renderBatchProgress = () => {
    if (!currentProgress) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No batch simulation currently running</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Batch Progress
            </CardTitle>
            <CardDescription>
              Running batch simulation: {currentBatch?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{currentProgress.completedRuns} of {currentProgress.totalRuns} runs</span>
              </div>
              <Progress value={currentProgress.overallProgress} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Run Progress</span>
                <span>Run {currentProgress.currentRun}</span>
              </div>
              <Progress value={currentProgress.currentRunProgress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentProgress.completedRuns}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {currentProgress.currentRun}
                </div>
                <div className="text-sm text-gray-600">Current Run</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentProgress.totalRuns}
                </div>
                <div className="text-sm text-gray-600">Total Runs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatDuration(currentProgress.estimatedTimeRemaining)}
                </div>
                <div className="text-sm text-gray-600">Est. Remaining</div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                variant="destructive" 
                onClick={stopBatch}
                disabled={!isRunning}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render batch results
  const renderBatchResults = () => (
    <div className="space-y-6">
      {/* Batch List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Batch History
          </CardTitle>
          <CardDescription>
            View and manage your batch simulation runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No batch simulations yet</p>
              <p className="text-sm">Create your first batch in the Setup tab</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => {
                const results = batchResults.get(batch.id)
                return (
                  <Card 
                    key={batch.id} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedBatch === batch.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedBatch(
                      selectedBatch === batch.id ? null : batch.id
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                batch.status === 'completed' ? 'default' :
                                batch.status === 'running' ? 'secondary' :
                                batch.status === 'error' ? 'destructive' :
                                'outline'
                              }
                            >
                              {batch.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                              {batch.status === 'running' && <Activity className="w-3 h-3" />}
                              {batch.status === 'error' && <XCircle className="w-3 h-3" />}
                              {batch.status === 'pending' && <Clock className="w-3 h-3" />}
                              {batch.status}
                            </Badge>
                            <span className="font-medium">{batch.name}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{batch.totalRuns} runs</span>
                          <span>{batch.variations.length} variations</span>
                          {results && (
                            <>
                              <span>{results.completedRuns} completed</span>
                              <span>{formatDuration(results.totalDuration)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {selectedBatch === batch.id && results && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {((results.completedRuns / results.totalRuns) * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-600">Success Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {results.summary.averageIterations.toFixed(0)}
                              </div>
                              <div className="text-xs text-gray-600">Avg. Iterations</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">
                                {formatDuration(results.averageDuration)}
                              </div>
                              <div className="text-xs text-gray-600">Avg. Duration</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-orange-600">
                                {results.summary.convergenceRate.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-600">Convergence</div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                exportBatchResults(batch.id, 'csv')
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export CSV
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                exportBatchResults(batch.id, 'json')
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export JSON
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-6 h-6" />
            Batch Simulation Manager
          </CardTitle>
          <CardDescription>
            Run multiple simulations with different parameters and compare results
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          {renderBatchSetup()}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {renderBatchProgress()}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {renderBatchResults()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BatchSimulationManager 