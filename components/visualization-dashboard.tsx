'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Import all chart components
import StrategyEvolutionChart from './charts/strategy-evolution-chart';
import PayoffDistributionChart from './charts/payoff-distribution-chart';
import NashEquilibriumChart from './charts/nash-equilibrium-chart';
import { EnhancedNashChart } from './charts/enhanced-nash-chart';
import PerformanceDashboard from './charts/performance-dashboard';
import ExportAnimationControls, { ExportFormat, ExportOptions } from './charts/export-animation-controls';

// Import sample data
import { 
  generateSampleStrategyEvolutionData,
  generateSamplePayoffDistributionData,
  generateSampleStrategySpaceData,
  generateSamplePerformanceData
} from '@/lib/sample-visualization-data';

// Import types
import { GameScenario } from '@/lib/game-theory-types';

import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Activity, 
  Download,
  Play,
  Info,
  Sparkles
} from 'lucide-react';

interface VisualizationDashboardProps {
  simulationData?: any;
  scenario?: GameScenario;
  isSimulationRunning?: boolean;
  onSimulationControl?: (action: 'play' | 'pause' | 'stop') => void;
  className?: string;
}

export const VisualizationDashboard: React.FC<VisualizationDashboardProps> = ({
  simulationData,
  scenario,
  isSimulationRunning = false,
  onSimulationControl,
  className
}) => {
  const [activeTab, setActiveTab] = useState('evolution');
  const [isExporting, setIsExporting] = useState(false);
  const [useEnhancedNash, setUseEnhancedNash] = useState(true);
  
  // Refs for chart components
  const evolutionChartRef = useRef<any>(null);
  const distributionChartRef = useRef<any>(null);
  const equilibriumChartRef = useRef<any>(null);
  const performanceChartRef = useRef<any>(null);

  // Generate or use provided sample data
  const dashboardData = useMemo(() => {
    if (simulationData) {
      return simulationData;
    }

    // Generate sample data for demonstration
    return {
      strategyEvolution: generateSampleStrategyEvolutionData(),
      payoffDistribution: generateSamplePayoffDistributionData(),
      nashEquilibrium: generateSampleStrategySpaceData(),
      performance: generateSamplePerformanceData()
    };
  }, [simulationData]);

  // Check if enhanced Nash analysis is available
  const canUseEnhancedNash = useMemo(() => {
    return scenario && scenario.payoffMatrix && scenario.payoffMatrix.strategies;
  }, [scenario]);

  // Export handler for individual charts
  const handleChartExport = useCallback(async (
    chartType: string, 
    format: ExportFormat, 
    options: ExportOptions
  ) => {
    setIsExporting(true);
    
    try {
      let chartRef;
      let filename = `${chartType}-${format}`;
      
      switch (chartType) {
        case 'evolution':
          chartRef = evolutionChartRef.current;
          filename = `strategy-evolution-${options.filename || 'chart'}`;
          break;
        case 'distribution':
          chartRef = distributionChartRef.current;
          filename = `payoff-distribution-${options.filename || 'chart'}`;
          break;
        case 'equilibrium':
          chartRef = equilibriumChartRef.current;
          filename = `nash-equilibrium-${options.filename || 'chart'}`;
          break;
        case 'performance':
          chartRef = performanceChartRef.current;
          filename = `performance-dashboard-${options.filename || 'chart'}`;
          break;
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }

      if (chartRef?.exportChart) {
        await chartRef.exportChart(format, { ...options, filename });
      } else {
        throw new Error('Chart export not available');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Export all charts as a combined dashboard
  const handleDashboardExport = useCallback(async (format: ExportFormat, options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      // Create a comprehensive export package
      const dashboardExport = {
        timestamp: new Date().toISOString(),
        format: 'taskmaster-dashboard-export',
        version: '1.0',
        simulation: {
          isRunning: isSimulationRunning,
          data: dashboardData
        },
        charts: {
          strategyEvolution: evolutionChartRef.current?.getChartData?.(),
          payoffDistribution: distributionChartRef.current?.getChartData?.(),
          nashEquilibrium: equilibriumChartRef.current?.getChartData?.(),
          performance: performanceChartRef.current?.getChartData?.()
        },
        exportOptions: options
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dashboardExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${options.filename || 'dashboard'}-export.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // For image formats, export each chart individually
        await Promise.all([
          handleChartExport('evolution', format, { ...options, filename: `${options.filename}-evolution` }),
          handleChartExport('distribution', format, { ...options, filename: `${options.filename}-distribution` }),
          handleChartExport('equilibrium', format, { ...options, filename: `${options.filename}-equilibrium` }),
          handleChartExport('performance', format, { ...options, filename: `${options.filename}-performance` })
        ]);
      }
    } catch (error) {
      console.error('Dashboard export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [dashboardData, isSimulationRunning, handleChartExport]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Monte Carlo Game Theory Visualization Dashboard
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant={isSimulationRunning ? "default" : "secondary"}>
                {isSimulationRunning ? "Simulation Running" : "Simulation Stopped"}
              </Badge>
              {onSimulationControl && (
                <Button
                  size="sm"
                  variant={isSimulationRunning ? "secondary" : "default"}
                  onClick={() => onSimulationControl(isSimulationRunning ? 'pause' : 'play')}
                  className="flex items-center gap-1"
                >
                  <Play className="w-4 h-4" />
                  {isSimulationRunning ? "Pause" : "Resume"}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This dashboard provides comprehensive visualization of Monte Carlo game theory simulations.
              Use the tabs below to explore different aspects of the analysis, and the export controls
              to save charts and data for presentations or further analysis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Main Visualization Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Strategy Evolution
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Payoff Distribution
          </TabsTrigger>
          <TabsTrigger value="equilibrium" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Nash Equilibrium
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Strategy Evolution Tab */}
        <TabsContent value="evolution" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <StrategyEvolutionChart
                data={dashboardData.strategyEvolution}
              />
            </div>
            <div>
              <ExportAnimationControls
                chartRef={evolutionChartRef}
                animationData={dashboardData.strategyEvolution?.series?.[0]?.data || []}
                onExport={(format: ExportFormat, options: ExportOptions) => handleChartExport('evolution', format, options)}
                className="h-fit"
              />
            </div>
          </div>
        </TabsContent>

        {/* Payoff Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <PayoffDistributionChart
                data={dashboardData.payoffDistribution}
              />
            </div>
            <div>
              <ExportAnimationControls
                chartRef={distributionChartRef}
                onExport={(format: ExportFormat, options: ExportOptions) => handleChartExport('distribution', format, options)}
                className="h-fit"
              />
            </div>
          </div>
        </TabsContent>

        {/* Nash Equilibrium Tab */}
        <TabsContent value="equilibrium" className="space-y-4">
          {canUseEnhancedNash && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enhanced-nash"
                  checked={useEnhancedNash}
                  onCheckedChange={setUseEnhancedNash}
                />
                <Label htmlFor="enhanced-nash" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Enhanced Nash Analysis
                </Label>
              </div>
              <Badge variant="outline">
                {useEnhancedNash ? 'AI-Powered Analysis' : 'Standard Visualization'}
              </Badge>
            </div>
          )}
          
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              {useEnhancedNash && canUseEnhancedNash && scenario ? (
                <EnhancedNashChart
                  scenario={scenario}
                  data={dashboardData.nashEquilibrium}
                  className="h-full"
                />
              ) : (
                <NashEquilibriumChart
                  data={dashboardData.nashEquilibrium}
                />
              )}
            </div>
            <div>
              <ExportAnimationControls
                chartRef={equilibriumChartRef}
                onExport={(format: ExportFormat, options: ExportOptions) => handleChartExport('equilibrium', format, options)}
                className="h-fit"
              />
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <PerformanceDashboard
                data={dashboardData.performance}
              />
            </div>
            <div>
              <ExportAnimationControls
                chartRef={performanceChartRef}
                onExport={(format: ExportFormat, options: ExportOptions) => handleChartExport('performance', format, options)}
                className="h-fit"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Global Export Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Dashboard Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Export Entire Dashboard</div>
              <div className="text-sm text-gray-600">
                Export all charts and data as a comprehensive package for analysis or presentation.
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDashboardExport('json', { filename: 'dashboard' })}
                disabled={isExporting}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDashboardExport('png', { filename: 'dashboard', width: 1200, height: 800 })}
                disabled={isExporting}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export Images
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualizationDashboard; 