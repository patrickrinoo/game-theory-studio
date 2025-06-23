'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import { Progress } from './ui/progress'
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Play, 
  BookOpen,
  TrendingUp,
  Archive,
  Share
} from 'lucide-react'
import { 
  ScenarioLibrary, 
  ScenarioLibraryItem, 
  ScenarioFilter, 
  SCENARIO_CATEGORIES, 
  ScenarioCategory 
} from '../lib/scenario-library'
import { GameType } from '../lib/game-theory-types'

interface ScenarioLibraryProps {
  onLoadScenario?: (scenario: ScenarioLibraryItem) => void
  onCreateNew?: () => void
  className?: string
}

export function ScenarioLibraryComponent({ onLoadScenario, onCreateNew, className }: ScenarioLibraryProps) {
  const [scenarios, setScenarios] = useState<ScenarioLibraryItem[]>([])
  const [filteredScenarios, setFilteredScenarios] = useState<ScenarioLibraryItem[]>([])
  const [filter, setFilter] = useState<ScenarioFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [showPresets, setShowPresets] = useState(true)
  const [showCustom, setShowCustom] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioLibraryItem | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importData, setImportData] = useState('')
  const [importProgress, setImportProgress] = useState<{ success: number; errors: string[] } | null>(null)

  const library = useMemo(() => ScenarioLibrary.getInstance(), [])

  // Load scenarios from library
  useEffect(() => {
    const loadScenarios = () => {
      const allScenarios = library.getScenarios()
      setScenarios(allScenarios)
    }

    loadScenarios()
  }, [library])

  // Apply filters
  useEffect(() => {
    const currentFilter: ScenarioFilter = {
      ...filter,
      searchQuery: searchQuery || undefined,
      categories: selectedCategory !== 'all' ? [selectedCategory] : undefined,
      difficulty: selectedDifficulty !== 'all' ? [selectedDifficulty as any] : undefined,
      isPreset: showPresets && showCustom ? undefined : showPresets ? true : false
    }

    const filtered = library.getScenarios(currentFilter)
    setFilteredScenarios(filtered)
  }, [library, filter, searchQuery, selectedCategory, selectedDifficulty, showPresets, showCustom])

  const handleLoadScenario = (scenario: ScenarioLibraryItem) => {
    library.loadScenario(scenario.id) // Updates usage stats
    onLoadScenario?.(scenario)
  }

  const handleDeleteScenario = (scenarioId: string) => {
    if (library.deleteScenario(scenarioId)) {
      setScenarios(prev => prev.filter(s => s.id !== scenarioId))
    }
  }

  const handleExportScenarios = () => {
    const exportData = library.exportScenarios(false) // Export custom scenarios only
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `game-theory-scenarios-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportScenarios = () => {
    if (!importData.trim()) return

    const result = library.importScenarios(importData)
    setImportProgress(result)
    
    if (result.success > 0) {
      const allScenarios = library.getScenarios()
      setScenarios(allScenarios)
      setImportData('')
    }
  }

  const stats = useMemo(() => library.getStats(), [library, scenarios])

  const ScenarioCard = ({ scenario }: { scenario: ScenarioLibraryItem }) => {
    const category = SCENARIO_CATEGORIES[scenario.category.toUpperCase()] || SCENARIO_CATEGORIES.CUSTOM

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{category.icon}</span>
              <div>
                <CardTitle className="text-lg leading-tight">{scenario.name}</CardTitle>
                <CardDescription className="text-sm mt-1">{scenario.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {scenario.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{scenario.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Tags and metadata */}
            <div className="flex flex-wrap gap-1">
              <Badge variant={scenario.isPreset ? "default" : "secondary"} className="text-xs">
                {scenario.isPreset ? 'Preset' : 'Custom'}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {scenario.difficulty}
              </Badge>
              {scenario.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {scenario.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{scenario.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{scenario.players.length} players</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{scenario.usage} uses</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(scenario.lastUsed).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleLoadScenario(scenario)}
                className="flex-1"
              >
                <Play className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedScenario(scenario)}
              >
                <BookOpen className="w-3 h-3" />
              </Button>
              {!scenario.isPreset && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{scenario.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteScenario(scenario.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const CategoryFilter = () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedCategory('all')}
      >
        All
      </Button>
      {Object.values(SCENARIO_CATEGORIES).map(category => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(category.id)}
          className="flex items-center gap-1"
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </Button>
      ))}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scenario Library</h2>
          <p className="text-muted-foreground">
            Browse and manage game theory scenarios
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportScenarios}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Scenarios</DialogTitle>
                <DialogDescription>
                  Paste JSON data to import custom scenarios
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-data">JSON Data</Label>
                  <Textarea
                    id="import-data"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste your scenario JSON data here..."
                    className="min-h-32"
                  />
                </div>
                {importProgress && (
                  <div className="space-y-2">
                    <p className="text-sm text-green-600">
                      Successfully imported {importProgress.success} scenarios
                    </p>
                    {importProgress.errors.length > 0 && (
                      <div className="text-sm text-red-600">
                        <p>Errors:</p>
                        <ul className="list-disc list-inside">
                          {importProgress.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleImportScenarios} disabled={!importData.trim()}>
                    Import
                  </Button>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalScenarios}</p>
                <p className="text-sm text-muted-foreground">Total Scenarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.presetScenarios}</p>
                <p className="text-sm text-muted-foreground">Preset Scenarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.customScenarios}</p>
                <p className="text-sm text-muted-foreground">Custom Scenarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.mostUsedScenarios.length}</p>
                <p className="text-sm text-muted-foreground">Popular Scenarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search scenarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={showPresets ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowPresets(!showPresets)}
                >
                  Presets
                </Button>
                <Button
                  variant={showCustom ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowCustom(!showCustom)}
                >
                  Custom
                </Button>
              </div>
            </div>
            <CategoryFilter />
          </div>
        </CardContent>
      </Card>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScenarios.map(scenario => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>

      {filteredScenarios.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No scenarios found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or create a new scenario.
            </p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Scenario
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scenario Details Modal */}
      {selectedScenario && (
        <Dialog open={!!selectedScenario} onOpenChange={() => setSelectedScenario(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">
                  {SCENARIO_CATEGORIES[selectedScenario.category.toUpperCase()]?.icon}
                </span>
                {selectedScenario.name}
              </DialogTitle>
              <DialogDescription>{selectedScenario.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm capitalize">{selectedScenario.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Difficulty</Label>
                  <p className="text-sm capitalize">{selectedScenario.difficulty}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Players</Label>
                  <p className="text-sm">{selectedScenario.players.length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Usage</Label>
                  <p className="text-sm">{selectedScenario.usage} times</p>
                </div>
              </div>
              
              {selectedScenario.realWorldExample && (
                <div>
                  <Label className="text-sm font-medium">Real-world Examples</Label>
                  <p className="text-sm text-muted-foreground">{selectedScenario.realWorldExample}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedScenario.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleLoadScenario(selectedScenario)
                    setSelectedScenario(null)
                  }}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Load Scenario
                </Button>
                <Button variant="outline" onClick={() => setSelectedScenario(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 