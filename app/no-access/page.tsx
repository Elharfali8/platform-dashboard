"use client";

import { ShieldAlert } from "lucide-react";

import AuthGuard from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

function NoAccessContent() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <ShieldAlert className="mx-auto size-10 text-muted-foreground" />

        <h1 className="mt-4 text-lg font-semibold text-foreground">
          No access yet
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your account isn&apos;t assigned to any application. Ask your
          platform administrator to add you, then sign in again.
        </p>

        <Button type="button" className="mt-6" onClick={logout}>
          Sign out
        </Button>
      </div>
    </main>
  );
}

export default function NoAccessPage() {
  return (
    <AuthGuard>
      <NoAccessContent />
    </AuthGuard>
  );
}
