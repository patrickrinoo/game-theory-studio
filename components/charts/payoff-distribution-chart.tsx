'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import BaseChart, { BaseChartRef } from './base-chart';
import { D3RenderFunction } from '@/hooks/use-d3';
import { PayoffDistributionData, PayoffDistributionSeries, HistogramConfig, ChartEventHandlers } from '@/lib/visualization-types';
import { defaultChartTheme } from './base-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart2, TrendingUp, Activity, Target } from 'lucide-react';

interface PayoffDistributionChartProps {
  data: PayoffDistributionData;
  config?: Partial<HistogramConfig>;
  showStatistics?: boolean;
  showDensityOverlay?: boolean;
  showComparison?: boolean;
  onBinClick?: (bin: any, series: PayoffDistributionSeries) => void;
  onStatisticHover?: (statistic: string, value: number, series: PayoffDistributionSeries) => void;
  className?: string;
}

interface FilterState {
  selectedPlayers: Set<string>;
  displayMode: 'histogram' | 'density' | 'both';
  binCount: number;
  showOverlays: boolean;
  normalizeByArea: boolean;
  showBoxPlot: boolean;
}

interface StatisticalOverlay {
  type: 'mean' | 'median' | 'mode' | 'confidence';
  value: number;
  label: string;
  color: string;
  bounds?: [number, number]; // For confidence intervals
}

