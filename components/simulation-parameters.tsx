"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Zap, 
  Clock, 
  Target, 
  Info, 
  AlertTriangle, 
  CheckCircle2,
  Cpu,
  MemoryStick,
  Timer
} from "lucide-react"
import type { SimulationParameters, ConvergenceCriteria } from "@/lib/game-theory-types"

interface SimulationParametersProps {
  parameters: SimulationParameters
  onParametersChange: (parameters: SimulationParameters) => void
  gameComplexity?: 'low' | 'medium' | 'high'
  estimatedMemoryUsage?: number
  estimatedRuntime?: number
}

interface PresetConfig {
  name: string
  description: string
  icon: React.ReactNode
  parameters: SimulationParameters
  badge?: string
}

const PRESET_CONFIGURATIONS: PresetConfig[] = [
  {
    name: "Quick Test",
    description: "Fast simulation for immediate feedback",
    icon: <Zap className="w-4 h-4" />,
    badge: "Fast",
    parameters: {
      iterations: 1000,
      seed: undefined,
      convergenceCriteria: {
        enabled: false,
        tolerance: 0.01,
        windowSize: 100,
        metric: 'strategy_frequency'
      },
      batchSize: 100,
      useWebWorkers: false,
      trackHistory: false,
      progressUpdateInterval: 100
    }
  },
  {
    name: "Thorough Analysis",
    description: "Balanced approach for comprehensive results",
    icon: <Target className="w-4 h-4" />,
    badge: "Balanced",
    parameters: {
      iterations: 50000,
      seed: undefined,
      convergenceCriteria: {
        enabled: true,
        tolerance: 0.001,
        windowSize: 1000,
        metric: 'strategy_frequency'
      },
      batchSize: 1000,
      useWebWorkers: true,
      trackHistory: true,
      progressUpdateInterval: 1000
    }
  },
  {
    name: "Research Grade",
    description: "High-precision simulation for academic research",
    icon: <Settings className="w-4 h-4" />,
    badge: "Precise",
    parameters: {
      iterations: 1000000,
      seed: 42,
      convergenceCriteria: {
        enabled: true,
        tolerance: 0.0001,
        windowSize: 10000,
        metric: 'payoff_variance'
      },
      batchSize: 5000,
      useWebWorkers: true,
      trackHistory: true,
      progressUpdateInterval: 5000
    }
  }
]

const ITERATION_PRESETS = [
  { label: "1K", value: 1000 },
  { label: "5K", value: 5000 },
  { label: "10K", value: 10000 },
  { label: "50K", value: 50000 },
  { label: "100K", value: 100000 },
  { label: "500K", value: 500000 },
  { label: "1M", value: 1000000 }
]

