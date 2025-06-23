import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Target, 
  TrendingDown,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { DominanceAnalyzer, DominanceAnalysisResult } from '@/lib/game-theory/dominance-analyzer';
import { GameTheoryUtils } from '@/lib/game-theory/game-theory-utils';

interface StrategicDominanceChartProps {
  payoffMatrix: number[][][];
  playerNames?: string[];
  strategyNames?: string[][];
  width?: number;
  height?: number;
}

export default function StrategicDominanceChart({
  payoffMatrix,
  playerNames = ['Player 1', 'Player 2'],
  strategyNames,
  width = 800,
  height = 600
}: StrategicDominanceChartProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<{ player: number; strategy: number } | null>(null);
  const [selectedEliminationStep, setSelectedEliminationStep] = useState<number>(0);

  // Generate strategy names if not provided
  const defaultStrategyNames = useMemo(() => {
    if (strategyNames) return strategyNames;
    return payoffMatrix.map((_, playerIndex) =>
      payoffMatrix[playerIndex][0].map((_, strategyIndex) => 
        `${playerNames[playerIndex]} Strategy ${strategyIndex + 1}`
      )
    );
  }, [payoffMatrix, playerNames, strategyNames]);

  // Perform dominance analysis
  const dominanceAnalysis = useMemo(() => {
    const analyzer = new DominanceAnalyzer();
    return analyzer.analyzeDominance(payoffMatrix);
  }, [payoffMatrix]);

  const DominanceIcon = ({ type }: { type: 'strict' | 'weak' }) => (
    type === 'strict' ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
  );

  const StrategyCard = ({ 
    playerIndex, 
    strategyIndex, 
    isSelected, 
    onClick 
  }: { 
    playerIndex: number; 
    strategyIndex: number; 
    isSelected: boolean; 
    onClick: () => void; 
  }) => {
    const isDominant = dominanceAnalysis.dominantStrategies.some(
      ds => ds.player === playerIndex && ds.strategy === strategyIndex
    );
    const isDominated = dominanceAnalysis.dominatedStrategies.some(
      ds => ds.player === playerIndex && ds.strategy === strategyIndex
    );
    const dominantInfo = dominanceAnalysis.dominantStrategies.find(
      ds => ds.player === playerIndex && ds.strategy === strategyIndex
    );
    const dominatedInfo = dominanceAnalysis.dominatedStrategies.find(
      ds => ds.player === playerIndex && ds.strategy === strategyIndex
    );

    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isDominant ? 'border-green-500' : isDominated ? 'border-red-500' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {defaultStrategyNames[playerIndex][strategyIndex]}
            </span>
            <div className="flex gap-1">
              {isDominant && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <DominanceIcon type={dominantInfo?.type || 'strict'} />
                  <span className="ml-1">Dominant</span>
                </Badge>
              )}
              {isDominated && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <XCircle className="h-4 w-4" />
                  <span className="ml-1">Dominated</span>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Dominance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Dominant Strategies</span>
                <Badge variant="default">
                  {dominanceAnalysis.dominantStrategies.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Dominated Strategies</span>
                <Badge variant="destructive">
                  {dominanceAnalysis.dominatedStrategies.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Elimination Steps</span>
                <Badge variant="outline">
                  {dominanceAnalysis.eliminationSteps.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Analysis Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dominanceAnalysis.hasDominantStrategies && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This game has dominant strategies that provide clear optimal choices.
                  </AlertDescription>
                </Alert>
              )}
              {dominanceAnalysis.canSimplifyByElimination && (
                <Alert>
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    The game can be simplified through elimination of dominated strategies.
                  </AlertDescription>
                </Alert>
              )}
              {!dominanceAnalysis.hasDominantStrategies && !dominanceAnalysis.canSimplifyByElimination && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No clear dominant strategies found. Players need mixed strategy analysis.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playerNames.map((playerName, playerIndex) => (
              <div key={playerIndex}>
                <h4 className="font-medium mb-2">{playerName}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {defaultStrategyNames[playerIndex].map((_, strategyIndex) => (
                    <StrategyCard
                      key={strategyIndex}
                      playerIndex={playerIndex}
                      strategyIndex={strategyIndex}
                      isSelected={selectedStrategy?.player === playerIndex && selectedStrategy?.strategy === strategyIndex}
                      onClick={() => setSelectedStrategy({ player: playerIndex, strategy: strategyIndex })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DominantStrategiesTab = () => (
    <div className="space-y-4">
      {dominanceAnalysis.dominantStrategies.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No dominant strategies found in this game.
          </AlertDescription>
        </Alert>
      ) : (
        dominanceAnalysis.dominantStrategies.map((strategy, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DominanceIcon type={strategy.type} />
                {strategy.type === 'strict' ? 'Strictly' : 'Weakly'} Dominant Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <strong>Player:</strong> {playerNames[strategy.player]}
                </div>
                <div>
                  <strong>Strategy:</strong> {defaultStrategyNames[strategy.player][strategy.strategy]}
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <strong>Explanation:</strong>
                  <p className="mt-1 text-sm">{strategy.explanation}</p>
                </div>
                {strategy.payoffComparisons && strategy.payoffComparisons.length > 0 && (
                  <div>
                    <strong>Payoff Comparisons:</strong>
                    <div className="mt-2 space-y-2">
                      {strategy.payoffComparisons.map((comparison, compIndex) => (
                        <div key={compIndex} className="text-sm bg-blue-50 p-2 rounded">
                          vs {defaultStrategyNames[strategy.player][comparison.otherStrategy]}: 
                          {comparison.scenarios.map((scenario, scenIndex) => (
                            <div key={scenIndex} className="ml-2">
                              {scenario.description}: {scenario.payoffDifference > 0 ? '+' : ''}{scenario.payoffDifference.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const DominatedStrategiesTab = () => (
    <div className="space-y-4">
      {dominanceAnalysis.dominatedStrategies.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No dominated strategies found in this game.
          </AlertDescription>
        </Alert>
      ) : (
        dominanceAnalysis.dominatedStrategies.map((strategy, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                {strategy.type === 'strict' ? 'Strictly' : 'Weakly'} Dominated Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <strong>Player:</strong> {playerNames[strategy.player]}
                </div>
                <div>
                  <strong>Strategy:</strong> {defaultStrategyNames[strategy.player][strategy.strategy]}
                </div>
                <div>
                  <strong>Dominated by:</strong> {defaultStrategyNames[strategy.player][strategy.dominatedBy]}
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <strong>Explanation:</strong>
                  <p className="mt-1 text-sm">{strategy.explanation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const EliminationTab = () => (
    <div className="space-y-4">
      {dominanceAnalysis.eliminationSteps.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No iterative elimination steps possible for this game.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <span className="font-medium">Elimination Step:</span>
            <div className="flex gap-2">
              {dominanceAnalysis.eliminationSteps.map((_, index) => (
                <Button
                  key={index}
                  variant={selectedEliminationStep === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEliminationStep(index)}
                >
                  Step {index + 1}
                </Button>
              ))}
            </div>
          </div>

          {dominanceAnalysis.eliminationSteps[selectedEliminationStep] && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Step {selectedEliminationStep + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <strong>Player:</strong> {playerNames[dominanceAnalysis.eliminationSteps[selectedEliminationStep].player]}
                  </div>
                  <div>
                    <strong>Eliminated Strategy:</strong> {
                      defaultStrategyNames[dominanceAnalysis.eliminationSteps[selectedEliminationStep].player][
                        dominanceAnalysis.eliminationSteps[selectedEliminationStep].eliminatedStrategy
                      ]
                    }
                  </div>
                  <div>
                    <strong>Reason:</strong> {dominanceAnalysis.eliminationSteps[selectedEliminationStep].reason}
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <strong>Remaining Strategies:</strong>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {dominanceAnalysis.eliminationSteps[selectedEliminationStep].remainingStrategies.map(
                        (playerStrategies, playerIndex) => (
                          <div key={playerIndex}>
                            <div className="font-medium">{playerNames[playerIndex]}:</div>
                            <div className="text-sm">
                              {playerStrategies.map(stratIndex => 
                                defaultStrategyNames[playerIndex][stratIndex]
                              ).join(', ')}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );

  const AdviceTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dominanceAnalysis.recommendations.map((recommendation, index) => (
              <Alert key={index}>
                <Info className="h-4 w-4" />
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Educational Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Strictly Dominant Strategy:</strong> A strategy that always provides better payoffs 
              than any other strategy, regardless of what opponents do.
            </div>
            <div>
              <strong>Weakly Dominant Strategy:</strong> A strategy that provides at least as good payoffs 
              as any other strategy, and strictly better in at least one scenario.
            </div>
            <div>
              <strong>Iterative Elimination:</strong> The process of repeatedly removing dominated strategies 
              to simplify the game and potentially find equilibria.
            </div>
            <div>
              <strong>Rational Play:</strong> Players should never play strictly dominated strategies, 
              as they can always do better by switching.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full" style={{ width, height }}>
      <Card>
        <CardHeader>
          <CardTitle>Strategic Dominance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="dominant">Dominant</TabsTrigger>
              <TabsTrigger value="dominated">Dominated</TabsTrigger>
              <TabsTrigger value="elimination">Elimination</TabsTrigger>
              <TabsTrigger value="advice">Advice</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <OverviewTab />
            </TabsContent>
            
            <TabsContent value="dominant" className="mt-6">
              <DominantStrategiesTab />
            </TabsContent>
            
            <TabsContent value="dominated" className="mt-6">
              <DominatedStrategiesTab />
            </TabsContent>
            
            <TabsContent value="elimination" className="mt-6">
              <EliminationTab />
            </TabsContent>
            
            <TabsContent value="advice" className="mt-6">
              <AdviceTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 