'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Calculator, TrendingUp, Target, Shuffle, RotateCcw, Info, Zap, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { GameScenario } from '@/lib/game-theory-types';
import { MixedStrategySolver } from '@/lib/mixed-strategy-solver';
import { cn } from '@/lib/utils';

export interface MixedStrategyCalculatorProps {
  game: GameScenario;
  className?: string;
  onStrategyChange?: (strategies: MixedStrategyConfiguration) => void;
}

export interface MixedStrategyConfiguration {
  players: PlayerMixedStrategy[];
  equilibrium?: MixedStrategyEquilibrium;
  expectedPayoffs: number[];
  payoffMatrix: number[][][];
}

export interface PlayerMixedStrategy {
  playerId: string;
  playerName: string;
  probabilities: number[];
  expectedPayoff: number;
  variance: number;
  bestResponse?: number[];
}

export interface MixedStrategyEquilibrium {
  strategies: number[][];
  payoffs: number[];
  stability: number;
  type: 'pure' | 'mixed';
  isOptimal: boolean;
}

interface PayoffCalculationResult {
  expectedPayoffs: number[];
  payoffMatrix: { [key: string]: number };
  variance: number[];
  riskProfile: { player: string; risk: 'Low' | 'Medium' | 'High'; score: number }[];
}

const PLAYER_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
];

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#f43f5e', '#6366f1', '#8b5cf6'
];

