import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { getUserRole } from "@/lib/auth-helpers";

export async function AuthButton() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const role = user ? await getUserRole() : null;

  return user ? (
    <div className="flex items-center gap-4 text-sm bg-muted/30 px-4 py-2 rounded-full border border-border/50">
      <div className="flex flex-col items-end">
        <span className="font-medium">{user.email}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Role: {role}</span>
      </div>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