const createPayoffDistributionRenderFunction = (
  filteredData: PayoffDistributionData,
  filterState: FilterState,
  eventHandlers?: ChartEventHandlers
): D3RenderFunction<PayoffDistributionData> => {
  return (svg, data, props) => {
    const { width, height, margin } = props;
    
    if (!width || !height || !margin) return;
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.bottom - margin.top;

    // Filter series based on selected players
    const visibleSeries = filteredData.series.filter(series => 
      filterState.selectedPlayers.has(series.playerId)
    );

    if (visibleSeries.length === 0) return;

    // Calculate combined data range
    const allBins = visibleSeries.flatMap(series => series.bins);
    const xExtent = [
      Math.min(...allBins.map(bin => bin.binStart)),
      Math.max(...allBins.map(bin => bin.binEnd))
    ] as [number, number];

    const yExtent = filterState.normalizeByArea
      ? [0, Math.max(...allBins.map(bin => bin.density))]
      : [0, Math.max(...allBins.map(bin => bin.count))];

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(yExtent)
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
    const xAxis = d3.axisBottom(xScale).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(6);

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
      .text('Payoff Value');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', defaultChartTheme.textColor)
      .text(filterState.normalizeByArea ? 'Density' : 'Frequency');

    // Draw histograms
    if (filterState.displayMode === 'histogram' || filterState.displayMode === 'both') {
      visibleSeries.forEach((series, seriesIndex) => {
        const color = series.color;
        const opacity = visibleSeries.length > 1 ? 0.7 : 0.8;
        
        // Draw histogram bars
        g.selectAll(`.histogram-bar-${series.playerId}`)
          .data(series.bins)
          .enter()
          .append('rect')
          .attr('class', `histogram-bar-${series.playerId}`)
          .attr('x', d => xScale(d.binStart))
          .attr('y', d => yScale(filterState.normalizeByArea ? d.density : d.count))
          .attr('width', d => Math.max(0, xScale(d.binEnd) - xScale(d.binStart) - 1))
          .attr('height', d => innerHeight - yScale(filterState.normalizeByArea ? d.density : d.count))
          .attr('fill', color)
          .attr('opacity', opacity)
          .attr('stroke', d3.color(color)?.darker(0.5)?.toString() || color)
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            // Highlight bar
            d3.select(this)
              .transition()
              .duration(200)
              .attr('opacity', 1)
              .attr('stroke-width', 2);

            // Show tooltip
            const tooltip = g.append('g')
              .attr('id', 'distribution-tooltip')
              .attr('transform', `translate(${xScale(d.binCenter) + 10}, ${yScale(filterState.normalizeByArea ? d.density : d.count) - 10})`);

            const tooltipBg = tooltip.append('rect')
              .attr('x', -5)
              .attr('y', -25)
              .attr('rx', 3)
              .attr('fill', 'rgba(0, 0, 0, 0.8)')
              .attr('stroke', color)
              .attr('stroke-width', 1);

            const tooltipText = tooltip.append('text')
              .attr('fill', 'white')
              .style('font-size', '11px');

            tooltipText.append('tspan')
              .attr('x', 0)
              .attr('y', -15)
              .text(`${series.playerName}`);

            tooltipText.append('tspan')
              .attr('x', 0)
              .attr('y', -5)
              .text(`Range: ${d.binStart.toFixed(2)} - ${d.binEnd.toFixed(2)}`);

            tooltipText.append('tspan')
              .attr('x', 0)
              .attr('y', 5)
              .text(`Count: ${d.count} (${(d.frequency * 100).toFixed(1)}%)`);

            // Adjust background size
            const bbox = tooltipText.node()?.getBBox();
            if (bbox) {
              tooltipBg
                .attr('width', bbox.width + 10)
                .attr('height', bbox.height + 10);
            }
          })
          .on('mouseout', function() {
            // Reset bar
            d3.select(this)
              .transition()
              .duration(200)
              .attr('opacity', opacity)
              .attr('stroke-width', 1);

            // Remove tooltip
            g.select('#distribution-tooltip').remove();
          })
          .on('click', function(event, d) {
            eventHandlers?.onBinClick?.(d, series);
          });
      });
    }

    // Draw density curves
    if (filterState.displayMode === 'density' || filterState.displayMode === 'both') {
      visibleSeries.forEach((series, seriesIndex) => {
        const color = series.color;
        
        // Create smooth density curve using kernel density estimation
        const densityData = series.bins.map(bin => [bin.binCenter, bin.density]);
        
        const line = d3.line<[number, number]>()
          .x(d => xScale(d[0]))
          .y(d => yScale(d[1]))
          .curve(d3.curveCardinal);

        g.append('path')
          .datum(densityData)
          .attr('class', `density-curve-${series.playerId}`)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 3)
          .attr('opacity', 0.8)
          .attr('d', line);

        // Add density area fill (optional)
        if (filterState.displayMode === 'density') {
          const area = d3.area<[number, number]>()
            .x(d => xScale(d[0]))
            .y0(yScale(0))
            .y1(d => yScale(d[1]))
            .curve(d3.curveCardinal);

          g.append('path')
            .datum(densityData)
            .attr('class', `density-area-${series.playerId}`)
            .attr('fill', color)
            .attr('opacity', 0.3)
            .attr('d', area);
        }
      });
    }

    // Add statistical overlays
    if (filterState.showOverlays) {
      visibleSeries.forEach((series, seriesIndex) => {
        const stats = series.statistics;
        const color = series.color;
        
        // Create statistical overlays
        const overlays: StatisticalOverlay[] = [
          {
            type: 'mean',
            value: stats.mean,
            label: `Mean: ${stats.mean.toFixed(2)}`,
            color: color
          },
          {
            type: 'median',
            value: stats.median,
            label: `Median: ${stats.median.toFixed(2)}`,
            color: d3.color(color)?.darker(0.3)?.toString() || color
          }
        ];

        // Draw statistical lines
        overlays.forEach(overlay => {
          const x = xScale(overlay.value);
          
          g.append('line')
            .attr('class', `stat-line-${overlay.type}-${series.playerId}`)
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', overlay.color)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', overlay.type === 'median' ? '5,5' : 'none')
            .attr('opacity', 0.8);

          // Add labels
          g.append('text')
            .attr('x', x + 5)
            .attr('y', 20 + seriesIndex * 15)
            .attr('fill', overlay.color)
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text(overlay.label);
        });

        // Add confidence interval if requested
        const ciWidth = 1.96 * stats.std; // 95% confidence interval
        const ciLower = stats.mean - ciWidth;
        const ciUpper = stats.mean + ciWidth;

        g.append('rect')
          .attr('class', `confidence-interval-${series.playerId}`)
          .attr('x', xScale(ciLower))
          .attr('y', innerHeight - 30 - seriesIndex * 20)
          .attr('width', xScale(ciUpper) - xScale(ciLower))
          .attr('height', 15)
          .attr('fill', color)
          .attr('opacity', 0.2)
          .attr('stroke', color)
          .attr('stroke-width', 1);

        g.append('text')
          .attr('x', xScale(stats.mean))
          .attr('y', innerHeight - 20 - seriesIndex * 20)
          .attr('text-anchor', 'middle')
          .attr('fill', color)
          .style('font-size', '9px')
          .text('95% CI');
      });
    }

    // Add box plots if requested
    if (filterState.showBoxPlot) {
      visibleSeries.forEach((series, seriesIndex) => {
        const stats = series.statistics;
        const boxY = innerHeight + 20 + seriesIndex * 40;
        const boxHeight = 20;
        const color = series.color;

        // Box plot elements
        const q1 = stats.q25;
        const q3 = stats.q75;
        const median = stats.median;
        const min = stats.min;
        const max = stats.max;

        // Draw box
        g.append('rect')
          .attr('class', `box-plot-box-${series.playerId}`)
          .attr('x', xScale(q1))
          .attr('y', boxY)
          .attr('width', xScale(q3) - xScale(q1))
          .attr('height', boxHeight)
          .attr('fill', color)
          .attr('opacity', 0.3)
          .attr('stroke', color)
          .attr('stroke-width', 2);

        // Draw median line
        g.append('line')
          .attr('class', `box-plot-median-${series.playerId}`)
          .attr('x1', xScale(median))
          .attr('x2', xScale(median))
          .attr('y1', boxY)
          .attr('y2', boxY + boxHeight)
          .attr('stroke', color)
          .attr('stroke-width', 3);

        // Draw whiskers
        g.append('line')
          .attr('class', `box-plot-whisker-left-${series.playerId}`)
          .attr('x1', xScale(min))
          .attr('x2', xScale(q1))
          .attr('y1', boxY + boxHeight / 2)
          .attr('y2', boxY + boxHeight / 2)
          .attr('stroke', color)
          .attr('stroke-width', 1);

        g.append('line')
          .attr('class', `box-plot-whisker-right-${series.playerId}`)
          .attr('x1', xScale(q3))
          .attr('x2', xScale(max))
          .attr('y1', boxY + boxHeight / 2)
          .attr('y2', boxY + boxHeight / 2)
          .attr('stroke', color)
          .attr('stroke-width', 1);

        // Draw whisker caps
        [min, max].forEach(value => {
          g.append('line')
            .attr('x1', xScale(value))
            .attr('x2', xScale(value))
            .attr('y1', boxY + 2)
            .attr('y2', boxY + boxHeight - 2)
            .attr('stroke', color)
            .attr('stroke-width', 1);
        });

        // Add player label
        g.append('text')
          .attr('x', xScale(median))
          .attr('y', boxY - 5)
          .attr('text-anchor', 'middle')
          .attr('fill', color)
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text(series.playerName);
      });
    }

    // Add title
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', defaultChartTheme.textColor)
      .text('Payoff Distribution Analysis');
  };
};

