"use client";

import { use, useMemo, useState, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  History, 
  Ticket, 
  HelpCircle, 
  User, 
  RefreshCw,
  Megaphone,
  Tag,
  AlertTriangle
} from "lucide-react";
import { DEFAULT_POLICIES } from "@/lib/actions/policy-constants";
import { cn } from "@/lib/utils";
import { PolicyCommitModal } from "../PolicyCommitModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryManagement } from "../CategoryManagement";
import { PolicySimulationPanel } from "../PolicySimulationPanel";
import { PolicyField } from "./PolicyField";
import { AnnualResetTool, RunMaintenanceTool, TestEmailTool } from "../../settings/SettingsShared";
import { SystemAnnouncement } from "../system-announcement";

import { TooltipProvider } from "@/components/ui/tooltip";

import { toast } from "sonner";

const CATEGORY_MAP: Record<string, { label: string; icon: React.ElementType; group: string }> = {
  circulation: { label: "Circulation", icon: History, group: "System Core" },
  reservations: { label: "Reservations", icon: Ticket, group: "System Core" },
  identity: { label: "Identity", icon: User, group: "System Data" },
  categories: { label: "Categories", icon: Tag, group: "System Data" },
  broadcasts: { label: "Broadcasts", icon: Megaphone, group: "Communication" },
  support: { label: "Support", icon: HelpCircle, group: "Communication" },
  lifecycle: { label: "Lifecycle", icon: RefreshCw, group: "Operations" },
};

import { PolicySetting, Category } from "@/types/admin";

