'use client'

import React, { useState } from 'react'
import { HelpCircle, BookOpen, Lightbulb, Target, AlertCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GameType } from '@/lib/game-theory-types'
import { GameEducationalContent, EducationalContentManager } from '@/lib/educational-content'
import { ConceptBadge } from '@/components/ui/educational-tooltip'

interface HelpPanelProps {
  gameType?: GameType
  context?: 'setup' | 'simulation' | 'results' | 'analysis'
  className?: string
}

interface HelpSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
  defaultOpen?: boolean
}

export function HelpPanel({ gameType, context = 'setup', className = '' }: HelpPanelProps) {
  const contentManager = EducationalContentManager.getInstance()
  const gameContent = gameType ? contentManager.getGameContent(gameType) : null

  const getContextualHelp = () => {
    switch (context) {
      case 'setup':
        return {
          title: 'Game Setup Help',
          description: 'Understanding game configuration and parameters',
          tips: [
            'Start with default parameters to understand basic mechanics',
            'Adjust payoff values to see how incentives change',
            'Consider the strategic implications of your parameter choices'
          ]
        }
      case 'simulation':
        return {
          title: 'Simulation Help',
          description: 'Running and understanding Monte Carlo simulations',
          tips: [
            'Higher iteration counts provide more accurate results',
            'Watch for convergence patterns in strategy frequencies',
            'Compare results across different initial conditions'
          ]
        }
      case 'results':
        return {
          title: 'Results Analysis Help',
          description: 'Interpreting simulation outcomes and insights',
          tips: [
            'Look for Nash equilibria in the final strategy distribution',
            'Compare expected payoffs with theoretical predictions',
            'Analyze strategy evolution over time for insights'
          ]
        }
      case 'analysis':
        return {
          title: 'Strategic Analysis Help',
          description: 'Deep dive into strategic concepts and patterns',
          tips: [
            'Identify dominant strategies and strategic dominance',
            'Look for Pareto efficient outcomes',
            'Consider how changing parameters affects equilibria'
          ]
        }
      default:
        return {
          title: 'General Help',
          description: 'Basic guidance for using the platform',
          tips: ['Explore different games to understand various strategic situations']
        }
    }
  }

  const contextHelp = getContextualHelp()

  const createHelpSections = (): HelpSection[] => {
    const sections: HelpSection[] = [
      {
        id: 'contextual',
        title: contextHelp.title,
        icon: HelpCircle,
        defaultOpen: true,
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{contextHelp.description}</p>
            <ul className="space-y-2">
              {contextHelp.tips.map((tip, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    ]

    if (gameContent) {
      sections.push(
        {
          id: 'game-overview',
          title: 'Game Overview',
          icon: BookOpen,
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">{gameContent.overview}</p>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Key Characteristics:</h4>
                <ul className="space-y-1">
                  {gameContent.keyCharacteristics.map((characteristic, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{characteristic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        },
        {
          id: 'strategic-insights',
          title: 'Strategic Insights',
          icon: Target,
          content: (
            <div className="space-y-3">
              <ul className="space-y-2">
                {gameContent.strategicInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        },
        {
          id: 'common-mistakes',
          title: 'Common Mistakes',
          icon: AlertCircle,
          content: (
            <div className="space-y-2">
              {gameContent.commonMistakes.map((mistake, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    {mistake}
                  </p>
                </div>
              ))}
            </div>
          )
        },
        {
          id: 'learning-objectives',
          title: 'Learning Objectives',
          icon: BookOpen,
          content: (
            <div className="space-y-3">
              <ul className="space-y-2">
                {gameContent.learningObjectives.map((objective, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 font-medium">{index + 1}.</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
              
              {gameContent.prerequisites.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2">Prerequisites:</h4>
                  <div className="flex flex-wrap gap-1">
                    {gameContent.prerequisites.map((prereq) => (
                      <Badge key={prereq} variant="outline" className="text-xs">
                        {prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }
      )

      if (gameContent.realWorldExamples.length > 0) {
        sections.push({
          id: 'real-world',
          title: 'Real-World Examples',
          icon: ExternalLink,
          content: (
            <ul className="space-y-2">
              {gameContent.realWorldExamples.map((example, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          )
        })
      }
    }

    return sections
  }

  const helpSections = createHelpSections()

  return (
    <Card className={`h-fit ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          Help & Guidance
        </CardTitle>
        <CardDescription>
          {gameType ? `Learn about ${gameType} and strategic concepts` : 'Understanding game theory concepts'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {helpSections.map((section, index) => (
          <CollapsibleHelpSection
            key={section.id}
            section={section}
            defaultOpen={section.defaultOpen}
            isLast={index === helpSections.length - 1}
          />
        ))}

        {gameType && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="font-medium text-sm mb-2">Related Concepts:</h4>
            <div className="flex flex-wrap gap-1">
              <ConceptBadge conceptId="nash-equilibrium" className="text-xs" />
              <ConceptBadge conceptId="dominant-strategy" className="text-xs" />
              {gameType === GameType.MATCHING_PENNIES && (
                <ConceptBadge conceptId="mixed-strategy" className="text-xs" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CollapsibleHelpSectionProps {
  section: HelpSection
  defaultOpen?: boolean
  isLast?: boolean
}

function CollapsibleHelpSection({ section, defaultOpen = false, isLast = false }: CollapsibleHelpSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2">
          <div className="flex items-center gap-2">
            <section.icon className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-sm">{section.title}</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <div className="pl-6">
            {section.content}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {!isLast && <Separator className="my-3" />}
    </div>
  )
} 