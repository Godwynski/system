"use client";

import { use, Suspense } from "react";
import { Section } from "../SettingsShared";
import { SettingsShell } from "../SettingsShell";
import { PolicyLayout } from "@/components/admin/policies/PolicyLayout";

import { Skeleton } from "@/components/ui/skeleton";
import { PolicySetting, Category } from "@/types/admin";

interface PoliciesSectionProps {
  role: string;
  settingsPromise: Promise<PolicySetting[]> | PromiseLike<PolicySetting[]>;
  categoriesPromise: Promise<Category[]> | PromiseLike<Category[]>;
}

export function PoliciesSection({ role, settingsPromise, categoriesPromise }: PoliciesSectionProps) {

  return (
    <SettingsShell>
      <Section>
        <Suspense fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-40 w-full rounded-xl border border-border/60" />
          </div>
        }>
          <PolicyStreamWrapper 
            promise={settingsPromise} 
            categoriesPromise={categoriesPromise} 
            canEdit={role === "super_admin" || role === "librarian"} 
            role={role}
          />
        </Suspense>
      </Section>
    </SettingsShell>
  );
}

function PolicyStreamWrapper({ 
  promise, 
  categoriesPromise, 
  canEdit,
  role
}: { 
  promise: Promise<PolicySetting[]> | PromiseLike<PolicySetting[]>, 
  categoriesPromise: Promise<Category[]> | PromiseLike<Category[]>,
  canEdit: boolean,
  role: string
}) {
  const data = use(promise) as PolicySetting[];
  return <PolicyLayout settings={data} canEdit={canEdit} role={role} categoriesPromise={categoriesPromise} />;
}
