"use client";

import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Phone, 
  GraduationCap, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAcademicPrograms, submitOnboarding } from "@/lib/actions/onboarding";
import { toast } from "sonner";


interface OnboardingFormProps {
  initialData?: {
    address?: string | null;
    phone?: string | null;
    department?: string | null;
  };
}

export function OnboardingForm({ initialData }: OnboardingFormProps) {
  const [programs, setPrograms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    address: initialData?.address || "",
    phone: initialData?.phone || "",
    department: initialData?.department || ""
  });

  useEffect(() => {
    getAcademicPrograms().then(setPrograms);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address || !formData.phone || !formData.department) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitOnboarding(formData);
      setIsSuccess(true);
      toast.success("Profile submitted successfully!");
      
      // Reload to trigger AccountPendingScreen updates
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="max-w-md w-full border border-border/60 bg-card shadow-sm rounded-xl animate-in fade-in duration-200">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="mx-auto w-16 h-16 rounded-xl bg-status-success/15 border border-status-success/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-status-success" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">Information Received</CardTitle>
            <CardDescription className="text-xs text-muted-foreground px-4">
              Your profile has been updated successfully. Redirecting you to status page...
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-8 gap-3">
           <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
           <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Processing</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full border border-border/60 bg-card shadow-sm rounded-xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight">Complete Your Profile</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Provide your details to enable your digital library card.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Home Address
            </Label>
            <Input 
              id="address"
              placeholder="House No., Street, Brgy, City"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="h-10 rounded-lg border border-border/60 bg-background text-xs font-semibold placeholder:text-muted-foreground/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary" />
              Contact Number
            </Label>
            <Input 
              id="phone"
              type="tel"
              placeholder="e.g. 09123456789"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 11) {
                  setFormData(prev => ({ ...prev, phone: value }));
                }
              }}
              className="h-10 rounded-lg border border-border/60 bg-background text-xs font-semibold tabular-nums placeholder:text-muted-foreground/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="program" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              Academic Program
            </Label>
            <Select 
              value={formData.department}
              onValueChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
              required
            >
              <SelectTrigger className="h-10 rounded-lg border border-border/60 bg-background text-xs font-semibold">
                <SelectValue placeholder="Select your program" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-xl">
                {programs.map((prog) => (
                  <SelectItem key={prog} value={prog} className="rounded-lg text-xs font-semibold">
                    {prog}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-10 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Submit for Approval
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
