import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const metadata = {
  title: "Forgot Password | Lumina LMS",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Reset your password securely."
      description="Enter your email address and we will send a verification link to complete the reset process."
    >
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