export const MixedStrategyCalculator: React.FC<MixedStrategyCalculatorProps> = ({
  game,
  className,
  onStrategyChange,
}) => {
  const [playerStrategies, setPlayerStrategies] = useState<PlayerMixedStrategy[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [calculationMode, setCalculationMode] = useState<'manual' | 'equilibrium' | 'best-response'>('manual');
  const [equilibriumData, setEquilibriumData] = useState<MixedStrategyEquilibrium | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Initialize player strategies
  useEffect(() => {
    const initialStrategies: PlayerMixedStrategy[] = game.players.map((player, index) => {
      const equalProb = 1 / game.payoffMatrix.strategies.length;
      const probabilities = new Array(game.payoffMatrix.strategies.length).fill(equalProb);
      
      return {
        playerId: player.id,
        playerName: player.name,
        probabilities,
        expectedPayoff: 0,
        variance: 0,
      };
    });

    setPlayerStrategies(initialStrategies);
    if (initialStrategies.length > 0) {
      setSelectedPlayer(initialStrategies[0].playerId);
    }
  }, [game]);

  const solver = useMemo(() => new MixedStrategySolver(), []);

  // Calculate expected payoffs and metrics
  const calculationResults = useMemo((): PayoffCalculationResult => {
    const expectedPayoffs: number[] = [];
    const payoffMatrix: { [key: string]: number } = {};
    const variance: number[] = [];
    const riskProfile: { player: string; risk: 'Low' | 'Medium' | 'High'; score: number }[] = [];

    for (let playerIndex = 0; playerIndex < playerStrategies.length; playerIndex++) {
      let totalExpectedPayoff = 0;
      let payoffVariance = 0;
      const payoffs: number[] = [];

      // Calculate expected payoff for 2-player games
      for (let i = 0; i < game.payoffMatrix.strategies.length; i++) {
        for (let j = 0; j < game.payoffMatrix.strategies.length; j++) {
          if (game.payoffMatrix.payoffs[i] && game.payoffMatrix.payoffs[i][j]) {
            const payoff = game.payoffMatrix.payoffs[i][j][playerIndex] || 0;
            
            let probability = 1;
            const strategies = [i, j];
            
            for (let p = 0; p < Math.min(playerStrategies.length, strategies.length); p++) {
              probability *= playerStrategies[p]?.probabilities[strategies[p]] || 0;
            }

            totalExpectedPayoff += payoff * probability;
            payoffs.push(payoff);
            payoffMatrix[`${i}-${j}-P${playerIndex}`] = payoff;
          }
        }
      }

      const mean = totalExpectedPayoff;
      for (const payoff of payoffs) {
        payoffVariance += Math.pow(payoff - mean, 2) / payoffs.length;
      }

      expectedPayoffs.push(totalExpectedPayoff);
      variance.push(payoffVariance);

      const riskScore = Math.sqrt(payoffVariance);
      const riskLevel: 'Low' | 'Medium' | 'High' = 
        riskScore < 1 ? 'Low' : riskScore < 2.5 ? 'Medium' : 'High';
      
      riskProfile.push({
        player: `Player ${playerIndex + 1}`,
        risk: riskLevel,
        score: riskScore
      });
    }

    return { expectedPayoffs, payoffMatrix, variance, riskProfile };
  }, [playerStrategies, game.payoffMatrix]);

  const updatePlayerProbabilities = useCallback((playerId: string, strategyIndex: number, probability: number) => {
    setPlayerStrategies(prev => prev.map(player => {
      if (player.playerId === playerId) {
        const newProbs = [...player.probabilities];
        newProbs[strategyIndex] = probability / 100;
        
        const total = newProbs.reduce((sum, p) => sum + p, 0);
        if (total > 0) {
          for (let i = 0; i < newProbs.length; i++) {
            newProbs[i] = newProbs[i] / total;
          }
        }
        
        const playerIndex = prev.findIndex(p => p.playerId === playerId);
        const expectedPayoff = calculationResults.expectedPayoffs[playerIndex] || 0;
        const variance = calculationResults.variance[playerIndex] || 0;
        
        return {
          ...player,
          probabilities: newProbs,
          expectedPayoff,
          variance,
        };
      }
      return player;
    }));
  }, [calculationResults]);

  const calculateEquilibrium = useCallback(async () => {
    setIsCalculating(true);
    
    try {
      const payoffMatrix = {
        players: game.players.length,
        strategies: game.payoffMatrix.strategies,
        payoffs: game.payoffMatrix.payoffs,
        isSymmetric: false, // Add required property
      };

      const equilibria = solver.findMixedEquilibria(payoffMatrix);
      
      if (equilibria.length > 0) {
        const equilibrium = equilibria[0];
        
        // Handle both pure (number[]) and mixed (number[][]) strategy formats
        const strategyMatrix = Array.isArray(equilibrium.strategies[0]) 
          ? equilibrium.strategies as number[][]
          : [equilibrium.strategies as number[]]; // Convert pure to mixed format

        setEquilibriumData({
          strategies: strategyMatrix,
          payoffs: equilibrium.payoffs,
          stability: equilibrium.stability,
          type: equilibrium.type as 'pure' | 'mixed',
          isOptimal: true,
        });

        if (calculationMode === 'equilibrium') {
          setPlayerStrategies(prev => prev.map((player, index) => ({
            ...player,
            probabilities: strategyMatrix[index] || player.probabilities,
            expectedPayoff: equilibrium.payoffs[index] || 0,
          })));
        }
      }
    } catch (error) {
      console.error('Equilibrium calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [game, solver, calculationMode]);

  const generateRandomStrategy = useCallback((playerId?: string) => {
    const targetPlayerId = playerId || selectedPlayer;
    
    setPlayerStrategies(prev => prev.map(player => {
      if (!targetPlayerId || player.playerId === targetPlayerId) {
        const randomProbs = new Array(game.payoffMatrix.strategies.length)
          .fill(0)
          .map(() => Math.random());
        
        const total = randomProbs.reduce((sum, p) => sum + p, 0);
        const normalizedProbs = randomProbs.map(p => p / total);
        
        return {
          ...player,
          probabilities: normalizedProbs,
        };
      }
      return player;
    }));
  }, [selectedPlayer, game.payoffMatrix.strategies.length]);

  const resetToEqual = useCallback((playerId?: string) => {
    const targetPlayerId = playerId || selectedPlayer;
    const equalProb = 1 / game.payoffMatrix.strategies.length;
    
    setPlayerStrategies(prev => prev.map(player => {
      if (!targetPlayerId || player.playerId === targetPlayerId) {
        return {
          ...player,
          probabilities: new Array(game.payoffMatrix.strategies.length).fill(equalProb),
        };
      }
      return player;
    }));
  }, [selectedPlayer, game.payoffMatrix.strategies.length]);

  useEffect(() => {
    if (onStrategyChange && playerStrategies.length > 0) {
      const configuration: MixedStrategyConfiguration = {
        players: playerStrategies,
        equilibrium: equilibriumData || undefined,
        expectedPayoffs: calculationResults.expectedPayoffs,
        payoffMatrix: game.payoffMatrix.payoffs,
      };
      onStrategyChange(configuration);
    }
  }, [playerStrategies, equilibriumData, calculationResults, onStrategyChange, game.payoffMatrix.payoffs]);

  useEffect(() => {
    if (autoCalculate && calculationMode === 'equilibrium') {
      calculateEquilibrium();
    }
  }, [autoCalculate, calculationMode, calculateEquilibrium]);

  const probabilityChartData = useMemo(() => {
    return playerStrategies.flatMap((player, playerIndex) =>
      player.probabilities.map((prob, strategyIndex) => ({
        strategy: game.payoffMatrix.strategies[strategyIndex]?.name || `Strategy ${strategyIndex + 1}`,
        player: player.playerName,
        probability: prob * 100,
        color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
        key: `${player.playerId}-${strategyIndex}`,
      }))
    );
  }, [playerStrategies, game.payoffMatrix.strategies]);

  const payoffChartData = useMemo(() => {
    return playerStrategies.map((player, index) => ({
      player: player.playerName,
      expectedPayoff: calculationResults.expectedPayoffs[index] || 0,
      variance: calculationResults.variance[index] || 0,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }));
  }, [playerStrategies, calculationResults]);

  const selectedPlayerData = useMemo(() => {
    const player = playerStrategies.find(p => p.playerId === selectedPlayer);
    if (!player) return [];

    return player.probabilities.map((prob, index) => ({
      strategy: game.payoffMatrix.strategies[index]?.name || `Strategy ${index + 1}`,
      probability: prob * 100,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [playerStrategies, selectedPlayer, game.payoffMatrix.strategies]);

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Mixed Strategy Calculator & Visualizer
          </CardTitle>
          <CardDescription>
            Calculate and visualize mixed strategies with interactive probability adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="equilibrium">Equilibrium</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Strategy Configuration
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {playerStrategies.map((player) => (
                            <SelectItem key={player.playerId} value={player.playerId}>
                              {player.playerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={calculationMode} onValueChange={(value: 'manual' | 'equilibrium' | 'best-response') => setCalculationMode(value)}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Input</SelectItem>
                          <SelectItem value="equilibrium">Nash Equilibrium</SelectItem>
                          <SelectItem value="best-response">Best Response</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const player = playerStrategies.find(p => p.playerId === selectedPlayer);
                      if (!player) return null;

                      return (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Strategy Probabilities</h4>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateRandomStrategy(selectedPlayer)}
                                >
                                  <Shuffle className="w-3 h-3 mr-1" />
                                  Random
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resetToEqual(selectedPlayer)}
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Equal
                                </Button>
                              </div>
                            </div>

                            {player.probabilities.map((prob, strategyIndex) => {
                              const strategy = game.payoffMatrix.strategies[strategyIndex];
                              return (
                                <div key={strategyIndex} className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-medium">{strategy?.name || `Strategy ${strategyIndex + 1}`}</span>
                                    <span className="text-muted-foreground">{(prob * 100).toFixed(1)}%</span>
                                  </div>
                                  <Slider
                                    value={[prob * 100]}
                                    onValueChange={([value]) =>
                                      updatePlayerProbabilities(selectedPlayer, strategyIndex, value)
                                    }
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    disabled={calculationMode === 'equilibrium' && isCalculating}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-lg font-bold text-primary">
                                {player.expectedPayoff.toFixed(3)}
                              </div>
                              <div className="text-sm text-muted-foreground">Expected Payoff</div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-lg font-bold text-primary">
                                {Math.sqrt(player.variance).toFixed(3)}
                              </div>
                              <div className="text-sm text-muted-foreground">Risk (σ)</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Real-time Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Expected Payoffs</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={payoffChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="player" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="expectedPayoff" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">Risk Assessment</h4>
                      <div className="space-y-2">
                        {calculationResults.riskProfile.map((risk, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">{risk.player}</span>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  risk.risk === 'Low' ? 'default' : 
                                  risk.risk === 'Medium' ? 'secondary' : 'destructive'
                                }
                              >
                                {risk.risk} Risk
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                σ={risk.score.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="visualization" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4" />
                      Strategy Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={selectedPlayerData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="probability"
                          label={({ strategy, probability }) => 
                            `${strategy}: ${probability.toFixed(1)}%`
                          }
                        >
                          {selectedPlayerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      All Players Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={probabilityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="strategy" />
                        <YAxis />
                        <Tooltip />
                        {playerStrategies.map((player, index) => (
                          <Bar
                            key={player.playerId}
                            dataKey="probability"
                            fill={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                            data={probabilityChartData.filter(d => d.player === player.playerName)}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="equilibrium" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Nash Equilibrium Analysis
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-calculate"
                        checked={autoCalculate}
                        onCheckedChange={setAutoCalculate}
                      />
                      <Label htmlFor="auto-calculate">Auto-calculate</Label>
                    </div>
                    <Button
                      onClick={calculateEquilibrium}
                      disabled={isCalculating}
                      variant="outline"
                    >
                      {isCalculating ? 'Calculating...' : 'Calculate Equilibrium'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isCalculating && (
                    <div className="space-y-2">
                      <Progress value={66} className="w-full" />
                      <p className="text-sm text-center text-muted-foreground">
                        Finding mixed strategy equilibria...
                      </p>
                    </div>
                  )}

                  {equilibriumData && !isCalculating && (
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{equilibriumData.type.charAt(0).toUpperCase() + equilibriumData.type.slice(1)} Strategy Equilibrium Found</strong>
                          <br />
                          Stability Score: {equilibriumData.stability.toFixed(3)} | 
                          {equilibriumData.isOptimal ? ' Optimal Solution' : ' Sub-optimal Solution'}
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-3">Equilibrium Strategies</h4>
                          <div className="space-y-2">
                            {equilibriumData.strategies.map((strategy, playerIndex) => (
                              <div key={playerIndex} className="p-3 bg-muted rounded-lg">
                                <div className="font-medium mb-2">Player {playerIndex + 1}</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {strategy.map((prob, strategyIndex) => (
                                    <div key={strategyIndex} className="flex justify-between">
                                      <span>{game.payoffMatrix.strategies[strategyIndex]?.name || `S${strategyIndex + 1}`}:</span>
                                      <span className="font-medium">{(prob * 100).toFixed(1)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Equilibrium Payoffs</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={equilibriumData.payoffs.map((payoff, index) => ({
                              player: `Player ${index + 1}`,
                              payoff,
                              color: PLAYER_COLORS[index % PLAYER_COLORS.length],
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="player" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="payoff" fill="#10b981" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {!equilibriumData && !isCalculating && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Click "Calculate Equilibrium" to find the Nash equilibrium for the current game.
                        Enable auto-calculate to update the equilibrium whenever strategies change.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Strategy Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={payoffChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="player" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="expectedPayoff"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="variance"
                          stroke="#ef4444"
                          fill="#ef4444"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Strategic Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Alert>
                        <AlertDescription>
                          <strong>Best Performer:</strong> {
                            payoffChartData.reduce((best, current) => 
                              current.expectedPayoff > best.expectedPayoff ? current : best
                            ).player
                          } with expected payoff of {
                            Math.max(...payoffChartData.map(p => p.expectedPayoff)).toFixed(3)
                          }
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <AlertDescription>
                          <strong>Most Consistent:</strong> {
                            payoffChartData.reduce((consistent, current) => 
                              current.variance < consistent.variance ? current : consistent
                            ).player
                          } with variance of {
                            Math.min(...payoffChartData.map(p => p.variance)).toFixed(3)
                          }
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <AlertDescription>
                          <strong>Strategy Advice:</strong> Consider the trade-off between expected payoff and risk. 
                          Mixed strategies can help avoid predictability and exploitation by opponents.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MixedStrategyCalculator; 