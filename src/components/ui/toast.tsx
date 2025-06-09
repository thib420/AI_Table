"use client"

import * as React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Generate unique IDs with better uniqueness
let toastCounter = 0
const generateToastId = () => {
  toastCounter += 1
  return `toast-${Date.now()}-${toastCounter}`
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    if (!message || typeof message !== 'string') return
    
    const id = generateToastId()
    const toast: Toast = { id, message, type, duration }
    
    setToasts(prev => {
      // Limit to max 5 toasts to prevent memory issues
      const newToasts = [...prev, toast]
      return newToasts.slice(-5)
    })
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t && t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    if (!id) return
    setToasts(prev => prev.filter(t => t && t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.filter(Boolean).map((toast) => {
          if (!toast?.id || !toast?.message) return null
          
          return (
            <div
              key={toast.id}
              className={cn(
                "flex items-center p-4 rounded-lg shadow-lg max-w-md animate-in slide-in-from-right-full",
                {
                  'bg-green-100 border border-green-200 text-green-800 dark:bg-green-900 dark:text-green-200': toast.type === 'success',
                  'bg-red-100 border border-red-200 text-red-800 dark:bg-red-900 dark:text-red-200': toast.type === 'error',
                  'bg-blue-100 border border-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200': toast.type === 'info',
                  'bg-yellow-100 border border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': toast.type === 'warning',
                }
              )}
            >
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
} 