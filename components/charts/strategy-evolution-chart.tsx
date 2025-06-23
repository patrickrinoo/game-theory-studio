'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import BaseChart, { BaseChartRef } from './base-chart';
import { D3RenderFunction } from '@/hooks/use-d3';
import { StrategyEvolutionData, StrategyEvolutionSeries, LineChartConfig, ChartEventHandlers } from '@/lib/visualization-types';
import { defaultChartTheme } from './base-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface StrategyEvolutionChartProps {
  data: StrategyEvolutionData;
  config?: Partial<LineChartConfig>;
  showLegend?: boolean;
  showAnimation?: boolean;
  realTimeUpdates?: boolean;
  onPointClick?: (point: any, series: StrategyEvolutionSeries) => void;
  onSeriesToggle?: (seriesId: string, visible: boolean) => void;
  className?: string;
}

interface AnimationState {
  isPlaying: boolean;
  currentIteration: number;
  speed: number;
  intervalId: NodeJS.Timeout | null;
}

const createStrategyEvolutionRenderFunction = (
  visibleSeries: Set<string>,
  animationState: AnimationState,
  eventHandlers?: ChartEventHandlers
): D3RenderFunction<StrategyEvolutionData> => {
  return (svg, data, props) => {
    const { width, height, margin } = props;
    
    if (!width || !height || !margin) return;
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.bottom - margin.top;

    // Filter data based on animation state and visible series
    const filteredSeries = data.series.filter(series => visibleSeries.has(series.playerId));
    const maxIteration = animationState.isPlaying 
      ? Math.min(animationState.currentIteration, Math.max(...data.iterations))
      : Math.max(...data.iterations);
    
    const filteredIterations = data.iterations.filter(iter => iter <= maxIteration);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(...data.iterations)])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 1]) // Strategy probabilities are 0-1
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(d.iteration))
      .y(d => yScale(d.probability))
      .curve(d3.curveMonotoneX);

    // Create area generator for filled charts
    const area = d3.area<any>()
      .x(d => xScale(d.iteration))
      .y0(yScale(0))
      .y1(d => yScale(d.probability))
      .curve(d3.curveMonotoneX);

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
      .tickFormat(d3.format(',.0f'))
      .ticks(8);
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format('.0%'))
      .ticks(6);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(6))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale)
      .attr('y2', yScale)
      .attr('stroke', defaultChartTheme.gridColor)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.7);

    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(xScale.ticks(8))
      .enter()
      .append('line')
      .attr('x1', xScale)
      .attr('x2', xScale)
      .attr('y1', 0)
      .attr('y2', innerHeight)
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
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', defaultChartTheme.textColor)
      .text('Simulation Iteration');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', defaultChartTheme.textColor)
      .text('Strategy Probability');

    // Draw strategy evolution lines and areas
    filteredSeries.forEach((series, index) => {
      const seriesData = series.data.filter(d => d.iteration <= maxIteration);
      
      if (seriesData.length === 0) return;

      const color = series.color || defaultChartTheme.colors[index % defaultChartTheme.colors.length];

      // Draw area (optional, with low opacity)
      g.append('path')
        .datum(seriesData)
        .attr('class', `strategy-area-${series.playerId}-${series.strategyId}`)
        .attr('fill', color)
        .attr('opacity', 0.2)
        .attr('d', area);

      // Draw line
      g.append('path')
        .datum(seriesData)
        .attr('class', `strategy-line-${series.playerId}-${series.strategyId}`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add interactive points
      g.selectAll(`.strategy-points-${series.playerId}-${series.strategyId}`)
        .data(seriesData.filter((_, i) => i % Math.max(1, Math.floor(seriesData.length / 50)) === 0)) // Subsample for performance
        .enter()
        .append('circle')
        .attr('class', `strategy-points-${series.playerId}-${series.strategyId}`)
        .attr('cx', d => xScale(d.iteration))
        .attr('cy', d => yScale(d.probability))
        .attr('r', 3)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // Highlight point
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 5);

          // Show tooltip
          const tooltip = g.append('g')
            .attr('id', 'evolution-tooltip')
            .attr('transform', `translate(${xScale(d.iteration) + 10}, ${yScale(d.probability) - 10})`);

          const tooltipBg = tooltip.append('rect')
            .attr('x', -5)
            .attr('y', -15)
            .attr('rx', 3)
            .attr('fill', 'rgba(0, 0, 0, 0.8)')
            .attr('stroke', color)
            .attr('stroke-width', 1);

          const tooltipText = tooltip.append('text')
            .attr('fill', 'white')
            .style('font-size', '11px')
            .text(`${series.playerName}: ${series.strategyName} (${(d.probability * 100).toFixed(1)}%)`);

          // Adjust background size
          const bbox = tooltipText.node()?.getBBox();
          if (bbox) {
            tooltipBg
              .attr('width', bbox.width + 10)
              .attr('height', bbox.height + 4);
          }

          // Call external event handler
          eventHandlers?.onPointHover?.(d, series);
        })
        .on('mouseout', function() {
          // Reset point
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 3);

          // Remove tooltip
          g.select('#evolution-tooltip').remove();
        })
        .on('click', function(event, d) {
          eventHandlers?.onPointClick?.(d, series);
        });
    });

    // Add current iteration indicator if animating
    if (animationState.isPlaying && animationState.currentIteration <= maxIteration) {
      g.append('line')
        .attr('class', 'current-iteration-line')
        .attr('x1', xScale(animationState.currentIteration))
        .attr('x2', xScale(animationState.currentIteration))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.8);

      g.append('text')
        .attr('x', xScale(animationState.currentIteration) + 5)
        .attr('y', 15)
        .attr('fill', '#ef4444')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(`Iteration ${animationState.currentIteration}`);
    }

    // Add title
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', defaultChartTheme.textColor)
      .text('Strategy Evolution Over Time');
  };
};

