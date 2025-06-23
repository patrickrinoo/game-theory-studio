'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X, MessageSquare, Star, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

// Feedback Context
interface FeedbackContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])

    // Auto-remove notification after duration (default 5 seconds)
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, notification.duration || 5000)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <FeedbackContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications
    }}>
      {children}
      <NotificationContainer />
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider')
  }
  return context
}

// Notification Container
function NotificationContainer() {
  const { notifications, removeNotification } = useFeedback()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// Individual Notification Card
function NotificationCard({ 
  notification, 
  onClose 
}: { 
  notification: Notification
  onClose: () => void 
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <Card className={cn('shadow-lg animate-in slide-in-from-right duration-300', getColors())}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-sm font-semibold">
              {notification.title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-3">
          {notification.message}
        </p>
        {notification.action && (
          <Button
            size="sm"
            variant="outline"
            onClick={notification.action.onClick}
            className="text-xs"
          >
            {notification.action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Success Message Component
export function SuccessMessage({ 
  title = "Success!",
  message,
  onClose,
  className
}: {
  title?: string
  message: string
  onClose?: () => void
  className?: string
}) {
  return (
    <Alert className={cn('border-green-200 bg-green-50', className)}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <div className="flex-1">
        <h4 className="font-semibold text-green-900">{title}</h4>
        <AlertDescription className="text-green-800">
          {message}
        </AlertDescription>
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </Alert>
  )
}

// User Feedback Collection Component
export function FeedbackCollector({
  onSubmit,
  title = "Share Your Feedback",
  placeholder = "Tell us about your experience..."
}: {
  onSubmit: (feedback: { rating: number; category: string; message: string }) => void
  title?: string
  placeholder?: string
}) {
  const [rating, setRating] = useState<number>(0)
  const [category, setCategory] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rating || !message.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({ rating, category, message })
      setRating(0)
      setCategory('')
      setMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Help us improve your experience with Game Theory Studio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            How would you rate your experience?
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={cn(
                  'p-1 rounded transition-colors',
                  star <= rating 
                    ? 'text-yellow-500 hover:text-yellow-600' 
                    : 'text-gray-300 hover:text-gray-400'
                )}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Category (optional)
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usability">Usability</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="features">Features</SelectItem>
              <SelectItem value="bugs">Bug Report</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Your feedback
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            rows={4}
          />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!rating || !message.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </CardContent>
    </Card>
  )
}

// Quick Feedback Buttons
export function QuickFeedback({
  onFeedback,
  className
}: {
  onFeedback: (type: 'positive' | 'negative', message?: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-gray-600">Was this helpful?</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFeedback('positive')}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFeedback('negative')}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
    </div>
  )
}

// Hook for easy notification usage
export function useNotifications() {
  const { addNotification } = useFeedback()

  return {
    success: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'success', title, message, ...options }),
    error: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'error', title, message, persistent: true, ...options }),
    warning: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'warning', title, message, ...options }),
    info: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification({ type: 'info', title, message, ...options })
  }
} 