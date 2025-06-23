"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"
import type { GameScenario } from "@/lib/game-theory-types"
import { GraduationCap, BookOpen, CheckCircle, ArrowRight, Lightbulb, Target, Users, Brain, Star, HelpCircle } from "lucide-react"
import { ConceptText, ConceptBadge, ConceptIcon } from "@/components/ui/educational-tooltip"
import { TutorialSystem, useTutorialSystem } from "@/components/tutorial-system"

interface LearningModule {
  id: string
  title: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  concepts: string[]
  gameId?: string
  completed: boolean
}

interface LearningModeProps {
  onGameSelect: (game: GameScenario) => void
}

const learningModules: LearningModule[] = [
  {
    id: "intro-game-theory",
    title: "Introduction to Game Theory",
    description: "Learn the fundamental concepts of strategic decision-making and rational choice.",
    difficulty: "Beginner",
    duration: "15 min",
    concepts: ["Strategic Form Games", "Players and Strategies", "Payoff Matrices", "Rational Choice"],
    completed: false,
  },
  {
    id: "prisoners-dilemma-basics",
    title: "The Prisoner's Dilemma",
    description: "Explore the most famous game in game theory and understand cooperation vs. competition.",
    difficulty: "Beginner",
    duration: "20 min",
    concepts: ["Cooperation", "Defection", "Dominant Strategies", "Social Dilemmas"],
    gameId: "prisoners-dilemma",
    completed: false,
  },
  {
    id: "nash-equilibrium",
    title: "Nash Equilibrium",
    description: "Understand the concept of Nash equilibrium and how to find stable strategy profiles.",
    difficulty: "Intermediate",
    duration: "25 min",
    concepts: ["Best Response", "Mutual Best Response", "Stability", "Equilibrium Concepts"],
    completed: false,
  },
  {
    id: "mixed-strategies",
    title: "Mixed Strategies",
    description: "Learn about randomized strategies and when players should use them.",
    difficulty: "Intermediate",
    duration: "30 min",
    concepts: ["Pure vs Mixed", "Probability Distributions", "Expected Payoffs", "Indifference Conditions"],
    gameId: "matching-pennies",
    completed: false,
  },
  {
    id: "coordination-games",
    title: "Coordination Games",
    description: "Study games where players benefit from coordinating their actions.",
    difficulty: "Intermediate",
    duration: "25 min",
    concepts: ["Multiple Equilibria", "Focal Points", "Communication", "Coordination Failure"],
    gameId: "battle-of-sexes",
    completed: false,
  },
  {
    id: "evolutionary-game-theory",
    title: "Evolutionary Game Theory",
    description: "Explore how strategies evolve over time through natural selection.",
    difficulty: "Advanced",
    duration: "35 min",
    concepts: ["Replicator Dynamics", "ESS", "Population Games", "Mutation"],
    gameId: "hawk-dove",
    completed: false,
  },
  {
    id: "behavioral-game-theory",
    title: "Behavioral Game Theory",
    description: "Understand how real human behavior deviates from theoretical predictions.",
    difficulty: "Advanced",
    duration: "40 min",
    concepts: ["Bounded Rationality", "Fairness", "Reciprocity", "Learning"],
    gameId: "ultimatum-game",
    completed: false,
  },
]

export function LearningMode({ onGameSelect }: LearningModeProps) {
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null)
  const [progress, setProgress] = useState(0)
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())
  const tutorialSystem = useTutorialSystem()

  const startModule = (module: LearningModule) => {
    setSelectedModule(module)
    setProgress(0)
  }

  const completeModule = (moduleId: string) => {
    setCompletedModules((prev) => new Set([...prev, moduleId]))
    setSelectedModule(null)
    setProgress(0)
  }

  const difficultyColors = {
    Beginner: "bg-green-100 text-green-700 border-green-200",
    Intermediate: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Advanced: "bg-red-100 text-red-700 border-red-200",
  }

  const difficultyIcons = {
    Beginner: Star,
    Intermediate: Target,
    Advanced: Brain,
  }

  if (selectedModule) {
    return (
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>{selectedModule.title}</CardTitle>
                <CardDescription>{selectedModule.description}</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedModule(null)} className="rounded-xl">
              Back to Modules
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Badge className={`${difficultyColors[selectedModule.difficulty]}`}>{selectedModule.difficulty}</Badge>
            <Badge variant="outline">{selectedModule.duration}</Badge>
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Key Concepts
              </h3>
              <div className="space-y-2">
                {selectedModule.concepts.map((concept, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white/50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{concept}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Interactive Learning</h3>
              <div className="p-4 bg-blue-50/50 rounded-2xl">
                <p className="text-sm text-gray-700 mb-4">
                  This module includes interactive simulations and examples to help you understand the concepts.
                </p>
                {selectedModule.gameId && (
                  <Button
                    onClick={() => {
                      // Find the game and select it
                      const games = [
                        {
                          id: "prisoners-dilemma",
                          name: "Prisoner's Dilemma",
                          description:
                            "Two prisoners must decide whether to cooperate or defect without knowing the other's choice.",
                          playerCount: 2,
                          strategies: ["Cooperate", "Defect"],
                          category: "Classic",
                          difficulty: "Beginner" as const,
                          realWorldExample: "Arms races, environmental agreements, trade negotiations",
                          defaultMatrix: [
                            [
                              [
                                [3, 3],
                                [0, 5],
                              ],
                              [
                                [5, 0],
                                [1, 1],
                              ],
                            ],
                          ],
                        },
                        // Add other games as needed
                      ]
                      const game = games.find((g) => g.id === selectedModule.gameId)
                      if (game) {
                        onGameSelect(game)
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl"
                  >
                    Try Interactive Simulation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setProgress(Math.max(0, progress - 20))}
              disabled={progress === 0}
              className="rounded-xl"
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (progress < 100) {
                  setProgress(Math.min(100, progress + 20))
                } else {
                  completeModule(selectedModule.id)
                }
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl"
            >
              {progress < 100 ? "Next" : "Complete Module"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            Learning Mode
          </CardTitle>
          <CardDescription>
            Master game theory concepts through interactive tutorials and guided simulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningModules.map((module) => {
              const IconComponent = difficultyIcons[module.difficulty]
              const isCompleted = completedModules.has(module.id)

              return (
                <div
                  key={module.id}
                  className={`group p-4 border rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    isCompleted
                      ? "border-green-300 bg-green-50/50"
                      : "border-white/30 bg-white/30 hover:border-white/50 hover:bg-white/50"
                  }`}
                  onClick={() => startModule(module)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                          isCompleted ? "bg-green-500" : "bg-gradient-to-br from-gray-100 to-gray-200"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.duration}</p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${difficultyColors[module.difficulty]}`}>{module.difficulty}</Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{module.description}</p>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {module.concepts.slice(0, 3).map((concept, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-white/60">
                          {concept}
                        </Badge>
                      ))}
                      {module.concepts.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-white/60">
                          +{module.concepts.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-xl border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-medium">
                {completedModules.size} of {learningModules.length} modules completed
              </span>
            </div>
            <Progress value={(completedModules.size / learningModules.length) * 100} className="h-3" />

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-green-50/50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{completedModules.size}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50/50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">
                  {learningModules.filter((m) => m.difficulty === "Beginner").length}
                </div>
                <div className="text-sm text-gray-600">Beginner</div>
              </div>
              <div className="text-center p-3 bg-purple-50/50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">
                  {learningModules.filter((m) => m.difficulty === "Advanced").length}
                </div>
                <div className="text-sm text-gray-600">Advanced</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
