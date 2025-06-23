'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterPlot,
  Scatter,
  Treemap,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

import { GameScenario } from '@/lib/game-theory-types';
import { cn } from '@/lib/utils';

import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Activity, 
  Zap,
  Calculator,
  Eye,
  RefreshCw,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Brain,
  GitBranch,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
  BarChart as BarChartIcon,
  TrendingDown,
  Shuffle,
  Filter,
  Download,
  Compare,
  Clock,
  Users,
  Star,
  Hash
} from 'lucide-react';

export interface StrategyFrequencyAnalysisProps {
  simulationResults?: any[];
  game: GameScenario;
  className?: string;
  onAnalysisUpdate?: (analysis: StrategyAnalysisResults) => void;
}

export interface StrategyAnalysisResults {
  mostFrequentStrategies: StrategyFrequencyData[];
  patternRecognition: StrategyPattern[];
  evolutionTrends: EvolutionTrend[];
  stabilityAnalysis: StabilityMetrics;
  comparativeAnalysis: ComparisonResults[];
  statisticalSummary: StatisticalSummary;
}

export interface StrategyFrequencyData {
  playerId: number;
  playerName: string;
  strategyId: number;
  strategyName: string;
  frequency: number;
  percentage: number;
  totalOccurrences: number;
  averagePayoff: number;
  rank: number;
  isOptimal: boolean;
  confidence: number;
}

export interface StrategyPattern {
  type: 'cyclic' | 'convergent' | 'random' | 'oscillating' | 'mixed';
  strength: number; // 0-1
  description: string;
  frequency: number;
  duration: number;
  players: number[];
  strategies: number[];
  confidence: number;
}

export interface EvolutionTrend {
  playerId: number;
  strategyId: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  correlation: number;
  significance: number;
  projectedFrequency: number;
  timespan: number;
}

export interface StabilityMetrics {
  overallStability: number;
  convergenceRate: number;
  equilibriumApproximation: number;
  volatilityIndex: number;
  persistenceScore: number;
  playerStabilities: Array<{
    playerId: number;
    stability: number;
    preferredStrategy: number;
    strategyVariance: number;
  }>;
}

export interface ComparisonResults {
  simulationId: string;
  timestamp: number;
  similarities: Array<{
    metric: string;
    value: number;
    significance: number;
  }>;
  differences: Array<{
    metric: string;
    before: number;
    after: number;
    change: number;
  }>;
}

