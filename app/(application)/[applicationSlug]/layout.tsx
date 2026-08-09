import { ApplicationShell } from "@/components/application/ApplicationShell";
import AuthGuard from "@/components/auth/AuthGuard";

export default async function ApplicationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    applicationSlug: string;
  }>;
}) {
  const { applicationSlug } = await params;

  return (
    <AuthGuard>
      <ApplicationShell applicationSlug={applicationSlug}>
        {children}
      </ApplicationShell>
    </AuthGuard>
  );
}
