'use client'

import React, { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, BookOpen, CheckCircle, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tutorial, TutorialStep, EducationalContentManager } from '@/lib/educational-content'

interface TutorialSystemProps {
  isOpen: boolean
  onClose: () => void
  tutorialId?: string
  autoStart?: boolean
}

interface TutorialProgress {
  currentStep: number
  completedSteps: Set<string>
  isCompleted: boolean
}

export function TutorialSystem({ 
  isOpen, 
  onClose, 
  tutorialId = 'GETTING_STARTED',
  autoStart = false 
}: TutorialSystemProps) {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [progress, setProgress] = useState<TutorialProgress>({
    currentStep: 0,
    completedSteps: new Set(),
    isCompleted: false
  })
  const [showTutorialList, setShowTutorialList] = useState(!tutorialId || !autoStart)

  const contentManager = EducationalContentManager.getInstance()

  useEffect(() => {
    if (tutorialId && autoStart) {
      const tutorial = contentManager.getTutorial(tutorialId)
      if (tutorial) {
        setSelectedTutorial(tutorial)
        setShowTutorialList(false)
        setProgress({
          currentStep: 0,
          completedSteps: new Set(),
          isCompleted: false
        })
      }
    }
  }, [tutorialId, autoStart])

  const handleTutorialSelect = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial)
    setShowTutorialList(false)
    setProgress({
      currentStep: 0,
      completedSteps: new Set(),
      isCompleted: false
    })
  }

  const handleStepComplete = () => {
    if (!selectedTutorial) return

    const newCompletedSteps = new Set(progress.completedSteps)
    newCompletedSteps.add(selectedTutorial.steps[progress.currentStep].id)

    if (progress.currentStep < selectedTutorial.steps.length - 1) {
      setProgress({
        currentStep: progress.currentStep + 1,
        completedSteps: newCompletedSteps,
        isCompleted: false
      })
    } else {
      setProgress({
        currentStep: progress.currentStep,
        completedSteps: newCompletedSteps,
        isCompleted: true
      })
    }
  }

  const handleStepBack = () => {
    if (progress.currentStep > 0) {
      setProgress(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }))
    }
  }

  const handleSkipTutorial = () => {
    setProgress(prev => ({ ...prev, isCompleted: true }))
  }

  const handleRestartTutorial = () => {
    setProgress({
      currentStep: 0,
      completedSteps: new Set(),
      isCompleted: false
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (showTutorialList) {
    const availableTutorials = contentManager.getAllTutorials()

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Choose a Tutorial
            </DialogTitle>
            <DialogDescription>
              Select a tutorial to learn game theory concepts step by step
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availableTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {tutorial.description}
                      </CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(tutorial.difficulty)}>
                      {tutorial.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {tutorial.estimatedTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {tutorial.steps.length} steps
                      </span>
                    </div>
                    <Button 
                      onClick={() => handleTutorialSelect(tutorial)}
                      size="sm"
                    >
                      Start Tutorial
                    </Button>
                  </div>
                  
                  {tutorial.prerequisites.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-2">Prerequisites:</p>
                      <div className="flex flex-wrap gap-1">
                        {tutorial.prerequisites.map((prereq) => (
                          <Badge key={prereq} variant="outline" className="text-xs">
                            {prereq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!selectedTutorial) return null

  const currentStep = selectedTutorial.steps[progress.currentStep]
  const progressPercentage = ((progress.currentStep + 1) / selectedTutorial.steps.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {selectedTutorial.title}
              </DialogTitle>
              <DialogDescription>
                Step {progress.currentStep + 1} of {selectedTutorial.steps.length}
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowTutorialList(true)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Tutorials
            </Button>
          </div>
          <Progress value={progressPercentage} className="mt-2" />
        </DialogHeader>

        {!progress.isCompleted ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{currentStep.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{currentStep.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm leading-relaxed">{currentStep.content}</p>
              </div>

              {currentStep.tips && currentStep.tips.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <strong>Tips:</strong>
                    <ul className="mt-2 space-y-1">
                      {currentStep.tips.map((tip, index) => (
                        <li key={index} className="text-sm">• {tip}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {currentStep.targetElement && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Interactive Step:</strong> Look for the highlighted element on the main interface and {currentStep.action || 'interact with'} it.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleStepBack}
                  disabled={progress.currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSkipTutorial}
                >
                  Skip Tutorial
                </Button>
              </div>

              <Button onClick={handleStepComplete}>
                {progress.currentStep === selectedTutorial.steps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete Tutorial
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-green-800">Tutorial Completed!</h3>
              <p className="text-gray-600 mt-2">
                Congratulations! You've completed "{selectedTutorial.title}".
              </p>
            </div>

            {selectedTutorial.completionCriteria.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-green-800 mb-2">What you've learned:</h4>
                <ul className="space-y-1">
                  {selectedTutorial.completionCriteria.map((criteria, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button onClick={handleRestartTutorial} variant="outline">
                Restart Tutorial
              </Button>
              <Button onClick={() => setShowTutorialList(true)}>
                Choose Another Tutorial
              </Button>
              <Button onClick={onClose}>
                Continue to App
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing tutorial state
export function useTutorialSystem() {
  const [isOpen, setIsOpen] = useState(false)
  const [tutorialId, setTutorialId] = useState<string>()

  const openTutorial = (id?: string) => {
    setTutorialId(id)
    setIsOpen(true)
  }

  const closeTutorial = () => {
    setIsOpen(false)
    setTutorialId(undefined)
  }

  return {
    isOpen,
    tutorialId,
    openTutorial,
    closeTutorial
  }
} 