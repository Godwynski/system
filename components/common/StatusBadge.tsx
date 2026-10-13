"use client";

import * as React from "react";
import { cn } from "@/lib/utils";


interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // User/General
  active: "status-success",
  pending: "status-warning",
  suspended: "status-danger",
  archived: "status-neutral",
  graduated: "status-neutral",
  
  // Book Copies (Uppercase from DB)
  AVAILABLE: "status-success",
  BORROWED: "status-warning",
  MAINTENANCE: "status-warning",
  LOST: "status-danger",

  // Reservations/General logic
  READY: "status-success",
  ACTIVE: "status-warning",
  CANCELLED: "status-neutral",
  COMPLETED: "status-neutral",
  EXPIRED: "status-danger",
  RETURNED: "status-success",
  OVERDUE: "status-danger",
};

const statusLabels: Record<string, string> = {
  // User/Profile Statuses
  PENDING: "Pending",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
  GRADUATED: "Graduated",
  
  // Book/Circulation
  AVAILABLE: "Available",
  BORROWED: "Borrowed",
  MAINTENANCE: "Maintenance",
  LOST: "Lost",
  READY: "Ready",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  RETURNED: "Returned",
  OVERDUE: "Overdue",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const rawNormalized = status.toLowerCase();
  
  // Try exact match, then try uppercase (for DB enums), then try lowercase
  const styleClass = statusStyles[status] || statusStyles[normalized] || statusStyles[rawNormalized] || "status-neutral";
  const label = statusLabels[status] || statusLabels[normalized] || status;

  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider leading-none transition-colors",
        styleClass,
        className
      )}
    >
      {label}
    </span>
  );
}
