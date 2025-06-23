"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Save, 
  FolderOpen, 
  Download, 
  Upload, 
  Search, 
  Tag, 
  Calendar,
  Copy,
  Trash2,
  Share2,
  Star,
  Clock,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react"

import { useConfigurationManager } from "@/hooks/use-configuration-manager"
import { GameScenario, SimulationParameters } from "@/lib/game-theory-types"
import { SavedConfiguration } from "@/lib/config-persistence"

interface ConfigurationManagerProps {
  currentScenario?: GameScenario | null
  currentParameters?: SimulationParameters | null
  onLoadConfiguration?: (scenario: GameScenario, parameters: SimulationParameters) => void
}

export function ConfigurationManager({
  currentScenario,
  currentParameters,
  onLoadConfiguration
}: ConfigurationManagerProps) {
  const {
    configurations,
    isLoading,
    error,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    exportConfigurations,
    importConfigurations,
    searchConfigurations,
    duplicateConfiguration
  } = useConfigurationManager()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("save")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Save dialog state
  const [saveName, setSaveName] = useState("")
  const [saveDescription, setSaveDescription] = useState("")
  const [saveTags, setSaveTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  
  // Import/Export state
  const [importData, setImportData] = useState("")
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter configurations based on search and tags
  const filteredConfigurations = configurations
    .filter(config => {
      // Search filter
      if (searchQuery) {
        const searchMatches = searchConfigurations(searchQuery)
        if (!searchMatches.find(c => c.id === config.id)) return false
      }
      
      // Tag filter
      if (selectedTags.length > 0) {
        if (!selectedTags.some(tag => config.tags.includes(tag))) return false
      }
      
      return true
    })

  // Get all unique tags from configurations
  const allTags = Array.from(new Set(configurations.flatMap(config => config.tags)))

  const handleSave = async () => {
    if (!currentScenario || !currentParameters || !saveName.trim()) return

    const id = await saveConfiguration(
      currentScenario,
      currentParameters,
      {
        name: saveName.trim(),
        description: saveDescription.trim() || undefined,
        tags: saveTags
      }
    )

    if (id) {
      setSaveName("")
      setSaveDescription("")
      setSaveTags([])
      setActiveTab("library")
    }
  }

  const handleLoad = async (config: SavedConfiguration) => {
    if (onLoadConfiguration) {
      onLoadConfiguration(config.scenario, config.parameters)
      setIsOpen(false)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !saveTags.includes(newTag.trim())) {
      setSaveTags([...saveTags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSaveTags(saveTags.filter(t => t !== tag))
  }

  const handleExport = async (configIds?: string[]) => {
    setExportLoading(true)
    try {
      const exportData = await exportConfigurations(configIds)
      
      // Download as JSON file
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `game-theory-configs-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExportLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importData.trim()) return

    const result = await importConfigurations(importData)
    setImportResult(result)
    setImportData("")
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setImportData(content)
      }
      reader.readAsText(file)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
  }

  const canSave = currentScenario && currentParameters && saveName.trim()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Manage Configurations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Configuration Manager
          </DialogTitle>
          <DialogDescription>
            Save, load, and manage your game theory simulation configurations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="save" className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Save Tab */}
          <TabsContent value="save" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Save Current Configuration</CardTitle>
                <CardDescription>
                  Save your current game scenario and simulation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentScenario && (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      No current configuration to save. Please configure a game scenario first.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="save-name">Configuration Name*</Label>
                  <Input
                    id="save-name"
                    placeholder="Enter configuration name..."
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    disabled={!currentScenario}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="save-description">Description</Label>
                  <Textarea
                    id="save-description"
                    placeholder="Optional description..."
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    disabled={!currentScenario}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      disabled={!currentScenario}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddTag}
                      disabled={!currentScenario || !newTag.trim()}
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  {saveTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {saveTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={!canSave}
                  className="w-full gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search configurations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => handleExport()}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>

            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter by tags:</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag))
                        } else {
                          setSelectedTags([...selectedTags, tag])
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <ScrollArea className="h-96">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading configurations...
                  </div>
                ) : filteredConfigurations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {configurations.length === 0 
                      ? "No saved configurations yet"
                      : "No configurations match your filters"
                    }
                  </div>
                ) : (
                  filteredConfigurations.map(config => (
                    <Card key={config.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            {config.name}
                            {config.metadata.isTemplate && (
                              <Star className="w-4 h-4 text-yellow-500" />
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.scenario.name} • {config.scenario.type}
                          </p>
                          {config.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {config.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(config.metadata.modified)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Used {config.metadata.usageCount} times
                            </span>
                          </div>
                          {config.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {config.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoad(config)}
                          >
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => duplicateConfiguration(config.id)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExport([config.id])}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteConfiguration(config.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Configurations</CardTitle>
                <CardDescription>
                  Import configurations from JSON files or paste JSON data directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Choose File
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!importData.trim()}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Import
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />

                <div className="space-y-2">
                  <Label>JSON Data</Label>
                  <Textarea
                    placeholder="Paste JSON configuration data here..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                {importResult && (
                  <Alert className={importResult.errors.length > 0 ? "border-red-200" : "border-green-200"}>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      <div>Imported: {importResult.imported} configurations</div>
                      {importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <strong>Errors:</strong>
                          <ul className="list-disc list-inside text-sm mt-1">
                            {importResult.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Configurations</CardTitle>
                <CardDescription>
                  Export your configurations as JSON files for backup or sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => handleExport()}
                    disabled={exportLoading || configurations.length === 0}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export All Configurations
                  </Button>
                  <Button
                    onClick={() => handleExport(configurations.filter(c => c.metadata.isTemplate).map(c => c.id))}
                    disabled={exportLoading}
                    variant="outline"
                    className="gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Export Templates Only
                  </Button>
                </div>

                <Alert>
                  <FileText className="w-4 h-4" />
                  <AlertDescription>
                    Exported files contain all configuration data including game scenarios, 
                    simulation parameters, and metadata. Files can be imported into any 
                    Game Theory Simulator instance.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert className="border-red-200">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
} 