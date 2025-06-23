'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Award,
  Zap,
  Shield,
  BarChart3,
  Users,
  Eye
} from 'lucide-react';
import { GameTheoryUtils } from '@/lib/game-theory-utils';
import { NashEquilibriumChart } from './nash-equilibrium-chart';
import { GameScenario, NashEquilibrium } from '@/lib/game-theory-types';
import { StrategySpaceData } from '@/lib/visualization-types';

interface EnhancedNashChartProps {
  scenario: GameScenario;
  data?: StrategySpaceData;
  className?: string;
}

interface ValidatedEquilibrium {
  equilibrium: NashEquilibrium;
  validation: any;
  recommendation?: string;
}

export const EnhancedNashChart: React.FC<EnhancedNashChartProps> = ({
  scenario,
  data,
  className
}) => {
  const [selectedEquilibrium, setSelectedEquilibrium] = useState<ValidatedEquilibrium | null>(null);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);

  const gameTheoryUtils = useMemo(() => new GameTheoryUtils(), []);

  // Get validated equilibria with comprehensive analysis
  const validatedEquilibria = useMemo(() => {
    try {
      return gameTheoryUtils.getRecommendedNashEquilibria(scenario);
    } catch (error) {
      console.error('Error calculating Nash equilibria:', error);
      return [];
    }
  }, [scenario, gameTheoryUtils]);

  // Get all equilibria for the visualization
  const allEquilibria = useMemo(() => {
    try {
      return gameTheoryUtils.findNashEquilibria(scenario);
    } catch (error) {
      console.error('Error finding equilibria:', error);
      return [];
    }
  }, [scenario, gameTheoryUtils]);

  const handleEquilibriumClick = useCallback((equilibrium: NashEquilibrium) => {
    const validated = validatedEquilibria.find(ve => 
      JSON.stringify(ve.equilibrium.strategies) === JSON.stringify(equilibrium.strategies)
    );
    setSelectedEquilibrium(validated || null);
  }, [validatedEquilibria]);

  const getStabilityColor = (stability: number): string => {
    if (stability >= 0.8) return 'text-green-600';
    if (stability >= 0.6) return 'text-yellow-600';
    if (stability >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBadgeVariant = (risk: string): 'default' | 'secondary' | 'destructive' => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatStrategy = (equilibrium: NashEquilibrium): string => {
    if (equilibrium.type === 'pure') {
      const strategies = equilibrium.strategies as number[];
      return `(${strategies.map(s => scenario.payoffMatrix.strategies[s]?.shortName || s).join(', ')})`;
    } else {
      const strategies = equilibrium.strategies as number[][];
      return strategies.map((playerStrat, playerIdx) => {
        const probs = playerStrat.map((prob, stratIdx) => 
          `${scenario.payoffMatrix.strategies[stratIdx]?.shortName || stratIdx}:${(prob * 100).toFixed(1)}%`
        ).join(', ');
        return `P${playerIdx + 1}:{${probs}}`;
      }).join(' | ');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Nash Equilibrium Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {allEquilibria.length} Equilibri{allEquilibria.length !== 1 ? 'a' : 'um'}
              </Badge>
              <Badge variant="outline">
                {validatedEquilibria.length} Validated
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Players</p>
                <p className="text-lg font-bold">{scenario.payoffMatrix.players}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Strategies</p>
                <p className="text-lg font-bold">{scenario.payoffMatrix.strategies.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Game Type</p>
                <p className="text-sm font-semibold">{scenario.type}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Strategy Space Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <NashEquilibriumChart
                data={data}
                onEquilibriumClick={handleEquilibriumClick}
                interactive={true}
                showBestResponse={true}
                showDominatedRegions={true}
                className="h-80"
              />
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Visualization not available for this game type</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equilibria List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recommended Equilibria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {validatedEquilibria.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No valid Nash equilibria found. This may indicate an issue with the game setup.
                  </AlertDescription>
                </Alert>
              ) : (
                validatedEquilibria.map((validatedEq, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEquilibrium?.equilibrium.strategies === validatedEq.equilibrium.strategies
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEquilibrium(validatedEq)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={validatedEq.equilibrium.type === 'pure' ? 'default' : 'secondary'}>
                            {validatedEq.equilibrium.type}
                          </Badge>
                          {validatedEq.validation.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <Badge variant={getRiskBadgeVariant(validatedEq.validation.qualityMetrics.risk_profile)}>
                            {validatedEq.validation.qualityMetrics.risk_profile} risk
                          </Badge>
                        </div>
                        <p className="text-sm font-mono">
                          {formatStrategy(validatedEq.equilibrium)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Payoffs: ({validatedEq.equilibrium.payoffs.map(p => p.toFixed(2)).join(', ')})
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            <span className={`text-xs font-medium ${
                              getStabilityColor(validatedEq.validation.stabilityAnalysis.overall)
                            }`}>
                              {(validatedEq.validation.stabilityAnalysis.overall * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-xs text-gray-600">
                              {(validatedEq.validation.qualityMetrics.efficiency * 100).toFixed(0)}% efficient
                            </span>
                          </div>
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge variant="outline" className="ml-2">
                          <Award className="h-3 w-3 mr-1" />
                          Best
                        </Badge>
                      )}
                    </div>
                    {validatedEq.recommendation && (
                      <p className="text-xs text-blue-600 mt-2 italic">
                        {validatedEq.recommendation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      {selectedEquilibrium && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Equilibrium Analysis: {selectedEquilibrium.equilibrium.type} Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stability">Stability</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Strategy Profile</h4>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                      {formatStrategy(selectedEquilibrium.equilibrium)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Expected Payoffs</h4>
                    <div className="space-y-1">
                      {selectedEquilibrium.equilibrium.payoffs.map((payoff, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>Player {index + 1}:</span>
                          <span className="font-mono">{payoff.toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Key Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {(selectedEquilibrium.validation.qualityMetrics.social_welfare).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">Social Welfare</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {(selectedEquilibrium.validation.qualityMetrics.efficiency * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-600">Efficiency</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {(selectedEquilibrium.validation.qualityMetrics.fairness * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-600">Fairness</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stability" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Overall Stability</h4>
                      <span className={`font-bold ${
                        getStabilityColor(selectedEquilibrium.validation.stabilityAnalysis.overall)
                      }`}>
                        {(selectedEquilibrium.validation.stabilityAnalysis.overall * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={selectedEquilibrium.validation.stabilityAnalysis.overall * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedEquilibrium.validation.stabilityAnalysis.components).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm font-medium">{((value as number) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={(value as number) * 100} className="h-1" />
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Stability Description</h4>
                    <p className="text-sm text-gray-700">
                      {selectedEquilibrium.validation.stabilityAnalysis.description}
                    </p>
                  </div>

                  {selectedEquilibrium.validation.stabilityAnalysis.riskFactors.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Risk Factors</h4>
                      <ul className="space-y-1">
                        {selectedEquilibrium.validation.stabilityAnalysis.riskFactors.map((factor: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Efficiency</span>
                        <span className="text-sm">{(selectedEquilibrium.validation.qualityMetrics.efficiency * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedEquilibrium.validation.qualityMetrics.efficiency * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Fairness</span>
                        <span className="text-sm">{(selectedEquilibrium.validation.qualityMetrics.fairness * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedEquilibrium.validation.qualityMetrics.fairness * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Complexity</span>
                        <span className="text-sm">{(selectedEquilibrium.validation.qualityMetrics.complexity * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedEquilibrium.validation.qualityMetrics.complexity * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Interpretability</span>
                        <span className="text-sm">{(selectedEquilibrium.validation.qualityMetrics.interpretability * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedEquilibrium.validation.qualityMetrics.interpretability * 100} className="h-2" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Quality Summary</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeVariant(selectedEquilibrium.validation.qualityMetrics.risk_profile)}>
                          {selectedEquilibrium.validation.qualityMetrics.risk_profile} Risk
                        </Badge>
                      </div>
                      <p className="text-sm">
                        Social Welfare: <span className="font-mono">{selectedEquilibrium.validation.qualityMetrics.social_welfare.toFixed(3)}</span>
                      </p>
                      <p className="text-sm">
                        Confidence: <span className="font-mono">{(selectedEquilibrium.validation.confidence * 100).toFixed(1)}%</span>
                      </p>
                    </div>
                  </div>
                </div>

                {selectedEquilibrium.validation.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Strategic Recommendations</h4>
                    <ul className="space-y-1">
                      {selectedEquilibrium.validation.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {selectedEquilibrium.validation.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold">
                      {selectedEquilibrium.validation.isValid ? 'Valid Nash Equilibrium' : 'Invalid Equilibrium'}
                    </span>
                    <Badge variant="outline">
                      {(selectedEquilibrium.validation.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>

                  {selectedEquilibrium.validation.errors.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600">Validation Errors</h4>
                      <div className="space-y-2">
                        {selectedEquilibrium.validation.errors.map((error: any, index: number) => (
                          <Alert key={index} variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{error.type}:</strong> {error.message}
                              {error.player !== undefined && ` (Player ${error.player + 1})`}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEquilibrium.validation.warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-yellow-600">Warnings</h4>
                      <div className="space-y-2">
                        {selectedEquilibrium.validation.warnings.map((warning: any, index: number) => (
                          <Alert key={index}>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{warning.type}:</strong> {warning.message}
                              {warning.suggestion && (
                                <div className="mt-1 text-sm text-gray-600">
                                  Suggestion: {warning.suggestion}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEquilibrium.validation.errors.length === 0 && selectedEquilibrium.validation.warnings.length === 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        This equilibrium passes all validation checks with no errors or warnings.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 