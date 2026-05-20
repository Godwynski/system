"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatus {
  online: boolean;
  isSyncing: boolean;
  queueLength: number;
}

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>({
    online: true,
    isSyncing: false,
    queueLength: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      try {
        const res = await fetch("/api/sync-status");
        if (!res.ok) throw new Error("Status fetch failed");
        const data = await res.json();
        if (active) {
          setStatus({
            online: !!data.online,
            isSyncing: !!data.isSyncing,
            queueLength: Number(data.queueLength || 0),
          });
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          // If fetch fails, we assume the server might be offline or unreachable
          setStatus(prev => ({
            ...prev,
            online: false,
          }));
          setLoading(false);
        }
      }
    }

    // Initial check
    checkStatus();

    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/10 text-muted-foreground/60 text-xs font-medium animate-pulse">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span className="hidden sm:inline">Checking sync...</span>
      </div>
    );
  }

  // Determine display states
  let icon = <Wifi className="h-3.5 w-3.5" />;
  let label = "Synced";
  let badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  let dotColor = "bg-emerald-500";

  if (!status.online) {
    icon = <WifiOff className="h-3.5 w-3.5" />;
    label = "Offline";
    badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
    dotColor = "bg-red-500";
  } else if (status.isSyncing) {
    icon = <RefreshCw className="h-3.5 w-3.5 animate-spin" />;
    label = "Syncing";
    badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
    dotColor = "bg-blue-500";
  } else if (status.queueLength > 0) {
    icon = <Database className="h-3.5 w-3.5 text-amber-500" />;
    label = `${status.queueLength} pending`;
    badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    dotColor = "bg-amber-500";
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium transition-all duration-300 shadow-sm",
        badgeColor
      )}
      title={
        !status.online
          ? "You are working offline. Data will sync when reconnected."
          : status.isSyncing
          ? "Syncing local mutations and refreshing cached tables..."
          : status.queueLength > 0
          ? `${status.queueLength} mutations are locally queued waiting to sync.`
          : "Connected to Supabase. Local cache synced successfully."
      }
    >
      <div className="relative flex h-2 w-2">
        {status.isSyncing && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)}></span>
      </div>
      {icon}
      <span className="tracking-wide select-none">{label}</span>
    </div>
  );
}
