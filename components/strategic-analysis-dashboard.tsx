'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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

// Import strategy analysis components
import { StrategyAnalysis } from '@/components/strategy-analysis';
import { StrategyExperiment } from '@/components/strategy-experiment';
import { MixedStrategyCalculator } from '@/components/mixed-strategy-calculator';
import { VisualizationDashboard } from '@/components/visualization-dashboard';

// Import chart components for integrated analysis
import { BestResponseChart } from '@/components/charts/best-response-chart';
import { StrategicDominanceChart } from '@/components/charts/strategic-dominance-chart';
import { EnhancedNashChart } from '@/components/charts/enhanced-nash-chart';

import { GameScenario } from '@/lib/game-theory-types';
import { DominanceAnalyzer } from '@/lib/dominance-analyzer';
import { MixedStrategySolver } from '@/lib/mixed-strategy-solver';
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
  GitBranch
} from 'lucide-react';

export interface StrategicAnalysisDashboardProps {
  simulationResults?: any;
  game: GameScenario;
  payoffMatrix: number[][][];
  className?: string;
  onAnalysisUpdate?: (analysis: AnalysisResults) => void;
}

export interface AnalysisResults {
  dominanceAnalysis: any;
  nashEquilibria: any[];
  mixedStrategies: any;
  bestResponses: any;
  recommendations: string[];
  insights: AnalysisInsight[];
}

export interface AnalysisInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  actionable?: boolean;
  recommendation?: string;
}

interface AnalysisMode {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  requiresSimulation?: boolean;
}

const ANALYSIS_MODES: AnalysisMode[] = [
  {
    id: 'overview',
    name: 'Strategic Overview',
    description: 'Comprehensive analysis combining all strategic insights',
    icon: Eye,
    requiresSimulation: false,
  },
  {
    id: 'dominance',
    name: 'Dominance Analysis',
    description: 'Find strictly and weakly dominant strategies',
    icon: Target,
    requiresSimulation: false,
  },
  {
    id: 'equilibrium',
    name: 'Nash Equilibrium',
    description: 'Calculate pure and mixed strategy equilibria',
    icon: Zap,
    requiresSimulation: false,
  },
  {
    id: 'mixed-strategies',
    name: 'Mixed Strategies',
    description: 'Interactive mixed strategy calculator and visualizer',
    icon: Calculator,
    requiresSimulation: false,
  },
  {
    id: 'best-response',
    name: 'Best Response',
    description: 'Analyze best response functions and intersections',
    icon: TrendingUp,
    requiresSimulation: false,
  },
  {
    id: 'experiments',
    name: 'Strategy Experiments',
    description: 'Run controlled strategy experiments and comparisons',
    icon: Activity,
    requiresSimulation: false,
  },
  {
    id: 'simulation-analysis',
    name: 'Simulation Analysis',
    description: 'Analyze results from Monte Carlo simulation runs',
    icon: BarChart3,
    requiresSimulation: true,
  },
];

