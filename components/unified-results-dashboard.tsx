'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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

// Import existing dashboard components
import { VisualizationDashboard } from '@/components/visualization-dashboard';
import { StrategicAnalysisDashboard } from '@/components/strategic-analysis-dashboard';
import { ResultsVisualization } from '@/components/results-visualization';

// Import additional components for comprehensive analysis
import { ExportResults } from '@/components/export-results';
import { BatchSimulationManager } from '@/components/batch-simulation-manager';
import PerformanceDashboard from '@/components/charts/performance-dashboard';

// Import types
import { GameScenario } from '@/lib/game-theory-types';

import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Activity, 
  Download,
  Settings,
  Info,
  Eye,
  Brain,
  Zap,
  Calculator,
  FileSpreadsheet,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Maximize2,
  Minimize2,
  Grid3X3,
  List,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  InfoIcon
} from 'lucide-react';

export interface UnifiedResultsDashboardProps {
  simulationResults?: any;
  simulationData?: any;
  game: GameScenario;
  payoffMatrix?: number[][][];
  isSimulationRunning?: boolean;
  onSimulationControl?: (action: 'play' | 'pause' | 'stop' | 'reset') => void;
  onExportResults?: (format: string, options: any) => void;
  className?: string;
}

interface DashboardView {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  requiresSimulation?: boolean;
  features: string[];
}

interface DashboardStats {
  totalSimulations: number;
  completedAnalyses: number;
  activeViews: number;
  dataSize: string;
  lastUpdate: Date;
}

const DASHBOARD_VIEWS: DashboardView[] = [
  {
    id: 'overview',
    name: 'Overview',
    description: 'Comprehensive summary of all analysis results',
    icon: Eye,
    component: ResultsVisualization,
    requiresSimulation: true,
    features: ['Quick insights', 'Key metrics', 'Summary charts', 'Status indicators']
  },
  {
    id: 'strategic-analysis',
    name: 'Strategic Analysis',
    description: 'Deep strategic analysis including Nash equilibria and dominance',
    icon: Brain,
    component: StrategicAnalysisDashboard,
    requiresSimulation: false,
    features: ['Nash equilibrium', 'Dominance analysis', 'Best responses', 'Strategy recommendations']
  },
  {
    id: 'visualizations',
    name: 'Advanced Visualizations',
    description: 'Interactive charts and real-time visualization dashboard',
    icon: BarChart3,
    component: VisualizationDashboard,
    requiresSimulation: false,
    features: ['Strategy evolution', 'Payoff distributions', 'Performance monitoring', 'Interactive charts']
  },
  {
    id: 'performance',
    name: 'Performance Analytics',
    description: 'Simulation performance metrics and optimization insights',
    icon: Activity,
    component: PerformanceDashboard,
    requiresSimulation: true,
    features: ['Execution metrics', 'Memory usage', 'Convergence analysis', 'Optimization tips']
  },
  {
    id: 'export',
    name: 'Export & Reports',
    description: 'Export results and generate comprehensive reports',
    icon: Download,
    component: ExportResults,
    requiresSimulation: true,
    features: ['Multi-format export', 'Custom reports', 'Data packages', 'Sharing options']
  },
  {
    id: 'batch',
    name: 'Batch Analysis',
    description: 'Manage and analyze multiple simulation runs',
    icon: Grid3X3,
    component: BatchSimulationManager,
    requiresSimulation: false,
    features: ['Multiple configurations', 'Comparison tools', 'Batch processing', 'Aggregate analysis']
  }
];

