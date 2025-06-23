'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Responsive Container Component
export function ResponsiveContainer({ 
  children, 
  className,
  size = 'default'
}: { 
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
}) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-2xl'
      case 'default':
        return 'max-w-4xl'
      case 'lg':
        return 'max-w-6xl'
      case 'xl':
        return 'max-w-7xl'
      case 'full':
        return 'max-w-full'
      default:
        return 'max-w-4xl'
    }
  }

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      getSizeClasses(),
      className
    )}>
      {children}
    </div>
  )
}

// Responsive Grid Component
export function ResponsiveGrid({ 
  children, 
  className,
  cols = { sm: 1, md: 2, lg: 3 },
  gap = 6
}: { 
  children: React.ReactNode
  className?: string
  cols?: { sm?: number; md?: number; lg?: number; xl?: number }
  gap?: number
}) {
  const getGridClasses = () => {
    const classes = ['grid']
    
    if (cols.sm) classes.push(`grid-cols-${cols.sm}`)
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
    
    classes.push(`gap-${gap}`)
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  )
}

// Mobile-First Stack Component
export function ResponsiveStack({ 
  children, 
  className,
  direction = { base: 'col', md: 'row' },
  spacing = 4,
  align = 'stretch'
}: { 
  children: React.ReactNode
  className?: string
  direction?: { base: 'row' | 'col'; md?: 'row' | 'col'; lg?: 'row' | 'col' }
  spacing?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
}) {
  const getStackClasses = () => {
    const classes = ['flex']
    
    // Base direction
    classes.push(direction.base === 'row' ? 'flex-row' : 'flex-col')
    
    // Responsive directions
    if (direction.md) {
      classes.push(direction.md === 'row' ? 'md:flex-row' : 'md:flex-col')
    }
    if (direction.lg) {
      classes.push(direction.lg === 'row' ? 'lg:flex-row' : 'lg:flex-col')
    }
    
    // Spacing
    if (direction.base === 'row') {
      classes.push(`gap-x-${spacing}`)
    } else {
      classes.push(`gap-y-${spacing}`)
    }
    
    // Alignment
    switch (align) {
      case 'start':
        classes.push('items-start')
        break
      case 'center':
        classes.push('items-center')
        break
      case 'end':
        classes.push('items-end')
        break
      case 'stretch':
        classes.push('items-stretch')
        break
    }
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getStackClasses(), className)}>
      {children}
    </div>
  )
}

// Responsive Show/Hide Component
export function ResponsiveVisibility({ 
  children, 
  show,
  hide,
  className
}: { 
  children: React.ReactNode
  show?: ('sm' | 'md' | 'lg' | 'xl')[]
  hide?: ('sm' | 'md' | 'lg' | 'xl')[]
  className?: string
}) {
  const getVisibilityClasses = () => {
    const classes = []
    
    if (hide) {
      hide.forEach(breakpoint => {
        classes.push(`${breakpoint}:hidden`)
      })
    }
    
    if (show) {
      // Start with hidden, then show at specified breakpoints
      classes.push('hidden')
      show.forEach(breakpoint => {
        classes.push(`${breakpoint}:block`)
      })
    }
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getVisibilityClasses(), className)}>
      {children}
    </div>
  )
}

// Responsive Card Component
export function ResponsiveCard({ 
  children, 
  className,
  padding = { base: 4, md: 6 },
  shadow = 'md'
}: { 
  children: React.ReactNode
  className?: string
  padding?: { base: number; md?: number; lg?: number }
  shadow?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const getCardClasses = () => {
    const classes = [
      'bg-white rounded-lg border',
      `shadow-${shadow}`
    ]
    
    // Responsive padding
    classes.push(`p-${padding.base}`)
    if (padding.md) classes.push(`md:p-${padding.md}`)
    if (padding.lg) classes.push(`lg:p-${padding.lg}`)
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getCardClasses(), className)}>
      {children}
    </div>
  )
}

// Responsive Typography
export function ResponsiveHeading({ 
  children, 
  level = 1,
  className,
  responsive = true
}: { 
  children: React.ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
  responsive?: boolean
}) {
  const getHeadingClasses = () => {
    const baseClasses = 'font-bold text-gray-900'
    
    if (!responsive) {
      switch (level) {
        case 1: return `${baseClasses} text-3xl`
        case 2: return `${baseClasses} text-2xl`
        case 3: return `${baseClasses} text-xl`
        case 4: return `${baseClasses} text-lg`
        case 5: return `${baseClasses} text-base`
        case 6: return `${baseClasses} text-sm`
        default: return `${baseClasses} text-3xl`
      }
    }
    
    // Responsive typography
    switch (level) {
      case 1:
        return `${baseClasses} text-2xl sm:text-3xl lg:text-4xl`
      case 2:
        return `${baseClasses} text-xl sm:text-2xl lg:text-3xl`
      case 3:
        return `${baseClasses} text-lg sm:text-xl lg:text-2xl`
      case 4:
        return `${baseClasses} text-base sm:text-lg lg:text-xl`
      case 5:
        return `${baseClasses} text-sm sm:text-base lg:text-lg`
      case 6:
        return `${baseClasses} text-xs sm:text-sm lg:text-base`
      default:
        return `${baseClasses} text-2xl sm:text-3xl lg:text-4xl`
    }
  }

  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return React.createElement(Tag, {
    className: cn(getHeadingClasses(), className)
  }, children)
}

// Responsive Button Stack
export function ResponsiveButtonStack({ 
  children, 
  className,
  stack = { base: true, md: false }
}: { 
  children: React.ReactNode
  className?: string
  stack?: { base: boolean; md?: boolean; lg?: boolean }
}) {
  const getStackClasses = () => {
    const classes = ['flex gap-3']
    
    // Base stacking
    classes.push(stack.base ? 'flex-col w-full' : 'flex-row')
    
    // Responsive stacking
    if (stack.md !== undefined) {
      classes.push(stack.md ? 'md:flex-col md:w-full' : 'md:flex-row md:w-auto')
    }
    if (stack.lg !== undefined) {
      classes.push(stack.lg ? 'lg:flex-col lg:w-full' : 'lg:flex-row lg:w-auto')
    }
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getStackClasses(), className)}>
      {children}
    </div>
  )
}

// Hook for responsive breakpoints
export function useResponsive() {
  const [breakpoint, setBreakpoint] = React.useState<'sm' | 'md' | 'lg' | 'xl'>('sm')

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else setBreakpoint('sm')
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [])

  return {
    breakpoint,
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl'
  }
} 