export function PolicyLayout({
  settings,
  canEdit,
  role,
  categoriesPromise,
}: {
  settings: PolicySetting[];
  canEdit: boolean;
  role: string;
  categoriesPromise: Promise<Category[]> | PromiseLike<Category[]>;
}) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("circulation");
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    if (changedKeys.length > 0) {
      setPendingCategory(categoryId);
    } else {
      setActiveCategory(categoryId);
    }
  };

  // Realtime synchronization
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('policies-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        () => {
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const initialValues = useMemo(() => {
    const byKey = new Map(settings.map((s) => [s.key, s.value]));
    const values: Record<string, string> = {};
    for (const [key, config] of Object.entries(DEFAULT_POLICIES)) {
      values[key] = byKey.get(key) ?? config.value;
    }
    return values;
  }, [settings]);

  const [formData, setFormData] = useState<Record<string, string>>(initialValues);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const changedKeys = useMemo(
    () => Object.keys(DEFAULT_POLICIES).filter((key) => (formData[key] ?? "") !== (initialValues[key] ?? "")),
    [formData, initialValues],
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (changedKeys.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [changedKeys]);

  // Defined the full set of categories in order
  const sidebarItems = useMemo(() => {
    const items = [
      { id: "circulation", ...CATEGORY_MAP.circulation },
      { id: "reservations", ...CATEGORY_MAP.reservations },
      { id: "identity", ...CATEGORY_MAP.identity },
      { id: "categories", ...CATEGORY_MAP.categories },
      { id: "broadcasts", ...CATEGORY_MAP.broadcasts },
      { id: "support", ...CATEGORY_MAP.support },
    ];

    if (role === "super_admin") {
      items.push({ id: "lifecycle", ...CATEGORY_MAP.lifecycle });
    }

    return items;
  }, [role]);

  const groupedSidebar = useMemo(() => {
    const groups: Record<string, typeof sidebarItems> = {};
    sidebarItems.forEach(item => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, [sidebarItems]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const handleConfirmCommit = async (reason: string) => {
    if (!canEdit) return;

    setLoading(true);
    setError(null);
    setIsCommitModalOpen(false);

    try {
      for (const key of changedKeys) {
        const value = formData[key];
        const description = DEFAULT_POLICIES[key as keyof typeof DEFAULT_POLICIES]?.description;

        const response = await fetch("/api/admin/policy-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value, description, reason }),
        });

        if (!response.ok) {
          throw new Error("Failed to save some settings");
        }
      }

      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const activeKeys = Object.keys(DEFAULT_POLICIES).filter(k => DEFAULT_POLICIES[k as keyof typeof DEFAULT_POLICIES].category === activeCategory);

  return (
    <div className="w-full pb-12">
      <div className="mb-4 space-y-2">

        {saved && (
          <div className="status-success flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
            <ShieldCheck size={14} />
            Changes synchronized
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr] items-start">
        {/* Mobile Category Navigation */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-2 min-w-max">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleCategoryClick(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap border",
                  activeCategory === item.id 
                    ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                    : "bg-card/50 text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
                )}
              >
                <item.icon size={12} className="shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block space-y-8 sticky top-12">
          {Object.entries(groupedSidebar).map(([group, items]) => (
            <div key={group} className="space-y-1.5">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleCategoryClick(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors group relative",
                      activeCategory === item.id 
                        ? "text-primary font-semibold bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    {activeCategory === item.id && (
                      <div className="absolute left-0 w-1 h-4 bg-primary rounded-r-sm" />
                    )}
                    <item.icon size={15} className={cn(
                      "shrink-0 transition-colors",
                      activeCategory === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* ── Content ───────────────────────────────────────────── */}
        <main className="min-w-0">
           <div className="max-w-3xl">
             <TooltipProvider>
              {activeCategory === "broadcasts" ? (
                <div className="space-y-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Megaphone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Global Announcement</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Broadcast an immediate notification message to all student dashboards.</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-xl border border-border/60 bg-card/40">
                      <SystemAnnouncement />
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Trigger Policies</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Set the rules for automated system alerts and borrowing reminders.</p>
                      </div>
                    </div>
                    <div className="space-y-0">
                      {activeKeys.map(key => (
                        <PolicyField 
                          key={key}
                          policyKey={key}
                          value={formData[key]}
                          initialValue={initialValues[key]}
                          onChange={(val) => handleChange(key, val)}
                          disabled={!canEdit}
                          loading={loading}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              ) : activeCategory === "categories" ? (
                <div className="space-y-6">
                  <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
                     <CategoryManagementWrapper promise={categoriesPromise} />
                  </Suspense>
                </div>
              ) : activeCategory === "lifecycle" ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl border border-border/60 bg-card/40">
                    <AnnualResetTool />
                  </div>
                  <div className="p-6 rounded-xl border border-border/60 bg-card/40">
                    <RunMaintenanceTool />
                  </div>
                  <div className="p-6 rounded-xl border border-border/60 bg-card/40">
                    <TestEmailTool />
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {activeKeys.map(key => (
                    <PolicyField 
                      key={key}
                      policyKey={key}
                      value={formData[key]}
                      initialValue={initialValues[key]}
                      onChange={(val) => handleChange(key, val)}
                      disabled={!canEdit}
                      loading={loading}
                    />
                  ))}
                  {activeCategory === "reservations" && (
                    <div className="mt-12 pt-12 border-t border-border/60">
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-foreground">Simulation Engine</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Preview the impact of reservation policies on system throughput.</p>
                      </div>
                      <PolicySimulationPanel formData={formData} />
                    </div>
                  )}
                </div>
              )}
             </TooltipProvider>
           </div>
        </main>


      </div>

      {/* ── Floating Review Bar ───────────────────────────────── */}
      {canEdit && changedKeys.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/95 p-2 pl-4 shadow-xl backdrop-blur-sm">
             <div className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {changedKeys.length} unsaved changes
                </span>
             </div>
             <div className="flex items-center gap-2">
               <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(initialValues);
                    toast.success("All unsaved changes discarded");
                  }}
                  className="h-9 rounded-lg px-4 text-xs font-semibold uppercase tracking-wider border border-border/60 text-muted-foreground hover:text-foreground"
               >
                  Discard
               </Button>
               <Button
                  onClick={() => setIsCommitModalOpen(true)}
                  className="h-9 rounded-lg px-4 text-xs font-semibold uppercase tracking-wider"
               >
                  Review Changes
               </Button>
             </div>
          </div>
        </div>
      )}
      <PolicyCommitModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onConfirm={handleConfirmCommit}
        changedKeys={changedKeys}
        initialValues={initialValues}
        formData={formData}
        loading={loading}
      />
      <Dialog open={pendingCategory !== null} onOpenChange={(open) => { if (!open) setPendingCategory(null); }}>
        <DialogContent className="sm:max-w-[400px] border border-border/60 bg-background rounded-xl p-0 overflow-hidden shadow-xl">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="px-2.5 py-0.5 rounded-md bg-destructive/10 text-xs font-semibold uppercase tracking-wider text-destructive border border-destructive/20">
                Unsaved Changes
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight text-foreground">Unsaved Policy Changes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You have unsaved changes in the current policy section. Moving to another section will discard these changes. Do you want to proceed?
              </p>
            </div>
          </div>

          <div className="p-6 pt-0 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPendingCategory(null)}
              className="flex-1 h-10 rounded-lg text-xs font-semibold uppercase tracking-wider border border-border/60 hover:bg-muted/40 transition-colors"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingCategory) {
                  setFormData(initialValues);
                  setActiveCategory(pendingCategory);
                  setPendingCategory(null);
                  toast.success("Changes discarded");
                }
              }}
              className="flex-1 h-10 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-xs transition-colors"
            >
              Discard & Move
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryManagementWrapper({ promise }: { promise: Promise<Category[]> | PromiseLike<Category[]> }) {
  const categories = use(promise);
  return <CategoryManagement initialCategories={Array.isArray(categories) ? categories : []} />;
}


