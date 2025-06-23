import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ScenarioLibrary, SCENARIO_CATEGORIES } from '../lib/scenario-library'
import { GameType, PlayerBehavior } from '../lib/game-theory-types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

describe('ScenarioLibrary', () => {
  let library: ScenarioLibrary
  
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
    
    // Reset singleton instance
    ;(ScenarioLibrary as any).instance = undefined
    library = ScenarioLibrary.getInstance()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const library2 = ScenarioLibrary.getInstance()
      expect(library).toBe(library2)
    })
  })

  describe('Preset Scenarios', () => {
    it('should initialize with preset scenarios', () => {
      const scenarios = library.getScenarios({ isPreset: true })
      expect(scenarios.length).toBeGreaterThan(0)
    })

    it('should have proper categories for preset scenarios', () => {
      const scenarios = library.getScenarios({ isPreset: true })
      scenarios.forEach(scenario => {
        expect(Object.keys(SCENARIO_CATEGORIES)).toContain(scenario.category.toUpperCase())
      })
    })

    it('should have Prisoner\'s Dilemma preset', () => {
      const prisonersScenario = library.loadScenario('preset-prisoners_dilemma')
      expect(prisonersScenario).toBeTruthy()
      expect(prisonersScenario?.name).toBe("Prisoner's Dilemma")
      expect(prisonersScenario?.type).toBe(GameType.PRISONERS_DILEMMA)
    })

    it('should not allow deletion of preset scenarios', () => {
      const result = library.deleteScenario('preset-prisoners_dilemma')
      expect(result).toBe(false)
    })
  })

  describe('Custom Scenarios', () => {
    const mockCustomScenario = {
      id: 'custom-test-1',
      name: 'Test Custom Game',
      description: 'A test custom game scenario',
      type: GameType.CUSTOM,
      payoffMatrix: {
        players: 2,
        strategies: [
          { id: 'a', name: 'Action A', description: 'First action', shortName: 'A' },
          { id: 'b', name: 'Action B', description: 'Second action', shortName: 'B' }
        ],
        payoffs: [[[2, 1], [0, 3]], [[3, 0], [1, 2]]],
        isSymmetric: false
      },
      players: [
        {
          id: 'player-1',
          name: 'Player 1',
          strategyType: 'pure' as const,
          behavior: PlayerBehavior.RATIONAL,
          color: '#3b82f6'
        },
        {
          id: 'player-2',
          name: 'Player 2',
          strategyType: 'pure' as const,
          behavior: PlayerBehavior.RATIONAL,
          color: '#ef4444'
        }
      ],
      difficulty: 'intermediate' as const,
      tags: ['custom', 'test'],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should save custom scenarios', () => {
      const scenarioId = library.saveScenario(mockCustomScenario)
      expect(scenarioId).toBe(mockCustomScenario.id)
      
      const saved = library.loadScenario(scenarioId)
      expect(saved).toBeTruthy()
      expect(saved?.name).toBe(mockCustomScenario.name)
      expect(saved?.isPreset).toBe(false)
    })

    it('should allow deletion of custom scenarios', () => {
      library.saveScenario(mockCustomScenario)
      const result = library.deleteScenario(mockCustomScenario.id)
      expect(result).toBe(true)
      
      const deleted = library.loadScenario(mockCustomScenario.id)
      expect(deleted).toBeNull()
    })

    it('should update custom scenarios', () => {
      library.saveScenario(mockCustomScenario)
      
      const updates = {
        name: 'Updated Test Game',
        description: 'Updated description'
      }
      
      const result = library.updateScenario(mockCustomScenario.id, updates)
      expect(result).toBe(true)
      
      const updated = library.loadScenario(mockCustomScenario.id)
      expect(updated?.name).toBe(updates.name)
      expect(updated?.description).toBe(updates.description)
    })

    it('should not allow updates to preset scenarios', () => {
      const result = library.updateScenario('preset-prisoners_dilemma', {
        name: 'Modified Preset'
      })
      expect(result).toBe(false)
    })
  })

  describe('Filtering and Search', () => {
    beforeEach(() => {
      // Add some custom scenarios for testing
      const customScenarios = [
        {
          id: 'test-economics-1',
          name: 'Market Competition',
          description: 'Economic competition scenario',
          type: GameType.CUSTOM,
          payoffMatrix: {
            players: 2,
            strategies: [],
            payoffs: [],
            isSymmetric: false
          },
          players: [],
          difficulty: 'intermediate' as const,
          tags: ['economics', 'competition'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-social-1',
          name: 'Social Cooperation',
          description: 'Social interaction scenario',
          type: GameType.CUSTOM,
          payoffMatrix: {
            players: 3,
            strategies: [],
            payoffs: [],
            isSymmetric: true
          },
          players: [],
          difficulty: 'beginner' as const,
          tags: ['social', 'cooperation'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      
      customScenarios.forEach(scenario => library.saveScenario(scenario))
    })

    it('should filter by category', () => {
      const classicScenarios = library.getScenarios({ categories: ['classic'] })
      expect(classicScenarios.length).toBeGreaterThan(0)
      classicScenarios.forEach(scenario => {
        expect(scenario.category).toBe('classic')
      })
    })

    it('should filter by difficulty', () => {
      const beginnerScenarios = library.getScenarios({ difficulty: ['beginner'] })
      expect(beginnerScenarios.length).toBeGreaterThan(0)
      beginnerScenarios.forEach(scenario => {
        expect(scenario.difficulty).toBe('beginner')
      })
    })

    it('should filter by preset status', () => {
      const presetScenarios = library.getScenarios({ isPreset: true })
      const customScenarios = library.getScenarios({ isPreset: false })
      
      expect(presetScenarios.length).toBeGreaterThan(0)
      expect(customScenarios.length).toBeGreaterThan(0)
      
      presetScenarios.forEach(scenario => expect(scenario.isPreset).toBe(true))
      customScenarios.forEach(scenario => expect(scenario.isPreset).toBe(false))
    })

    it('should search by name and description', () => {
      const searchResults = library.getScenarios({ searchQuery: 'competition' })
      expect(searchResults.length).toBeGreaterThan(0)
      
      searchResults.forEach(scenario => {
        const matchesName = scenario.name.toLowerCase().includes('competition')
        const matchesDescription = scenario.description.toLowerCase().includes('competition')
        const matchesTags = scenario.tags.some(tag => tag.toLowerCase().includes('competition'))
        
        expect(matchesName || matchesDescription || matchesTags).toBe(true)
      })
    })

    it('should filter by tags', () => {
      const economicsScenarios = library.getScenarios({ tags: ['economics'] })
      expect(economicsScenarios.length).toBeGreaterThan(0)
      economicsScenarios.forEach(scenario => {
        expect(scenario.tags).toContain('economics')
      })
    })

    it('should combine multiple filters', () => {
      const filteredScenarios = library.getScenarios({
        categories: ['custom'],
        difficulty: ['beginner'],
        isPreset: false
      })
      
      filteredScenarios.forEach(scenario => {
        expect(scenario.category).toBe('custom')
        expect(scenario.difficulty).toBe('beginner')
        expect(scenario.isPreset).toBe(false)
      })
    })
  })

  describe('Usage Statistics', () => {
    it('should track scenario usage', () => {
      const scenarioId = 'preset-prisoners_dilemma'
      const initialScenario = library.loadScenario(scenarioId)
      const initialUsage = initialScenario?.usage || 0
      
      // Load the scenario multiple times
      library.loadScenario(scenarioId)
      library.loadScenario(scenarioId)
      
      const updatedScenario = library.loadScenario(scenarioId)
      expect(updatedScenario?.usage).toBe(initialUsage + 3) // +3 because we loaded it 3 times total
    })

    it('should update last used timestamp', () => {
      const scenarioId = 'preset-prisoners_dilemma'
      const beforeTime = Date.now()
      
      library.loadScenario(scenarioId)
      
      const scenario = library.loadScenario(scenarioId)
      const afterTime = Date.now()
      
      expect(scenario?.lastUsed.getTime()).toBeGreaterThanOrEqual(beforeTime)
      expect(scenario?.lastUsed.getTime()).toBeLessThanOrEqual(afterTime)
    })

    it('should provide library statistics', () => {
      const stats = library.getStats()
      
      expect(stats.totalScenarios).toBeGreaterThan(0)
      expect(stats.presetScenarios).toBeGreaterThan(0)
      expect(stats.totalScenarios).toBe(stats.presetScenarios + stats.customScenarios)
      expect(typeof stats.categoryCounts).toBe('object')
      expect(Array.isArray(stats.mostUsedScenarios)).toBe(true)
      expect(Array.isArray(stats.recentlyUsed)).toBe(true)
    })
  })

  describe('Import/Export', () => {
    const testScenarios = [
      {
        id: 'export-test-1',
        name: 'Export Test 1',
        description: 'Test scenario for export',
        type: GameType.CUSTOM,
        payoffMatrix: {
          players: 2,
          strategies: [],
          payoffs: [],
          isSymmetric: false
        },
        players: [],
        difficulty: 'intermediate' as const,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        category: 'custom',
        isPreset: false,
        usage: 0,
        lastUsed: new Date(),
        author: 'Test User'
      }
    ]

    it('should export custom scenarios only', () => {
      testScenarios.forEach(scenario => library.saveScenario(scenario))
      
      const exportData = library.exportScenarios(false)
      const exported = JSON.parse(exportData)
      
      expect(Array.isArray(exported)).toBe(true)
      exported.forEach((scenario: any) => {
        expect(scenario.isPreset).toBe(false)
      })
    })

    it('should export all scenarios when requested', () => {
      const exportData = library.exportScenarios(true)
      const exported = JSON.parse(exportData)
      
      expect(Array.isArray(exported)).toBe(true)
      expect(exported.length).toBeGreaterThan(0)
      
      const hasPresets = exported.some((scenario: any) => scenario.isPreset)
      const hasCustom = exported.some((scenario: any) => !scenario.isPreset)
      
      expect(hasPresets).toBe(true)
    })

    it('should import scenarios successfully', () => {
      const importData = JSON.stringify(testScenarios)
      const result = library.importScenarios(importData)
      
      expect(result.success).toBe(testScenarios.length)
      expect(result.errors.length).toBe(0)
      
      // Verify scenarios were imported
      const allScenarios = library.getScenarios()
      const importedScenario = allScenarios.find(s => s.name === testScenarios[0].name)
      expect(importedScenario).toBeTruthy()
    })

    it('should handle invalid import data', () => {
      const invalidData = '{ invalid json }'
      const result = library.importScenarios(invalidData)
      
      expect(result.success).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate imported scenarios', () => {
      const invalidScenarios = [
        { name: 'Invalid Scenario' }, // Missing required fields
        null,
        'not an object'
      ]
      
      const importData = JSON.stringify(invalidScenarios)
      const result = library.importScenarios(importData)
      
      expect(result.success).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Storage Integration', () => {
    it('should save to localStorage when scenarios are modified', () => {
      const mockScenario = {
        id: 'storage-test',
        name: 'Storage Test',
        description: 'Test storage functionality',
        type: GameType.CUSTOM,
        payoffMatrix: {
          players: 2,
          strategies: [],
          payoffs: [],
          isSymmetric: false
        },
        players: [],
        difficulty: 'intermediate' as const,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      library.saveScenario(mockScenario)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'game-theory-scenarios',
        expect.any(String)
      )
    })

    it('should handle storage errors gracefully', () => {
      // Simulate storage error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const mockScenario = {
        id: 'error-test',
        name: 'Error Test',
        description: 'Test error handling',
        type: GameType.CUSTOM,
        payoffMatrix: {
          players: 2,
          strategies: [],
          payoffs: [],
          isSymmetric: false
        },
        players: [],
        difficulty: 'intermediate' as const,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Should not throw error
      expect(() => library.saveScenario(mockScenario)).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Category Management', () => {
    it('should have all required scenario categories', () => {
      const expectedCategories = ['CLASSIC', 'ECONOMICS', 'POLITICS', 'SOCIAL', 'BIOLOGY', 'CUSTOM']
      
      expectedCategories.forEach(category => {
        expect(SCENARIO_CATEGORIES[category]).toBeTruthy()
        expect(SCENARIO_CATEGORIES[category].id).toBeTruthy()
        expect(SCENARIO_CATEGORIES[category].name).toBeTruthy()
        expect(SCENARIO_CATEGORIES[category].description).toBeTruthy()
        expect(SCENARIO_CATEGORIES[category].color).toBeTruthy()
      })
    })

    it('should get scenarios by category', () => {
      const classicScenarios = library.getScenariosByCategory('classic')
      expect(classicScenarios.length).toBeGreaterThan(0)
      classicScenarios.forEach(scenario => {
        expect(scenario.category).toBe('classic')
      })
    })
  })

  describe('Cleanup Operations', () => {
    it('should clear custom scenarios while preserving presets', () => {
      // Add some custom scenarios
      const customScenario = {
        id: 'clear-test',
        name: 'Clear Test',
        description: 'Test clearing functionality',
        type: GameType.CUSTOM,
        payoffMatrix: {
          players: 2,
          strategies: [],
          payoffs: [],
          isSymmetric: false
        },
        players: [],
        difficulty: 'intermediate' as const,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      library.saveScenario(customScenario)
      
      const beforeClear = library.getStats()
      expect(beforeClear.customScenarios).toBeGreaterThan(0)
      
      library.clearCustomScenarios()
      
      const afterClear = library.getStats()
      expect(afterClear.customScenarios).toBe(0)
      expect(afterClear.presetScenarios).toBe(beforeClear.presetScenarios)
    })
  })
}) 