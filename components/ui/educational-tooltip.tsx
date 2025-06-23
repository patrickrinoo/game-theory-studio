'use client'

import React, { useState } from 'react'
import { Info, BookOpen, ExternalLink, ChevronRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EducationalConcept, EducationalContentManager } from '@/lib/educational-content'

interface EducationalTooltipProps {
  conceptId: string
  children?: React.ReactNode
  triggerText?: string
  className?: string
  variant?: 'icon' | 'text' | 'badge'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'strategy': return '🎯'
    case 'equilibrium': return '⚖️'
    case 'payoff': return '💰'
    case 'behavior': return '🧠'
    case 'simulation': return '🔬'
    default: return '📚'
  }
}

export function EducationalTooltip({ 
  conceptId, 
  children, 
  triggerText, 
  className = '',
  variant = 'icon',
  side = 'top'
}: EducationalTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const contentManager = EducationalContentManager.getInstance()
  const concept = contentManager.getConcept(conceptId)

  if (!concept) {
    return children || <span className={className}>{triggerText}</span>
  }

  const renderTrigger = () => {
    if (children) return children

    switch (variant) {
      case 'icon':
        return (
          <button className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors ${className}`}>
            <Info className="w-3 h-3 text-blue-600" />
          </button>
        )
      case 'badge':
        return (
          <Badge variant="outline" className={`cursor-help hover:bg-blue-50 ${className}`}>
            {triggerText || concept.title}
          </Badge>
        )
      case 'text':
        return (
          <button className={`text-blue-600 hover:text-blue-800 underline decoration-dotted ${className}`}>
            {triggerText || concept.title}
          </button>
        )
      default:
        return null
    }
  }

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          {renderTrigger()}
        </TooltipTrigger>
        <TooltipContent side={side} className="w-96 p-0 border-0 shadow-lg">
          <Card className="border shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(concept.category)}</span>
                  <div>
                    <CardTitle className="text-lg leading-tight">{concept.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {concept.shortDescription}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getDifficultyColor(concept.difficulty)}>
                  {concept.difficulty}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Tabs defaultValue="explanation" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-8 text-xs">
                  <TabsTrigger value="explanation" className="text-xs">Explanation</TabsTrigger>
                  <TabsTrigger value="examples" className="text-xs">Examples</TabsTrigger>
                  <TabsTrigger value="applications" className="text-xs">Applications</TabsTrigger>
                </TabsList>

                <TabsContent value="explanation" className="mt-3 space-y-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {concept.detailedExplanation}
                  </p>
                  
                  {concept.keyTakeaways.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Takeaways:</h4>
                      <ul className="space-y-1">
                        {concept.keyTakeaways.map((takeaway, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="examples" className="mt-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Examples:</h4>
                    <ul className="space-y-2">
                      {concept.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500 font-medium flex-shrink-0">{index + 1}.</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="applications" className="mt-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Real-World Applications:</h4>
                    <ul className="space-y-2">
                      {concept.realWorldApplications.map((application, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <ExternalLink className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{application}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              {concept.relatedConcepts.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <h4 className="font-medium text-sm mb-2">Related Concepts:</h4>
                  <div className="flex flex-wrap gap-1">
                    {concept.relatedConcepts.map((relatedId) => (
                      <EducationalTooltip
                        key={relatedId}
                        conceptId={relatedId}
                        variant="badge"
                        className="text-xs"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Convenient wrapper for inline text with educational tooltips
export function ConceptText({ 
  conceptId, 
  children, 
  className = '' 
}: { 
  conceptId: string
  children: React.ReactNode
  className?: string 
}) {
  return (
    <EducationalTooltip conceptId={conceptId} variant="text" className={className}>
      <span className="cursor-help border-b border-dotted border-blue-300 hover:border-blue-500">
        {children}
      </span>
    </EducationalTooltip>
  )
}

// Quick icon tooltip for concepts
export function ConceptIcon({ 
  conceptId, 
  className = '' 
}: { 
  conceptId: string
  className?: string 
}) {
  return (
    <EducationalTooltip 
      conceptId={conceptId} 
      variant="icon" 
      className={className}
    />
  )
}

// Badge version for labeling
export function ConceptBadge({ 
  conceptId, 
  text,
  className = '' 
}: { 
  conceptId: string
  text?: string
  className?: string 
}) {
  return (
    <EducationalTooltip 
      conceptId={conceptId} 
      variant="badge" 
      triggerText={text}
      className={className}
    />
  )
} 