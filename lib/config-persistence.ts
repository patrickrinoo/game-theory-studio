// Configuration Persistence Utilities for Game Theory Simulator
// Handles saving, loading, and managing game configurations

import { GameScenario, SimulationParameters, GameConfiguration } from './game-theory-types'

// Storage schema for saved configurations
export interface SavedConfiguration {
  id: string
  version: string
  name: string
  description?: string
  tags: string[]
  scenario: GameScenario
  parameters: SimulationParameters
  metadata: {
    created: Date
    modified: Date
    accessed: Date
    isTemplate: boolean
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    source: 'user' | 'template' | 'import' | 'shared'
    usageCount: number
  }
}

// Search and filter options
export interface ConfigurationFilter {
  search?: string
  tags?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  source?: 'user' | 'template' | 'import' | 'shared'
  dateRange?: {
    start: Date
    end: Date
  }
}

// Export/Import format
export interface ExportFormat {
  version: string
  exportDate: Date
  configurations: SavedConfiguration[]
  metadata: {
    appVersion: string
    source: string
  }
}

// Configuration persistence class
export class ConfigurationPersistence {
  private static readonly STORAGE_PREFIX = 'gametheory_config_'
  private static readonly METADATA_KEY = 'gametheory_metadata'
  private static readonly CURRENT_VERSION = '1.0.0'
  private static readonly MAX_STORAGE_ITEMS = 100

  // Generate unique ID for configurations
  static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get storage key for configuration
  static getStorageKey(id: string): string {
    return `${this.STORAGE_PREFIX}${id}`
  }

