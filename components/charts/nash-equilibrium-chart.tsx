'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import BaseChart, { BaseChartRef } from './base-chart';
import { D3RenderFunction } from '@/hooks/use-d3';
import { StrategySpaceData, NashEquilibriumPoint, BestResponseFunction, DominatedRegion, ScatterPlotConfig } from '@/lib/visualization-types';
import { defaultChartTheme } from './base-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, Zap, Eye, Settings } from 'lucide-react';

interface NashEquilibriumChartProps {
  data: StrategySpaceData;
  config?: Partial<ScatterPlotConfig>;
  showBestResponse?: boolean;
  showDominatedRegions?: boolean;
  showConvergencePaths?: boolean;
  interactive?: boolean;
  onEquilibriumClick?: (equilibrium: NashEquilibriumPoint) => void;
  onStrategyHover?: (strategy: [number, number]) => void;
  className?: string;
}

interface ViewState {
  showPureEquilibria: boolean;
  showMixedEquilibria: boolean;
  showBestResponse: boolean;
  showDominatedRegions: boolean;
  showPayoffContours: boolean;
  highlightStability: boolean;
  animateConvergence: boolean;
  selectedPlayer: number;
}

const createNashEquilibriumRenderFunction = (
  viewState: ViewState,
  interactionHandlers?: {
    onEquilibriumClick?: (equilibrium: NashEquilibriumPoint) => void;
    onStrategyHover?: (strategy: [number, number]) => void;
  }
): D3RenderFunction<StrategySpaceData> => {
  return (svg, data, props) => {
    const { width, height, margin } = props;
    
    if (!width || !height || !margin) return;
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.bottom - margin.top;

    // Create scales (strategy probabilities are 0-1)
    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add background
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', defaultChartTheme.background)
      .attr('stroke', defaultChartTheme.gridColor)
      .attr('stroke-width', 1);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format('.1f'))
      .ticks(5);
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format('.1f'))
      .ticks(5);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(xScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', xScale)
      .attr('x2', xScale)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', defaultChartTheme.gridColor)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.7);

    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale)
      .attr('y2', yScale)
      .attr('stroke', defaultChartTheme.gridColor)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.7);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    g.append('g')
      .call(yAxis);

    // Add axis labels
    const player1Strategy = data.strategies[0]?.name || 'Strategy 1';
    const player2Strategy = data.strategies[0]?.name || 'Strategy 1';

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', defaultChartTheme.textColor)
      .text(`Player 1: P(${player1Strategy})`);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', defaultChartTheme.textColor)
      .text(`Player 2: P(${player2Strategy})`);

    // Draw dominated strategy regions
    if (viewState.showDominatedRegions && data.dominatedRegions) {
      data.dominatedRegions.forEach((region, index) => {
        const pathData = region.vertices.map((vertex, i) => 
          `${i === 0 ? 'M' : 'L'} ${xScale(vertex.x)} ${yScale(vertex.y)}`
        ).join(' ') + ' Z';

        g.append('path')
          .attr('class', `dominated-region-${index}`)
          .attr('d', pathData)
          .attr('fill', region.type === 'strictly' ? '#ef4444' : '#f59e0b')
          .attr('opacity', 0.2)
          .attr('stroke', region.type === 'strictly' ? '#dc2626' : '#d97706')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', region.type === 'strictly' ? 'none' : '5,5');

        // Add region label
        const centroid = region.vertices.reduce(
          (acc, vertex) => ({
            x: acc.x + vertex.x / region.vertices.length,
            y: acc.y + vertex.y / region.vertices.length
          }),
          { x: 0, y: 0 }
        );

        g.append('text')
          .attr('x', xScale(centroid.x))
          .attr('y', yScale(centroid.y))
          .attr('text-anchor', 'middle')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .style('fill', region.type === 'strictly' ? '#dc2626' : '#d97706')
          .text(region.type === 'strictly' ? 'Strictly Dominated' : 'Weakly Dominated');
      });
    }

    // Draw best response functions
    if (viewState.showBestResponse && data.bestResponseFunctions) {
      data.bestResponseFunctions.forEach((responseFunc, index) => {
        const line = d3.line<{x: number, y: number}>()
          .x(d => xScale(d.x))
          .y(d => yScale(d.y))
          .curve(d3.curveLinear);

        g.append('path')
          .datum(responseFunc.points)
          .attr('class', `best-response-${responseFunc.playerId}`)
          .attr('fill', 'none')
          .attr('stroke', responseFunc.color)
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '10,5')
          .attr('opacity', 0.8)
          .attr('d', line);

        // Add function label
        const midpoint = responseFunc.points[Math.floor(responseFunc.points.length / 2)];
        g.append('text')
          .attr('x', xScale(midpoint.x) + 10)
          .attr('y', yScale(midpoint.y) - 5)
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .style('fill', responseFunc.color)
          .text(`BR${responseFunc.playerId.slice(-1)}(·)`);
      });
    }

    // Create payoff contour lines (simplified)
    if (viewState.showPayoffContours) {
      const contourData = [];
      const resolution = 20;
      
      for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
          const x = i / resolution;
          const y = j / resolution;
          // Simplified payoff calculation for demonstration
          const payoff1 = 3 * x * y + 1 * x * (1 - y) + 0 * (1 - x) * y + 1 * (1 - x) * (1 - y);
          const payoff2 = 3 * x * y + 0 * x * (1 - y) + 1 * (1 - x) * y + 1 * (1 - x) * (1 - y);
          contourData.push({ x, y, payoff1, payoff2, totalPayoff: payoff1 + payoff2 });
        }
      }

      // Create contour generator
      const contours = d3.contours()
        .size([resolution + 1, resolution + 1])
        .thresholds(5);

      const values = contourData.map(d => d.totalPayoff);
      const contourPaths = contours(values);

      contourPaths.forEach((contour, index) => {
        const pathString = d3.geoPath()(contour);
        if (pathString) {
          g.append('path')
            .attr('class', `payoff-contour-${index}`)
            .attr('d', pathString)
            .attr('fill', 'none')
            .attr('stroke', '#6b7280')
            .attr('stroke-width', 1)
            .attr('opacity', 0.3)
            .attr('transform', `scale(${innerWidth / resolution}, ${innerHeight / resolution})`);
        }
      });
    }

    // Draw Nash equilibria
    const equilibriaToShow = data.equilibria.filter(eq => {
      if (eq.type === 'pure' && !viewState.showPureEquilibria) return false;
      if (eq.type === 'mixed' && !viewState.showMixedEquilibria) return false;
      return true;
    });

    equilibriaToShow.forEach((equilibrium, index) => {
      const radius = equilibrium.type === 'pure' ? 8 : 12;
      const strokeWidth = viewState.highlightStability 
        ? Math.max(2, equilibrium.stability * 6) 
        : 2;

      // Draw equilibrium point
      const circle = g.append('circle')
        .attr('class', `nash-equilibrium-${equilibrium.type}-${index}`)
        .attr('cx', xScale(equilibrium.x))
        .attr('cy', yScale(equilibrium.y))
        .attr('r', radius)
        .attr('fill', equilibrium.type === 'pure' ? '#3b82f6' : '#ef4444')
        .attr('stroke', equilibrium.type === 'pure' ? '#1d4ed8' : '#dc2626')
        .attr('stroke-width', strokeWidth)
        .attr('opacity', 0.8)
        .style('cursor', 'pointer');

      // Add hover effects
      circle
        .on('mouseover', function(event, d) {
          // Highlight equilibrium
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', radius + 3)
            .attr('opacity', 1);

          // Show detailed tooltip
          const tooltip = g.append('g')
            .attr('id', 'equilibrium-tooltip')
            .attr('transform', `translate(${xScale(equilibrium.x) + 15}, ${yScale(equilibrium.y) - 15})`);

          const tooltipBg = tooltip.append('rect')
            .attr('x', -5)
            .attr('y', -35)
            .attr('rx', 3)
            .attr('fill', 'rgba(0, 0, 0, 0.9)')
            .attr('stroke', equilibrium.type === 'pure' ? '#1d4ed8' : '#dc2626')
            .attr('stroke-width', 1);

          const tooltipText = tooltip.append('text')
            .attr('fill', 'white')
            .style('font-size', '11px');

          tooltipText.append('tspan')
            .attr('x', 0)
            .attr('y', -25)
            .style('font-weight', 'bold')
            .text(`${equilibrium.type === 'pure' ? 'Pure' : 'Mixed'} Nash Equilibrium`);

          tooltipText.append('tspan')
            .attr('x', 0)
            .attr('y', -15)
            .text(`Strategy: (${equilibrium.x.toFixed(3)}, ${equilibrium.y.toFixed(3)})`);

          tooltipText.append('tspan')
            .attr('x', 0)
            .attr('y', -5)
            .text(`Payoffs: (${equilibrium.payoffs.player1?.toFixed(2) || 'N/A'}, ${equilibrium.payoffs.player2?.toFixed(2) || 'N/A'})`);

          tooltipText.append('tspan')
            .attr('x', 0)
            .attr('y', 5)
            .text(`Stability: ${(equilibrium.stability * 100).toFixed(1)}%`);

          // Adjust background size
          const bbox = tooltipText.node()?.getBBox();
          if (bbox) {
            tooltipBg
              .attr('width', bbox.width + 10)
              .attr('height', bbox.height + 10);
          }

          // Call external hover handler
          interactionHandlers?.onStrategyHover?.([equilibrium.x, equilibrium.y]);
        })
        .on('mouseout', function() {
          // Reset equilibrium
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', radius)
            .attr('opacity', 0.8);

          // Remove tooltip
          g.select('#equilibrium-tooltip').remove();
        })
        .on('click', function(event, d) {
          interactionHandlers?.onEquilibriumClick?.(equilibrium);
        });

      // Add equilibrium label
      g.append('text')
        .attr('x', xScale(equilibrium.x))
        .attr('y', yScale(equilibrium.y) - radius - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('font-weight', 'bold')
        .style('fill', equilibrium.type === 'pure' ? '#1d4ed8' : '#dc2626')
        .text(`NE${index + 1}`);

      // Add stability indicator if enabled
      if (viewState.highlightStability) {
        const stabilityRadius = radius + 8;
        g.append('circle')
          .attr('class', `stability-indicator-${index}`)
          .attr('cx', xScale(equilibrium.x))
          .attr('cy', yScale(equilibrium.y))
          .attr('r', stabilityRadius)
          .attr('fill', 'none')
          .attr('stroke', d3.interpolateRdYlGn(equilibrium.stability))
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '5,3')
          .attr('opacity', 0.6);
      }
    });

    // Add interactive strategy space overlay
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const strategyX = xScale.invert(mouseX);
        const strategyY = yScale.invert(mouseY);
        
        if (strategyX >= 0 && strategyX <= 1 && strategyY >= 0 && strategyY <= 1) {
          // Remove previous crosshair
          g.selectAll('.crosshair').remove();
          
          // Add crosshair
          g.append('line')
            .attr('class', 'crosshair')
            .attr('x1', mouseX)
            .attr('x2', mouseX)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', '#6b7280')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.5);

          g.append('line')
            .attr('class', 'crosshair')
            .attr('x1', 0)
            .attr('x2', innerWidth)
            .attr('y1', mouseY)
            .attr('y2', mouseY)
            .attr('stroke', '#6b7280')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('opacity', 0.5);

          // Add strategy coordinates
          g.append('text')
            .attr('class', 'crosshair')
            .attr('x', mouseX + 5)
            .attr('y', mouseY - 5)
            .style('font-size', '10px')
            .style('fill', '#374151')
            .style('font-weight', 'bold')
            .text(`(${strategyX.toFixed(3)}, ${strategyY.toFixed(3)})`);

          // Call external hover handler
          interactionHandlers?.onStrategyHover?.([strategyX, strategyY]);
        }
      })
      .on('mouseleave', function() {
        g.selectAll('.crosshair').remove();
      });

    // Add corner labels for pure strategies
    const strategies = data.strategies || [
      { name: 'Strategy 1', shortName: 'S1' },
      { name: 'Strategy 2', shortName: 'S2' }
    ];

    // Corner strategy labels
    const corners = [
      { x: 0, y: 0, label: `(${strategies[1]?.shortName || 'S2'}, ${strategies[1]?.shortName || 'S2'})` },
      { x: 1, y: 0, label: `(${strategies[0]?.shortName || 'S1'}, ${strategies[1]?.shortName || 'S2'})` },
      { x: 0, y: 1, label: `(${strategies[1]?.shortName || 'S2'}, ${strategies[0]?.shortName || 'S1'})` },
      { x: 1, y: 1, label: `(${strategies[0]?.shortName || 'S1'}, ${strategies[0]?.shortName || 'S1'})` }
    ];

    corners.forEach(corner => {
      g.append('text')
        .attr('x', xScale(corner.x) + (corner.x === 0 ? 5 : -5))
        .attr('y', yScale(corner.y) + (corner.y === 0 ? 15 : -5))
        .attr('text-anchor', corner.x === 0 ? 'start' : 'end')
        .style('font-size', '10px')
        .style('fill', '#6b7280')
        .style('font-weight', 'bold')
        .text(corner.label);
    });

    // Add title
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', defaultChartTheme.textColor)
      .text('Strategy Space & Nash Equilibria');
  };
};

