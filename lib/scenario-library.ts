import { GameScenario, GameType, Strategy, PlayerBehavior } from './game-theory-types'
import { GAME_TEMPLATES } from './game-templates'

export interface ScenarioCategory {
  id: string
  name: string
  description: string
  color: string
  icon?: string
}

export interface ScenarioLibraryItem extends GameScenario {
  category: string
  isPreset: boolean
  rating?: number
  usage: number
  lastUsed: Date
  author?: string
  isPublic?: boolean
  thumbnail?: string
}

export interface ScenarioFilter {
  categories?: string[]
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[]
  tags?: string[]
  gameType?: GameType[]
  isPreset?: boolean
  minRating?: number
  searchQuery?: string
}

export interface ScenarioLibraryStats {
  totalScenarios: number
  presetScenarios: number
  customScenarios: number
  categoryCounts: Record<string, number>
  mostUsedScenarios: ScenarioLibraryItem[]
  recentlyUsed: ScenarioLibraryItem[]
}

// Predefined scenario categories
export const SCENARIO_CATEGORIES: Record<string, ScenarioCategory> = {
  CLASSIC: {
    id: 'classic',
    name: 'Classic Games',
    description: 'Traditional game theory scenarios',
    color: '#3b82f6',
    icon: '🎯'
  },
  ECONOMICS: {
    id: 'economics',
    name: 'Economics',
    description: 'Economic and market-based scenarios',
    color: '#10b981',
    icon: '💰'
  },
  POLITICS: {
    id: 'politics',
    name: 'Politics',
    description: 'Political and diplomatic scenarios',
    color: '#8b5cf6',
    icon: '🏛️'
  },
  SOCIAL: {
    id: 'social',
    name: 'Social',
    description: 'Social interaction and cooperation',
    color: '#f59e0b',
    icon: '👥'
  },
  BIOLOGY: {
    id: 'biology',
    name: 'Biology',
    description: 'Evolutionary and biological scenarios',
    color: '#ef4444',
    icon: '🧬'
  },
  CUSTOM: {
    id: 'custom',
    name: 'Custom',
    description: 'User-created scenarios',
    color: '#6b7280',
    icon: '⚙️'
  }
}

export class ScenarioLibrary {
  private static instance: ScenarioLibrary
  private scenarios: Map<string, ScenarioLibraryItem> = new Map()
  private readonly STORAGE_KEY = 'game-theory-scenarios'
  private readonly STATS_KEY = 'scenario-library-stats'

  private constructor() {
    this.loadFromStorage()
    this.initializePresetScenarios()
  }

  static getInstance(): ScenarioLibrary {
    if (!ScenarioLibrary.instance) {
      ScenarioLibrary.instance = new ScenarioLibrary()
    }
    return ScenarioLibrary.instance
  }

  // Initialize preset scenarios from game templates
  private initializePresetScenarios(): void {
    const presetScenarios = this.createPresetScenarios()
    
    presetScenarios.forEach(scenario => {
      if (!this.scenarios.has(scenario.id)) {
        this.scenarios.set(scenario.id, scenario)
      }
    })
    
    this.saveToStorage()
  }

  private createPresetScenarios(): ScenarioLibraryItem[] {
    const scenarios: ScenarioLibraryItem[] = []

    // Convert game templates to scenario library items
    Object.values(GAME_TEMPLATES).forEach(template => {
      const scenario: ScenarioLibraryItem = {
        id: `preset-${template.type}`,
        name: template.name,
        description: template.description,
        type: template.type,
        payoffMatrix: {
          players: 2,
          strategies: template.strategies,
          payoffs: template.payoffMatrix,
          isSymmetric: this.isSymmetricMatrix(template.payoffMatrix)
        },
        players: template.defaultPlayers.map((player, index) => ({
          id: `player-${index}`,
          name: player.name || `Player ${index + 1}`,
          strategyType: 'pure' as const,
          behavior: player.behavior || PlayerBehavior.RATIONAL,
          color: player.color || this.getDefaultPlayerColor(index)
        })),
        realWorldExample: template.realWorldExample,
        difficulty: this.inferDifficulty(template.type),
        tags: this.generateTags(template),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        category: this.inferCategory(template.type),
        isPreset: true,
        rating: this.getPresetRating(template.type),
        usage: 0,
        lastUsed: new Date(),
        author: 'Game Theory Studio',
        isPublic: true
      }
      
      scenarios.push(scenario)
    })

    return scenarios
  }

