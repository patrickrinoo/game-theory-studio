"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Search, Filter, Star, Users, Brain, Zap, BookOpen, Target, Info } from "lucide-react"
import { GAME_TEMPLATES, GameTemplateUtils } from "@/lib/game-templates"

// UI-specific interface for game scenarios
interface UIGameScenario {
  id: string
  name: string
  description: string
  playerCount: number
  strategies: string[]
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  payoffMatrix: number[][][]
  realWorldApplications: string[]
  educationalFocus: string[]
  learningObjectives: string[]
  nashEquilibria: any[]
  dominantStrategies: any[]
}

interface GameSelectorProps {
  onGameSelect: (game: UIGameScenario) => void
  selectedGame: UIGameScenario | null
}

// Convert game templates to the format expected by the UI
function convertTemplateToScenario(template: any): UIGameScenario {
  return {
    id: template.type.toLowerCase().replace(/_/g, '-'),
    name: template.name,
    description: template.description,
    playerCount: 2, // Most games are 2-player for now
    strategies: template.strategies.map((s: any) => s.name),
    category: getCategoryFromType(template.type),
    difficulty: getDifficultyFromType(template.type),
    payoffMatrix: template.payoffMatrix,
    realWorldApplications: [template.realWorldExample],
    educationalFocus: getEducationalFocusFromType(template.type),
    learningObjectives: [template.educationalNote],
    nashEquilibria: [], // To be calculated
    dominantStrategies: [], // To be calculated
  }
}

function getCategoryFromType(type: string): string {
  const categoryMap: Record<string, string> = {
    'PRISONERS_DILEMMA': 'Classic',
    'BATTLE_OF_SEXES': 'Coordination',
    'CHICKEN_GAME': 'Conflict',
    'STAG_HUNT': 'Coordination',
    'HAWK_DOVE': 'Evolutionary',
    'MATCHING_PENNIES': 'Zero-Sum',
    'COORDINATION': 'Coordination',
    'PUBLIC_GOODS': 'Social',
    'CUSTOM': 'Custom'
  }
  return categoryMap[type] || 'Classic'
}

function getDifficultyFromType(type: string): 'Beginner' | 'Intermediate' | 'Advanced' {
  const difficultyMap: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
    'PRISONERS_DILEMMA': 'Beginner',
    'COORDINATION': 'Beginner',
    'STAG_HUNT': 'Beginner',
    'BATTLE_OF_SEXES': 'Intermediate',
    'CHICKEN_GAME': 'Intermediate',
    'HAWK_DOVE': 'Intermediate',
    'MATCHING_PENNIES': 'Advanced',
    'PUBLIC_GOODS': 'Advanced',
    'CUSTOM': 'Advanced'
  }
  return difficultyMap[type] || 'Intermediate'
}

function getEducationalFocusFromType(type: string): string[] {
  const focusMap: Record<string, string[]> = {
    'PRISONERS_DILEMMA': ['Nash Equilibrium', 'Dominant Strategies'],
    'BATTLE_OF_SEXES': ['Coordination', 'Multiple Equilibria'],
    'CHICKEN_GAME': ['Mixed Strategies', 'Brinkmanship'],
    'STAG_HUNT': ['Coordination', 'Trust'],
    'HAWK_DOVE': ['Evolutionary Stable Strategy', 'Mixed Strategies'],
    'MATCHING_PENNIES': ['Zero-Sum', 'Mixed Strategies'],
    'COORDINATION': ['Coordination', 'Focal Points'],
    'PUBLIC_GOODS': ['Free Rider Problem', 'Social Dilemmas'],
    'CUSTOM': ['Custom Analysis']
  }
  return focusMap[type] || ['Game Theory']
}

const categoryIcons = {
  Classic: Star,
  Coordination: Users,
  Conflict: Zap,
  Evolutionary: Brain,
  "Zero-Sum": Filter,
  Social: Users,
  Behavioral: Brain,
  Economic: Target,
  Competitive: Zap,
  Custom: Zap,
}

const difficultyColors = {
  Beginner: "bg-green-100 text-green-700 border-green-200",
  Intermediate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Advanced: "bg-red-100 text-red-700 border-red-200",
}

