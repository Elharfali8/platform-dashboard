import AuthGuard from "@/components/auth/AuthGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PlatformShell>{children}</PlatformShell>
    </AuthGuard>
  );
}