"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Building2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import PageTitle from "@/components/applications/global/PageTitle";
import { getProfile } from "@/services/auth.service";
import { listApplications } from "@/services/applications.service";
import { useAuthStore } from "@/store/auth.store";

const DashboardClientPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  const [firstName, setFirstName] = useState<string | null>(null);
  const [applicationCount, setApplicationCount] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleApiError = useCallback(
    (apiError: unknown, fallbackMessage: string) => {
      if (isAxiosError<{ message?: string }>(apiError)) {
        if (apiError.response?.status === 401) {
          logout();
          router.replace(
            `/auth/login?redirect=${encodeURIComponent(pathname)}`,
          );
          return "Your session expired. Please sign in again.";
        }

        return apiError.response?.data?.message ?? fallbackMessage;
      }

      return apiError instanceof Error ? apiError.message : fallbackMessage;
    },
    [logout, pathname, router],
  );

  const fetchDashboard = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [profile, applications] = await Promise.all([
        getProfile(accessToken),
        listApplications({ accessToken, limit: 1 }),
      ]);

      setFirstName(profile.user.firstName);
      setApplicationCount(applications.meta.total);
    } catch (fetchError) {
      setError(handleApiError(fetchError, "Could not load the dashboard."));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, handleApiError]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div>
      <PageTitle title="Dashboard" icon={Sparkles} />
      <div className="my-3 h-px w-full bg-gray-300 lg:my-5" />

      <div className="rounded-lg border border-border bg-surface p-6 shadow-[var(--card-shadow)]">
        <h1 className="text-xl font-semibold text-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your platform.
        </p>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-[var(--card-shadow)]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">
                Total applications
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {isLoading ? "—" : applicationCount}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/applications"
          className="group flex flex-col justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6 transition duration-200 hover:border-primary hover:bg-primary/10"
        >
          <div>
            <p className="text-sm font-medium text-primary">Get started</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              Create a new application
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Spin up a new tenant workspace and assign its owner.
            </p>
          </div>

          <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition duration-200 group-hover:bg-blue-600">
            <Plus size={16} />
            Create Application
          </span>
        </Link>
      </div>
    </div>
  );
};

export default DashboardClientPage;
