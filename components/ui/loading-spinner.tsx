'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Brain, Zap, Target } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'game-theory' | 'simulation' | 'analysis'
  text?: string
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg', 
  xl: 'text-xl'
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  text,
  className 
}: LoadingSpinnerProps) {
  const getIcon = () => {
    switch (variant) {
      case 'game-theory':
        return <Brain className={cn(sizeClasses[size], 'animate-pulse')} />
      case 'simulation':
        return <Zap className={cn(sizeClasses[size], 'animate-bounce')} />
      case 'analysis':
        return <Target className={cn(sizeClasses[size], 'animate-spin')} />
      default:
        return <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
    }
  }

  const getVariantColors = () => {
    switch (variant) {
      case 'game-theory':
        return 'text-blue-600'
      case 'simulation':
        return 'text-green-600'
      case 'analysis':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      className
    )}>
      <div className={cn('flex items-center justify-center', getVariantColors())}>
        {getIcon()}
      </div>
      {text && (
        <p className={cn(
          'text-center text-muted-foreground font-medium',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

// Specialized loading components for common use cases
export function GameTheoryLoader({ text = "Analyzing game theory..." }: { text?: string }) {
  return (
    <LoadingSpinner 
      variant="game-theory" 
      size="lg" 
      text={text}
      className="py-8"
    />
  )
}

export function SimulationLoader({ text = "Running simulation..." }: { text?: string }) {
  return (
    <LoadingSpinner 
      variant="simulation" 
      size="lg" 
      text={text}
      className="py-8"
    />
  )
}

export function AnalysisLoader({ text = "Performing analysis..." }: { text?: string }) {
  return (
    <LoadingSpinner 
      variant="analysis" 
      size="lg" 
      text={text}
      className="py-8"
    />
  )
}

// Full page loading overlay
export function LoadingOverlay({ 
  isVisible, 
  text = "Loading...",
  variant = 'default'
}: { 
  isVisible: boolean
  text?: string
  variant?: LoadingSpinnerProps['variant']
}) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
        <LoadingSpinner 
          variant={variant}
          size="xl"
          text={text}
        />
      </div>
    </div>
  )
} 