export const PayoffDistributionChart: React.FC<PayoffDistributionChartProps> = ({
  data,
  config = {},
  showStatistics = true,
  showDensityOverlay = true,
  showComparison = true,
  onBinClick,
  onStatisticHover,
  className
}) => {
  const chartRef = useRef<BaseChartRef>(null);
  
  const [filterState, setFilterState] = useState<FilterState>({
    selectedPlayers: new Set(data.series.map(s => s.playerId)),
    displayMode: 'both',
    binCount: data.binCount || 20,
    showOverlays: showStatistics,
    normalizeByArea: false,
    showBoxPlot: showComparison
  });

  // Create filtered data based on current filter state
  const filteredData = useMemo(() => {
    // If bin count changed, we'd need to recalculate bins
    // For now, we'll use the original data structure
    return data;
  }, [data, filterState.binCount]);

  // Memoized render function
  const renderFunction = useMemo(() => {
    return createPayoffDistributionRenderFunction(
      filteredData,
      filterState,
      { onBinClick }
    );
  }, [filteredData, filterState, onBinClick]);

  // Filter controls
  const togglePlayer = useCallback((playerId: string) => {
    setFilterState(prev => {
      const newSet = new Set(prev.selectedPlayers);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return { ...prev, selectedPlayers: newSet };
    });
  }, []);

  // Chart configuration
  const chartConfig: Partial<HistogramConfig> = {
    width: 800,
    height: 600,
    margin: { 
      top: 40, 
      right: 20, 
      bottom: filterState.showBoxPlot ? 120 : 60, 
      left: 60 
    },
    responsive: true,
    showGrid: true,
    showLegend: showComparison,
    interactive: true,
    binCount: filterState.binCount,
    ...config
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              Payoff Distribution Analysis
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {data.series.length} players
              </Badge>
              <Badge variant="outline">
                {filterState.binCount} bins
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Mode Controls */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Display Mode:</Label>
              <Select
                value={filterState.displayMode}
                onValueChange={(value: 'histogram' | 'density' | 'both') =>
                  setFilterState(prev => ({ ...prev, displayMode: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="histogram">Histogram</SelectItem>
                  <SelectItem value="density">Density</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Bins: {filterState.binCount}</Label>
              <Slider
                value={[filterState.binCount]}
                onValueChange={([count]) => setFilterState(prev => ({ ...prev, binCount: count }))}
                min={5}
                max={50}
                step={1}
                className="w-32"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={filterState.showOverlays}
                  onCheckedChange={(checked) => setFilterState(prev => ({ ...prev, showOverlays: checked }))}
                  id="show-overlays"
                />
                <Label htmlFor="show-overlays" className="text-sm">Statistics</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={filterState.normalizeByArea}
                  onCheckedChange={(checked) => setFilterState(prev => ({ ...prev, normalizeByArea: checked }))}
                  id="normalize"
                />
                <Label htmlFor="normalize" className="text-sm">Density</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={filterState.showBoxPlot}
                  onCheckedChange={(checked) => setFilterState(prev => ({ ...prev, showBoxPlot: checked }))}
                  id="box-plot"
                />
                <Label htmlFor="box-plot" className="text-sm">Box Plot</Label>
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Visible Players:</Label>
            <div className="flex flex-wrap gap-2">
              {data.series.map((series, index) => {
                const isSelected = filterState.selectedPlayers.has(series.playerId);
                
                return (
                  <div key={series.playerId} className="flex items-center space-x-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePlayer(series.playerId)}
                      id={`player-${series.playerId}`}
                    />
                    <label
                      htmlFor={`player-${series.playerId}`}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-white border-gray-300 shadow-sm' 
                          : 'bg-gray-100 border-gray-200 opacity-60'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      <span className="text-sm">{series.playerName}</span>
                      <Badge variant="outline" className="text-xs">
                        μ={series.statistics.mean.toFixed(2)}
                      </Badge>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics Summary */}
          {showStatistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.series
                .filter(series => filterState.selectedPlayers.has(series.playerId))
                .map(series => (
                  <Card key={series.playerId} className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      <span className="text-sm font-medium">{series.playerName}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Mean:</span>
                        <span className="font-mono">{series.statistics.mean.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Std:</span>
                        <span className="font-mono">{series.statistics.std.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Range:</span>
                        <span className="font-mono">{series.statistics.min.toFixed(1)}-{series.statistics.max.toFixed(1)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      <BaseChart
        ref={chartRef}
        data={filteredData}
        renderFunction={renderFunction}
        config={chartConfig}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
    </div>
  );
};

export default PayoffDistributionChart; 