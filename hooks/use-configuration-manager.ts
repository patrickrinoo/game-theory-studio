// React hook for managing game configurations

import { useState, useCallback, useEffect } from 'react'
import { ConfigurationPersistence, SavedConfiguration } from '@/lib/config-persistence'
import { GameScenario, SimulationParameters } from '@/lib/game-theory-types'

export interface UseConfigurationManagerReturn {
  // Configuration library
  configurations: SavedConfiguration[]
  isLoading: boolean
  error: string | null

  // Actions
  saveConfiguration: (
    scenario: GameScenario,
    parameters: SimulationParameters,
    options: { name: string; description?: string; tags?: string[] }
  ) => Promise<string | null>
  loadConfiguration: (id: string) => Promise<SavedConfiguration | null>
  deleteConfiguration: (id: string) => Promise<boolean>
  refreshConfigurations: () => Promise<void>
  
  // Export/Import
  exportConfigurations: (ids?: string[]) => Promise<string>
  importConfigurations: (jsonData: string) => Promise<{
    imported: number
    errors: string[]
  }>

  // Search and filter
  searchConfigurations: (query: string) => SavedConfiguration[]
  filterByTags: (tags: string[]) => SavedConfiguration[]
  
  // Quick actions
  duplicateConfiguration: (id: string, newName?: string) => Promise<string | null>
  clearAll: () => Promise<void>
}

export function useConfigurationManager(): UseConfigurationManagerReturn {
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all configurations on mount
  useEffect(() => {
    refreshConfigurations()
  }, [])

  const refreshConfigurations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const configs = await ConfigurationPersistence.listConfigurations()
      setConfigurations(configs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveConfiguration = useCallback(async (
    scenario: GameScenario,
    parameters: SimulationParameters,
    options: { name: string; description?: string; tags?: string[] }
  ): Promise<string | null> => {
    setError(null)
    
    try {
      const id = await ConfigurationPersistence.saveConfiguration(scenario, parameters, options)
      await refreshConfigurations()
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save configuration'
      setError(message)
      return null
    }
  }, [refreshConfigurations])

  const loadConfiguration = useCallback(async (id: string): Promise<SavedConfiguration | null> => {
    setError(null)
    
    try {
      const config = await ConfigurationPersistence.loadConfiguration(id)
      if (config) {
        // Refresh to update access time
        await refreshConfigurations()
      }
      return config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
      return null
    }
  }, [refreshConfigurations])

  const deleteConfiguration = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    
    try {
      const success = await ConfigurationPersistence.deleteConfiguration(id)
      if (success) {
        await refreshConfigurations()
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration')
      return false
    }
  }, [refreshConfigurations])

  const exportConfigurations = useCallback(async (ids?: string[]): Promise<string> => {
    const exportData = await ConfigurationPersistence.exportConfigurations(ids)
    return JSON.stringify(exportData, null, 2)
  }, [])

  const importConfigurations = useCallback(async (jsonData: string): Promise<{
    imported: number
    errors: string[]
  }> => {
    try {
      const data = JSON.parse(jsonData)
      const result = await ConfigurationPersistence.importConfigurations(data)
      await refreshConfigurations()
      return result
    } catch (err) {
      return {
        imported: 0,
        errors: [err instanceof Error ? err.message : 'Invalid JSON data']
      }
    }
  }, [refreshConfigurations])

  const searchConfigurations = useCallback((query: string): SavedConfiguration[] => {
    if (!query.trim()) return configurations
    
    const searchTerm = query.toLowerCase()
    return configurations.filter(config => {
      const searchableText = [
        config.name,
        config.description || '',
        config.scenario.name,
        config.scenario.description,
        ...config.tags
      ].join(' ').toLowerCase()
      
      return searchableText.includes(searchTerm)
    })
  }, [configurations])

  const filterByTags = useCallback((tags: string[]): SavedConfiguration[] => {
    if (tags.length === 0) return configurations
    
    return configurations.filter(config =>
      tags.some(tag => config.tags.includes(tag))
    )
  }, [configurations])

  const duplicateConfiguration = useCallback(async (
    id: string,
    newName?: string
  ): Promise<string | null> => {
    const original = await loadConfiguration(id)
    if (!original) return null

    const duplicatedName = newName || `${original.name} (Copy)`
    
    return await saveConfiguration(
      original.scenario,
      original.parameters,
      {
        name: duplicatedName,
        description: original.description,
        tags: [...original.tags, 'duplicate']
      }
    )
  }, [loadConfiguration, saveConfiguration])

  const clearAll = useCallback(async (): Promise<void> => {
    setError(null)
    
    try {
      for (const config of configurations) {
        if (!config.metadata.isTemplate) {
          await ConfigurationPersistence.deleteConfiguration(config.id)
        }
      }
      await refreshConfigurations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear configurations')
    }
  }, [configurations, refreshConfigurations])

  return {
    configurations,
    isLoading,
    error,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    refreshConfigurations,
    exportConfigurations,
    importConfigurations,
    searchConfigurations,
    filterByTags,
    duplicateConfiguration,
    clearAll
  }
} 