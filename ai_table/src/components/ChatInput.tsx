"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal } from "lucide-react"
import { ExaResultItem, FullExaApiResponse } from "@/types/exa"

interface ChatInputProps {
  onSearchSubmit: (query: string) => Promise<void>
  isLoading: boolean
}

export function ChatInput({ onSearchSubmit, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      await onSearchSubmit(message)
      setMessage("") // Clear message input after submitting
    }
  }

  return (
    <div className="pb-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
          <Textarea
            placeholder="Type your message here..."
            className="min-h-24 resize-none p-4 bg-transparent border-0 focus-visible:ring-0 text-base"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            disabled={isLoading}
          />
          <div className="absolute bottom-3 right-4">
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost"
              className="rounded-lg hover:bg-accent"
              disabled={!message.trim() || isLoading}
            >
              <SendHorizontal className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
} 