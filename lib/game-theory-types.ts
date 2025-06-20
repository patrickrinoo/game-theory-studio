// Game Theory Data Models and Types

// Enums for game types and strategies
export enum GameType {
  PRISONERS_DILEMMA = 'prisoners_dilemma',
  BATTLE_OF_SEXES = 'battle_of_sexes',
  CHICKEN_GAME = 'chicken_game',
  STAG_HUNT = 'stag_hunt',
  PUBLIC_GOODS = 'public_goods',
  HAWK_DOVE = 'hawk_dove',
  MATCHING_PENNIES = 'matching_pennies',
  COORDINATION = 'coordination',
  CUSTOM = 'custom'
}

export enum StrategyType {
  PURE = 'pure',
  MIXED = 'mixed',
  ADAPTIVE = 'adaptive',
  RANDOM = 'random'
}

export enum PlayerBehavior {
  RATIONAL = 'rational',
  AGGRESSIVE = 'aggressive',
  COOPERATIVE = 'cooperative',
  RANDOM = 'random',
  TIT_FOR_TAT = 'tit_for_tat',
  GRUDGER = 'grudger',
  PAVLOV = 'pavlov'
}

export enum SimulationStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// Core interfaces
export interface Player {
  id: string
  name: string
  strategyType: StrategyType
  behavior: PlayerBehavior
  pureStrategy?: number  // Index of chosen pure strategy
  mixedStrategy?: number[]  // Probability distribution over strategies
  adaptiveParams?: AdaptiveParams
  color?: string  // For visualization
}

export interface AdaptiveParams {
  learningRate: number
  explorationRate: number
  memoryLength: number
  initialBelief: number[]
}

export interface Strategy {
  id: string
  name: string
  description: string
  shortName: string
}

export interface PayoffMatrix {
  players: number
  strategies: Strategy[]
  payoffs: number[][][]  // [strategy1][strategy2][playerIndex]
  isSymmetric: boolean
}

export interface GameScenario {
  id: string
  name: string
  description: string
  type: GameType
  payoffMatrix: PayoffMatrix
  players: Player[]
  realWorldExample?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface SimulationParameters {
  iterations: number
  seed?: number
  convergenceCriteria?: ConvergenceCriteria
  batchSize: number
  useWebWorkers: boolean
  trackHistory: boolean
  progressUpdateInterval: number
}

export interface ConvergenceCriteria {
  enabled: boolean
  tolerance: number
  windowSize: number
  metric: 'strategy_frequency' | 'payoff_variance' | 'custom'
}

export interface SimulationResult {
  id: string
  gameScenario: GameScenario
  parameters: SimulationParameters
  status: SimulationStatus
  progress: number
  startTime: Date
  endTime?: Date
  elapsedTime?: number
  
  // Results data
  iterations: number
  outcomes: OutcomeFrequency
  strategyFrequencies: StrategyFrequency
  expectedPayoffs: number[]
  convergenceData: ConvergencePoint[]
  nashEquilibria: NashEquilibrium[]
  dominantStrategies: DominantStrategy[]
  
  // Statistical analysis
  statistics: SimulationStatistics
  
  // Historical data
  iterationHistory?: IterationHistory[]
}

export interface OutcomeFrequency {
  [outcomeKey: string]: {
    count: number
    percentage: number
    strategies: number[]
    payoffs: number[]
  }
}

export interface StrategyFrequency {
  [strategyKey: string]: {
    count: number
    percentage: number
    playerIndex: number
    strategyIndex: number
  }
}

export interface ConvergencePoint {
  iteration: number
  strategies: number[]
  payoffs: number[]
  variance: number
  isConverged: boolean
}

export interface NashEquilibrium {
  type: 'pure' | 'mixed'
  strategies: number[] | number[][]  // Pure: indices, Mixed: probabilities
  payoffs: number[]
  stability: number  // Measure of stability (0-1)
  isStrict: boolean
}

export interface DominantStrategy {
  playerIndex: number
  strategyIndex: number
  strategyName: string
  dominanceType: 'strict' | 'weak'
  dominatedStrategies: number[]
}

export interface SimulationStatistics {
  mean: number[]
  variance: number[]
  standardDeviation: number[]
  confidenceInterval: ConfidenceInterval[]
  correlations: number[][]
  entropy: number
  giniCoefficient: number
}

export interface ConfidenceInterval {
  playerIndex: number
  lower: number
  upper: number
  confidence: number  // e.g., 0.95 for 95%
}

export interface IterationHistory {
  iteration: number
  playerChoices: number[]
  payoffs: number[]
  cumulativePayoffs: number[]
  timestamp: number
}

// Game template definitions
export interface GameTemplate {
  type: GameType
  name: string
  description: string
  strategies: Strategy[]
  payoffMatrix: number[][][]
  defaultPlayers: Partial<Player>[]
  realWorldExample: string
  educationalNote: string
}

// Visualization data types
export interface ChartData {
  type: 'line' | 'bar' | 'scatter' | 'heatmap' | 'histogram'
  data: ChartPoint[]
  labels: string[]
  colors: string[]
  title: string
  xAxis: string
  yAxis: string
}

export interface ChartPoint {
  x: number | string
  y: number
  label?: string
  color?: string
  size?: number
}

// Event types for real-time updates
export interface SimulationEvent {
  type: 'progress' | 'convergence' | 'completed' | 'error'
  data: any
  timestamp: number
}

// Validation types
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// Export utility type for game scenario configurations
export interface GameConfiguration {
  scenario: GameScenario
  parameters: SimulationParameters
  exportFormat?: 'json' | 'csv' | 'excel'
  includeHistory?: boolean
} 