"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, FolderOpen, Settings } from "lucide-react"
import { useConfigurationManager } from "@/hooks/use-configuration-manager"
import { GameScenario, SimulationParameters } from "@/lib/game-theory-types"

interface ConfigManagerProps {
  currentScenario?: GameScenario | null
  currentParameters?: SimulationParameters | null
  onLoadConfiguration?: (scenario: GameScenario, parameters: SimulationParameters) => void
}

export function ConfigManager({
  currentScenario,
  currentParameters,
  onLoadConfiguration
}: ConfigManagerProps) {
  const {
    configurations,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration
  } = useConfigurationManager()

  const [isOpen, setIsOpen] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [saveDescription, setSaveDescription] = useState("")

  const handleSave = async () => {
    if (!currentScenario || !currentParameters || !saveName.trim()) return

    await saveConfiguration(
      currentScenario,
      currentParameters,
      {
        name: saveName.trim(),
        description: saveDescription.trim() || undefined
      }
    )

    setSaveName("")
    setSaveDescription("")
  }

  const handleLoad = async (configId: string) => {
    const config = await loadConfiguration(configId)
    if (config && onLoadConfiguration) {
      onLoadConfiguration(config.scenario, config.parameters)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Save & Load
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configuration Manager</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Current
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Configuration name..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Description..."
                  rows={2}
                />
              </div>
              <Button 
                onClick={handleSave} 
                disabled={!currentScenario || !saveName.trim()}
                className="w-full"
              >
                Save Configuration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Saved Configurations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {configurations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No saved configurations
                </p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {configurations.map(config => (
                    <div key={config.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {config.scenario.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleLoad(config.id)}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteConfiguration(config.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 