export const StrategicAnalysisDashboard: React.FC<StrategicAnalysisDashboardProps> = ({
  simulationResults,
  game,
  payoffMatrix,
  className,
  onAnalysisUpdate,
}) => {
  const [activeMode, setActiveMode] = useState<string>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize analyzers
  const dominanceAnalyzer = useMemo(() => new DominanceAnalyzer(), []);
  const mixedStrategySolver = useMemo(() => new MixedStrategySolver(), []);

  // Perform comprehensive strategic analysis
  const performAnalysis = useCallback(async () => {
    if (!game || !payoffMatrix || payoffMatrix.length === 0) return;

    setIsAnalyzing(true);
    
    try {
      // Dominance Analysis
      const dominanceResults = dominanceAnalyzer.analyzeDominance({
        players: game.players.length,
        strategies: game.payoffMatrix.strategies,
        payoffs: payoffMatrix,
        isSymmetric: false,
      });

      // Nash Equilibrium Analysis
      const nashEquilibria = mixedStrategySolver.findMixedEquilibria({
        players: game.players.length,
        strategies: game.payoffMatrix.strategies,
        payoffs: payoffMatrix,
        isSymmetric: false,
      });

      // Generate insights
      const insights: AnalysisInsight[] = [];

      // Dominance insights
      if (dominanceResults.strictlyDominant.length > 0) {
        insights.push({
          type: 'success',
          title: 'Strictly Dominant Strategies Found',
          description: `Found ${dominanceResults.strictlyDominant.length} strictly dominant strategies that always perform better.`,
          actionable: true,
          recommendation: 'Players should always choose their dominant strategies when available.',
        });
      }

      if (dominanceResults.weaklyDominant.length > 0) {
        insights.push({
          type: 'info',
          title: 'Weakly Dominant Strategies Identified',
          description: `${dominanceResults.weaklyDominant.length} strategies perform at least as well as alternatives.`,
          actionable: true,
          recommendation: 'Consider these strategies as safe choices, but watch for better opportunities.',
        });
      }

      // Nash equilibrium insights
      if (nashEquilibria.length > 0) {
        const hasMultipleEquilibria = nashEquilibria.length > 1;
        insights.push({
          type: hasMultipleEquilibria ? 'warning' : 'success',
          title: `${nashEquilibria.length} Nash Equilibri${nashEquilibria.length > 1 ? 'a' : 'um'} Found`,
          description: hasMultipleEquilibria 
            ? 'Multiple equilibria suggest coordination challenges.'
            : 'Single equilibrium provides clear strategic guidance.',
          actionable: true,
          recommendation: hasMultipleEquilibria
            ? 'Players need coordination mechanisms to select between equilibria.'
            : 'This equilibrium represents the most stable strategic outcome.',
        });
      } else {
        insights.push({
          type: 'warning',
          title: 'No Pure Strategy Equilibrium',
          description: 'Players may need to use mixed strategies for optimal play.',
          actionable: true,
          recommendation: 'Explore mixed strategy combinations for better outcomes.',
        });
      }

      // Simulation-based insights
      if (simulationResults) {
        const convergenceRate = simulationResults.convergenceData?.length > 0 
          ? simulationResults.convergenceData[simulationResults.convergenceData.length - 1]?.iteration / simulationResults.iterations
          : 0;

        if (convergenceRate > 0.8) {
          insights.push({
            type: 'success',
            title: 'Strong Convergence Observed',
            description: 'Simulation shows players quickly finding stable strategies.',
            actionable: false,
          });
        } else if (convergenceRate < 0.3) {
          insights.push({
            type: 'warning',
            title: 'Poor Convergence',
            description: 'Players struggle to find stable strategies in this game.',
            actionable: true,
            recommendation: 'Consider mechanism design or external coordination.',
          });
        }
      }

      // Game complexity insights
      const strategyCombinations = Math.pow(game.payoffMatrix.strategies.length, game.players.length);
      if (strategyCombinations > 16) {
        insights.push({
          type: 'info',
          title: 'Complex Strategic Space',
          description: `${strategyCombinations} possible strategy combinations create a complex decision environment.`,
          actionable: true,
          recommendation: 'Focus on dominant strategies and equilibrium analysis to simplify decisions.',
        });
      }

      const results: AnalysisResults = {
        dominanceAnalysis: dominanceResults,
        nashEquilibria,
        mixedStrategies: null, // Will be filled by mixed strategy calculator
        bestResponses: null, // Will be filled by best response analysis
        recommendations: insights.filter(i => i.actionable).map(i => i.recommendation).filter(Boolean) as string[],
        insights,
      };

      setAnalysisResults(results);
      onAnalysisUpdate?.(results);

    } catch (error) {
      console.error('Analysis failed:', error);
      const errorInsight: AnalysisInsight = {
        type: 'error',
        title: 'Analysis Error',
        description: 'Failed to complete strategic analysis. Please check game configuration.',
        actionable: false,
      };
      setAnalysisResults({
        dominanceAnalysis: null,
        nashEquilibria: [],
        mixedStrategies: null,
        bestResponses: null,
        recommendations: [],
        insights: [errorInsight],
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [game, payoffMatrix, simulationResults, dominanceAnalyzer, mixedStrategySolver, onAnalysisUpdate]);

  // Auto-refresh analysis when game changes
  useEffect(() => {
    if (autoRefresh) {
      performAnalysis();
    }
  }, [game, payoffMatrix, simulationResults, autoRefresh, performAnalysis]);

  // Filter available modes based on simulation availability
  const availableModes = useMemo(() => {
    return ANALYSIS_MODES.filter(mode => 
      !mode.requiresSimulation || simulationResults
    );
  }, [simulationResults]);

  // Render insights panel
  const renderInsights = () => {
    if (!analysisResults?.insights.length) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Strategic Insights
          </CardTitle>
          <CardDescription>
            Key findings and recommendations from the analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysisResults.insights.map((insight, index) => (
            <Alert key={index}>
              <div className="flex items-start gap-2">
                {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />}
                {insight.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />}
                {insight.type === 'info' && <Info className="w-4 h-4 text-blue-600 mt-0.5" />}
                {insight.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="font-medium mb-1">{insight.title}</div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="text-sm font-medium text-primary">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Convert UI game to GameScenario format for components that need it
  const gameScenario: GameScenario = useMemo(() => ({
    id: game.id,
    name: game.name,
    description: game.description,
    type: game.type,
    payoffMatrix: game.payoffMatrix,
    players: game.players,
    realWorldExample: '',
    difficulty: 'intermediate' as const,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }), [game]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Dashboard Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Strategic Analysis Dashboard
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-advanced"
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
                <Label htmlFor="show-advanced" className="text-sm">Advanced</Label>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={performAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
                Analyze
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Comprehensive strategic analysis for {game.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{game.players.length}</div>
              <div className="text-sm text-muted-foreground">Players</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{game.payoffMatrix.strategies.length}</div>
              <div className="text-sm text-muted-foreground">Strategies</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {Math.pow(game.payoffMatrix.strategies.length, game.players.length)}
              </div>
              <div className="text-sm text-muted-foreground">Combinations</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {analysisResults?.nashEquilibria.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Equilibria</div>
            </div>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={66} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Analyzing strategic structure...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Analysis Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={activeMode} onValueChange={setActiveMode}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select analysis mode" />
            </SelectTrigger>
            <SelectContent>
              {availableModes.map((mode) => (
                <SelectItem key={mode.id} value={mode.id}>
                  <div className="flex items-center gap-2">
                    <mode.icon className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{mode.name}</div>
                      <div className="text-xs text-muted-foreground">{mode.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Main Analysis Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Analysis Content */}
          {activeMode === 'overview' && (
            <div className="space-y-6">
              <StrategyAnalysis 
                results={simulationResults}
                game={gameScenario}
                payoffMatrix={payoffMatrix}
              />
            </div>
          )}

          {activeMode === 'dominance' && (
            <StrategicDominanceChart
              payoffMatrix={payoffMatrix}
              strategies={game.payoffMatrix.strategies.map(s => s.name)}
              interactive={true}
              showDetails={showAdvanced}
            />
          )}

          {activeMode === 'equilibrium' && (
            <EnhancedNashChart
              payoffMatrix={payoffMatrix}
              strategies={game.payoffMatrix.strategies.map(s => s.name)}
              interactive={true}
              showRegions={showAdvanced}
            />
          )}

          {activeMode === 'mixed-strategies' && (
            <MixedStrategyCalculator
              game={gameScenario}
              onStrategyChange={(config) => {
                // Update analysis results with mixed strategy data
                if (analysisResults) {
                  setAnalysisResults({
                    ...analysisResults,
                    mixedStrategies: config,
                  });
                }
              }}
            />
          )}

          {activeMode === 'best-response' && (
            <BestResponseChart
              payoffMatrix={payoffMatrix}
              strategies={game.payoffMatrix.strategies.map(s => s.name)}
              interactive={true}
              showIntersections={true}
            />
          )}

          {activeMode === 'experiments' && (
            <StrategyExperiment
              game={gameScenario}
              onExperimentComplete={(results) => {
                console.log('Strategy experiment completed:', results);
              }}
            />
          )}

          {activeMode === 'simulation-analysis' && simulationResults && (
            <VisualizationDashboard
              simulationData={{
                strategyEvolution: {
                  series: [{
                    name: 'Strategy Evolution',
                    data: simulationResults.convergenceData?.map((point: any) => ({
                      x: point.iteration,
                      y: point.strategies,
                      timestamp: Date.now()
                    })) || []
                  }]
                },
                payoffDistribution: {
                  bins: simulationResults.expectedPayoffs?.map((payoff: number, index: number) => ({
                    range: `Player ${index + 1}`,
                    frequency: 1,
                    value: payoff,
                    cumulative: payoff
                  })) || [],
                  statistics: {
                    mean: simulationResults.expectedPayoffs?.reduce((a: number, b: number) => a + b, 0) / (simulationResults.expectedPayoffs?.length || 1) || 0,
                    median: simulationResults.expectedPayoffs?.[Math.floor((simulationResults.expectedPayoffs?.length || 0) / 2)] || 0,
                    std: 0
                  }
                }
              }}
              scenario={gameScenario}
              isSimulationRunning={false}
            />
          )}
        </div>

        {/* Insights Sidebar */}
        <div className="space-y-6">
          {renderInsights()}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableModes.map((mode) => (
                <Button
                  key={mode.id}
                  variant={activeMode === mode.id ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveMode(mode.id)}
                >
                  <mode.icon className="w-4 h-4 mr-2" />
                  {mode.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Analysis Summary */}
          {analysisResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Nash Equilibria:</span>
                    <Badge variant="outline">{analysisResults.nashEquilibria.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Dominant Strategies:</span>
                    <Badge variant="outline">
                      {analysisResults.dominanceAnalysis?.strictlyDominant?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Strategic Insights:</span>
                    <Badge variant="outline">{analysisResults.insights.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommendations:</span>
                    <Badge variant="outline">{analysisResults.recommendations.length}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Recommendations</h4>
                  {analysisResults.recommendations.slice(0, 3).map((rec, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      • {rec}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategicAnalysisDashboard; 