export const NashEquilibriumChart: React.FC<NashEquilibriumChartProps> = ({
  data,
  config = {},
  showBestResponse = true,
  showDominatedRegions = true,
  showConvergencePaths = false,
  interactive = true,
  onEquilibriumClick,
  onStrategyHover,
  className
}) => {
  const chartRef = useRef<BaseChartRef>(null);
  
  const [viewState, setViewState] = useState<ViewState>({
    showPureEquilibria: true,
    showMixedEquilibria: true,
    showBestResponse,
    showDominatedRegions,
    showPayoffContours: false,
    highlightStability: true,
    animateConvergence: showConvergencePaths,
    selectedPlayer: 1
  });

  // Memoized render function
  const renderFunction = useMemo(() => {
    return createNashEquilibriumRenderFunction(
      viewState,
      { onEquilibriumClick, onStrategyHover }
    );
  }, [viewState, onEquilibriumClick, onStrategyHover]);

  // Chart configuration
  const chartConfig: Partial<ScatterPlotConfig> = {
    width: 600,
    height: 600,
    margin: { top: 40, right: 40, bottom: 60, left: 60 },
    responsive: true,
    showGrid: true,
    interactive,
    ...config
  };

  const pureEquilibria = data.equilibria.filter(eq => eq.type === 'pure');
  const mixedEquilibria = data.equilibria.filter(eq => eq.type === 'mixed');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Nash Equilibrium Analysis
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50">
                {pureEquilibria.length} pure
              </Badge>
              <Badge variant="outline" className="bg-red-50">
                {mixedEquilibria.length} mixed
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="display" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="interaction">Interaction</TabsTrigger>
            </TabsList>
            
            <TabsContent value="display" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Equilibria Types:</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={viewState.showPureEquilibria}
                        onCheckedChange={(checked) => setViewState(prev => ({ ...prev, showPureEquilibria: checked }))}
                        id="pure-equilibria"
                      />
                      <Label htmlFor="pure-equilibria" className="text-sm">Pure Equilibria</Label>
                      <Badge variant="outline" className="bg-blue-50">{pureEquilibria.length}</Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={viewState.showMixedEquilibria}
                        onCheckedChange={(checked) => setViewState(prev => ({ ...prev, showMixedEquilibria: checked }))}
                        id="mixed-equilibria"
                      />
                      <Label htmlFor="mixed-equilibria" className="text-sm">Mixed Equilibria</Label>
                      <Badge variant="outline" className="bg-red-50">{mixedEquilibria.length}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Overlays:</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={viewState.showBestResponse}
                        onCheckedChange={(checked) => setViewState(prev => ({ ...prev, showBestResponse: checked }))}
                        id="best-response"
                      />
                      <Label htmlFor="best-response" className="text-sm">Best Response</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={viewState.showDominatedRegions}
                        onCheckedChange={(checked) => setViewState(prev => ({ ...prev, showDominatedRegions: checked }))}
                        id="dominated-regions"
                      />
                      <Label htmlFor="dominated-regions" className="text-sm">Dominated Regions</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={viewState.showPayoffContours}
                        onCheckedChange={(checked) => setViewState(prev => ({ ...prev, showPayoffContours: checked }))}
                        id="payoff-contours"
                      />
                      <Label htmlFor="payoff-contours" className="text-sm">Payoff Contours</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={viewState.highlightStability}
                  onCheckedChange={(checked) => setViewState(prev => ({ ...prev, highlightStability: checked }))}
                  id="highlight-stability"
                />
                <Label htmlFor="highlight-stability" className="text-sm">Highlight Stability</Label>
              </div>
              
              {/* Equilibrium details table */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Equilibrium Details:</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Strategy</th>
                        <th className="px-3 py-2 text-left">Payoffs</th>
                        <th className="px-3 py-2 text-left">Stability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.equilibria.map((eq, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                            <Badge variant={eq.type === 'pure' ? 'default' : 'destructive'}>
                              {eq.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            ({eq.x.toFixed(3)}, {eq.y.toFixed(3)})
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            ({eq.payoffs.player1?.toFixed(2) || 'N/A'}, {eq.payoffs.player2?.toFixed(2) || 'N/A'})
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center space-x-1">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: d3.interpolateRdYlGn(eq.stability) }}
                              />
                              <span className="text-xs">{(eq.stability * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="interaction" className="space-y-4">
              <div className="text-sm text-gray-600">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Hover over equilibria for detailed information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Click equilibria to select and analyze</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Move mouse over strategy space to explore payoffs</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Chart */}
      <BaseChart
        ref={chartRef}
        data={data}
        renderFunction={renderFunction}
        config={chartConfig}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
    </div>
  );
};

export default NashEquilibriumChart; 