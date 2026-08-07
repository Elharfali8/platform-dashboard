import AuthGuard from "@/components/auth/AuthGuard";

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {/* Sidebar / Navbar */}
      {children}
    </AuthGuard>
  );
}