"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"
import { 
  Users, 
  User, 
  Brain, 
  Shuffle, 
  Target, 
  Heart, 
  Zap, 
  Settings, 
  Plus, 
  Minus, 
  Info,
  TrendingUp,
  RotateCcw,
  Copy,
  Save,
  Upload
} from "lucide-react"

export interface PlayerStrategy {
  type: 'pure' | 'mixed' | 'adaptive'
  purStrategy?: number // Index of pure strategy
  mixedProbabilities?: number[] // Probabilities for mixed strategy
  adaptiveType?: 'tit-for-tat' | 'generous-tit-for-tat' | 'pavlov' | 'random' | 'grudger'
  learningRate?: number // For adaptive strategies
}

export interface PlayerConfig {
  id: string
  name: string
  behavior: 'rational' | 'random' | 'aggressive' | 'cooperative' | 'custom'
  strategy: PlayerStrategy
  color: string
  isHuman: boolean
  skillLevel: number // 0-100, affects decision quality
  riskTolerance: number // 0-100, affects risk-taking behavior
  cooperationBias: number // 0-100, tendency to cooperate
}

interface PlayerConfigurationProps {
  playerCount: number
  strategies: string[]
  players: PlayerConfig[]
  onPlayersChange: (players: PlayerConfig[]) => void
  onPlayerCountChange: (count: number) => void
  maxPlayers?: number
  gameType?: string
}

const BEHAVIOR_PRESETS = {
  rational: {
    name: "Rational",
    description: "Maximizes expected utility",
    icon: Brain,
    color: "bg-blue-500",
    skillLevel: 85,
    riskTolerance: 50,
    cooperationBias: 50
  },
  random: {
    name: "Random",
    description: "Makes random decisions",
    icon: Shuffle,
    color: "bg-gray-500",
    skillLevel: 30,
    riskTolerance: 50,
    cooperationBias: 50
  },
  aggressive: {
    name: "Aggressive",
    description: "Prefers competitive strategies",
    icon: Zap,
    color: "bg-red-500",
    skillLevel: 70,
    riskTolerance: 80,
    cooperationBias: 20
  },
  cooperative: {
    name: "Cooperative",
    description: "Favors collaborative approaches",
    icon: Heart,
    color: "bg-green-500",
    skillLevel: 70,
    riskTolerance: 30,
    cooperationBias: 80
  },
  custom: {
    name: "Custom",
    description: "User-defined behavior",
    icon: Settings,
    color: "bg-purple-500",
    skillLevel: 50,
    riskTolerance: 50,
    cooperationBias: 50
  }
}

const PLAYER_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"
]

const ADAPTIVE_STRATEGIES = {
  'tit-for-tat': {
    name: "Tit for Tat",
    description: "Copy opponent's last move"
  },
  'generous-tit-for-tat': {
    name: "Generous Tit for Tat", 
    description: "Tit for tat with forgiveness"
  },
  'pavlov': {
    name: "Pavlov",
    description: "Win-stay, lose-shift strategy"
  },
  'random': {
    name: "Random",
    description: "Random strategy selection"
  },
  'grudger': {
    name: "Grudger",
    description: "Punish defection permanently"
  }
}

