"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Clock, 
  TrendingUp, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  Activity,
  BarChart3,
  Timer,
  Cpu,
  MemoryStick,
  Target
} from "lucide-react"
import { MonteCarloEngine } from "@/lib/monte-carlo-engine"
import type { 
  SimulationParameters, 
  GameScenario, 
  Player,
  SimulationResult 
} from "@/lib/game-theory-types"

interface SimulationControlsProps {
  gameScenario: GameScenario
  players: Player[]
  payoffMatrix: number[][][]
  parameters: SimulationParameters
  onResultsUpdate: (results: SimulationResult) => void
  onProgressUpdate?: (progress: number, data?: any) => void
  onStatusChange?: (status: SimulationStatus) => void
  className?: string
}

export type SimulationStatus = 
  | 'idle' 
  | 'initializing' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'error' 
  | 'interrupted'

interface SimulationMetrics {
  currentIteration: number
  totalIterations: number
  progress: number
  elapsedTime: number
  estimatedTimeRemaining: number
  iterationsPerSecond: number
  convergenceConfidence?: number
  convergenceIteration?: number
  memoryUsage: number
  peakMemory: number
  isConverged: boolean
}

interface SimulationState {
  status: SimulationStatus
  metrics: SimulationMetrics
  startTime: number | null
  pauseTime: number | null
  engine: MonteCarloEngine | null
  results: SimulationResult | null
  error: string | null
}

const initialMetrics: SimulationMetrics = {
  currentIteration: 0,
  totalIterations: 0,
  progress: 0,
  elapsedTime: 0,
  estimatedTimeRemaining: 0,
  iterationsPerSecond: 0,
  convergenceConfidence: 0,
  convergenceIteration: undefined,
  memoryUsage: 0,
  peakMemory: 0,
  isConverged: false
}

const initialState: SimulationState = {
  status: 'idle',
  metrics: initialMetrics,
  startTime: null,
  pauseTime: null,
  engine: null,
  results: null,
  error: null
}

