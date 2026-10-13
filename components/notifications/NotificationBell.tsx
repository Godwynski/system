'use client'

import React from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/use-notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationList } from './NotificationList'

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    loading 
  } = useNotifications()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 h-5 min-w-5 flex items-center justify-center p-1 text-xs font-semibold rounded-lg border-2 border-background animate-in zoom-in-50 duration-300"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      {/* Adaptive width: full on mobile (via padding/margins), 320px on sm+ */}
      <DropdownMenuContent 
        align="end" 
        className="w-[calc(100vw-2rem)] sm:w-80 p-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl"
      >
        <DropdownMenuLabel className="px-5 py-4 flex items-center justify-between bg-muted/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-muted-foreground tracking-wider italic">{unreadCount} new events</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/70 transition-all"
              onClick={markAllAsRead}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="m-0 opacity-50" />
        
        <div className="max-h-[350px] overflow-y-auto">
          <NotificationList 
            notifications={notifications}
            loading={loading}
            onMarkRead={markAsRead}
            variant="compact"
          />
        </div>
        
        <DropdownMenuSeparator className="m-0 opacity-50" />
        
        <div className="p-3 bg-muted/5">
          <Link 
            href="/notifications" 
            className="block w-full py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all text-center"
          >
            Expand Activity Log
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