export function PlayerConfiguration({
  playerCount,
  strategies,
  players,
  onPlayersChange,
  onPlayerCountChange,
  maxPlayers = 5,
  gameType = "Unknown"
}: PlayerConfigurationProps) {
  const [activePlayer, setActivePlayer] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Initialize players when player count changes
  useEffect(() => {
    if (players.length !== playerCount) {
      const newPlayers: PlayerConfig[] = []
      
      for (let i = 0; i < playerCount; i++) {
        if (players[i]) {
          newPlayers.push(players[i])
        } else {
          newPlayers.push({
            id: `player_${i + 1}`,
            name: `Player ${i + 1}`,
            behavior: i === 0 ? 'rational' : 'random',
            strategy: {
              type: 'pure',
              purStrategy: 0
            },
            color: PLAYER_COLORS[i % PLAYER_COLORS.length],
            isHuman: i === 0,
            skillLevel: 70,
            riskTolerance: 50,
            cooperationBias: 50
          })
        }
      }
      
      onPlayersChange(newPlayers)
    }
  }, [playerCount, players, onPlayersChange])

  const updatePlayer = (index: number, updates: Partial<PlayerConfig>) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], ...updates }
    onPlayersChange(newPlayers)
  }

  const applyBehaviorPreset = (playerIndex: number, behavior: keyof typeof BEHAVIOR_PRESETS) => {
    const preset = BEHAVIOR_PRESETS[behavior]
    updatePlayer(playerIndex, {
      behavior,
      skillLevel: preset.skillLevel,
      riskTolerance: preset.riskTolerance,
      cooperationBias: preset.cooperationBias
    })
  }

  const copyPlayerConfig = (fromIndex: number, toIndex: number) => {
    const sourcePlayer = players[fromIndex]
    updatePlayer(toIndex, {
      ...sourcePlayer,
      id: `player_${toIndex + 1}`,
      name: `${sourcePlayer.name} (Copy)`,
      color: PLAYER_COLORS[toIndex % PLAYER_COLORS.length]
    })
  }

  const resetToDefaults = () => {
    const defaultPlayers: PlayerConfig[] = []
    for (let i = 0; i < playerCount; i++) {
      defaultPlayers.push({
        id: `player_${i + 1}`,
        name: `Player ${i + 1}`,
        behavior: i === 0 ? 'rational' : 'random',
        strategy: {
          type: 'pure',
          purStrategy: 0
        },
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        isHuman: i === 0,
        skillLevel: 70,
        riskTolerance: 50,
        cooperationBias: 50
      })
    }
    onPlayersChange(defaultPlayers)
  }

  const exportConfig = () => {
    const config = {
      playerCount,
      players,
      gameType,
      timestamp: Date.now()
    }
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `player-config-${gameType}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)
        if (config.players && config.playerCount) {
          onPlayerCountChange(Math.min(config.playerCount, maxPlayers))
          onPlayersChange(config.players.slice(0, maxPlayers))
        }
      } catch (error) {
        console.error('Failed to import configuration:', error)
      }
    }
    reader.readAsText(file)
  }

  if (players.length === 0) {
    return <div>Loading player configuration...</div>
  }

  return (
    <TooltipProvider>
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Player Configuration</CardTitle>
                <CardDescription>Configure players, strategies, and behaviors</CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {playerCount} Players
              </Badge>
              <Badge variant="outline">
                {gameType}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Player Count Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Number of Players</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playerCount > 2 && onPlayerCountChange(playerCount - 1)}
                  disabled={playerCount <= 2}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{playerCount}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playerCount < maxPlayers && onPlayerCountChange(playerCount + 1)}
                  disabled={playerCount >= maxPlayers}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              {Array.from({ length: maxPlayers }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full border-2 ${
                    i < playerCount 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-gray-100 border-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Player Tabs */}
          <Tabs value={activePlayer.toString()} onValueChange={(value) => setActivePlayer(parseInt(value))}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-gray-100/50">
                {players.map((player, index) => (
                  <TabsTrigger
                    key={player.id}
                    value={index.toString()}
                    className="flex items-center gap-2 data-[state=active]:bg-white"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="hidden sm:inline">{player.name}</span>
                    <span className="sm:hidden">{index + 1}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={resetToDefaults}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset to defaults</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={exportConfig}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export configuration</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importConfig}
                        className="hidden"
                      />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>Import configuration</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Player Configuration Content */}
            {players.map((player, index) => (
              <TabsContent key={player.id} value={index.toString()} className="space-y-6 mt-6">
                {/* Basic Player Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>Player Name</Label>
                    <Input
                      id={`name-${index}`}
                      value={player.name}
                      onChange={(e) => updatePlayer(index, { name: e.target.value })}
                      placeholder="Enter player name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Player Type</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={player.isHuman}
                          onCheckedChange={(checked) => updatePlayer(index, { isHuman: checked })}
                        />
                        <span className="text-sm">{player.isHuman ? 'Human' : 'AI'}</span>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: player.color }}
                      />
                    </div>
                  </div>
                </div>

                {/* Behavior Presets */}
                <div className="space-y-3">
                  <Label>Behavior Preset</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(BEHAVIOR_PRESETS).map(([key, preset]) => {
                      const Icon = preset.icon
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={player.behavior === key ? "default" : "outline"}
                              size="sm"
                              onClick={() => applyBehaviorPreset(index, key as keyof typeof BEHAVIOR_PRESETS)}
                              className="flex flex-col items-center gap-1 h-auto py-3"
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-xs">{preset.name}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{preset.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>

                {/* Strategy Configuration */}
                <div className="space-y-4">
                  <Label>Strategy Type</Label>
                  <Select 
                    value={player.strategy.type} 
                    onValueChange={(value: 'pure' | 'mixed' | 'adaptive') => 
                      updatePlayer(index, { 
                        strategy: { 
                          ...player.strategy, 
                          type: value,
                          ...(value === 'pure' && { purStrategy: 0 }),
                          ...(value === 'mixed' && { mixedProbabilities: new Array(strategies.length).fill(1/strategies.length) }),
                          ...(value === 'adaptive' && { adaptiveType: 'tit-for-tat', learningRate: 0.1 })
                        } 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pure">Pure Strategy</SelectItem>
                      <SelectItem value="mixed">Mixed Strategy</SelectItem>
                      <SelectItem value="adaptive">Adaptive Strategy</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Pure Strategy */}
                  {player.strategy.type === 'pure' && (
                    <div className="space-y-2">
                      <Label>Selected Strategy</Label>
                      <Select 
                        value={player.strategy.purStrategy?.toString() || "0"}
                        onValueChange={(value) => 
                          updatePlayer(index, { 
                            strategy: { ...player.strategy, purStrategy: parseInt(value) } 
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {strategies.map((strategy, stratIndex) => (
                            <SelectItem key={stratIndex} value={stratIndex.toString()}>
                              {strategy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Mixed Strategy */}
                  {player.strategy.type === 'mixed' && (
                    <div className="space-y-3">
                      <Label>Strategy Probabilities</Label>
                      {strategies.map((strategy, stratIndex) => (
                        <div key={stratIndex} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{strategy}</span>
                            <span className="text-sm text-gray-500">
                              {Math.round((player.strategy.mixedProbabilities?.[stratIndex] || 0) * 100)}%
                            </span>
                          </div>
                          <Slider
                            value={[player.strategy.mixedProbabilities?.[stratIndex] || 0]}
                            onValueChange={([value]) => {
                              const newProbs = [...(player.strategy.mixedProbabilities || [])]
                              newProbs[stratIndex] = value
                              // Normalize probabilities
                              const sum = newProbs.reduce((a, b) => a + b, 0)
                              if (sum > 0) {
                                for (let i = 0; i < newProbs.length; i++) {
                                  newProbs[i] = newProbs[i] / sum
                                }
                              }
                              updatePlayer(index, { 
                                strategy: { ...player.strategy, mixedProbabilities: newProbs } 
                              })
                            }}
                            max={1}
                            min={0}
                            step={0.01}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adaptive Strategy */}
                  {player.strategy.type === 'adaptive' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Adaptive Type</Label>
                        <Select 
                          value={player.strategy.adaptiveType || 'tit-for-tat'}
                          onValueChange={(value) => 
                            updatePlayer(index, { 
                              strategy: { ...player.strategy, adaptiveType: value as any } 
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ADAPTIVE_STRATEGIES).map(([key, strategy]) => (
                              <SelectItem key={key} value={key}>
                                <div>
                                  <div className="font-medium">{strategy.name}</div>
                                  <div className="text-xs text-gray-500">{strategy.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Learning Rate</Label>
                          <span className="text-sm text-gray-500">
                            {(player.strategy.learningRate || 0.1).toFixed(2)}
                          </span>
                        </div>
                        <Slider
                          value={[player.strategy.learningRate || 0.1]}
                          onValueChange={([value]) => 
                            updatePlayer(index, { 
                              strategy: { ...player.strategy, learningRate: value } 
                            })
                          }
                          max={1}
                          min={0.01}
                          step={0.01}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={showAdvanced} 
                      onCheckedChange={setShowAdvanced}
                    />
                    <Label>Advanced Settings</Label>
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 bg-gray-50/50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Skill Level</Label>
                          <span className="text-sm text-gray-500">{player.skillLevel}%</span>
                        </div>
                        <Slider
                          value={[player.skillLevel]}
                          onValueChange={([value]) => updatePlayer(index, { skillLevel: value })}
                          max={100}
                          min={0}
                          step={1}
                        />
                        <p className="text-xs text-gray-500">Higher skill means better decision-making</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Risk Tolerance</Label>
                          <span className="text-sm text-gray-500">{player.riskTolerance}%</span>
                        </div>
                        <Slider
                          value={[player.riskTolerance]}
                          onValueChange={([value]) => updatePlayer(index, { riskTolerance: value })}
                          max={100}
                          min={0}
                          step={1}
                        />
                        <p className="text-xs text-gray-500">Higher values prefer risky, high-reward strategies</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Cooperation Bias</Label>
                          <span className="text-sm text-gray-500">{player.cooperationBias}%</span>
                        </div>
                        <Slider
                          value={[player.cooperationBias]}
                          onValueChange={([value]) => updatePlayer(index, { cooperationBias: value })}
                          max={100}
                          min={0}
                          step={1}
                        />
                        <p className="text-xs text-gray-500">Higher values favor cooperative strategies</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (index > 0) copyPlayerConfig(0, index)
                          }}
                          disabled={index === 0}
                          className="flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy from Player 1
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50/50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Configuration Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Human Players:</span>
                <span className="ml-2">{players.filter(p => p.isHuman).length}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">AI Players:</span>
                <span className="ml-2">{players.filter(p => !p.isHuman).length}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Strategy Types:</span>
                <span className="ml-2">
                  {Array.from(new Set(players.map(p => p.strategy.type))).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 