  // Check if localStorage is available
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      console.warn('localStorage is not available:', e)
      return false
    }
  }

  // Save configuration to localStorage
  static async saveConfiguration(
    scenario: GameScenario,
    parameters: SimulationParameters,
    options: {
      name: string
      description?: string
      tags?: string[]
      isTemplate?: boolean
      difficulty?: 'beginner' | 'intermediate' | 'advanced'
    }
  ): Promise<string> {
    if (!this.isStorageAvailable()) {
      throw new Error('Storage is not available')
    }

    const id = this.generateId()
    const now = new Date()

    const savedConfig: SavedConfiguration = {
      id,
      version: this.CURRENT_VERSION,
      name: options.name,
      description: options.description,
      tags: options.tags || [],
      scenario,
      parameters,
      metadata: {
        created: now,
        modified: now,
        accessed: now,
        isTemplate: options.isTemplate || false,
        difficulty: options.difficulty,
        source: 'user',
        usageCount: 0
      }
    }

    try {
      // Check storage quota and cleanup if necessary
      await this.checkAndCleanupStorage()

      // Save configuration
      localStorage.setItem(
        this.getStorageKey(id),
        JSON.stringify(savedConfig)
      )

      // Update metadata index
      await this.updateMetadataIndex(id, savedConfig)

      return id
    } catch (error) {
      console.error('Failed to save configuration:', error)
      throw new Error('Failed to save configuration')
    }
  }

  // Load configuration by ID
  static async loadConfiguration(id: string): Promise<SavedConfiguration | null> {
    if (!this.isStorageAvailable()) {
      return null
    }

    try {
      const stored = localStorage.getItem(this.getStorageKey(id))
      if (!stored) {
        return null
      }

      const config: SavedConfiguration = JSON.parse(stored)
      
      // Update access time
      config.metadata.accessed = new Date()
      config.metadata.usageCount += 1
      
      // Save back updated metadata
      localStorage.setItem(this.getStorageKey(id), JSON.stringify(config))
      
      return config
    } catch (error) {
      console.error('Failed to load configuration:', error)
      return null
    }
  }

  // List all saved configurations with filtering
  static async listConfigurations(filter?: ConfigurationFilter): Promise<SavedConfiguration[]> {
    if (!this.isStorageAvailable()) {
      return []
    }

    const configurations: SavedConfiguration[] = []

    try {
      // Get all configuration keys
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.STORAGE_PREFIX)
      )

      // Load and filter configurations
      for (const key of keys) {
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            const config: SavedConfiguration = JSON.parse(stored)
            
            // Apply filters
            if (this.matchesFilter(config, filter)) {
              configurations.push(config)
            }
          } catch (e) {
            console.warn('Corrupted configuration found:', key)
          }
        }
      }

      // Sort by modified date (newest first)
      configurations.sort((a, b) => 
        new Date(b.metadata.modified).getTime() - new Date(a.metadata.modified).getTime()
      )

      return configurations
    } catch (error) {
      console.error('Failed to list configurations:', error)
      return []
    }
  }

  // Delete configuration
  static async deleteConfiguration(id: string): Promise<boolean> {
    if (!this.isStorageAvailable()) {
      return false
    }

    try {
      localStorage.removeItem(this.getStorageKey(id))
      await this.removeFromMetadataIndex(id)
      return true
    } catch (error) {
      console.error('Failed to delete configuration:', error)
      return false
    }
  }

  // Update existing configuration
  static async updateConfiguration(
    id: string,
    updates: Partial<Pick<SavedConfiguration, 'name' | 'description' | 'tags' | 'scenario' | 'parameters'>>
  ): Promise<boolean> {
    const existing = await this.loadConfiguration(id)
    if (!existing) {
      return false
    }

    const updated: SavedConfiguration = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        modified: new Date()
      }
    }

    try {
      localStorage.setItem(this.getStorageKey(id), JSON.stringify(updated))
      return true
    } catch (error) {
      console.error('Failed to update configuration:', error)
      return false
    }
  }

  // Export configurations to JSON
  static async exportConfigurations(ids?: string[]): Promise<ExportFormat> {
    const configurations = await this.listConfigurations()
    const filtered = ids 
      ? configurations.filter(config => ids.includes(config.id))
      : configurations

    return {
      version: this.CURRENT_VERSION,
      exportDate: new Date(),
      configurations: filtered,
      metadata: {
        appVersion: this.CURRENT_VERSION,
        source: 'Game Theory Simulator'
      }
    }
  }

  // Import configurations from JSON
  static async importConfigurations(data: ExportFormat, options?: {
    overwriteExisting?: boolean
    addPrefix?: string
  }): Promise<{
    imported: number
    errors: string[]
    ids: string[]
  }> {
    const result = {
      imported: 0,
      errors: [] as string[],
      ids: [] as string[]
    }

    if (!this.isStorageAvailable()) {
      result.errors.push('Storage is not available')
      return result
    }

    for (const config of data.configurations) {
      try {
        // Validate configuration structure
        if (!this.validateConfiguration(config)) {
          result.errors.push(`Invalid configuration: ${config.name}`)
          continue
        }

        // Check if ID already exists
        const existingConfig = await this.loadConfiguration(config.id)
        if (existingConfig && !options?.overwriteExisting) {
          // Generate new ID for import
          const newId = this.generateId()
          config.id = newId
          config.name = options?.addPrefix 
            ? `${options.addPrefix}${config.name}`
            : `Imported: ${config.name}`
          config.metadata.source = 'import'
          config.metadata.created = new Date()
          config.metadata.modified = new Date()
        }

        // Save configuration
        localStorage.setItem(
          this.getStorageKey(config.id),
          JSON.stringify(config)
        )

        result.imported++
        result.ids.push(config.id)
      } catch (error) {
        result.errors.push(`Failed to import ${config.name}: ${error}`)
      }
    }

    return result
  }

  // Generate shareable URL
  static async generateShareableUrl(id: string, baseUrl: string = window.location.origin): Promise<string | null> {
    const config = await this.loadConfiguration(id)
    if (!config) {
      return null
    }

    try {
      // Create minimal share data
      const shareData = {
        name: config.name,
        scenario: config.scenario,
        parameters: config.parameters
      }

      // Compress and encode
      const encoded = btoa(JSON.stringify(shareData))
      
      // Check URL length (most browsers support ~2000 chars)
      const url = `${baseUrl}?config=${encoded}`
      if (url.length > 2000) {
        console.warn('Share URL is too long, consider using a URL shortener')
      }

      return url
    } catch (error) {
      console.error('Failed to generate shareable URL:', error)
      return null
    }
  }

  // Load configuration from URL
  static loadFromUrl(url: string): GameConfiguration | null {
    try {
      const urlParams = new URLSearchParams(new URL(url).search)
      const encoded = urlParams.get('config')
      
      if (!encoded) {
        return null
      }

      const decoded = JSON.parse(atob(encoded))
      
      // Validate basic structure
      if (!decoded.scenario || !decoded.parameters) {
        throw new Error('Invalid configuration data')
      }

      return {
        scenario: decoded.scenario,
        parameters: decoded.parameters
      }
    } catch (error) {
      console.error('Failed to load configuration from URL:', error)
      return null
    }
  }

  // Private helper methods
  private static matchesFilter(config: SavedConfiguration, filter?: ConfigurationFilter): boolean {
    if (!filter) return true

    // Search filter
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase()
      const searchableText = [
        config.name,
        config.description || '',
        config.scenario.name,
        config.scenario.description,
        ...config.tags
      ].join(' ').toLowerCase()

      if (!searchableText.includes(searchTerm)) {
        return false
      }
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag => 
        config.tags.includes(tag)
      )
      if (!hasMatchingTag) {
        return false
      }
    }

    // Difficulty filter
    if (filter.difficulty && config.metadata.difficulty !== filter.difficulty) {
      return false
    }

    // Source filter
    if (filter.source && config.metadata.source !== filter.source) {
      return false
    }

    // Date range filter
    if (filter.dateRange) {
      const modifiedDate = new Date(config.metadata.modified)
      if (modifiedDate < filter.dateRange.start || modifiedDate > filter.dateRange.end) {
        return false
      }
    }

    return true
  }

  private static validateConfiguration(config: SavedConfiguration): boolean {
    return !!(
      config.id &&
      config.name &&
      config.scenario &&
      config.parameters &&
      config.metadata
    )
  }

  private static async checkAndCleanupStorage(): Promise<void> {
    try {
      const configs = await this.listConfigurations()
      
      if (configs.length >= this.MAX_STORAGE_ITEMS) {
        // Remove oldest non-template configurations
        const nonTemplates = configs
          .filter(config => !config.metadata.isTemplate)
          .sort((a, b) => 
            new Date(a.metadata.accessed).getTime() - new Date(b.metadata.accessed).getTime()
          )

        // Remove oldest 10% of configurations
        const toRemove = Math.ceil(nonTemplates.length * 0.1)
        for (let i = 0; i < toRemove && i < nonTemplates.length; i++) {
          await this.deleteConfiguration(nonTemplates[i].id)
        }
      }
    } catch (error) {
      console.warn('Storage cleanup failed:', error)
    }
  }

  private static async updateMetadataIndex(id: string, config: SavedConfiguration): Promise<void> {
    try {
      const metadata = this.getStorageMetadata()
      metadata.configurations[id] = {
        name: config.name,
        modified: config.metadata.modified,
        isTemplate: config.metadata.isTemplate
      }
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.warn('Failed to update metadata index:', error)
    }
  }

  private static async removeFromMetadataIndex(id: string): Promise<void> {
    try {
      const metadata = this.getStorageMetadata()
      delete metadata.configurations[id]
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.warn('Failed to remove from metadata index:', error)
    }
  }

  private static getStorageMetadata(): any {
    try {
      const stored = localStorage.getItem(this.METADATA_KEY)
      return stored ? JSON.parse(stored) : { configurations: {} }
    } catch (error) {
      return { configurations: {} }
    }
  }
} 