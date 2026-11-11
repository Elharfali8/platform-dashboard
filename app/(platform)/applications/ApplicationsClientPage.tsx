"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Pencil,
  Plus,
  PowerOff,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { DeleteApplicationForm, EditApplicationForm } from "@/components/platform/ApplicationModals";
import { CreateApplicationWizard } from "@/components/platform/CreateApplicationWizard";
import {
  Alert,
  Avatar,
  Badge,
  EmptyState,
  IconButton,
  Modal,
  PageHeader,
  Panel,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SegmentedControl,
  SkeletonRows,
  StatCard,
  Toast,
  timeAgo,
  useCopy,
} from "@/components/platform/ui";
import { cn } from "@/lib/utils";
import { useApiError } from "@/lib/use-api-error";
import { listApplications, type Application } from "@/services/applications.service";
import { useAuthStore } from "@/store/auth.store";

type StatusFilter = "all" | "active" | "inactive";
type Dialog = { kind: "create" | "edit" | "delete"; application: Application | null; open: boolean };

const ApplicationsClientPage = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const { copied, copy } = useCopy();

  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dialog, setDialog] = useState<Dialog>({ kind: "create", application: null, open: false });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    listApplications({ accessToken })
      .then((response) => {
        if (cancelled) return;
        setApplications(response.data);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) setError(apiError(fetchError, "Could not load applications."));
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, apiError, reloadKey]);

  const counts = useMemo(() => {
    const list = applications ?? [];
    const active = list.filter((application) => application.isActive).length;
    return { all: list.length, active, inactive: list.length - active };
  }, [applications]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (applications ?? []).filter(
      (application) =>
        (status === "all" || application.isActive === (status === "active")) &&
        (!query || `${application.name} ${application.slug}`.toLowerCase().includes(query)),
    );
  }, [applications, search, status]);

  const closeDialog = useCallback(() => setDialog((current) => ({ ...current, open: false })), []);
  const replace = (saved: Application) =>
    setApplications((current) => current?.map((item) => (item.id === saved.id ? saved : item)) ?? null);

  return (
    <div>
      <PageHeader
        icon={Building2}
        eyebrow="Manage"
        title="Applications"
        description="Every business on the platform: riads, delivery apps and more."
        actions={
          <>
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
            <PrimaryButton onClick={() => setDialog({ kind: "create", application: null, open: true })}>
              <Plus className="size-4" />
              New application
            </PrimaryButton>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={counts.all} icon={Building2} tone="indigo" loading={!applications} delay={0.05} />
        <StatCard label="Active" value={counts.active} icon={CheckCircle2} tone="emerald" loading={!applications} delay={0.1} hint="Open to their team and guests" />
        <StatCard label="Inactive" value={counts.inactive} icon={PowerOff} tone="slate" loading={!applications} delay={0.15} hint="Switched off, nothing deleted" />
      </div>

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Panel bodyClassName="p-0" delay={0.15}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or slug…" className="w-full sm:w-72" />
          <SegmentedControl
            id="app-status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Active", count: counts.active },
              { value: "inactive", label: "Inactive", count: counts.inactive },
            ]}
          />
        </div>

        {!applications ? (
          <SkeletonRows />
        ) : visible.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Application</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {visible.map((application, index) => (
                    <motion.tr
                      key={application.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 10) * 0.03 } }}
                      exit={{ opacity: 0, x: -12 }}
                      className="group border-t border-slate-100 transition-colors hover:bg-indigo-50/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={application.name} src={application.logoUrl} size={38} square />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{application.name}</p>
                            <p className="truncate font-mono text-[11px] text-slate-400">{application.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => copy(application.slug, application.id)}
                          className="group/slug inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1 font-mono text-xs text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                          title="Copy slug"
                        >
                          /{application.slug}
                          {copied === application.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3 opacity-0 transition-opacity group-hover/slug:opacity-100" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={application.isActive ? "emerald" : "slate"} dot>
                          {application.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-700">{new Date(application.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400">{timeAgo(application.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                          <IconButton
                            onClick={() => setDialog({ kind: "edit", application, open: true })}
                            aria-label={`Edit ${application.name}`}
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </IconButton>
                          <IconButton
                            tone="rose"
                            onClick={() => setDialog({ kind: "delete", application, open: true })}
                            aria-label={`Delete ${application.name}`}
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </IconButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : applications.length ? (
          <EmptyState icon={Building2} title="No applications match" description="Try another search or filter." />
        ) : (
          <EmptyState
            icon={Building2}
            title="No applications yet"
            description="Create the first business on the platform and give it an owner."
            action={
              <PrimaryButton onClick={() => setDialog({ kind: "create", application: null, open: true })}>
                <Plus className="size-4" />
                New application
              </PrimaryButton>
            }
          />
        )}
      </Panel>

      <Modal
        open={dialog.open && dialog.kind === "create"}
        onClose={closeDialog}
        title="New application"
        description="A few quick steps: type, details, owner."
        icon={Building2}
        width="max-w-2xl"
      >
        <CreateApplicationWizard
          applications={applications ?? []}
          onClose={closeDialog}
          onCreated={(created) => setApplications((current) => [created, ...(current ?? [])])}
        />
      </Modal>

      <Modal
        open={dialog.open && dialog.kind === "edit"}
        onClose={closeDialog}
        title="Edit application"
        description={dialog.application ? `/${dialog.application.slug}` : undefined}
        icon={Pencil}
      >
        {dialog.application && dialog.kind === "edit" ? (
          <EditApplicationForm
            key={dialog.application.id}
            application={dialog.application}
            onClose={closeDialog}
            onSaved={(saved) => {
              replace(saved);
              closeDialog();
              setToast(`${saved.name} updated.`);
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={dialog.open && dialog.kind === "delete"}
        onClose={closeDialog}
        title={dialog.application ? `Delete ${dialog.application.name}?` : "Delete application"}
        description={dialog.application ? `/${dialog.application.slug}` : undefined}
        icon={Trash2}
        tone="rose"
      >
        {dialog.application && dialog.kind === "delete" ? (
          <DeleteApplicationForm
            key={dialog.application.id}
            application={dialog.application}
            onClose={closeDialog}
            onDeleted={(deleted) => {
              setApplications((current) => current?.filter((item) => item.id !== deleted.id) ?? null);
              closeDialog();
              setToast(`${deleted.name} deleted.`);
            }}
            onDeactivate={(saved) => {
              replace(saved);
              closeDialog();
              setToast(`${saved.name} deactivated.`);
            }}
          />
        ) : null}
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
};

export default ApplicationsClientPage;
