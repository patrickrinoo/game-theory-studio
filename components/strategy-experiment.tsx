'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Play, RotateCcw, TrendingUp, Target, Users, Zap, Info } from 'lucide-react';
import { GameScenario } from '@/lib/game-theory-types';
import { MonteCarloEngine } from '@/lib/monte-carlo-engine';
import { cn } from '@/lib/utils';

export interface StrategyExperimentProps {
  game: GameScenario;
  className?: string;
  onExperimentComplete?: (results: ExperimentResult[]) => void;
}

export interface PlayerStrategy {
  playerId: string;
  playerName: string;
  strategyType: 'pure' | 'mixed';
  pureStrategy?: number;
  mixedProbabilities?: number[];
  color: string;
}

export interface ExperimentConfiguration {
  players: PlayerStrategy[];
  iterations: number;
  trials: number;
}

export interface ExperimentResult {
  id: string;
  configuration: PlayerStrategy[];
  expectedPayoffs: number[];
  winRates: number[];
  avgPayoff: number;
  variance: number;
  iterations: number;
  timestamp: Date;
  outcomeDistribution: { [key: string]: number };
  confidence: number;
  effectiveness: number;
}

export interface ComparisonMetrics {
  bestStrategy: ExperimentResult;
  worstStrategy: ExperimentResult;
  mostConsistent: ExperimentResult;
  riskiestStrategy: ExperimentResult;
  averagePayoff: number;
  payoffRange: [number, number];
}

const PLAYER_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

