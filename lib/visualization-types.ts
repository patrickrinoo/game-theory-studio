import { SimulationResult, Player, Strategy, GameConfiguration } from './game-theory-types';

// Base visualization interfaces
export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ChartConfig extends ChartDimensions {
  responsive?: boolean;
  animation?: AnimationConfig;
  theme?: ChartTheme;
}

export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
  stagger?: number;
}

export interface ChartTheme {
  background: string;
  gridColor: string;
  textColor: string;
  axisColor: string;
  colors: string[];
  fontFamily: string;
  fontSize: number;
}

// Strategy Evolution Data Types
export interface StrategyEvolutionPoint {
  iteration: number;
  playerId: string;
  playerName: string;
  strategyId: string;
  strategyName: string;
  probability: number;
  payoff: number;
  timestamp: number;
}

export interface StrategyEvolutionSeries {
  playerId: string;
  playerName: string;
  strategyId: string;
  strategyName: string;
  color: string;
  data: StrategyEvolutionPoint[];
}

export interface StrategyEvolutionData {
  series: StrategyEvolutionSeries[];
  iterations: number[];
  players: Player[];
  strategies: Strategy[];
  config: GameConfiguration;
}

// Payoff Distribution Data Types
export interface PayoffDistributionBin {
  binStart: number;
  binEnd: number;
  binCenter: number;
  count: number;
  frequency: number;
  density: number;
  playerId: string;
  strategyId?: string;
}

export interface PayoffDistributionSeries {
  playerId: string;
  playerName: string;
  strategyId?: string;
  strategyName?: string;
  color: string;
  bins: PayoffDistributionBin[];
  statistics: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
  };
}

export interface PayoffDistributionData {
  series: PayoffDistributionSeries[];
  binCount: number;
  range: [number, number];
  overlayStatistics?: boolean;
}

// Nash Equilibrium Visualization Data Types
export interface NashEquilibriumPoint {
  x: number;
  y: number;
  z?: number;
  strategies: { [playerId: string]: number[] }; // Mixed strategy probabilities
  payoffs: { [playerId: string]: number };
  type: 'pure' | 'mixed' | 'approximate';
  stability: number; // 0-1 stability score
}

export interface BestResponseFunction {
  playerId: string;
  strategyIndex: number;
  points: { x: number; y: number }[];
  color: string;
}

export interface StrategySpaceData {
  equilibria: NashEquilibriumPoint[];
  bestResponseFunctions: BestResponseFunction[];
  dominatedRegions: {
    vertices: { x: number; y: number }[];
    type: 'strictly' | 'weakly';
  }[];
  players: Player[];
  strategies: Strategy[];
}

// Performance Dashboard Data Types
export interface PerformanceMetric {
  timestamp: number;
  iterationsPerSecond: number;
  memoryUsage: number; // MB
  convergenceScore: number; // 0-1
  cpuUsage?: number; // 0-100
  totalIterations: number;
  completedIterations: number;
}

export interface PerformanceData {
  metrics: PerformanceMetric[];
  targetIterations: number;
  startTime: number;
  estimatedCompletion?: number;
  bottlenecks: string[];
}

// Chart Configuration Types
export interface LineChartConfig extends ChartConfig {
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  showGrid: boolean;
  showLegend: boolean;
  interactive: boolean;
  zoom: boolean;
  pan: boolean;
}

export interface HistogramConfig extends ChartConfig {
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  binCount?: number;
  showDensity: boolean;
  showStatistics: boolean;
  overlayDistribution?: 'normal' | 'uniform' | 'exponential';
}

export interface ScatterPlotConfig extends ChartConfig {
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  pointSize: number;
  showTooltips: boolean;
  enableSelection: boolean;
  colorScale: 'categorical' | 'continuous';
}

export interface AxisConfig {
  label: string;
  scale: 'linear' | 'log' | 'sqrt' | 'time';
  domain?: [number, number];
  ticks?: number;
  format?: string;
  grid?: boolean;
}

// Export and Animation Types
export interface ExportConfig {
  format: 'png' | 'svg' | 'pdf' | 'gif';
  quality?: number;
  scale?: number;
  background?: string;
  filename?: string;
}

export interface AnimationState {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  speed: number; // 0.1 to 5.0
  loop: boolean;
}

export interface AnimationControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  step: (direction: 'forward' | 'backward') => void;
  setSpeed: (speed: number) => void;
  setFrame: (frame: number) => void;
  export: (config: ExportConfig) => Promise<void>;
}

// Interaction Types
export interface TooltipData {
  x: number;
  y: number;
  content: React.ReactNode;
  visible: boolean;
}

export interface SelectionData {
  selectedPoints: number[];
  selectedSeries: string[];
  selectionRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ZoomState {
  transform: {
    x: number;
    y: number;
    k: number; // scale factor
  };
  domain: {
    x: [number, number];
    y: [number, number];
  };
}

// Utility Types
export interface ChartDataPoint {
  x: number;
  y: number;
  z?: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries<T = ChartDataPoint> {
  id: string;
  name: string;
  data: T[];
  color: string;
  visible: boolean;
  style?: {
    strokeWidth?: number;
    strokeDasharray?: string;
    fillOpacity?: number;
  };
}

// Event Types
export interface ChartEventHandlers {
  onPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
  onPointHover?: (point: ChartDataPoint, series: ChartSeries) => void;
  onSeriesClick?: (series: ChartSeries) => void;
  onZoom?: (zoomState: ZoomState) => void;
  onSelection?: (selectionData: SelectionData) => void;
}

// Aggregated visualization data type for comprehensive game theory analysis
export interface GameTheoryVisualizationData {
  strategyEvolution: StrategyEvolutionData;
  payoffDistribution: PayoffDistributionData;
  nashEquilibrium: StrategySpaceData;
  performance: PerformanceData;
  gameResult: SimulationResult;
  config: GameConfiguration;
} 