'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import BaseChart, { BaseChartRef } from './base-chart';
import { D3RenderFunction } from '@/hooks/use-d3';
import { PerformanceData, PerformanceMetric, LineChartConfig } from '@/lib/visualization-types';
import { defaultChartTheme } from './base-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  Zap, 
  Timer, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';

interface PerformanceDashboardProps {
  data: PerformanceData;
  isRunning?: boolean;
  onSimulationControl?: (action: 'play' | 'pause' | 'stop') => void;
  showDetailed?: boolean;
  refreshInterval?: number;
  className?: string;
}

interface MetricDisplay {
  current: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface BottleneckAlert {
  type: 'performance' | 'memory' | 'convergence';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
}

const createPerformanceMetricsRenderFunction = (
  timeWindow: number = 60
): D3RenderFunction<PerformanceData> => {
  return (svg, data, props) => {
    const { width, height, margin } = props;
    
    if (!width || !height || !margin) return;
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.bottom - margin.top;

    // Get recent metrics based on time window
    const now = Date.now();
    const windowStart = now - (timeWindow * 1000);
    const recentMetrics = data.metrics.filter(m => m.timestamp >= windowStart);

    if (recentMetrics.length === 0) return;

    // Create scales
    const xScale = d3.scaleTime()
      .domain([windowStart, now])
      .range([0, innerWidth]);

    const iterationsScale = d3.scaleLinear()
      .domain([0, d3.max(recentMetrics, d => d.iterationsPerSecond) || 1000])
      .range([innerHeight, 0]);

    const memoryScale = d3.scaleLinear()
      .domain([0, d3.max(recentMetrics, d => d.memoryUsage) || 500])
      .range([innerHeight, 0]);

    const convergenceScale = d3.scaleLinear()
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
      .tickFormat(d3.timeFormat('%H:%M:%S'))
      .ticks(6);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(iterationsScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', iterationsScale)
      .attr('y2', iterationsScale)
      .attr('stroke', defaultChartTheme.gridColor)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.7);

    // Add x-axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    // Create line generators
    const iterationsLine = d3.line<PerformanceMetric>()
      .x(d => xScale(d.timestamp))
      .y(d => iterationsScale(d.iterationsPerSecond))
      .curve(d3.curveMonotoneX);

    const memoryLine = d3.line<PerformanceMetric>()
      .x(d => xScale(d.timestamp))
      .y(d => memoryScale(d.memoryUsage))
      .curve(d3.curveMonotoneX);

    const convergenceLine = d3.line<PerformanceMetric>()
      .x(d => xScale(d.timestamp))
      .y(d => convergenceScale(d.convergenceScore))
      .curve(d3.curveMonotoneX);

    // Draw iterations/second line
    g.append('path')
      .datum(recentMetrics)
      .attr('class', 'iterations-line')
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', iterationsLine);

    // Draw memory usage area
    const memoryArea = d3.area<PerformanceMetric>()
      .x(d => xScale(d.timestamp))
      .y0(memoryScale(0))
      .y1(d => memoryScale(d.memoryUsage))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(recentMetrics)
      .attr('class', 'memory-area')
      .attr('fill', '#ef4444')
      .attr('opacity', 0.3)
      .attr('d', memoryArea);

    g.append('path')
      .datum(recentMetrics)
      .attr('class', 'memory-line')
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('d', memoryLine);

    // Draw convergence score
    g.append('path')
      .datum(recentMetrics)
      .attr('class', 'convergence-line')
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', convergenceLine);

    // Add metric labels and current values
    const latestMetric = recentMetrics[recentMetrics.length - 1];
    
    // Iterations per second label
    g.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text(`Iterations/sec: ${latestMetric.iterationsPerSecond.toFixed(0)}`);

    // Memory usage label
    g.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#ef4444')
      .text(`Memory: ${latestMetric.memoryUsage.toFixed(1)} MB`);

    // Convergence score label
    g.append('text')
      .attr('x', 10)
      .attr('y', 60)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#10b981')
      .text(`Convergence: ${(latestMetric.convergenceScore * 100).toFixed(1)}%`);

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 150}, 20)`);

    const legendItems = [
      { color: '#3b82f6', label: 'Iterations/sec', line: 'solid' },
      { color: '#ef4444', label: 'Memory (MB)', line: 'solid' },
      { color: '#10b981', label: 'Convergence', line: 'dashed' }
    ];

    legendItems.forEach((item, index) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${index * 20})`);

      legendItem.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', item.color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', item.line === 'dashed' ? '3,3' : 'none');

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 4)
        .style('font-size', '10px')
        .style('fill', defaultChartTheme.textColor)
        .text(item.label);
    });

    // Add title
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', defaultChartTheme.textColor)
      .text('Real-Time Performance Metrics');
  };
};

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  data,
  isRunning = false,
  onSimulationControl,
  showDetailed = true,
  refreshInterval = 1000,
  className
}) => {
  const chartRef = useRef<BaseChartRef>(null);
  const [timeWindow, setTimeWindow] = useState(60); // seconds

  // Calculate current metrics and trends
  const currentMetrics = useMemo((): Record<string, MetricDisplay> => {
    if (data.metrics.length === 0) {
      return {};
    }

    const recent = data.metrics.slice(-10); // Last 10 data points
    const latest = data.metrics[data.metrics.length - 1];
    const previous = data.metrics.length > 1 ? data.metrics[data.metrics.length - 2] : latest;

    const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
      const change = (current - previous) / previous;
      if (Math.abs(change) < 0.05) return 'stable';
      return change > 0 ? 'up' : 'down';
    };

    const calculateStatus = (current: number, thresholds: [number, number]): 'good' | 'warning' | 'critical' => {
      if (current < thresholds[0]) return 'critical';
      if (current < thresholds[1]) return 'warning';
      return 'good';
    };

    return {
      iterationsPerSecond: {
        current: latest.iterationsPerSecond,
        average: recent.reduce((sum, m) => sum + m.iterationsPerSecond, 0) / recent.length,
        trend: calculateTrend(latest.iterationsPerSecond, previous.iterationsPerSecond),
        status: calculateStatus(latest.iterationsPerSecond, [100, 500])
      },
      memoryUsage: {
        current: latest.memoryUsage,
        average: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
        trend: calculateTrend(latest.memoryUsage, previous.memoryUsage),
        status: calculateStatus(1000 - latest.memoryUsage, [200, 500]) // Invert for memory (higher usage = worse)
      },
      convergenceScore: {
        current: latest.convergenceScore,
        average: recent.reduce((sum, m) => sum + m.convergenceScore, 0) / recent.length,
        trend: calculateTrend(latest.convergenceScore, previous.convergenceScore),
        status: calculateStatus(latest.convergenceScore, [0.3, 0.7])
      },
      cpuUsage: {
        current: latest.cpuUsage || 0,
        average: recent.reduce((sum, m) => sum + (m.cpuUsage || 0), 0) / recent.length,
        trend: calculateTrend(latest.cpuUsage || 0, previous.cpuUsage || 0),
        status: calculateStatus(100 - (latest.cpuUsage || 0), [20, 50])
      }
    };
  }, [data.metrics]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!data.targetIterations || data.targetIterations === 0) return 0;
    const latest = data.metrics[data.metrics.length - 1];
    if (!latest) return 0;
    return Math.min(100, (latest.completedIterations / data.targetIterations) * 100);
  }, [data.metrics, data.targetIterations]);

  // Detect bottlenecks
  const bottlenecks = useMemo((): BottleneckAlert[] => {
    const alerts: BottleneckAlert[] = [];
    
    if (currentMetrics.iterationsPerSecond?.status === 'critical') {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: 'Simulation performance is critically low',
        suggestion: 'Consider reducing simulation complexity or enabling web workers'
      });
    }

    if (currentMetrics.memoryUsage?.status === 'critical') {
      alerts.push({
        type: 'memory',
        severity: 'high',
        message: 'Memory usage is critically high',
        suggestion: 'Reduce batch size or enable garbage collection'
      });
    }

    if (currentMetrics.convergenceScore?.status === 'critical') {
      alerts.push({
        type: 'convergence',
        severity: 'medium',
        message: 'Convergence is poor',
        suggestion: 'Consider adjusting convergence criteria or running more iterations'
      });
    }

    // Add custom bottlenecks from data
    if (data.bottlenecks) {
      data.bottlenecks.forEach(bottleneck => {
        alerts.push({
          type: 'performance',
          severity: 'medium',
          message: `Bottleneck detected: ${bottleneck}`,
          suggestion: 'Check simulation parameters and system resources'
        });
      });
    }

    return alerts;
  }, [currentMetrics, data.bottlenecks]);

  // Memoized render function
  const renderFunction = useMemo(() => {
    return createPerformanceMetricsRenderFunction(timeWindow);
  }, [timeWindow]);

  // Chart configuration
  const chartConfig: Partial<LineChartConfig> = {
    width: 800,
    height: 300,
    margin: { top: 40, right: 160, bottom: 40, left: 50 },
    responsive: true,
    showGrid: true
  };

  // Estimated completion time
  const estimatedCompletion = useMemo(() => {
    if (!data.estimatedCompletion) return null;
    const now = Date.now();
    const remaining = Math.max(0, data.estimatedCompletion - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [data.estimatedCompletion]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-Time Performance Dashboard
            </span>
            <div className="flex items-center space-x-2">
              {onSimulationControl && (
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant={isRunning ? "secondary" : "default"}
                    onClick={() => onSimulationControl(isRunning ? 'pause' : 'play')}
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSimulationControl('stop')}
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Badge variant={isRunning ? "default" : "secondary"}>
                {isRunning ? "Running" : "Stopped"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Simulation Progress</span>
              <span>{progress.toFixed(1)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
            {estimatedCompletion && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Estimated completion: {estimatedCompletion}</span>
                <span>
                  {data.targetIterations ? 
                    `${currentMetrics.iterationsPerSecond?.current.toFixed(0) || 0} / ${data.targetIterations.toLocaleString()} iterations` 
                    : ''
                  }
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {bottlenecks.length > 0 && (
        <div className="space-y-2">
          {bottlenecks.map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">{alert.message}</div>
                  {alert.suggestion && (
                    <div className="text-sm text-gray-600">{alert.suggestion}</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Iterations per Second */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className={`w-4 h-4 ${
                currentMetrics.iterationsPerSecond?.status === 'good' ? 'text-green-500' :
                currentMetrics.iterationsPerSecond?.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className="text-sm font-medium">Iterations/sec</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {currentMetrics.iterationsPerSecond?.current.toFixed(0) || 0}
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <TrendingUp className={`w-3 h-3 ${
                  currentMetrics.iterationsPerSecond?.trend === 'up' ? 'text-green-500' :
                  currentMetrics.iterationsPerSecond?.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                }`} />
                <span>Avg: {currentMetrics.iterationsPerSecond?.average.toFixed(0) || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MemoryStick className={`w-4 h-4 ${
                currentMetrics.memoryUsage?.status === 'good' ? 'text-green-500' :
                currentMetrics.memoryUsage?.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {currentMetrics.memoryUsage?.current.toFixed(0) || 0}<span className="text-sm text-gray-500">MB</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <TrendingUp className={`w-3 h-3 ${
                  currentMetrics.memoryUsage?.trend === 'down' ? 'text-green-500' :
                  currentMetrics.memoryUsage?.trend === 'up' ? 'text-red-500' : 'text-gray-400'
                }`} />
                <span>Avg: {currentMetrics.memoryUsage?.average.toFixed(0) || 0}MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Convergence Score */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className={`w-4 h-4 ${
                currentMetrics.convergenceScore?.status === 'good' ? 'text-green-500' :
                currentMetrics.convergenceScore?.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className="text-sm font-medium">Convergence</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {((currentMetrics.convergenceScore?.current || 0) * 100).toFixed(1)}<span className="text-sm text-gray-500">%</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <TrendingUp className={`w-3 h-3 ${
                  currentMetrics.convergenceScore?.trend === 'up' ? 'text-green-500' :
                  currentMetrics.convergenceScore?.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                }`} />
                <span>Avg: {((currentMetrics.convergenceScore?.average || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CPU Usage */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Cpu className={`w-4 h-4 ${
                currentMetrics.cpuUsage?.status === 'good' ? 'text-green-500' :
                currentMetrics.cpuUsage?.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className="text-sm font-medium">CPU</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {(currentMetrics.cpuUsage?.current || 0).toFixed(0)}<span className="text-sm text-gray-500">%</span>
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <TrendingUp className={`w-3 h-3 ${
                  currentMetrics.cpuUsage?.trend === 'down' ? 'text-green-500' :
                  currentMetrics.cpuUsage?.trend === 'up' ? 'text-red-500' : 'text-gray-400'
                }`} />
                <span>Avg: {(currentMetrics.cpuUsage?.average || 0).toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      {showDetailed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Performance Metrics Over Time</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  Last {timeWindow}s
                </Badge>
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(Number(e.target.value))}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                  <option value={600}>10m</option>
                </select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart
              ref={chartRef}
              data={data}
              renderFunction={renderFunction}
              config={chartConfig}
              className="border border-gray-200 rounded-lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceDashboard; 