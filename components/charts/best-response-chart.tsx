'use client';

import React, { useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { BaseChart, BaseChartRef, defaultChartTheme } from './base-chart';
import { ChartConfig } from '@/lib/visualization-types';
import { BestResponseAnalyzer, BestResponseAnalysisResult, BestResponseVisualizationData } from '@/lib/best-response-analyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface BestResponseChartProps {
  payoffMatrix: number[][][];
  strategies: string[];
  config?: Partial<ChartConfig>;
  className?: string;
  interactive?: boolean;
  showIntersections?: boolean;
  showPayoffContours?: boolean;
  resolution?: number;
  onNashEquilibriumSelect?: (equilibrium: any) => void;
}

interface InteractiveBestResponseState {
  player1Strategy: number[];
  player2Strategy: number[];
  selectedPayoffMatrix: number[][][];
  hoveredPoint: { x: number; y: number; player: number; payoff: number } | null;
  selectedNashEquilibrium: any | null;
}

export const BestResponseChart: React.FC<BestResponseChartProps> = ({
  payoffMatrix,
  strategies,
  config = {},
  className,
  interactive = true,
  showIntersections = true,
  showPayoffContours = false,
  resolution = 50,
  onNashEquilibriumSelect,
}) => {
  const [state, setState] = useState<InteractiveBestResponseState>({
    player1Strategy: [1, 0],
    player2Strategy: [1, 0],
    selectedPayoffMatrix: payoffMatrix,
    hoveredPoint: null,
    selectedNashEquilibrium: null,
  });

  const [payoffAdjustments, setPayoffAdjustments] = useState<{
    [key: string]: number;
  }>({});

  // Create analyzer and generate analysis
  const analysisResult = useMemo(() => {
    try {
      const analyzer = new BestResponseAnalyzer(state.selectedPayoffMatrix, strategies);
      return analyzer.generateBestResponseAnalysis(resolution);
    } catch (error) {
      console.error('Best response analysis failed:', error);
      return null;
    }
  }, [state.selectedPayoffMatrix, strategies, resolution]);

  // Generate visualization data
  const visualizationData = useMemo(() => {
    if (!analysisResult) return null;
    try {
      const analyzer = new BestResponseAnalyzer(state.selectedPayoffMatrix, strategies);
      return analyzer.generateVisualizationData(resolution);
    } catch (error) {
      console.error('Visualization data generation failed:', error);
      return null;
    }
  }, [state.selectedPayoffMatrix, strategies, resolution, analysisResult]);

  // Chart configuration
  const chartConfig: ChartConfig = {
    width: 700,
    height: 500,
    margin: { top: 40, right: 40, bottom: 60, left: 60 },
    theme: {
      ...defaultChartTheme,
      colors: [
        '#3b82f6', // Player 1 - Blue
        '#ef4444', // Player 2 - Red
        '#10b981', // Nash Equilibria - Green
        '#f59e0b', // Highlighted points - Amber
      ],
    },
    ...config,
  };

  // D3 render function for best response chart
  const renderBestResponseChart = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: any, props: any) => {
      if (!visualizationData || !analysisResult) return;

      const { width, height, margin } = props;
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Clear previous content
      svg.selectAll('*').remove();

      // Create main group
      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Set up scales
      const xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0]);

      // Add grid
      const xAxis = d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat(() => '');
      const yAxis = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '');

      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('line')
        .style('stroke', chartConfig.theme?.gridColor || '#e5e7eb')
        .style('stroke-width', 0.5);

      g.append('g')
        .attr('class', 'grid')
        .call(yAxis)
        .selectAll('line')
        .style('stroke', chartConfig.theme?.gridColor || '#e5e7eb')
        .style('stroke-width', 0.5);

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .style('color', chartConfig.theme?.axisColor || '#6b7280');

      g.append('g')
        .call(d3.axisLeft(yScale))
        .style('color', chartConfig.theme?.axisColor || '#6b7280');

      // Add axis labels
      g.append('text')
        .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 10})`)
        .style('text-anchor', 'middle')
        .style('fill', chartConfig.theme?.textColor || '#374151')
        .style('font-size', '14px')
        .text('Player 2 Strategy Probability');

      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left + 15)
        .attr('x', 0 - (innerHeight / 2))
        .style('text-anchor', 'middle')
        .style('fill', chartConfig.theme?.textColor || '#374151')
        .style('font-size', '14px')
        .text('Player 1 Strategy Probability');

      // Draw payoff contours if enabled
      if (showPayoffContours && visualizationData.payoffContours) {
        visualizationData.payoffContours.forEach((playerContours, playerIndex) => {
          const color = chartConfig.theme?.colors?.[playerIndex] || '#999';
          
          playerContours.contours.forEach((contour, i) => {
            const line = d3.line<{ x: number; y: number }>()
              .x(d => xScale(d.x))
              .y(d => yScale(d.y))
              .curve(d3.curveCardinal);

            g.append('path')
              .datum(contour.points)
              .attr('fill', 'none')
              .attr('stroke', color)
              .attr('stroke-width', 1)
              .attr('stroke-opacity', 0.3)
              .attr('d', line);
          });
        });
      }

      // Draw best response functions
      if (visualizationData.player1Responses) {
        const line = d3.line<{ x: number; y: number; isOptimal: boolean }>()
          .x(d => xScale(d.x))
          .y(d => yScale(d.y));

        // Player 1 best response
        g.append('path')
          .datum(visualizationData.player1Responses.filter(d => d.isOptimal))
          .attr('fill', 'none')
          .attr('stroke', chartConfig.theme?.colors?.[0] || '#3b82f6')
          .attr('stroke-width', 3)
          .attr('d', line);

        // Player 2 best response
        g.append('path')
          .datum(visualizationData.player2Responses.filter(d => d.isOptimal))
          .attr('fill', 'none')
          .attr('stroke', chartConfig.theme?.colors?.[1] || '#ef4444')
          .attr('stroke-width', 3)
          .attr('d', line);
      }

      // Draw Nash equilibria intersections
      if (showIntersections && visualizationData.nashEquilibria) {
        const nashPoints = g.selectAll('.nash-point')
          .data(visualizationData.nashEquilibria)
          .enter()
          .append('circle')
          .attr('class', 'nash-point')
          .attr('cx', d => xScale(d.x))
          .attr('cy', d => yScale(d.y))
          .attr('r', d => d.type === 'pure' ? 8 : 6)
          .attr('fill', chartConfig.theme?.colors?.[2] || '#10b981')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .style('cursor', interactive ? 'pointer' : 'default');

        // Add interaction for Nash equilibria
        if (interactive) {
          nashPoints
            .on('mouseover', function(event, d) {
              d3.select(this).attr('r', d.type === 'pure' ? 10 : 8);
              
              // Show tooltip
              const tooltip = g.append('g')
                .attr('class', 'tooltip')
                .attr('transform', `translate(${xScale(d.x) + 10}, ${yScale(d.y) - 10})`);

              const rect = tooltip.append('rect')
                .attr('fill', 'rgba(0,0,0,0.8)')
                .attr('rx', 4)
                .attr('ry', 4);

              const text = tooltip.append('text')
                .attr('fill', 'white')
                .attr('font-size', '12px')
                .attr('x', 8)
                .attr('y', 16)
                .text(`${d.type === 'pure' ? 'Pure' : 'Mixed'} Nash Equilibrium`);

              const bbox = text.node()?.getBBox();
              if (bbox) {
                rect.attr('width', bbox.width + 16)
                    .attr('height', bbox.height + 8);
              }
            })
            .on('mouseout', function(event, d) {
              d3.select(this).attr('r', d.type === 'pure' ? 8 : 6);
              g.select('.tooltip').remove();
            })
            .on('click', function(event, d) {
              setState(prev => ({ ...prev, selectedNashEquilibrium: d }));
              onNashEquilibriumSelect?.(d);
            });
        }
      }

      // Add legend
      const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth - 150}, 20)`);

      const legendItems = [
        { label: 'Player 1 Best Response', color: chartConfig.theme?.colors?.[0] || '#3b82f6' },
        { label: 'Player 2 Best Response', color: chartConfig.theme?.colors?.[1] || '#ef4444' },
        { label: 'Nash Equilibria', color: chartConfig.theme?.colors?.[2] || '#10b981' },
      ];

      legendItems.forEach((item, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 20})`);

        legendItem.append('line')
          .attr('x1', 0)
          .attr('x2', 15)
          .attr('stroke', item.color)
          .attr('stroke-width', i < 2 ? 3 : 0);

        if (i === 2) {
          legendItem.append('circle')
            .attr('cx', 7.5)
            .attr('cy', 0)
            .attr('r', 4)
            .attr('fill', item.color);
        }

        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 4)
          .style('font-size', '12px')
          .style('fill', chartConfig.theme?.textColor || '#374151')
          .text(item.label);
      });
    },
    [visualizationData, analysisResult, interactive, showIntersections, showPayoffContours, chartConfig, onNashEquilibriumSelect]
  );

  // Handle payoff matrix adjustments
  const handlePayoffAdjustment = useCallback((row: number, col: number, player: number, value: number) => {
    const key = `${row}-${col}-${player}`;
    setPayoffAdjustments(prev => ({ ...prev, [key]: value }));
    
    const newMatrix = state.selectedPayoffMatrix.map((r, i) =>
      r.map((c, j) =>
        c.map((p, k) => {
          if (i === row && j === col && k === player) {
            return value;
          }
          return p;
        })
      )
    );
    
    setState(prev => ({ ...prev, selectedPayoffMatrix: newMatrix }));
  }, [state.selectedPayoffMatrix]);

  if (!analysisResult || !visualizationData) {
    return (
      <Alert className={className}>
        <AlertDescription>
          Unable to generate best response analysis. Please check the payoff matrix format.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Best Response Analysis</CardTitle>
          <CardDescription>
            Interactive visualization showing best response functions and Nash equilibria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">Visualization</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              <BaseChart
                data={visualizationData}
                renderFunction={renderBestResponseChart}
                config={chartConfig}
                className="w-full"
              />
              
              {state.selectedNashEquilibrium && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-800">
                        Selected Nash Equilibrium
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Type:</span>{' '}
                          <Badge variant={state.selectedNashEquilibrium.type === 'pure' ? 'default' : 'secondary'}>
                            {state.selectedNashEquilibrium.type}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Stability:</span>{' '}
                          {(state.selectedNashEquilibrium.stability * 100).toFixed(1)}%
                        </div>
                        <div>
                          <span className="font-medium">Player 1 Strategy:</span>{' '}
                          {state.selectedNashEquilibrium.x.toFixed(3)}
                        </div>
                        <div>
                          <span className="font-medium">Player 2 Strategy:</span>{' '}
                          {state.selectedNashEquilibrium.y.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nash Equilibria Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.intersections.length > 0 ? (
                      <div className="space-y-3">
                        {analysisResult.intersections.map((eq, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={eq.type === 'pure' ? 'default' : 'secondary'}>
                                {eq.type} Strategy
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Stability: {(eq.stability * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>Player 1: {eq.strategies[0]?.toFixed(3) || 'N/A'}</div>
                              <div>Player 2: {eq.strategies[1]?.toFixed(3) || 'N/A'}</div>
                              <div>Payoffs: [{eq.payoffs.map(p => p.toFixed(2)).join(', ')}]</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No Nash equilibria found</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dominant Strategies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.dominantStrategies.length > 0 ? (
                      <div className="space-y-2">
                        {analysisResult.dominantStrategies.map((ds, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span>Player {ds.player + 1}</span>
                            <div className="text-right">
                              <div className="font-medium">{strategies[ds.strategy]}</div>
                              <Badge variant="outline" className="text-xs">
                                {ds.type}ly dominant
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No dominant strategies found</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {analysisResult.iterativeElimination.rounds.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Iterative Elimination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.iterativeElimination.rounds.map((round, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium mb-2">Round {round.round}</div>
                          <div className="text-sm text-muted-foreground">
                            Eliminated: Player {round.eliminatedStrategy.player + 1} - {strategies[round.eliminatedStrategy.strategy]}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {round.eliminatedStrategy.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="controls" className="space-y-4">
              {interactive && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Interactive Controls</CardTitle>
                    <CardDescription>
                      Adjust payoff values to see how they affect best responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      {payoffMatrix.map((row, i) =>
                        row.map((col, j) => (
                          <div key={`${i}-${j}`} className="space-y-3">
                            <h4 className="font-medium">
                              {strategies[i]} vs {strategies[j]}
                            </h4>
                            {col.map((payoff, k) => (
                              <div key={k} className="space-y-2">
                                <label className="text-sm font-medium">
                                  Player {k + 1} Payoff: {payoffAdjustments[`${i}-${j}-${k}`] ?? payoff}
                                </label>
                                <Slider
                                  value={[payoffAdjustments[`${i}-${j}-${k}`] ?? payoff]}
                                  onValueChange={([value]) => handlePayoffAdjustment(i, j, k, value)}
                                  min={-10}
                                  max={10}
                                  step={0.1}
                                  className="w-full"
                                />
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPayoffAdjustments({});
                          setState(prev => ({ ...prev, selectedPayoffMatrix: payoffMatrix }));
                        }}
                      >
                        Reset Payoffs
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setState(prev => ({ 
                          ...prev, 
                          selectedNashEquilibrium: null 
                        }))}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Display Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showIntersections}
                        onChange={(e) => {
                          // This would need to be managed by parent component
                          console.log('Toggle intersections:', e.target.checked);
                        }}
                      />
                      <span>Show Nash Equilibria</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showPayoffContours}
                        onChange={(e) => {
                          // This would need to be managed by parent component
                          console.log('Toggle contours:', e.target.checked);
                        }}
                      />
                      <span>Show Payoff Contours</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BestResponseChart; 