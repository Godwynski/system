'use client'

import React, { useState } from 'react'
import { Megaphone, Loader2, Users, Send, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/**
 * Component for broadcasting system-wide announcements to users.
 */
export function SystemAnnouncement() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [target, setTarget] = useState<'all' | 'students'>('students')
  const [loading, setLoading] = useState(false)

  /**
   * Handles sending the announcement to the selected target group.
   */
  async function handleSend() {
    if (!title.trim() || !content.trim()) {
      toast.error('Subject and message content are required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target, 
          title: title.trim(), 
          content: content.trim(), 
          type: 'SYSTEM', 
          priority: 'high' 
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch notifications')
      }

      toast.success(`Announcement successfully dispatched to ${data.count ?? 'all'} users`)
      setTitle('')
      setContent('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = title.trim() && content.trim()

  return (
    <div className="w-full space-y-6 p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-2">
            <Target className="h-3 w-3" />
            Target Audience
          </label>
          <Select value={target} onValueChange={(v: 'all' | 'students') => setTarget(v)}>
            <SelectTrigger className="h-10 rounded-lg border border-border/60 bg-background text-xs font-semibold">
              <SelectValue placeholder="Select target" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border/60 shadow-xl bg-popover">
              <SelectItem value="students" className="py-2.5 px-3 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 opacity-50" />
                  All Students Only
                </div>
              </SelectItem>
              <SelectItem value="all" className="py-2.5 px-3 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-3.5 w-3.5 opacity-50" />
                  Universal Broadcast (Everyone)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Subject Heading
          </label>
          <Input
            placeholder="e.g. Mandatory System Maintenance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 rounded-lg border border-border/60 bg-background text-xs font-semibold placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
          Detailed Message Payload
        </label>
        <Textarea
          placeholder="Craft your system announcement here. Use clear and concise language..."
          className="min-h-[140px] rounded-lg border border-border/60 bg-background text-xs font-medium p-3 resize-none placeholder:text-muted-foreground/50"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          className={cn(
            "h-10 flex-1 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors",
            !isFormValid && "opacity-50"
          )}
          disabled={loading || !isFormValid}
          onClick={handleSend}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Dispatch Announcement
        </Button>
      </div>
    </div>
  )
}

