"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  KeyRound,
  LayoutDashboard,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Avatar,
  Alert,
  Badge,
  EmptyState,
  PageHeader,
  Panel,
  SecondaryButton,
  SkeletonRows,
  StatCard,
  timeAgo,
  toneClasses,
  type Tone,
} from "@/components/platform/ui";
import { cn } from "@/lib/utils";
import { useApiError } from "@/lib/use-api-error";
import { listApplications, type Application } from "@/services/applications.service";
import { getProfile } from "@/services/auth.service";
import { listUsers, type MembershipRole, type PlatformUser } from "@/services/users.service";
import { useAuthStore } from "@/store/auth.store";

type DashboardData = {
  firstName: string;
  greeting: string;
  today: string;
  applications: Application[];
  applicationTotal: number;
  users: PlatformUser[];
  userTotal: number;
};

const ROLE_STYLE: Record<MembershipRole, { label: string; tone: Tone }> = {
  OWNER: { label: "Owners", tone: "indigo" },
  ADMIN: { label: "Admins", tone: "violet" },
  STAFF: { label: "Staff", tone: "sky" },
  DRIVER: { label: "Drivers", tone: "amber" },
  USER: { label: "Users", tone: "slate" },
};

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** The last 6 months, oldest first, with how many applications and users were created in each. */
function monthlyGrowth(applications: Application[], users: PlatformUser[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const within = (iso: string) => {
      const date = new Date(iso);
      return date >= start && date < end;
    };
    return {
      label: start.toLocaleDateString("en", { month: "short" }),
      applications: applications.filter((application) => within(application.createdAt)).length,
      users: users.filter((user) => within(user.createdAt)).length,
    };
  });
}