export const UnifiedResultsDashboard: React.FC<UnifiedResultsDashboardProps> = ({
  simulationResults,
  simulationData,
  game,
  payoffMatrix,
  isSimulationRunning = false,
  onSimulationControl,
  onExportResults,
  className
}) => {
  const [activeView, setActiveView] = useState('overview');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Calculate dashboard statistics
  const dashboardStats = useMemo((): DashboardStats => {
    const hasResults = simulationResults || simulationData;
    const dataSize = hasResults ? 
      `${Math.round(JSON.stringify(hasResults).length / 1024)}KB` : '0KB';
    
    return {
      totalSimulations: simulationResults?.iterations || 0,
      completedAnalyses: DASHBOARD_VIEWS.filter(view => 
        !view.requiresSimulation || hasResults
      ).length,
      activeViews: DASHBOARD_VIEWS.length,
      dataSize,
      lastUpdate: lastRefresh
    };
  }, [simulationResults, simulationData, lastRefresh]);

  // Get available views based on data availability
  const availableViews = useMemo(() => {
    const hasSimulationData = simulationResults || simulationData;
    return DASHBOARD_VIEWS.filter(view => 
      !view.requiresSimulation || hasSimulationData
    );
  }, [simulationResults, simulationData]);

  // Auto-refresh handler
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle view change
  const handleViewChange = useCallback((viewId: string) => {
    setActiveView(viewId);
  }, []);

  // Handle simulation control
  const handleSimulationControl = useCallback((action: 'play' | 'pause' | 'stop' | 'reset') => {
    onSimulationControl?.(action);
    setLastRefresh(new Date());
  }, [onSimulationControl]);

  // Render view component
  const renderActiveView = useCallback(() => {
    const view = DASHBOARD_VIEWS.find(v => v.id === activeView);
    if (!view) return null;

    const Component = view.component;
    const commonProps = {
      game,
      payoffMatrix,
      simulationResults,
      simulationData,
      isSimulationRunning,
      onSimulationControl: handleSimulationControl,
      onExportResults,
      className: "h-full"
    };

    return <Component {...commonProps} />;
  }, [activeView, game, payoffMatrix, simulationResults, simulationData, isSimulationRunning, handleSimulationControl, onExportResults]);

  // Render dashboard header
  const renderDashboardHeader = () => (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Unified Results Dashboard
              </CardTitle>
              <CardDescription className="text-lg">
                Comprehensive analysis and visualization of game theory simulations
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Simulation Status */}
            <Badge 
              variant={isSimulationRunning ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {isSimulationRunning ? (
                <PlayCircle className="w-3 h-3" />
              ) : (
                <PauseCircle className="w-3 h-3" />
              )}
              {isSimulationRunning ? "Running" : "Stopped"}
            </Badge>

            {/* Auto-refresh toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-xs">
                Auto-refresh
              </Label>
            </div>

            {/* Compact mode toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="compact-mode"
                checked={isCompactMode}
                onCheckedChange={setIsCompactMode}
              />
              <Label htmlFor="compact-mode" className="text-xs">
                Compact
              </Label>
            </div>

            {/* Refresh button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLastRefresh(new Date())}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.totalSimulations.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700">Total Simulations</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.completedAnalyses}
            </div>
            <div className="text-sm text-green-700">Available Views</div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardStats.dataSize}
            </div>
            <div className="text-sm text-purple-700">Data Size</div>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {dashboardStats.lastUpdate.toLocaleTimeString()}
            </div>
            <div className="text-sm text-orange-700">Last Update</div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  // Render view selector
  const renderViewSelector = () => (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableViews.map((view) => (
            <button
              key={view.id}
              onClick={() => handleViewChange(view.id)}
              className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                activeView === view.id
                  ? 'bg-blue-50 border-blue-200 shadow-md'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  activeView === view.id ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <view.icon className={`w-5 h-5 ${
                    activeView === view.id ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`font-semibold ${
                      activeView === view.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {view.name}
                    </h3>
                    {view.requiresSimulation && !(simulationResults || simulationData) && (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  
                  <p className={`text-sm mb-2 ${
                    activeView === view.id ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {view.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {view.features.slice(0, isCompactMode ? 2 : 4).map((feature, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {view.features.length > (isCompactMode ? 2 : 4) && (
                      <Badge variant="outline" className="text-xs">
                        +{view.features.length - (isCompactMode ? 2 : 4)} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                {activeView === view.id && (
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Simulation requirement notice */}
        {DASHBOARD_VIEWS.some(view => view.requiresSimulation && !(simulationResults || simulationData)) && (
          <Alert className="mt-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Some views require simulation data to be available. Run a simulation to unlock all dashboard features.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {renderDashboardHeader()}
      {renderViewSelector()}
      
      {/* Active View Content */}
      <Card className="min-h-[600px]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {(() => {
                const view = DASHBOARD_VIEWS.find(v => v.id === activeView);
                return view ? (
                  <>
                    <view.icon className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-xl">{view.name}</CardTitle>
                  </>
                ) : null;
              })()}
            </div>
            
            <div className="flex items-center space-x-2">
              {onSimulationControl && (
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant={isSimulationRunning ? "secondary" : "default"}
                    onClick={() => handleSimulationControl(isSimulationRunning ? 'pause' : 'play')}
                  >
                    {isSimulationRunning ? (
                      <PauseCircle className="w-4 h-4" />
                    ) : (
                      <PlayCircle className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSimulationControl('stop')}
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {showAdvancedControls && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select value={activeView} onValueChange={handleViewChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableViews.map((view) => (
                      <SelectItem key={view.id} value={view.id}>
                        {view.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="advanced-compact"
                    checked={isCompactMode}
                    onCheckedChange={setIsCompactMode}
                  />
                  <Label htmlFor="advanced-compact">Compact View</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="advanced-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="advanced-refresh">Auto Refresh</Label>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reset Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="h-full">
          {renderActiveView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedResultsDashboard; 