export const StrategyExperiment: React.FC<StrategyExperimentProps> = ({
  game,
  className,
  onExperimentComplete,
}) => {
  const [currentConfig, setCurrentConfig] = useState<ExperimentConfiguration>({
    players: game.players.map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      strategyType: 'pure',
      pureStrategy: 0,
      mixedProbabilities: new Array(game.payoffMatrix.strategies.length).fill(0).map((_, i) => i === 0 ? 1 : 0),
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    })),
    iterations: 1000,
    trials: 1,
  });

  const [experiments, setExperiments] = useState<ExperimentResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);

  const comparisonMetrics = useMemo((): ComparisonMetrics | null => {
    if (experiments.length === 0) return null;

    const bestStrategy = experiments.reduce((best, current) => 
      current.avgPayoff > best.avgPayoff ? current : best
    );

    const worstStrategy = experiments.reduce((worst, current) => 
      current.avgPayoff < worst.avgPayoff ? current : worst
    );

    const mostConsistent = experiments.reduce((consistent, current) => 
      current.variance < consistent.variance ? current : consistent
    );

    const riskiestStrategy = experiments.reduce((risky, current) => 
      current.variance > risky.variance ? current : risky
    );

    const averagePayoff = experiments.reduce((sum, exp) => sum + exp.avgPayoff, 0) / experiments.length;
    const payoffs = experiments.map(exp => exp.avgPayoff);
    const payoffRange: [number, number] = [Math.min(...payoffs), Math.max(...payoffs)];

    return {
      bestStrategy,
      worstStrategy,
      mostConsistent,
      riskiestStrategy,
      averagePayoff,
      payoffRange,
    };
  }, [experiments]);

  const updatePlayerStrategy = useCallback((playerId: string, updates: Partial<PlayerStrategy>) => {
    setCurrentConfig(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.playerId === playerId ? { ...player, ...updates } : player
      ),
    }));
  }, []);

  const updateMixedProbabilities = useCallback((playerId: string, strategyIndex: number, probability: number) => {
    setCurrentConfig(prev => ({
      ...prev,
      players: prev.players.map(player => {
        if (player.playerId === playerId) {
          const newProbs = [...(player.mixedProbabilities || [])];
          newProbs[strategyIndex] = probability / 100;
          
          const total = newProbs.reduce((sum, p) => sum + p, 0);
          if (total > 0) {
            for (let i = 0; i < newProbs.length; i++) {
              newProbs[i] = newProbs[i] / total;
            }
          }
          
          return { ...player, mixedProbabilities: newProbs };
        }
        return player;
      }),
    }));
  }, []);

  const runExperiment = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);

    try {
      const engine = new MonteCarloEngine();
      
      // Create simulation result placeholder
      const mockResult = {
        expectedPayoffs: currentConfig.players.map(() => Math.random() * 10),
        outcomes: {},
        iterationHistory: {},
      };

      const avgPayoff = mockResult.expectedPayoffs.reduce((sum, p) => sum + p, 0) / mockResult.expectedPayoffs.length;
      const variance = mockResult.expectedPayoffs.reduce((sum, p) => sum + Math.pow(p - avgPayoff, 2), 0) / mockResult.expectedPayoffs.length;
      
      const winRates = new Array(currentConfig.players.length).fill(0).map(() => Math.random() * 100);
      const effectiveness = avgPayoff - (variance * 0.1);

      const experimentResult: ExperimentResult = {
        id: `exp-${Date.now()}`,
        configuration: [...currentConfig.players],
        expectedPayoffs: mockResult.expectedPayoffs,
        winRates,
        avgPayoff,
        variance,
        iterations: currentConfig.iterations,
        timestamp: new Date(),
        outcomeDistribution: mockResult.outcomes,
        confidence: 0.95,
        effectiveness,
      };

      setExperiments(prev => [experimentResult, ...prev].slice(0, 10));
      onExperimentComplete?.([experimentResult]);

    } catch (error) {
      console.error('Experiment failed:', error);
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  }, [currentConfig, onExperimentComplete]);

  const resetExperiments = useCallback(() => {
    setExperiments([]);
    setSelectedExperiment(null);
  }, []);

  const generateRandomStrategy = useCallback(() => {
    setCurrentConfig(prev => ({
      ...prev,
      players: prev.players.map(player => {
        const useRandomType = Math.random() > 0.5;
        const strategyType = useRandomType ? 'mixed' : 'pure';
        
        if (strategyType === 'pure') {
          return {
            ...player,
            strategyType,
            pureStrategy: Math.floor(Math.random() * game.payoffMatrix.strategies.length),
          };
        } else {
          const probs = new Array(game.payoffMatrix.strategies.length).fill(0).map(() => Math.random());
          const total = probs.reduce((sum, p) => sum + p, 0);
          const normalizedProbs = probs.map(p => p / total);
          
          return {
            ...player,
            strategyType,
            mixedProbabilities: normalizedProbs,
          };
        }
      }),
    }));
  }, [game.payoffMatrix.strategies.length]);

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Strategy Experiment Interface
          </CardTitle>
          <CardDescription>
            Design and test different strategy combinations to find optimal plays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="design" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="comparison">Compare</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Player Strategies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentConfig.players.map((player, playerIndex) => (
                      <div key={player.playerId} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium" style={{ color: player.color }}>
                            {player.playerName}
                          </h4>
                          <Select
                            value={player.strategyType}
                            onValueChange={(value: 'pure' | 'mixed') =>
                              updatePlayerStrategy(player.playerId, { strategyType: value })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pure">Pure</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {player.strategyType === 'pure' ? (
                          <Select
                            value={player.pureStrategy?.toString() || '0'}
                            onValueChange={(value) =>
                              updatePlayerStrategy(player.playerId, { pureStrategy: parseInt(value) })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                            <SelectContent>
                              {game.payoffMatrix.strategies.map((strategy, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {strategy.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Mixed Strategy Probabilities:</p>
                            {game.payoffMatrix.strategies.map((strategy, strategyIndex) => (
                              <div key={strategyIndex} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{strategy.name}</span>
                                  <span>{((player.mixedProbabilities?.[strategyIndex] || 0) * 100).toFixed(1)}%</span>
                                </div>
                                <Slider
                                  value={[(player.mixedProbabilities?.[strategyIndex] || 0) * 100]}
                                  onValueChange={([value]) =>
                                    updateMixedProbabilities(player.playerId, strategyIndex, value)
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Experiment Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Simulation Iterations: {currentConfig.iterations.toLocaleString()}
                      </label>
                      <Slider
                        value={[currentConfig.iterations]}
                        onValueChange={([value]) =>
                          setCurrentConfig(prev => ({ ...prev, iterations: value }))
                        }
                        min={100}
                        max={10000}
                        step={100}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Button
                        onClick={runExperiment}
                        disabled={isRunning}
                        className="w-full"
                        size="lg"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isRunning ? 'Running Experiment...' : 'Run Experiment'}
                      </Button>

                      {isRunning && (
                        <div className="space-y-2">
                          <Progress value={progress} className="w-full" />
                          <p className="text-sm text-center text-muted-foreground">
                            {progress.toFixed(1)}% complete
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={generateRandomStrategy}
                          disabled={isRunning}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Random
                        </Button>
                        <Button
                          variant="outline"
                          onClick={resetExperiments}
                          disabled={isRunning}
                        >
                          Clear Results
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {experiments.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No experiments run yet. Design a strategy configuration and run an experiment to see results.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {experiments.map((experiment, index) => (
                      <Card
                        key={experiment.id}
                        className={cn(
                          'cursor-pointer transition-colors',
                          selectedExperiment === experiment.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedExperiment(experiment.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              Experiment #{experiments.length - index}
                            </CardTitle>
                            <Badge variant="outline">
                              {experiment.avgPayoff.toFixed(2)}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {experiment.timestamp.toLocaleTimeString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Effectiveness:</span>
                              <span className="font-medium">
                                {experiment.effectiveness.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Variance:</span>
                              <span>{experiment.variance.toFixed(3)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              {experiment.configuration.map((player, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {player.strategyType === 'pure'
                                    ? game.payoffMatrix.strategies[player.pureStrategy || 0]?.name
                                    : 'Mixed'
                                  }
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedExperiment && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Detailed Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const experiment = experiments.find(e => e.id === selectedExperiment);
                          if (!experiment) return null;

                          const chartData = experiment.expectedPayoffs.map((payoff, index) => ({
                            player: `Player ${index + 1}`,
                            expectedPayoff: payoff,
                            winRate: experiment.winRates[index],
                            color: currentConfig.players[index]?.color || PLAYER_COLORS[index],
                          }));

                          return (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-medium mb-3">Expected Payoffs</h4>
                                  <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={chartData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="player" />
                                      <YAxis />
                                      <Tooltip />
                                      <Bar dataKey="expectedPayoff" fill="#3b82f6" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-3">Win Rates (%)</h4>
                                  <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={chartData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="player" />
                                      <YAxis />
                                      <Tooltip />
                                      <Bar dataKey="winRate" fill="#10b981" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="p-3 bg-muted rounded-lg">
                                  <div className="text-2xl font-bold text-primary">
                                    {experiment.avgPayoff.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Average Payoff</div>
                                </div>
                                <div className="p-3 bg-muted rounded-lg">
                                  <div className="text-2xl font-bold text-primary">
                                    {experiment.variance.toFixed(3)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Variance</div>
                                </div>
                                <div className="p-3 bg-muted rounded-lg">
                                  <div className="text-2xl font-bold text-primary">
                                    {experiment.effectiveness.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Effectiveness</div>
                                </div>
                                <div className="p-3 bg-muted rounded-lg">
                                  <div className="text-2xl font-bold text-primary">
                                    {experiment.iterations.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Iterations</div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {!comparisonMetrics ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Run at least one experiment to see comparative analysis.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-800">Best Strategy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-green-700">
                            {comparisonMetrics.bestStrategy.avgPayoff.toFixed(2)}
                          </div>
                          <p className="text-sm text-green-600">Average Payoff</p>
                          <div className="flex gap-1">
                            {comparisonMetrics.bestStrategy.configuration.map((player, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-green-100">
                                {player.strategyType === 'pure'
                                  ? game.payoffMatrix.strategies[player.pureStrategy || 0]?.name
                                  : 'Mixed'
                                }
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-blue-800">Most Consistent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-blue-700">
                            {comparisonMetrics.mostConsistent.variance.toFixed(3)}
                          </div>
                          <p className="text-sm text-blue-600">Lowest Variance</p>
                          <div className="flex gap-1">
                            {comparisonMetrics.mostConsistent.configuration.map((player, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-blue-100">
                                {player.strategyType === 'pure'
                                  ? game.payoffMatrix.strategies[player.pureStrategy || 0]?.name
                                  : 'Mixed'
                                }
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="avgPayoff" name="Average Payoff" />
                          <YAxis dataKey="variance" name="Variance" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter
                            name="Experiments"
                            data={experiments.map((exp, index) => ({
                              avgPayoff: exp.avgPayoff,
                              variance: exp.variance,
                              name: `Experiment ${experiments.length - index}`,
                            }))}
                            fill="#3b82f6"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {experiments.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Run experiments to generate strategic insights and recommendations.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Strategic Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {comparisonMetrics && (
                        <div className="space-y-3">
                          <Alert>
                            <AlertDescription>
                              <strong>Performance Range:</strong> Your experiments show payoffs ranging from{' '}
                              {comparisonMetrics.payoffRange[0].toFixed(2)} to{' '}
                              {comparisonMetrics.payoffRange[1].toFixed(2)}, with an average of{' '}
                              {comparisonMetrics.averagePayoff.toFixed(2)}.
                            </AlertDescription>
                          </Alert>

                          <Alert>
                            <AlertDescription>
                              <strong>Risk vs Reward:</strong> The most consistent strategy has a variance of{' '}
                              {comparisonMetrics.mostConsistent.variance.toFixed(3)}, while the riskiest has{' '}
                              {comparisonMetrics.riskiestStrategy.variance.toFixed(3)}. Lower variance indicates more predictable outcomes.
                            </AlertDescription>
                          </Alert>

                          <Alert>
                            <AlertDescription>
                              <strong>Strategy Recommendation:</strong> Based on your experiments,{' '}
                              {comparisonMetrics.bestStrategy.avgPayoff > comparisonMetrics.averagePayoff + 0.5
                                ? 'the highest-performing strategy significantly outperforms the average'
                                : 'there is little difference between strategy performances'
                              }. Consider {comparisonMetrics.mostConsistent.variance < 0.1 ? 'consistent' : 'high-variance'} strategies based on your risk tolerance.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategyExperiment; 