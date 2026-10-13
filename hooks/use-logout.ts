"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [supabase] = useState(() => createClient());

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      toast.loading("Ending session safely...", { id: "logout-session" });
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      toast.success("Signed out successfully", { id: "logout-session" });
      
      // Brief delay to allow state propagation and toast visibility
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Redirect cleanly to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Failed to sign out. Please try again.", { id: "logout-session" });
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}
