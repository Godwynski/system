"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: string;
  className?: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  librarian: "Librarian",
  staff: "Staff",
  student_assistant: "Student Assistant",
  student: "Student",
  patron: "Patron",
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const normalized = role.toLowerCase();
  const displayName = roleLabels[normalized] || role;
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-border/60 bg-muted px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground",
        className
      )}
    >
      {displayName}
    </span>
  );
}