const educationalFocusColors = {
  "Nash Equilibrium": "bg-blue-100 text-blue-700 border-blue-200",
  "Dominant Strategies": "bg-purple-100 text-purple-700 border-purple-200", 
  "Mixed Strategies": "bg-orange-100 text-orange-700 border-orange-200",
  "Coordination": "bg-teal-100 text-teal-700 border-teal-200",
  "Zero-Sum": "bg-gray-100 text-gray-700 border-gray-200",
  "Pareto Efficiency": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Multiple Equilibria": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Brinkmanship": "bg-red-100 text-red-700 border-red-200",
  "Trust": "bg-green-100 text-green-700 border-green-200",
  "Evolutionary Stable Strategy": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Focal Points": "bg-violet-100 text-violet-700 border-violet-200",
  "Free Rider Problem": "bg-amber-100 text-amber-700 border-amber-200",
  "Social Dilemmas": "bg-rose-100 text-rose-700 border-rose-200",
  "Custom Analysis": "bg-slate-100 text-slate-700 border-slate-200",
  "Game Theory": "bg-blue-100 text-blue-700 border-blue-200",
}

export function GameSelector({ onGameSelect, selectedGame }: GameSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [showEducationalInfo, setShowEducationalInfo] = useState(false)

  // Convert our game templates to the format expected by the UI
  const gameScenarios = GameTemplateUtils.getAllTemplates().map(convertTemplateToScenario)

  const filteredGames = gameScenarios.filter((game) => {
    const matchesSearch =
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (game.educationalFocus && game.educationalFocus.some((focus: string) => 
        focus.toLowerCase().includes(searchTerm.toLowerCase())
      )) ||
      (game.realWorldApplications && game.realWorldApplications.some((app: string) =>
        app.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    
    const matchesCategory = categoryFilter === "all" || game.category === categoryFilter
    const matchesDifficulty = difficultyFilter === "all" || game.difficulty === difficultyFilter

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const categories = [...new Set(gameScenarios.map((game) => game.category))]

  return (
    <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          Game Scenarios
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Choose from classic game theory scenarios to simulate</span>
          <button
            onClick={() => setShowEducationalInfo(!showEducationalInfo)}
            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 text-sm"
          >
            <Info className="w-4 h-4" />
            {showEducationalInfo ? 'Hide' : 'Show'} Educational Info
          </button>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search games, concepts, or applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/50 border-white/20 rounded-xl"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white/50 border-white/20 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white/50 border-white/20 rounded-xl">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filteredGames.map((game) => {
            const IconComponent = categoryIcons[game.category as keyof typeof categoryIcons] || Star

            return (
              <div
                key={game.id}
                className={`group p-4 border rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedGame?.id === game.id
                    ? "border-blue-300 bg-blue-50/50 shadow-lg shadow-blue-500/10"
                    : "border-white/30 bg-white/30 hover:border-white/50 hover:bg-white/50"
                }`}
                onClick={() => onGameSelect(game)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{game.name}</h3>
                      <p className="text-sm text-gray-600">{game.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={`text-xs ${difficultyColors[game.difficulty]}`}>{game.difficulty}</Badge>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs bg-white/50">
                        {game.playerCount} Players
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white/50">
                        {game.strategies.length} Strategies
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{game.description}</p>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {game.strategies.map((strategy, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-white/60">
                        {strategy}
                      </Badge>
                    ))}
                  </div>

                  {showEducationalInfo && game.educationalFocus && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {game.educationalFocus.map((focus, index) => (
                          <Badge 
                            key={index} 
                            className={`text-xs ${educationalFocusColors[focus as keyof typeof educationalFocusColors] || 'bg-gray-100 text-gray-700'}`}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            {focus}
                          </Badge>
                        ))}
                      </div>
                      
                      {game.learningObjectives && (
                        <div className="text-xs text-blue-700 bg-blue-50/50 rounded-lg p-2">
                          <strong>Learning Goal:</strong> {game.learningObjectives[0]}
                        </div>
                      )}
                    </div>
                  )}

                  {game.realWorldApplications && (
                    <div className="text-xs text-gray-600 bg-gray-50/50 rounded-lg p-2">
                      <strong>Real-world examples:</strong> {game.realWorldApplications.slice(0, 2).join(', ')}
                      {game.realWorldApplications.length > 2 && '...'}
                    </div>
                  )}

                  {game.nashEquilibria && game.nashEquilibria.length > 0 && (
                    <div className="text-xs text-green-700 bg-green-50/50 rounded-lg p-2 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <strong>Nash Equilibria:</strong> {game.nashEquilibria.length} found
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No games match your current filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