  private isSymmetricMatrix(matrix: number[][][]): boolean {
    // Check if the payoff matrix is symmetric
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j][0] !== matrix[j][i][1] || matrix[i][j][1] !== matrix[j][i][0]) {
          return false
        }
      }
    }
    return true
  }

  private inferDifficulty(gameType: GameType): 'beginner' | 'intermediate' | 'advanced' {
    const difficultyMap: Record<GameType, 'beginner' | 'intermediate' | 'advanced'> = {
      [GameType.PRISONERS_DILEMMA]: 'beginner',
      [GameType.STAG_HUNT]: 'beginner',
      [GameType.BATTLE_OF_SEXES]: 'intermediate',
      [GameType.CHICKEN_GAME]: 'intermediate',
      [GameType.HAWK_DOVE]: 'intermediate',
      [GameType.MATCHING_PENNIES]: 'advanced',
      [GameType.PUBLIC_GOODS]: 'advanced',
      [GameType.COORDINATION]: 'beginner',
      [GameType.CUSTOM]: 'intermediate'
    }
    return difficultyMap[gameType] || 'intermediate'
  }

  private inferCategory(gameType: GameType): string {
    const categoryMap: Record<GameType, string> = {
      [GameType.PRISONERS_DILEMMA]: 'classic',
      [GameType.STAG_HUNT]: 'classic',
      [GameType.BATTLE_OF_SEXES]: 'social',
      [GameType.CHICKEN_GAME]: 'politics',
      [GameType.HAWK_DOVE]: 'biology',
      [GameType.MATCHING_PENNIES]: 'classic',
      [GameType.PUBLIC_GOODS]: 'economics',
      [GameType.COORDINATION]: 'social',
      [GameType.CUSTOM]: 'custom'
    }
    return categoryMap[gameType] || 'custom'
  }

  private generateTags(template: any): string[] {
    const tags: string[] = []
    
    // Add difficulty-based tags
    const difficulty = this.inferDifficulty(template.type)
    tags.push(difficulty)
    
    // Add type-based tags
    if (template.type.includes('dilemma')) tags.push('dilemma')
    if (template.type.includes('coordination')) tags.push('coordination')
    if (template.type.includes('competition')) tags.push('competition')
    
    // Add behavioral tags based on real-world examples
    if (template.realWorldExample?.includes('cooperation')) tags.push('cooperation')
    if (template.realWorldExample?.includes('conflict')) tags.push('conflict')
    if (template.realWorldExample?.includes('trade')) tags.push('trade')
    if (template.realWorldExample?.includes('war')) tags.push('warfare')
    
    // Add educational tags
    tags.push('educational', 'simulation')
    
    return [...new Set(tags)] // Remove duplicates
  }

  private getPresetRating(gameType: GameType): number {
    // Assign ratings based on educational value and popularity
    const ratingMap: Record<GameType, number> = {
      [GameType.PRISONERS_DILEMMA]: 5.0,
      [GameType.STAG_HUNT]: 4.5,
      [GameType.BATTLE_OF_SEXES]: 4.2,
      [GameType.CHICKEN_GAME]: 4.0,
      [GameType.HAWK_DOVE]: 4.3,
      [GameType.MATCHING_PENNIES]: 3.8,
      [GameType.PUBLIC_GOODS]: 4.1,
      [GameType.COORDINATION]: 3.9,
      [GameType.CUSTOM]: 3.5
    }
    return ratingMap[gameType] || 3.5
  }

  private getDefaultPlayerColor(index: number): string {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
    return colors[index % colors.length]
  }

  // Save scenario to library
  saveScenario(scenario: GameScenario, isCustom: boolean = true): string {
    const libraryItem: ScenarioLibraryItem = {
      ...scenario,
      category: isCustom ? 'custom' : this.inferCategory(scenario.type),
      isPreset: !isCustom,
      rating: 0,
      usage: 0,
      lastUsed: new Date(),
      author: 'User',
      isPublic: false
    }

    this.scenarios.set(scenario.id, libraryItem)
    this.saveToStorage()
    
    return scenario.id
  }

  // Load scenario by ID
  loadScenario(id: string): ScenarioLibraryItem | null {
    const scenario = this.scenarios.get(id)
    if (scenario) {
      // Update usage statistics
      scenario.usage += 1
      scenario.lastUsed = new Date()
      this.saveToStorage()
    }
    return scenario || null
  }

  // Get all scenarios with optional filtering
  getScenarios(filter?: ScenarioFilter): ScenarioLibraryItem[] {
    let scenarios = Array.from(this.scenarios.values())

    if (filter) {
      scenarios = scenarios.filter(scenario => {
        // Category filter
        if (filter.categories && !filter.categories.includes(scenario.category)) {
          return false
        }

        // Difficulty filter
        if (filter.difficulty && !filter.difficulty.includes(scenario.difficulty)) {
          return false
        }

        // Tags filter
        if (filter.tags && !filter.tags.some(tag => scenario.tags.includes(tag))) {
          return false
        }

        // Game type filter
        if (filter.gameType && !filter.gameType.includes(scenario.type)) {
          return false
        }

        // Preset filter
        if (filter.isPreset !== undefined && scenario.isPreset !== filter.isPreset) {
          return false
        }

        // Rating filter
        if (filter.minRating && (!scenario.rating || scenario.rating < filter.minRating)) {
          return false
        }

        // Search query filter
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase()
          return (
            scenario.name.toLowerCase().includes(query) ||
            scenario.description.toLowerCase().includes(query) ||
            scenario.tags.some(tag => tag.toLowerCase().includes(query))
          )
        }

        return true
      })
    }

    return scenarios.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
  }

  // Get scenarios by category
  getScenariosByCategory(categoryId: string): ScenarioLibraryItem[] {
    return this.getScenarios({ categories: [categoryId] })
  }

  // Get library statistics
  getStats(): ScenarioLibraryStats {
    const scenarios = Array.from(this.scenarios.values())
    const categoryCounts: Record<string, number> = {}

    scenarios.forEach(scenario => {
      categoryCounts[scenario.category] = (categoryCounts[scenario.category] || 0) + 1
    })

    const mostUsed = scenarios
      .filter(s => s.usage > 0)
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)

    const recentlyUsed = scenarios
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, 10)

    return {
      totalScenarios: scenarios.length,
      presetScenarios: scenarios.filter(s => s.isPreset).length,
      customScenarios: scenarios.filter(s => !s.isPreset).length,
      categoryCounts,
      mostUsedScenarios: mostUsed,
      recentlyUsed
    }
  }

  // Delete scenario
  deleteScenario(id: string): boolean {
    const scenario = this.scenarios.get(id)
    if (scenario && !scenario.isPreset) {
      this.scenarios.delete(id)
      this.saveToStorage()
      return true
    }
    return false
  }

  // Update scenario
  updateScenario(id: string, updates: Partial<ScenarioLibraryItem>): boolean {
    const scenario = this.scenarios.get(id)
    if (scenario && !scenario.isPreset) {
      Object.assign(scenario, updates, { updatedAt: new Date() })
      this.saveToStorage()
      return true
    }
    return false
  }

  // Export scenarios to JSON
  exportScenarios(includePresets: boolean = false): string {
    const scenarios = Array.from(this.scenarios.values()).filter(
      s => includePresets || !s.isPreset
    )
    return JSON.stringify(scenarios, null, 2)
  }

  // Import scenarios from JSON
  importScenarios(jsonData: string): { success: number; errors: string[] } {
    const errors: string[] = []
    let success = 0

    try {
      const scenarios: ScenarioLibraryItem[] = JSON.parse(jsonData)
      
      scenarios.forEach((scenario, index) => {
        try {
          if (this.validateScenario(scenario)) {
            // Generate new ID to avoid conflicts
            const newId = `imported-${Date.now()}-${index}`
            scenario.id = newId
            scenario.isPreset = false
            scenario.createdAt = new Date()
            scenario.updatedAt = new Date()
            
            this.scenarios.set(newId, scenario)
            success++
          } else {
            errors.push(`Invalid scenario at index ${index}`)
          }
        } catch (err) {
          errors.push(`Error processing scenario at index ${index}: ${err}`)
        }
      })

      this.saveToStorage()
    } catch (err) {
      errors.push(`Invalid JSON format: ${err}`)
    }

    return { success, errors }
  }

  // Validate scenario structure
  private validateScenario(scenario: any): boolean {
    return (
      scenario &&
      typeof scenario.id === 'string' &&
      typeof scenario.name === 'string' &&
      typeof scenario.description === 'string' &&
      scenario.type &&
      scenario.payoffMatrix &&
      Array.isArray(scenario.players) &&
      Array.isArray(scenario.tags)
    )
  }

  // Storage methods
  private saveToStorage(): void {
    try {
      const data = Array.from(this.scenarios.entries())
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to save scenarios to storage:', err)
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        const entries: [string, ScenarioLibraryItem][] = JSON.parse(data)
        this.scenarios = new Map(entries.map(([id, scenario]) => [
          id,
          {
            ...scenario,
            createdAt: new Date(scenario.createdAt),
            updatedAt: new Date(scenario.updatedAt),
            lastUsed: new Date(scenario.lastUsed)
          }
        ]))
      }
    } catch (err) {
      console.error('Failed to load scenarios from storage:', err)
      this.scenarios = new Map()
    }
  }

  // Clear all custom scenarios (keep presets)
  clearCustomScenarios(): void {
    const presetScenarios = Array.from(this.scenarios.entries()).filter(
      ([_, scenario]) => scenario.isPreset
    )
    this.scenarios = new Map(presetScenarios)
    this.saveToStorage()
  }
} 