export function SimulationParameters({
  parameters,
  onParametersChange,
  gameComplexity = 'medium',
  estimatedMemoryUsage = 0,
  estimatedRuntime = 0
}: SimulationParametersProps) {
  const [currentTab, setCurrentTab] = useState("basic")
  const [customSeed, setCustomSeed] = useState(parameters.seed?.toString() || "")

  // Calculate estimates based on parameters
  const calculateEstimates = (params: SimulationParameters) => {
    const baseMemoryPerIteration = 0.001 // MB per iteration (rough estimate)
    const baseTimePerIteration = 0.0001 // seconds per iteration (rough estimate)
    
    const complexityMultiplier = gameComplexity === 'high' ? 2 : gameComplexity === 'low' ? 0.5 : 1
    
    const estimatedMemory = params.iterations * baseMemoryPerIteration * complexityMultiplier
    const estimatedTime = params.iterations * baseTimePerIteration * complexityMultiplier
    
    return {
      memory: Math.round(estimatedMemory * 100) / 100,
      time: Math.round(estimatedTime * 10) / 10
    }
  }

  const estimates = calculateEstimates(parameters)

  const applyPreset = (preset: PresetConfig) => {
    onParametersChange(preset.parameters)
    setCustomSeed(preset.parameters.seed?.toString() || "")
  }

  const updateParameters = (updates: Partial<SimulationParameters>) => {
    onParametersChange({ ...parameters, ...updates })
  }

  const updateConvergenceCriteria = (updates: Partial<ConvergenceCriteria>) => {
    updateParameters({
      convergenceCriteria: { ...parameters.convergenceCriteria!, ...updates }
    })
  }

  const handleSeedChange = (value: string) => {
    setCustomSeed(value)
    const seedNum = value === "" ? undefined : parseInt(value)
    updateParameters({ seed: seedNum })
  }

  const generateRandomSeed = () => {
    const seed = Math.floor(Math.random() * 1000000)
    setCustomSeed(seed.toString())
    updateParameters({ seed })
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  const formatMemory = (mb: number) => {
    if (mb < 1) return `${(mb * 1000).toFixed(0)}KB`
    if (mb < 1000) return `${mb.toFixed(1)}MB`
    return `${(mb / 1000).toFixed(1)}GB`
  }

  const getPerformanceWarning = () => {
    if (parameters.iterations > 500000 && !parameters.useWebWorkers) {
      return "High iteration count without Web Workers may cause browser freezing"
    }
    if (parameters.trackHistory && parameters.iterations > 100000) {
      return "Tracking history with high iterations will use significant memory"
    }
    if (estimates.memory > 100) {
      return "High memory usage predicted - consider reducing iterations or disabling history"
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Preset Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Simulation Presets
          </CardTitle>
          <CardDescription>
            Choose a preset configuration or customize your own settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESET_CONFIGURATIONS.map((preset) => (
              <Card 
                key={preset.name} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => applyPreset(preset)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {preset.icon}
                      <h3 className="font-medium">{preset.name}</h3>
                    </div>
                    {preset.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {preset.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {preset.description}
                  </p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Iterations:</span>
                      <span>{preset.parameters.iterations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Web Workers:</span>
                      <span>{preset.parameters.useWebWorkers ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Estimates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Performance Estimates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Timer className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Runtime</p>
                <p className="text-xs text-muted-foreground">{formatTime(estimates.time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <MemoryStick className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Memory</p>
                <p className="text-xs text-muted-foreground">{formatMemory(estimates.memory)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Cpu className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Iterations</p>
                <p className="text-xs text-muted-foreground">{parameters.iterations.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Batch Size</p>
                <p className="text-xs text-muted-foreground">{parameters.batchSize}</p>
              </div>
            </div>
          </div>
          
          {getPerformanceWarning() && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{getPerformanceWarning()}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detailed Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Configuration</CardTitle>
          <CardDescription>
            Fine-tune simulation parameters for your specific needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="convergence">Convergence</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 mt-6">
              {/* Iteration Count */}
              <div className="space-y-3">
                <Label>Number of Iterations</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={parameters.iterations}
                    onChange={(e) => updateParameters({ iterations: Math.max(100, parseInt(e.target.value) || 1000) })}
                    min={100}
                    max={10000000}
                    className="flex-1"
                  />
                  <Select
                    value={parameters.iterations.toString()}
                    onValueChange={(value) => updateParameters({ iterations: parseInt(value) })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITERATION_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value.toString()}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  More iterations provide better accuracy but take longer to compute
                </p>
              </div>

              <Separator />

              {/* Random Seed */}
              <div className="space-y-3">
                <Label>Random Seed (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Leave empty for random"
                    value={customSeed}
                    onChange={(e) => handleSeedChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={generateRandomSeed}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use a seed for reproducible results across multiple runs
                </p>
              </div>

              <Separator />

              {/* History Tracking */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Track Iteration History</Label>
                  <p className="text-xs text-muted-foreground">
                    Store detailed data for each iteration (increases memory usage)
                  </p>
                </div>
                <Switch
                  checked={parameters.trackHistory}
                  onCheckedChange={(checked) => updateParameters({ trackHistory: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="convergence" className="space-y-6 mt-6">
              {/* Enable Convergence */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Convergence Detection</Label>
                  <p className="text-xs text-muted-foreground">
                    Stop simulation early when strategies converge
                  </p>
                </div>
                <Switch
                  checked={parameters.convergenceCriteria?.enabled || false}
                  onCheckedChange={(checked) => updateConvergenceCriteria({ enabled: checked })}
                />
              </div>

              {parameters.convergenceCriteria?.enabled && (
                <>
                  <Separator />

                  {/* Convergence Metric */}
                  <div className="space-y-2">
                    <Label>Convergence Metric</Label>
                    <Select
                      value={parameters.convergenceCriteria.metric}
                      onValueChange={(value: any) => updateConvergenceCriteria({ metric: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strategy_frequency">Strategy Frequency</SelectItem>
                        <SelectItem value="payoff_variance">Payoff Variance</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tolerance */}
                  <div className="space-y-3">
                    <Label>Tolerance: {parameters.convergenceCriteria.tolerance}</Label>
                    <Slider
                      value={[parameters.convergenceCriteria.tolerance * 10000]}
                      onValueChange={([value]) => updateConvergenceCriteria({ tolerance: value / 10000 })}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower values require more precise convergence
                    </p>
                  </div>

                  {/* Window Size */}
                  <div className="space-y-2">
                    <Label>Window Size</Label>
                    <Input
                      type="number"
                      value={parameters.convergenceCriteria.windowSize}
                      onChange={(e) => updateConvergenceCriteria({ 
                        windowSize: Math.max(10, parseInt(e.target.value) || 100) 
                      })}
                      min={10}
                      max={10000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of recent iterations to consider for convergence
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-6">
              {/* Web Workers */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Use Web Workers</Label>
                  <p className="text-xs text-muted-foreground">
                    Run simulation in background thread (recommended for large simulations)
                  </p>
                </div>
                <Switch
                  checked={parameters.useWebWorkers}
                  onCheckedChange={(checked) => updateParameters({ useWebWorkers: checked })}
                />
              </div>

              <Separator />

              {/* Batch Size */}
              <div className="space-y-3">
                <Label>Batch Size: {parameters.batchSize}</Label>
                <Slider
                  value={[parameters.batchSize]}
                  onValueChange={([value]) => updateParameters({ batchSize: value })}
                  min={10}
                  max={10000}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Number of iterations processed before updating progress
                </p>
              </div>

              <Separator />

              {/* Progress Update Interval */}
              <div className="space-y-3">
                <Label>Progress Update Interval: {parameters.progressUpdateInterval}</Label>
                <Slider
                  value={[parameters.progressUpdateInterval]}
                  onValueChange={([value]) => updateParameters({ progressUpdateInterval: value })}
                  min={10}
                  max={5000}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How often to update progress (lower = more responsive but slower)
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 