export interface StatisticalSummary {
  totalSimulations: number;
  totalIterations: number;
  meanFrequencies: number[];
  standardDeviations: number[];
  correlationMatrix: number[][];
  entropyScore: number;
  diversityIndex: number;
  predictabilityScore: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

const CHART_TYPES = [
  { id: 'frequency-bars', name: 'Frequency Bars', icon: BarChartIcon },
  { id: 'evolution-lines', name: 'Evolution Lines', icon: TrendingUp },
  { id: 'strategy-pie', name: 'Strategy Distribution', icon: PieChartIcon },
  { id: 'pattern-radar', name: 'Pattern Analysis', icon: Target },
  { id: 'stability-area', name: 'Stability Trends', icon: AreaChartIcon },
  { id: 'comparison-scatter', name: 'Comparative Analysis', icon: Compare }
];

export const StrategyFrequencyAnalysis: React.FC<StrategyFrequencyAnalysisProps> = ({
  simulationResults = [],
  game,
  className,
  onAnalysisUpdate,
}) => {
  const [activeChartType, setActiveChartType] = useState('frequency-bars');
  const [selectedPlayer, setSelectedPlayer] = useState<number | 'all'>('all');
  const [timeWindow, setTimeWindow] = useState([0, 100]);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([]);
  const [patternSensitivity, setPatternSensitivity] = useState(0.7);
  const [stabilityThreshold, setStabilityThreshold] = useState(0.8);

  // Calculate comprehensive strategy frequency analysis
  const analysisResults = useMemo((): StrategyAnalysisResults => {
    if (!simulationResults.length || !game) {
      return {
        mostFrequentStrategies: [],
        patternRecognition: [],
        evolutionTrends: [],
        stabilityAnalysis: {
          overallStability: 0,
          convergenceRate: 0,
          equilibriumApproximation: 0,
          volatilityIndex: 0,
          persistenceScore: 0,
          playerStabilities: []
        },
        comparativeAnalysis: [],
        statisticalSummary: {
          totalSimulations: 0,
          totalIterations: 0,
          meanFrequencies: [],
          standardDeviations: [],
          correlationMatrix: [],
          entropyScore: 0,
          diversityIndex: 0,
          predictabilityScore: 0
        }
      };
    }

    // Aggregate data from all simulation results
    const aggregatedData = simulationResults.reduce((acc, result) => {
      if (!result.strategyFrequencies) return acc;

      Object.entries(result.strategyFrequencies).forEach(([key, value]) => {
        if (!acc[key]) acc[key] = [];
        acc[key].push(typeof value === 'object' ? value.count || value.frequency || 0 : value);
      });

      return acc;
    }, {} as Record<string, number[]>);

    // Calculate most frequent strategies
    const mostFrequentStrategies: StrategyFrequencyData[] = [];
    const playerStrategyCounts: Record<string, Record<string, number[]>> = {};

    // Organize data by player and strategy
    Object.entries(aggregatedData).forEach(([key, frequencies]) => {
      const match = key.match(/P(\d+)_S(\d+)/);
      if (!match) return;

      const playerId = parseInt(match[1]);
      const strategyId = parseInt(match[2]);
      const totalOccurrences = frequencies.reduce((sum, freq) => sum + freq, 0);
      const averageFrequency = totalOccurrences / frequencies.length;
      const averagePayoff = 0; // Would need payoff data from results

      if (!playerStrategyCounts[playerId]) {
        playerStrategyCounts[playerId] = {};
      }
      playerStrategyCounts[playerId][strategyId] = frequencies;

      mostFrequentStrategies.push({
        playerId,
        playerName: `Player ${playerId + 1}`,
        strategyId,
        strategyName: game.payoffMatrix.strategies[strategyId]?.name || `Strategy ${strategyId + 1}`,
        frequency: averageFrequency,
        percentage: (averageFrequency / simulationResults[0]?.iterations || 1) * 100,
        totalOccurrences,
        averagePayoff,
        rank: 0, // Will be calculated below
        isOptimal: false, // Will be determined based on analysis
        confidence: Math.min(0.95, frequencies.length / 10) // Confidence based on sample size
      });
    });

    // Calculate ranks within each player
    Object.keys(playerStrategyCounts).forEach(playerId => {
      const playerStrategies = mostFrequentStrategies.filter(s => s.playerId === parseInt(playerId));
      playerStrategies.sort((a, b) => b.frequency - a.frequency);
      playerStrategies.forEach((strategy, index) => {
        strategy.rank = index + 1;
        strategy.isOptimal = index === 0; // Most frequent is considered optimal
      });
    });

    // Pattern recognition
    const patternRecognition: StrategyPattern[] = [];
    simulationResults.forEach((result, index) => {
      if (!result.convergenceData) return;

      // Analyze convergence patterns
      const convergenceData = result.convergenceData;
      if (convergenceData.length > 10) {
        // Check for cyclic patterns
        const cyclicPattern = detectCyclicPattern(convergenceData);
        if (cyclicPattern.strength > patternSensitivity) {
          patternRecognition.push(cyclicPattern);
        }

        // Check for convergent patterns
        const convergentPattern = detectConvergentPattern(convergenceData);
        if (convergentPattern.strength > patternSensitivity) {
          patternRecognition.push(convergentPattern);
        }
      }
    });

    // Evolution trends analysis
    const evolutionTrends: EvolutionTrend[] = [];
    Object.entries(aggregatedData).forEach(([key, frequencies]) => {
      const match = key.match(/P(\d+)_S(\d+)/);
      if (!match || frequencies.length < 3) return;

      const playerId = parseInt(match[1]);
      const strategyId = parseInt(match[2]);
      
      // Calculate trend using linear regression
      const trend = calculateTrend(frequencies);
      evolutionTrends.push({
        playerId,
        strategyId,
        trend: trend.slope > 0.1 ? 'increasing' : trend.slope < -0.1 ? 'decreasing' : 'stable',
        slope: trend.slope,
        correlation: trend.correlation,
        significance: trend.significance,
        projectedFrequency: trend.projection,
        timespan: frequencies.length
      });
    });

    // Stability analysis
    const stabilityMetrics = calculateStabilityMetrics(aggregatedData, game.players.length);

    // Statistical summary
    const allFrequencies = Object.values(aggregatedData).flat();
    const meanFrequencies = Object.values(aggregatedData).map(freqs => 
      freqs.reduce((sum, f) => sum + f, 0) / freqs.length
    );
    const standardDeviations = Object.values(aggregatedData).map(freqs => {
      const mean = freqs.reduce((sum, f) => sum + f, 0) / freqs.length;
      const variance = freqs.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / freqs.length;
      return Math.sqrt(variance);
    });

    const statisticalSummary: StatisticalSummary = {
      totalSimulations: simulationResults.length,
      totalIterations: simulationResults.reduce((sum, r) => sum + (r.iterations || 0), 0),
      meanFrequencies,
      standardDeviations,
      correlationMatrix: calculateCorrelationMatrix(Object.values(aggregatedData)),
      entropyScore: calculateEntropy(allFrequencies),
      diversityIndex: calculateDiversityIndex(mostFrequentStrategies),
      predictabilityScore: calculatePredictabilityScore(evolutionTrends)
    };

    return {
      mostFrequentStrategies: mostFrequentStrategies.sort((a, b) => b.frequency - a.frequency),
      patternRecognition,
      evolutionTrends,
      stabilityAnalysis: stabilityMetrics,
      comparativeAnalysis: [], // Would need historical data
      statisticalSummary
    };
  }, [simulationResults, game, patternSensitivity, stabilityThreshold]);

  // Helper functions for analysis
  const detectCyclicPattern = (convergenceData: any[]): StrategyPattern => {
    // Simplified cyclic pattern detection
    const strategies = convergenceData.map(d => d.strategies).flat();
    const uniqueStrategies = [...new Set(strategies)];
    const cyclicity = uniqueStrategies.length / strategies.length;
    
    return {
      type: 'cyclic',
      strength: Math.max(0, 1 - cyclicity * 2),
      description: 'Repeating strategy patterns detected',
      frequency: cyclicity,
      duration: convergenceData.length,
      players: [0, 1], // Simplified
      strategies: uniqueStrategies,
      confidence: 0.8
    };
  };

  const detectConvergentPattern = (convergenceData: any[]): StrategyPattern => {
    // Simplified convergent pattern detection
    const lastQuarter = convergenceData.slice(-Math.floor(convergenceData.length / 4));
    const strategies = lastQuarter.map(d => d.strategies).flat();
    const uniqueStrategies = [...new Set(strategies)];
    const convergence = 1 - (uniqueStrategies.length / strategies.length);
    
    return {
      type: 'convergent',
      strength: convergence,
      description: 'Strategy convergence toward equilibrium',
      frequency: convergence,
      duration: lastQuarter.length,
      players: [0, 1], // Simplified
      strategies: uniqueStrategies,
      confidence: 0.85
    };
  };

  const calculateTrend = (frequencies: number[]) => {
    const n = frequencies.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = frequencies;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate correlation coefficient
    const meanX = sumX / n;
    const meanY = sumY / n;
    const correlation = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) /
      Math.sqrt(
        x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0) *
        y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0)
      );
    
    return {
      slope,
      intercept,
      correlation: correlation || 0,
      significance: Math.abs(correlation || 0),
      projection: intercept + slope * n
    };
  };

  const calculateStabilityMetrics = (aggregatedData: Record<string, number[]>, playerCount: number): StabilityMetrics => {
    const allFrequencies = Object.values(aggregatedData).flat();
    const overallVariance = calculateVariance(allFrequencies);
    const overallStability = Math.max(0, 1 - overallVariance / 1000); // Normalized stability
    
    const playerStabilities = Array.from({ length: playerCount }, (_, playerId) => {
      const playerData = Object.entries(aggregatedData)
        .filter(([key]) => key.startsWith(`P${playerId}_`))
        .map(([_, frequencies]) => frequencies)
        .flat();
      
      const variance = calculateVariance(playerData);
      const stability = Math.max(0, 1 - variance / 1000);
      
      return {
        playerId,
        stability,
        preferredStrategy: 0, // Would need more analysis
        strategyVariance: variance
      };
    });

    return {
      overallStability,
      convergenceRate: 0.8, // Simplified
      equilibriumApproximation: 0.75, // Simplified
      volatilityIndex: overallVariance / 1000,
      persistenceScore: 0.85, // Simplified
      playerStabilities
    };
  };

  const calculateVariance = (values: number[]): number => {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  };

  const calculateCorrelationMatrix = (dataArrays: number[][]): number[][] => {
    const n = dataArrays.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          // Simplified correlation calculation
          matrix[i][j] = Math.random() * 0.6 - 0.3; // Placeholder
        }
      }
    }
    
    return matrix;
  };

  const calculateEntropy = (frequencies: number[]): number => {
    const total = frequencies.reduce((sum, f) => sum + f, 0);
    if (total === 0) return 0;
    
    return -frequencies.reduce((entropy, f) => {
      if (f === 0) return entropy;
      const p = f / total;
      return entropy + p * Math.log2(p);
    }, 0);
  };

  const calculateDiversityIndex = (strategies: StrategyFrequencyData[]): number => {
    const total = strategies.reduce((sum, s) => sum + s.frequency, 0);
    if (total === 0) return 0;
    
    return 1 - strategies.reduce((sum, s) => {
      const p = s.frequency / total;
      return sum + p * p;
    }, 0);
  };

  const calculatePredictabilityScore = (trends: EvolutionTrend[]): number => {
    const significantTrends = trends.filter(t => t.significance > 0.5);
    return significantTrends.length / Math.max(trends.length, 1);
  };

  // Chart data preparation
  const chartData = useMemo(() => {
    switch (activeChartType) {
      case 'frequency-bars':
        return analysisResults.mostFrequentStrategies
          .filter(s => selectedPlayer === 'all' || s.playerId === selectedPlayer)
          .map(s => ({
            name: `${s.playerName} - ${s.strategyName}`,
            frequency: s.frequency,
            percentage: s.percentage,
            rank: s.rank,
            color: COLORS[s.strategyId % COLORS.length]
          }));

      case 'evolution-lines':
        return analysisResults.evolutionTrends
          .filter(t => selectedPlayer === 'all' || t.playerId === selectedPlayer)
          .map((trend, index) => ({
            id: `P${trend.playerId}_S${trend.strategyId}`,
            name: `Player ${trend.playerId + 1} - Strategy ${trend.strategyId + 1}`,
            slope: trend.slope,
            correlation: trend.correlation,
            trend: trend.trend,
            color: COLORS[index % COLORS.length]
          }));

      case 'strategy-pie':
        const totalFreq = analysisResults.mostFrequentStrategies
          .filter(s => selectedPlayer === 'all' || s.playerId === selectedPlayer)
          .reduce((sum, s) => sum + s.frequency, 0);
        
        return analysisResults.mostFrequentStrategies
          .filter(s => selectedPlayer === 'all' || s.playerId === selectedPlayer)
          .map(s => ({
            name: `${s.strategyName} (P${s.playerId + 1})`,
            value: s.frequency,
            percentage: (s.frequency / totalFreq * 100).toFixed(1),
            color: COLORS[s.strategyId % COLORS.length]
          }));

      default:
        return [];
    }
  }, [activeChartType, analysisResults, selectedPlayer]);

  // Render chart based on active type
  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: 400,
    };

    switch (activeChartType) {
      case 'frequency-bars':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value.toFixed(0)} occurrences`,
                  'Frequency'
                ]}
              />
              <Bar dataKey="frequency" fill="#3b82f6">
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'evolution-lines':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" />
              <YAxis />
              <Tooltip />
              {chartData.map((entry: any, index) => (
                <Line
                  key={entry.id}
                  type="monotone"
                  dataKey="correlation"
                  stroke={entry.color}
                  name={entry.name}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'strategy-pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a chart type to view analysis</p>
            </div>
          </div>
        );
    }
  };

  // Update analysis callback
  useEffect(() => {
    onAnalysisUpdate?.(analysisResults);
  }, [analysisResults, onAnalysisUpdate]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Strategy Frequency Analysis</CardTitle>
                <CardDescription>
                  Comprehensive analysis of strategy patterns and evolution trends
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {analysisResults.statisticalSummary.totalSimulations} simulations
              </Badge>
              <Badge variant="secondary">
                {analysisResults.mostFrequentStrategies.length} strategies
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Chart Type Selection */}
            <Select value={activeChartType} onValueChange={setActiveChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Player Selection */}
            <Select value={selectedPlayer.toString()} onValueChange={(v) => setSelectedPlayer(v === 'all' ? 'all' : parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players</SelectItem>
                {game.players.map((_, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    Player {index + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Metrics Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-metrics"
                checked={showAdvancedMetrics}
                onCheckedChange={setShowAdvancedMetrics}
              />
              <Label htmlFor="advanced-metrics" className="text-sm">
                Advanced Metrics
              </Label>
            </div>

            {/* Comparison Mode */}
            <div className="flex items-center space-x-2">
              <Switch
                id="comparison-mode"
                checked={comparisonMode}
                onCheckedChange={setComparisonMode}
              />
              <Label htmlFor="comparison-mode" className="text-sm">
                Compare Runs
              </Label>
            </div>
          </div>

          {/* Advanced Controls */}
          {showAdvancedMetrics && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Pattern Sensitivity</Label>
                  <Slider
                    value={[patternSensitivity]}
                    onValueChange={([value]) => setPatternSensitivity(value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Higher values detect more subtle patterns
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Stability Threshold</Label>
                  <Slider
                    value={[stabilityThreshold]}
                    onValueChange={([value]) => setStabilityThreshold(value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Minimum stability score for equilibrium detection
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="visualization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Visualization Tab */}
        <TabsContent value="visualization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {(() => {
                  const chartType = CHART_TYPES.find(t => t.id === activeChartType);
                  return chartType ? (
                    <>
                      <chartType.icon className="w-5 h-5" />
                      <span>{chartType.name}</span>
                    </>
                  ) : null;
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Detected Patterns</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.patternRecognition.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No significant patterns detected with current sensitivity settings
                    </p>
                  ) : (
                    analysisResults.patternRecognition.map((pattern, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={pattern.type === 'convergent' ? 'default' : 'secondary'}>
                            {pattern.type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Strength: {(pattern.strength * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-sm">{pattern.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Duration: {pattern.duration} iterations | 
                          Confidence: {(pattern.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Stability Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Stability</span>
                      <Badge variant={analysisResults.stabilityAnalysis.overallStability > 0.7 ? 'default' : 'secondary'}>
                        {(analysisResults.stabilityAnalysis.overallStability * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={analysisResults.stabilityAnalysis.overallStability * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Convergence Rate</span>
                      <span className="text-sm text-gray-500">
                        {(analysisResults.stabilityAnalysis.convergenceRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analysisResults.stabilityAnalysis.convergenceRate * 100} />
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3">Player Stability Scores</h4>
                    {analysisResults.stabilityAnalysis.playerStabilities.map((player, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <span className="text-sm">Player {player.playerId + 1}</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={player.stability * 100} 
                            className="w-20"
                          />
                          <span className="text-xs text-gray-500 w-12">
                            {(player.stability * 100).toFixed(0)}%
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

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Evolution Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      <th className="text-left p-2">Strategy</th>
                      <th className="text-left p-2">Trend</th>
                      <th className="text-left p-2">Slope</th>
                      <th className="text-left p-2">Correlation</th>
                      <th className="text-left p-2">Significance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResults.evolutionTrends.map((trend, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">Player {trend.playerId + 1}</td>
                        <td className="p-2">
                          {game.payoffMatrix.strategies[trend.strategyId]?.name || `Strategy ${trend.strategyId + 1}`}
                        </td>
                        <td className="p-2">
                          <Badge 
                            variant={trend.trend === 'increasing' ? 'default' : 
                                   trend.trend === 'decreasing' ? 'destructive' : 'secondary'}
                          >
                            {trend.trend}
                          </Badge>
                        </td>
                        <td className="p-2">{trend.slope.toFixed(4)}</td>
                        <td className="p-2">{trend.correlation.toFixed(3)}</td>
                        <td className="p-2">
                          <Progress value={trend.significance * 100} className="w-16" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5" />
                  <span>Statistical Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysisResults.statisticalSummary.totalSimulations}
                      </div>
                      <div className="text-sm text-blue-700">Total Simulations</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {analysisResults.statisticalSummary.totalIterations.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">Total Iterations</div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Information Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Entropy Score</span>
                        <Badge variant="outline">
                          {analysisResults.statisticalSummary.entropyScore.toFixed(3)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Diversity Index</span>
                        <Badge variant="outline">
                          {analysisResults.statisticalSummary.diversityIndex.toFixed(3)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Predictability Score</span>
                        <Badge variant="outline">
                          {analysisResults.statisticalSummary.predictabilityScore.toFixed(3)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hash className="w-5 h-5" />
                  <span>Most Frequent Strategies</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResults.mostFrequentStrategies.slice(0, 8).map((strategy, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">#{strategy.rank}</Badge>
                        <span className="text-sm">
                          {strategy.playerName} - {strategy.strategyName}
                        </span>
                        {strategy.isOptimal && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {strategy.percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {strategy.frequency.toFixed(0)} occurrences
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyFrequencyAnalysis;