'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Target, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Info, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Users,
  Gamepad2
} from 'lucide-react';

import { PayoffMatrix } from '@/lib/game-theory-types';
import { 
  DominanceAnalyzer, 
  DominanceAnalysisResult,
  DominantStrategyInfo,
  DominatedStrategyInfo,
  EliminationStep,
  PayoffComparison 
} from '@/lib/dominance-analyzer';

interface StrategicDominanceChartProps {
  payoffMatrix: PayoffMatrix;
  title?: string;
  description?: string;
  showEducationalTips?: boolean;
  interactive?: boolean;
  className?: string;
}

export default function StrategicDominanceChart({
  payoffMatrix,
  title = "Strategic Dominance Analysis",
  description = "Analyze dominant strategies and iterative elimination",
  showEducationalTips = true,
  interactive = true,
  className = ""
}: StrategicDominanceChartProps) {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [showPayoffDetails, setShowPayoffDetails] = useState(false);

  // Perform dominance analysis
  const analysisResult = useMemo(() => {
    const analyzer = new DominanceAnalyzer(payoffMatrix);
    return analyzer.analyze();
  }, [payoffMatrix]);

  // Analysis summary stats
  const analysisStats = useMemo(() => {
    return {
      totalStrategies: payoffMatrix.strategies.length,
      strictDominant: analysisResult.strictlyDominantStrategies.length,
      weakDominant: analysisResult.weaklyDominantStrategies.length,
      strictDominated: analysisResult.strictlyDominatedStrategies.length,
      weakDominated: analysisResult.weaklyDominatedStrategies.length,
      eliminationSteps: analysisResult.iterativeElimination.length,
      remainingStrategies: analysisResult.reducedGame?.strategies.length || payoffMatrix.strategies.length
    };
  }, [analysisResult, payoffMatrix]);

  const getBadgeVariant = (type: 'strict' | 'weak', isDominant: boolean) => {
    if (type === 'strict') {
      return isDominant ? 'default' : 'destructive';
    }
    return isDominant ? 'secondary' : 'outline';
  };

  const getDominanceIcon = (type: 'strict' | 'weak', isDominant: boolean) => {
    if (isDominant) {
      return type === 'strict' ? <Crown className="w-4 h-4" /> : <Target className="w-4 h-4" />;
    }
    return type === 'strict' ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />;
  };

  const renderOverview = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          Analysis Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analysisStats.totalStrategies}</div>
            <div className="text-sm text-gray-600">Total Strategies</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analysisStats.strictDominant}</div>
            <div className="text-sm text-gray-600">Strict Dominant</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">{analysisStats.strictDominated}</div>
            <div className="text-sm text-gray-600">Strict Dominated</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{analysisStats.remainingStrategies}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>

        {/* Overall Result */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {analysisResult.hasStrictDominance 
              ? "This game has strictly dominant strategies, providing clear optimal choices for players."
              : analysisResult.hasWeakDominance
              ? "This game has weakly dominant strategies, providing some guidance for player choices."
              : "No dominant strategies found. Players need to consider mixed strategies or Nash equilibrium analysis."
            }
          </AlertDescription>
        </Alert>

        {/* Elimination Progress */}
        {analysisResult.iterativeElimination.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Elimination Progress</span>
              <span>{analysisStats.eliminationSteps} steps completed</span>
            </div>
            <Progress 
              value={(analysisStats.totalStrategies - analysisStats.remainingStrategies) / analysisStats.totalStrategies * 100} 
              className="w-full"
            />
            <div className="text-xs text-gray-600">
              Eliminated {analysisStats.totalStrategies - analysisStats.remainingStrategies} of {analysisStats.totalStrategies} strategies
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDominantStrategies = () => (
    <div className="space-y-4">
      {/* Strictly Dominant Strategies */}
      {analysisResult.strictlyDominantStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Strictly Dominant Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisResult.strictlyDominantStrategies.map((strategy, index) => (
                <div key={index} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">
                        Player {strategy.playerIndex + 1}
                      </Badge>
                      <span className="font-semibold">{strategy.strategyName}</span>
                      {getDominanceIcon('strict', true)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStrategy(selectedStrategy === strategy.strategyName ? null : strategy.strategyName)}
                    >
                      {selectedStrategy === strategy.strategyName ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">{strategy.explanation}</p>
                  
                  <div className="mt-2">
                    <span className="text-sm font-medium">Dominates: </span>
                    {strategy.dominatedStrategyNames.map((name, i) => (
                      <Badge key={i} variant="outline" className="ml-1">
                        {name}
                      </Badge>
                    ))}
                  </div>

                  {selectedStrategy === strategy.strategyName && showPayoffDetails && (
                    <div className="mt-4 space-y-2">
                      <h5 className="font-medium">Payoff Comparisons:</h5>
                      {strategy.payoffComparison.map((comp, i) => (
                        <div key={i} className="text-xs bg-white p-2 rounded border">
                          <div className="font-medium">vs {comp.againstStrategyName}:</div>
                          <div className="flex justify-between">
                            <span>Dominant payoffs: [{comp.dominantPayoffs.join(', ')}]</span>
                            <span>Dominated payoffs: [{comp.dominatedPayoffs.join(', ')}]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weakly Dominant Strategies */}
      {analysisResult.weaklyDominantStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Weakly Dominant Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisResult.weaklyDominantStrategies.map((strategy, index) => (
                <div key={index} className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Player {strategy.playerIndex + 1}</Badge>
                    <span className="font-semibold">{strategy.strategyName}</span>
                    {getDominanceIcon('weak', true)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{strategy.explanation}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Dominates: </span>
                    {strategy.dominatedStrategyNames.map((name, i) => (
                      <Badge key={i} variant="outline" className="ml-1">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Dominant Strategies */}
      {analysisResult.strictlyDominantStrategies.length === 0 && analysisResult.weaklyDominantStrategies.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No dominant strategies found. All strategies remain potentially viable depending on opponent behavior.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderDominatedStrategies = () => (
    <div className="space-y-4">
      {/* Strictly Dominated Strategies */}
      {analysisResult.strictlyDominatedStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Strictly Dominated Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisResult.strictlyDominatedStrategies.map((strategy, index) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Player {strategy.playerIndex + 1}</Badge>
                      <span className="font-semibold">{strategy.strategyName}</span>
                      {getDominanceIcon('strict', false)}
                      {strategy.shouldEliminate && <Trash2 className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{strategy.explanation}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Dominated by: </span>
                    {strategy.dominatedByNames.map((name, i) => (
                      <Badge key={i} variant="outline" className="ml-1">
                        {name}
                      </Badge>
                    ))}
                  </div>
                  {strategy.shouldEliminate && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        This strategy should be eliminated from consideration as it is never optimal.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weakly Dominated Strategies */}
      {analysisResult.weaklyDominatedStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Weakly Dominated Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisResult.weaklyDominatedStrategies.map((strategy, index) => (
                <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Player {strategy.playerIndex + 1}</Badge>
                    <span className="font-semibold">{strategy.strategyName}</span>
                    {getDominanceIcon('weak', false)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{strategy.explanation}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Dominated by: </span>
                    {strategy.dominatedByNames.map((name, i) => (
                      <Badge key={i} variant="outline" className="ml-1">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderEliminationProcess = () => {
    if (analysisResult.iterativeElimination.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No strategies were eliminated through iterative dominance. All strategies remain in the final analysis.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Elimination Steps</h3>
          <Badge variant="outline">
            {analysisResult.iterativeElimination.length} steps
          </Badge>
        </div>

        {/* Step Navigation */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedStep === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStep(0)}
          >
            Initial Game
          </Button>
          {analysisResult.iterativeElimination.map((_, index) => (
            <Button
              key={index}
              variant={selectedStep === index + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStep(index + 1)}
            >
              Step {index + 1}
            </Button>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedStep === 0 
                ? "Initial Game State" 
                : `Elimination Step ${selectedStep}`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStep === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Starting with {payoffMatrix.strategies.length} strategies for each player.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {payoffMatrix.strategies.map((strategy, i) => (
                    <Badge key={i} variant="outline">
                      {strategy.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const step = analysisResult.iterativeElimination[selectedStep - 1];
                  return (
                    <>
                      <p className="text-sm text-gray-600">{step.explanation}</p>
                      
                      {/* Eliminated Strategies */}
                      <div>
                        <h5 className="font-medium text-red-600 mb-2">Eliminated:</h5>
                        <div className="space-y-2">
                          {step.eliminatedStrategies.map((elim, i) => (
                            <div key={i} className="bg-red-50 p-2 rounded border border-red-200">
                              <div className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4 text-red-500" />
                                <span className="font-medium">{elim.strategyName}</span>
                                <Badge variant="destructive" size="sm">
                                  Player {elim.playerIndex + 1}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{elim.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remaining Strategies */}
                      <div>
                        <h5 className="font-medium text-green-600 mb-2">Remaining:</h5>
                        <div className="flex gap-2 flex-wrap">
                          {step.remainingStrategies[0].map(stratIndex => (
                            <Badge key={stratIndex} variant="outline" className="bg-green-50">
                              {payoffMatrix.strategies[stratIndex].name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Final Reduced Game */}
        {analysisResult.reducedGame && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Final Reduced Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                After iterative elimination, the following strategies remain viable:
              </p>
              <div className="flex gap-2 flex-wrap">
                {analysisResult.reducedGame.strategies.map((strategy, i) => (
                  <Badge key={i} variant="default" className="bg-green-600">
                    {strategy.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderRecommendations = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Strategic Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analysisResult.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                {index + 1}
              </div>
              <p className="text-sm text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderEducationalTips = () => {
    if (!showEducationalTips) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Educational Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-800">Strict Dominance</h5>
            <p className="text-blue-700">A strategy strictly dominates another if it always provides a better payoff, regardless of opponents' choices.</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <h5 className="font-medium text-green-800">Weak Dominance</h5>
            <p className="text-green-700">A strategy weakly dominates another if it provides at least as good payoffs in all scenarios and better payoffs in at least one scenario.</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <h5 className="font-medium text-purple-800">Iterative Elimination</h5>
            <p className="text-purple-700">Dominated strategies can be eliminated step by step, potentially revealing new dominance relationships in the reduced game.</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dominant">Dominant</TabsTrigger>
          <TabsTrigger value="dominated">Dominated</TabsTrigger>
          <TabsTrigger value="elimination">Elimination</TabsTrigger>
          <TabsTrigger value="recommendations">Advice</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverview()}
          {showEducationalTips && renderEducationalTips()}
        </TabsContent>

        <TabsContent value="dominant" className="space-y-4">
          {renderDominantStrategies()}
        </TabsContent>

        <TabsContent value="dominated" className="space-y-4">
          {renderDominatedStrategies()}
        </TabsContent>

        <TabsContent value="elimination" className="space-y-4">
          {renderEliminationProcess()}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {renderRecommendations()}
          <div className="mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Analysis Summary:</strong> {analysisResult.explanation}
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>

      {/* Debug/Developer Controls */}
      {interactive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Analysis Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPayoffDetails(!showPayoffDetails)}
              >
                {showPayoffDetails ? 'Hide' : 'Show'} Payoff Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 