export function SimulationControls({
  gameScenario,
  players,
  payoffMatrix,
  parameters,
  onResultsUpdate,
  onProgressUpdate,
  onStatusChange,
  className
}: SimulationControlsProps) {
  const [state, setState] = useState<SimulationState>(initialState)
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const engineRef = useRef<MonteCarloEngine | null>(null)

  // Update status and notify parent
  const updateStatus = useCallback((status: SimulationStatus) => {
    setState(prev => ({ ...prev, status }))
    onStatusChange?.(status)
  }, [onStatusChange])

  // Calculate real-time metrics
  const updateMetrics = useCallback(() => {
    if (!state.startTime || state.status !== 'running') return

    const now = Date.now()
    const elapsedTime = (now - state.startTime) / 1000

    setState(prev => {
      const iterationsPerSecond = prev.metrics.currentIteration / elapsedTime || 0
      const remainingIterations = prev.metrics.totalIterations - prev.metrics.currentIteration
      const estimatedTimeRemaining = remainingIterations / iterationsPerSecond || 0

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          elapsedTime,
          estimatedTimeRemaining,
          iterationsPerSecond
        }
      }
    })
  }, [state.startTime, state.status])

  // Start metrics update interval
  useEffect(() => {
    if (state.status === 'running') {
      metricsIntervalRef.current = setInterval(updateMetrics, 1000)
    } else {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
        metricsIntervalRef.current = null
      }
    }

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
      }
    }
  }, [state.status, updateMetrics])

  // Initialize simulation engine
  const initializeEngine = useCallback(() => {
    try {
      updateStatus('initializing')
      
      const engine = new MonteCarloEngine()
      
      // Configure engine based on parameters
      if (parameters.seed !== undefined) {
        engine.configureRNG("mersenne", parameters.seed)
      }

      engine.configurePerformance({
        maxMemoryMB: 1024,
        batchSize: parameters.batchSize || 1000,
        workerCount: 4,
        useWebWorkers: parameters.useWebWorkers || false
      })

      engine.configureConvergence({
        enable: parameters.convergenceCriteria?.enabled || false,
        windowSize: parameters.convergenceCriteria?.windowSize || 1000,
        confidenceLevel: 0.95,
        stabilityThreshold: parameters.convergenceCriteria?.tolerance || 0.01,
        minIterations: Math.min(1000, parameters.iterations),
        maxIterations: parameters.iterations,
        playerCount: players.length
      })

      engine.configureAdvancedResults({
        enable: true,
        playerCount: players.length,
        trackDistributions: parameters.trackHistory || false,
        trackEvolution: parameters.trackHistory || false,
        enableHistoricalComparison: false
      })

      engineRef.current = engine
      setState(prev => ({ ...prev, engine }))
      
      return engine
    } catch (error) {
      console.error('Failed to initialize simulation engine:', error)
      setState(prev => ({ 
        ...prev, 
        error: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }))
      return null
    }
  }, [parameters, players.length, updateStatus])

  // Progress callback for simulation
  const handleProgress = useCallback((progress: number, analysisData?: any) => {
    const currentIteration = Math.round(progress * parameters.iterations)
    
    setState(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        currentIteration,
        progress: progress * 100,
        convergenceConfidence: analysisData?.convergenceData?.confidence,
        convergenceIteration: analysisData?.convergenceData?.iteration,
        isConverged: analysisData?.convergenceData?.isConverged || false
      }
    }))

    onProgressUpdate?.(progress, analysisData)
  }, [parameters.iterations, onProgressUpdate])

  // Start simulation
  const startSimulation = useCallback(async () => {
    const engine = engineRef.current || initializeEngine()
    if (!engine) return

    try {
      updateStatus('running')
      setState(prev => ({
        ...prev,
        startTime: Date.now(),
        pauseTime: null,
        metrics: {
          ...initialMetrics,
          totalIterations: parameters.iterations
        },
        error: null
      }))

      // Extract strategy information
      const playerStrategies = players.map(player => player.strategy)
      const mixedStrategies = players.map(player => player.mixedStrategy || [1])

      const results = await engine.runSimulationWithAdvancedAnalysis({
        game: gameScenario,
        payoffMatrix,
        iterations: parameters.iterations,
        playerStrategies,
        mixedStrategies,
        onProgress: handleProgress,
        rngType: "mersenne",
        seed: parameters.seed,
        gameScenario,
        players,
        enableLearning: true,
        useWebWorkers: parameters.useWebWorkers || false,
        batchSize: parameters.batchSize || 1000,
        enableInterruption: true,
        convergenceOptions: {
          windowSize: parameters.convergenceCriteria?.windowSize,
          confidenceLevel: 0.95,
          stabilityThreshold: parameters.convergenceCriteria?.tolerance,
          minIterations: Math.min(1000, parameters.iterations),
          maxIterations: parameters.iterations
        },
        advancedResultsOptions: {
          trackDistributions: parameters.trackHistory,
          trackEvolution: parameters.trackHistory,
          enableHistoricalComparison: false
        }
      })

      setState(prev => ({
        ...prev,
        results,
        status: 'completed'
      }))

      onResultsUpdate(results)

    } catch (error) {
      console.error('Simulation failed:', error)
      setState(prev => ({
        ...prev,
        error: `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }))
    }
  }, [
    gameScenario, 
    players, 
    payoffMatrix, 
    parameters, 
    handleProgress, 
    onResultsUpdate, 
    initializeEngine, 
    updateStatus
  ])

  // Pause simulation
  const pauseSimulation = useCallback(() => {
    if (engineRef.current && state.status === 'running') {
      engineRef.current.interrupt()
      setState(prev => ({
        ...prev,
        pauseTime: Date.now(),
        status: 'paused'
      }))
    }
  }, [state.status])

  // Resume simulation
  const resumeSimulation = useCallback(async () => {
    if (engineRef.current && state.status === 'paused') {
      try {
        updateStatus('running')
        setState(prev => ({
          ...prev,
          pauseTime: null
        }))

        await engineRef.current.resumeSimulation(handleProgress)
        updateStatus('completed')

      } catch (error) {
        console.error('Failed to resume simulation:', error)
        setState(prev => ({
          ...prev,
          error: `Resume failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          status: 'error'
        }))
      }
    }
  }, [state.status, handleProgress, updateStatus])

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.interrupt()
    }
    
    setState(prev => ({
      ...prev,
      status: 'interrupted'
    }))
  }, [])

  // Reset simulation
  const resetSimulation = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.interrupt()
    }
    
    setState(initialState)
    engineRef.current = null
  }, [])

  // Format time display
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  // Format memory display
  const formatMemory = (mb: number) => {
    if (mb < 1) return `${(mb * 1000).toFixed(0)}KB`
    if (mb < 1000) return `${mb.toFixed(1)}MB`
    return `${(mb / 1000).toFixed(1)}GB`
  }

  // Get status color and icon
  const getStatusDisplay = () => {
    switch (state.status) {
      case 'idle':
        return { color: 'secondary', icon: Clock, text: 'Ready' }
      case 'initializing':
        return { color: 'default', icon: Activity, text: 'Initializing...' }
      case 'running':
        return { color: 'default', icon: Play, text: 'Running' }
      case 'paused':
        return { color: 'secondary', icon: Pause, text: 'Paused' }
      case 'completed':
        return { color: 'default', icon: CheckCircle2, text: 'Completed' }
      case 'error':
        return { color: 'destructive', icon: AlertTriangle, text: 'Error' }
      case 'interrupted':
        return { color: 'secondary', icon: Square, text: 'Stopped' }
      default:
        return { color: 'secondary', icon: Clock, text: 'Unknown' }
    }
  }

  const statusDisplay = getStatusDisplay()
  const StatusIcon = statusDisplay.icon

  const isRunning = state.status === 'running'
  const isPaused = state.status === 'paused'
  const canStart = state.status === 'idle' || state.status === 'error' || state.status === 'interrupted'
  const canPause = state.status === 'running'
  const canResume = state.status === 'paused'
  const canStop = state.status === 'running' || state.status === 'paused'
  const canReset = state.status !== 'running' && state.status !== 'initializing'

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Simulation Controls
            </CardTitle>
            <CardDescription>
              Control and monitor Monte Carlo simulation execution
            </CardDescription>
          </div>
          <Badge variant={statusDisplay.color as any} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {statusDisplay.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={startSimulation}
            disabled={!canStart}
            variant={canStart ? "default" : "secondary"}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start
          </Button>

          {canPause && (
            <Button
              onClick={pauseSimulation}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}

          {canResume && (
            <Button
              onClick={resumeSimulation}
              variant="default"
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Resume
            </Button>
          )}

          <Button
            onClick={stopSimulation}
            disabled={!canStop}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>

          <Button
            onClick={resetSimulation}
            disabled={!canReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Progress Section */}
        {(isRunning || isPaused || state.status === 'completed') && (
          <>
            <Separator />
        <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{state.metrics.progress.toFixed(1)}%</span>
                </div>
                <Progress value={state.metrics.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {state.metrics.currentIteration.toLocaleString()} / {state.metrics.totalIterations.toLocaleString()} iterations
                  </span>
                  {state.metrics.iterationsPerSecond > 0 && (
                    <span>{state.metrics.iterationsPerSecond.toFixed(0)} iter/s</span>
                  )}
                </div>
              </div>

              {/* Time and Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Elapsed
                  </div>
                  <div className="font-mono">
                    {formatTime(state.metrics.elapsedTime)}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Timer className="w-3 h-3" />
                    Remaining
                  </div>
                  <div className="font-mono">
                    {state.metrics.estimatedTimeRemaining > 0 
                      ? formatTime(state.metrics.estimatedTimeRemaining)
                      : '--'
                    }
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    Speed
                  </div>
                  <div className="font-mono">
                    {state.metrics.iterationsPerSecond > 0 
                      ? `${state.metrics.iterationsPerSecond.toFixed(0)}/s`
                      : '--'
                    }
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MemoryStick className="w-3 h-3" />
                    Memory
                  </div>
                  <div className="font-mono">
                    {formatMemory(state.metrics.memoryUsage)}
                  </div>
                </div>
              </div>

              {/* Convergence Information */}
              {parameters.convergenceCriteria?.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span className="text-sm font-medium">Convergence</span>
                    </div>
                    {state.metrics.isConverged && (
                      <Badge variant="default" className="text-xs">
                        Converged
                      </Badge>
                    )}
                  </div>
                  
                  {state.metrics.convergenceConfidence !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Confidence</span>
                        <span>{(state.metrics.convergenceConfidence * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={state.metrics.convergenceConfidence * 100} className="h-1" />
                    </div>
                  )}
                  
                  {state.metrics.convergenceIteration && (
                    <div className="text-xs text-muted-foreground">
                      Detected at iteration {state.metrics.convergenceIteration.toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Error Display */}
        {state.error && (
          <>
            <Separator />
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          </>
        )}

        {/* Simulation Summary */}
        {state.status === 'completed' && state.results && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Simulation Complete</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total iterations: {state.metrics.currentIteration.toLocaleString()}</div>
                <div>Total time: {formatTime(state.metrics.elapsedTime)}</div>
                <div>Average speed: {(state.metrics.currentIteration / state.metrics.elapsedTime).toFixed(0)} iter/s</div>
                {state.metrics.isConverged && (
                  <div>Converged at iteration {state.metrics.convergenceIteration?.toLocaleString()}</div>
                )}
              </div>
            </div>
            </>
          )}
      </CardContent>
    </Card>
  )
}