const DashboardClientPage = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    Promise.all([
      getProfile(accessToken),
      listApplications({ accessToken, limit: 100 }),
      listUsers({ accessToken, limit: 100 }),
    ])
      .then(([profile, applications, users]) => {
        if (cancelled) return;
        const now = new Date();
        setData({
          firstName: profile.user.firstName,
          greeting: greetingFor(now),
          today: now.toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" }),
          applications: applications.data,
          applicationTotal: applications.meta.total,
          users: users.data,
          userTotal: users.meta.total,
        });
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) setError(apiError(fetchError, "Could not load the dashboard."));
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, apiError, reloadKey]);

  const stats = useMemo(() => {
    if (!data) return null;
    const memberships = data.users.flatMap((user) => user.memberships);
    const roleCounts = (Object.keys(ROLE_STYLE) as MembershipRole[])
      .map((role) => ({ role, count: memberships.filter((membership) => membership.role === role).length }))
      .filter((entry) => entry.count > 0);

    return {
      activeApps: data.applications.filter((application) => application.isActive).length,
      activeUsers: data.users.filter((user) => user.isActive).length,
      pendingPasswords: data.users.filter((user) => user.mustChangePassword).length,
      owners: data.users.filter((user) => user.platformRole === "PLATFORM_OWNER").length,
      memberships: memberships.length,
      roleCounts,
      growth: monthlyGrowth(data.applications, data.users),
      recentApps: [...data.applications]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
      recentUsers: [...data.users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    };
  }, [data]);

  const loading = !data && !error;

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="Overview"
        title="Dashboard"
        description="Everything happening across your platform."
        actions={
          <SecondaryButton
            onClick={() => {
              setRefreshing(true);
              setReloadKey((key) => key + 1);
            }}
            disabled={refreshing}
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </SecondaryButton>
        }
      />

      {error ? (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-6 overflow-hidden rounded-3xl bg-[#0f1430] p-6 text-white shadow-xl shadow-indigo-900/20 sm:p-8"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-24 size-80 rounded-full bg-indigo-500/40 blur-3xl" />
          <div className="absolute -bottom-32 right-10 size-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-indigo-200/90">{data?.today ?? " "}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {data ? `${data.greeting}, ${data.firstName}` : "Welcome back"}
              <motion.span
                className="ml-2 inline-block origin-[70%_70%]"
                animate={{ rotate: [0, 16, -8, 14, 0] }}
                transition={{ duration: 1.6, delay: 0.5 }}
              >
                👋
              </motion.span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-indigo-100/80">
              {stats
                ? `${stats.activeApps} active application${stats.activeApps === 1 ? "" : "s"} and ${stats.activeUsers} active user${stats.activeUsers === 1 ? "" : "s"} right now.`
                : "Loading your platform…"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/applications"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-slate-900 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Plus className="size-4" />
              New application
            </Link>
            <Link
              href="/users"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <UserPlus className="size-4" />
              Add user
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={data?.applicationTotal ?? 0}
          icon={Building2}
          tone="indigo"
          loading={loading}
          delay={0.05}
          hint={stats ? <span><b className="font-semibold text-emerald-600">{stats.activeApps} active</b> · {(data?.applications.length ?? 0) - stats.activeApps} inactive</span> : null}
        />
        <StatCard
          label="Users"
          value={data?.userTotal ?? 0}
          icon={Users}
          tone="violet"
          loading={loading}
          delay={0.1}
          hint={stats ? <span><b className="font-semibold text-emerald-600">{stats.activeUsers} active</b> · {stats.memberships} app access{stats.memberships === 1 ? "" : "es"}</span> : null}
        />
        <StatCard
          label="Waiting to sign in"
          value={stats?.pendingPasswords ?? 0}
          icon={KeyRound}
          tone="amber"
          loading={loading}
          delay={0.15}
          hint="Still on their temporary password"
        />
        <StatCard
          label="Platform owners"
          value={stats?.owners ?? 0}
          icon={ShieldCheck}
          tone="emerald"
          loading={loading}
          delay={0.2}
          hint="Full access to this dashboard"
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Growth chart */}
        <Panel
          title="Growth"
          description="New applications and users, last 6 months"
          delay={0.15}
          action={
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-500" />Applications</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-fuchsia-400" />Users</span>
            </div>
          }
        >
          {stats ? <GrowthChart data={stats.growth} /> : <div className="h-56 animate-pulse rounded-xl bg-slate-50" />}
        </Panel>

        {/* Roles */}
        <Panel title="Access by role" description="Who can open which applications" delay={0.2}>
          {stats ? (
            stats.memberships ? (
              <div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                  {stats.roleCounts.map(({ role, count }, index) => (
                    <motion.div
                      key={role}
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / stats.memberships) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className={cn("h-full bg-gradient-to-r", toneClasses(ROLE_STYLE[role].tone).solid)}
                    />
                  ))}
                </div>
                <ul className="mt-5 space-y-3">
                  {stats.roleCounts.map(({ role, count }) => (
                    <li key={role} className="flex items-center gap-3 text-sm">
                      <span className={cn("size-2.5 rounded-full", toneClasses(ROLE_STYLE[role].tone).dot)} />
                      <span className="flex-1 text-slate-600">{ROLE_STYLE[role].label}</span>
                      <span className="font-semibold tabular-nums text-slate-900">{count}</span>
                      <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                        {Math.round((count / stats.memberships) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState icon={Users} title="Nobody has access yet" description="Add users to applications on the Users page." />
            )
          ) : (
            <div className="h-48 animate-pulse rounded-xl bg-slate-50" />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Latest applications"
          delay={0.25}
          bodyClassName="p-0"
          action={<ViewAll href="/applications" />}
        >
          {!stats ? (
            <SkeletonRows rows={4} height={48} />
          ) : stats.recentApps.length ? (
            <ul className="divide-y divide-slate-100">
              {stats.recentApps.map((application, index) => (
                <motion.li
                  key={application.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70"
                >
                  <Avatar name={application.name} src={application.logoUrl} square />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{application.name}</p>
                    <p className="truncate font-mono text-xs text-slate-400">/{application.slug}</p>
                  </div>
                  <span className="hidden text-xs text-slate-400 sm:block">{timeAgo(application.createdAt)}</span>
                  <Badge tone={application.isActive ? "emerald" : "slate"} dot>
                    {application.isActive ? "Active" : "Inactive"}
                  </Badge>
                </motion.li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Building2} title="No applications yet" />
          )}
        </Panel>

        <Panel title="Latest users" delay={0.3} bodyClassName="p-0" action={<ViewAll href="/users" />}>
          {!stats ? (
            <SkeletonRows rows={4} height={48} />
          ) : stats.recentUsers.length ? (
            <ul className="divide-y divide-slate-100">
              {stats.recentUsers.map((user, index) => (
                <motion.li
                  key={user.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70"
                >
                  <Avatar name={user.name || user.email} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <span className="hidden text-xs text-slate-400 sm:block">{timeAgo(user.createdAt)}</span>
                  {user.mustChangePassword ? (
                    <Badge tone="amber">Temporary password</Badge>
                  ) : (
                    <Badge tone={user.isActive ? "emerald" : "slate"} dot>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </motion.li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Users} title="No users yet" />
          )}
        </Panel>
      </div>
    </div>
  );
};

export default DashboardClientPage;

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
    >
      View all
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Two bars per month, growing in on load. Hover shows the numbers. */
function GrowthChart({ data }: { data: { label: string; applications: number; users: number }[] }) {
  const max = Math.max(1, ...data.flatMap((month) => [month.applications, month.users]));
  return (
    <div className="flex h-56 items-end gap-3 sm:gap-5">
      {data.map((month, index) => (
        <div key={month.label} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {month.applications} app{month.applications === 1 ? "" : "s"} · {month.users} user{month.users === 1 ? "" : "s"}
          </div>
          <div className="flex h-full w-full items-end justify-center gap-1.5 rounded-xl px-1 transition-colors group-hover:bg-slate-50">
            {[
              { value: month.applications, className: "from-indigo-500 to-violet-400" },
              { value: month.users, className: "from-fuchsia-400 to-pink-300" },
            ].map((bar, barIndex) => (
              <motion.div
                key={barIndex}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(bar.value ? 6 : 2, (bar.value / max) * 100)}%` }}
                transition={{ duration: 0.8, delay: 0.25 + index * 0.06 + barIndex * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className={cn("w-full max-w-7 rounded-t-lg bg-gradient-to-t", bar.value ? bar.className : "from-slate-200 to-slate-100")}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-slate-400">{month.label}</span>
        </div>
      ))}
    </div>
  );
}