export const StrategyEvolutionChart: React.FC<StrategyEvolutionChartProps> = ({
  data,
  config = {},
  showLegend = true,
  showAnimation = true,
  realTimeUpdates = false,
  onPointClick,
  onSeriesToggle,
  className
}) => {
  const chartRef = useRef<BaseChartRef>(null);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    new Set(data.series.map(s => s.playerId))
  );
  
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentIteration: Math.max(...data.iterations),
    speed: 1.0,
    intervalId: null
  });

  const [showAreas, setShowAreas] = useState(false);

  // Memoized render function
  const renderFunction = useMemo(() => {
    return createStrategyEvolutionRenderFunction(
      visibleSeries,
      animationState,
      { onPointClick, onPointHover: undefined }
    );
  }, [visibleSeries, animationState, onPointClick]);

  // Animation controls
  const startAnimation = useCallback(() => {
    if (animationState.intervalId) return;

    const intervalId = setInterval(() => {
      setAnimationState(prev => {
        const nextIteration = prev.currentIteration + Math.max(1, Math.floor(100 / prev.speed));
        const maxIteration = Math.max(...data.iterations);
        
        if (nextIteration >= maxIteration) {
          clearInterval(prev.intervalId!);
          return {
            ...prev,
            currentIteration: maxIteration,
            isPlaying: false,
            intervalId: null
          };
        }
        
        return {
          ...prev,
          currentIteration: nextIteration
        };
      });
    }, 100);

    setAnimationState(prev => ({
      ...prev,
      isPlaying: true,
      intervalId
    }));
  }, [animationState.intervalId, data.iterations]);

  const pauseAnimation = useCallback(() => {
    if (animationState.intervalId) {
      clearInterval(animationState.intervalId);
      setAnimationState(prev => ({
        ...prev,
        isPlaying: false,
        intervalId: null
      }));
    }
  }, [animationState.intervalId]);

  const resetAnimation = useCallback(() => {
    if (animationState.intervalId) {
      clearInterval(animationState.intervalId);
    }
    setAnimationState(prev => ({
      ...prev,
      isPlaying: false,
      currentIteration: 0,
      intervalId: null
    }));
  }, [animationState.intervalId]);

  const toggleSeries = useCallback((playerId: string) => {
    setVisibleSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      onSeriesToggle?.(playerId, newSet.has(playerId));
      return newSet;
    });
  }, [onSeriesToggle]);

  // Chart configuration
  const chartConfig: Partial<LineChartConfig> = {
    width: 800,
    height: 500,
    margin: { top: 40, right: 20, bottom: 60, left: 60 },
    responsive: true,
    showGrid: true,
    showLegend,
    interactive: true,
    zoom: true,
    pan: true,
    xAxis: {
      label: 'Simulation Iteration',
      scale: 'linear',
      ticks: 8,
      format: ',.0f',
      grid: true
    },
    yAxis: {
      label: 'Strategy Probability',
      scale: 'linear',
      domain: [0, 1],
      ticks: 6,
      format: '.0%',
      grid: true
    },
    ...config
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Strategy Evolution Chart</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {data.series.length} strategies tracked
              </Badge>
              <Badge variant="outline">
                {Math.max(...data.iterations).toLocaleString()} iterations
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Animation Controls */}
          {showAnimation && (
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={animationState.isPlaying ? pauseAnimation : startAnimation}
                >
                  {animationState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={resetAnimation}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 space-y-2">
                <Label className="text-sm">Animation Speed: {animationState.speed}x</Label>
                <Slider
                  value={[animationState.speed]}
                  onValueChange={([speed]) => setAnimationState(prev => ({ ...prev, speed }))}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-32"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={showAreas}
                  onCheckedChange={setShowAreas}
                  id="show-areas"
                />
                <Label htmlFor="show-areas" className="text-sm">Show Areas</Label>
              </div>
            </div>
          )}

          {/* Series Legend and Controls */}
          {showLegend && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Visible Strategies:</Label>
              <div className="flex flex-wrap gap-2">
                {data.series.map((series, index) => {
                  const color = series.color || defaultChartTheme.colors[index % defaultChartTheme.colors.length];
                  const isVisible = visibleSeries.has(series.playerId);
                  
                  return (
                    <button
                      key={`${series.playerId}-${series.strategyId}`}
                      onClick={() => toggleSeries(series.playerId)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg border transition-all ${
                        isVisible 
                          ? 'bg-white border-gray-300 shadow-sm' 
                          : 'bg-gray-100 border-gray-200 opacity-60'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm">
                        {series.playerName}: {series.strategyName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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

export default StrategyEvolutionChart; 