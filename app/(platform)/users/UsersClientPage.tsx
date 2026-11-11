"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Field, Toggle } from "@/components/platform/ApplicationModals";
import {
  Alert,
  Avatar,
  Badge,
  DangerButton,
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
  fieldClass,
  selectClass,
  timeAgo,
  toneClasses,
  useCopy,
  type Tone,
} from "@/components/platform/ui";
import { cn } from "@/lib/utils";
import { generateTemporaryPassword, useApiError } from "@/lib/use-api-error";
import { listApplications, type Application } from "@/services/applications.service";
import {
  createUser,
  deleteUser,
  listUsers,
  MEMBERSHIP_ROLES,
  removeMembership,
  setMembership,
  updateUser,
  type MembershipRole,
  type PlatformUser,
} from "@/services/users.service";
import { useAuthStore } from "@/store/auth.store";

const ROLES: Record<MembershipRole, { label: string; tone: Tone }> = {
  OWNER: { label: "Owner", tone: "indigo" },
  ADMIN: { label: "Admin", tone: "violet" },
  STAFF: { label: "Staff", tone: "sky" },
  DRIVER: { label: "Driver", tone: "amber" },
  USER: { label: "User", tone: "slate" },
};

type StatusFilter = "all" | "active" | "pending" | "inactive";
type Dialog =
  | { kind: "create" }
  | { kind: "edit"; user: PlatformUser }
  | { kind: "membership"; user: PlatformUser }
  | { kind: "delete"; user: PlatformUser }
  | { kind: "credentials"; email: string; password: string; title: string };

const UsersClientPage = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();

  const [users, setUsers] = useState<PlatformUser[] | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    Promise.all([listUsers({ accessToken, limit: 100 }), listApplications({ accessToken })])
      .then(([usersResponse, applicationsResponse]) => {
        if (cancelled) return;
        setUsers(usersResponse.data);
        setApplications(applicationsResponse.data);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) setError(apiError(fetchError, "Could not load users."));
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, apiError, reloadKey]);

  const counts = useMemo(() => {
    const list = users ?? [];
    return {
      all: list.length,
      active: list.filter((user) => user.isActive).length,
      pending: list.filter((user) => user.mustChangePassword).length,
      inactive: list.filter((user) => !user.isActive).length,
      owners: list.filter((user) => user.platformRole === "PLATFORM_OWNER").length,
    };
  }, [users]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (users ?? []).filter((user) => {
      if (status === "active" && !user.isActive) return false;
      if (status === "inactive" && user.isActive) return false;
      if (status === "pending" && !user.mustChangePassword) return false;
      if (applicationFilter && !user.memberships.some((m) => m.applicationId === applicationFilter)) return false;
      return !query || `${user.name} ${user.email}`.toLowerCase().includes(query);
    });
  }, [users, search, status, applicationFilter]);

  const openDialog = (next: Dialog) => {
    setDialog(next);
    setDialogOpen(true);
  };
  const closeDialog = useCallback(() => setDialogOpen(false), []);
  const replaceUser = (updated: PlatformUser) =>
    setUsers((current) => current?.map((user) => (user.id === updated.id ? updated : user)) ?? null);

  async function changeRole(user: PlatformUser, applicationId: string, role: MembershipRole) {
    if (!accessToken) return;
    setBusyKey(`${user.id}:${applicationId}`);
    setError(null);
    try {
      replaceUser(await setMembership({ accessToken, userId: user.id, applicationId, role }));
      setToast(`Role changed to ${ROLES[role].label}.`);
    } catch (roleError) {
      setError(apiError(roleError, "Could not change the role."));
    } finally {
      setBusyKey(null);
    }
  }

  async function removeAccess(user: PlatformUser, applicationId: string, applicationName: string) {
    if (!accessToken) return;
    if (!window.confirm(`Remove ${user.email} from ${applicationName}? Their account stays.`)) return;
    setBusyKey(`${user.id}:${applicationId}`);
    setError(null);
    try {
      replaceUser(await removeMembership({ accessToken, userId: user.id, applicationId }));
      setToast(`${user.email} removed from ${applicationName}.`);
    } catch (removeError) {
      setError(apiError(removeError, "Could not remove the access."));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <PageHeader
        icon={Users}
        eyebrow="Manage"
        title="Users"
        description="Everyone who can sign in, and what they can open."
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
            <PrimaryButton onClick={() => openDialog({ kind: "create" })}>
              <UserPlus className="size-4" />
              Add user
            </PrimaryButton>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={counts.all} icon={Users} tone="violet" loading={!users} delay={0.05} />
        <StatCard label="Active" value={counts.active} icon={CheckCircle2} tone="emerald" loading={!users} delay={0.1} hint="Can sign in" />
        <StatCard label="Temporary password" value={counts.pending} icon={KeyRound} tone="amber" loading={!users} delay={0.15} hint="Haven't set their own yet" />
        <StatCard label="Platform owners" value={counts.owners} icon={ShieldCheck} tone="indigo" loading={!users} delay={0.2} hint="Full access here" />
      </div>

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <Panel bodyClassName="p-0" delay={0.15}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" className="w-full sm:w-64" />
          <select
            value={applicationFilter}
            onChange={(event) => setApplicationFilter(event.target.value)}
            className={cn(selectClass, "w-full sm:w-56")}
            aria-label="Filter by application"
          >
            <option value="">All applications</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.name} · /{application.slug}
              </option>
            ))}
          </select>
          <SegmentedControl
            id="user-status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Active", count: counts.active },
              { value: "pending", label: "Temp. password", count: counts.pending },
              { value: "inactive", label: "Inactive", count: counts.inactive },
            ]}
          />
        </div>

        {!users ? (
          <SkeletonRows rows={6} height={64} />
        ) : visible.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Applications &amp; roles</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {visible.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 10) * 0.03 } }}
                      exit={{ opacity: 0, x: -12 }}
                      className="group border-t border-slate-100 align-top transition-colors hover:bg-indigo-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar name={user.name || user.email} size={40} />
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white",
                                user.isActive ? "bg-emerald-400" : "bg-slate-300",
                              )}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-medium text-slate-900">
                              {user.name}
                              {user.platformRole === "PLATFORM_OWNER" ? (
                                <ShieldCheck className="size-3.5 text-indigo-500" aria-label="Platform owner" />
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.memberships.map((membership) => {
                            const busy = busyKey === `${user.id}:${membership.applicationId}`;
                            const tone = toneClasses(ROLES[membership.role].tone);
                            return (
                              <span
                                key={membership.applicationId}
                                className={cn(
                                  "group/chip inline-flex items-center gap-1 rounded-lg py-0.5 pl-2 pr-0.5 text-xs ring-1 ring-inset transition",
                                  tone.soft,
                                  tone.ring,
                                  busy && "opacity-50",
                                )}
                              >
                                <span className="max-w-36 truncate font-medium text-slate-700" title={`/${membership.applicationSlug}`}>
                                  {membership.applicationName}
                                </span>
                                <select
                                  value={membership.role}
                                  onChange={(event) =>
                                    changeRole(user, membership.applicationId, event.target.value as MembershipRole)
                                  }
                                  disabled={busy}
                                  className={cn("cursor-pointer rounded-md bg-white/70 py-0.5 pl-1 pr-0.5 text-[11px] font-semibold outline-none", tone.text)}
                                  aria-label={`Role of ${user.email} in ${membership.applicationName}`}
                                >
                                  {MEMBERSHIP_ROLES.map((role) => (
                                    <option key={role} value={role}>
                                      {ROLES[role].label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => removeAccess(user, membership.applicationId, membership.applicationName)}
                                  disabled={busy}
                                  className="grid size-5 place-items-center rounded-md text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                                  aria-label={`Remove ${user.email} from ${membership.applicationName}`}
                                  title="Remove access"
                                >
                                  <X className="size-3" />
                                </button>
                              </span>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => openDialog({ kind: "membership", user })}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Plus className="size-3" />
                            {user.memberships.length ? "Add" : "Add to application"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <Badge tone={user.isActive ? "emerald" : "slate"} dot>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {user.mustChangePassword ? <Badge tone="amber">Temp. password</Badge> : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400">{timeAgo(user.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                          <IconButton onClick={() => openDialog({ kind: "edit", user })} aria-label={`Edit ${user.email}`} title="Edit">
                            <Pencil className="size-4" />
                          </IconButton>
                          <IconButton
                            tone="rose"
                            onClick={() => openDialog({ kind: "delete", user })}
                            aria-label={`Delete ${user.email}`}
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
        ) : users.length ? (
          <EmptyState icon={Users} title="No users match" description="Try another search or filter." />
        ) : (
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Add the first person who can sign in."
            action={
              <PrimaryButton onClick={() => openDialog({ kind: "create" })}>
                <UserPlus className="size-4" />
                Add user
              </PrimaryButton>
            }
          />
        )}
      </Panel>

      <Modal
        open={dialogOpen && dialog?.kind === "create"}
        onClose={closeDialog}
        title="Add user"
        description="They sign in with a temporary password and choose their own."
        icon={UserPlus}
      >
        <CreateUserForm
          applications={applications}
          onCancel={closeDialog}
          onCreated={(user, password) => {
            setUsers((current) => [user, ...(current ?? [])]);
            openDialog({ kind: "credentials", email: user.email, password, title: "User created" });
          }}
        />
      </Modal>

      <Modal
        open={dialogOpen && dialog?.kind === "edit"}
        onClose={closeDialog}
        title="Edit user"
        description={dialog?.kind === "edit" ? dialog.user.email : undefined}
        icon={Pencil}
      >
        {dialog?.kind === "edit" ? (
          <EditUserForm
            key={dialog.user.id}
            user={dialog.user}
            onCancel={closeDialog}
            onSaved={(user, newPassword) => {
              replaceUser(user);
              if (newPassword) {
                openDialog({ kind: "credentials", email: user.email, password: newPassword, title: "Password reset" });
              } else {
                closeDialog();
                setToast(`${user.email} updated.`);
              }
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={dialogOpen && dialog?.kind === "membership"}
        onClose={closeDialog}
        title="Add to application"
        description={dialog?.kind === "membership" ? dialog.user.email : undefined}
        icon={Plus}
      >
        {dialog?.kind === "membership" ? (
          <MembershipForm
            key={dialog.user.id}
            user={dialog.user}
            applications={applications}
            onCancel={closeDialog}
            onSaved={(user, applicationName) => {
              replaceUser(user);
              closeDialog();
              setToast(`${user.email} can now open ${applicationName}.`);
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={dialogOpen && dialog?.kind === "delete"}
        onClose={closeDialog}
        title="Delete user?"
        description={dialog?.kind === "delete" ? dialog.user.email : undefined}
        icon={Trash2}
        tone="rose"
      >
        {dialog?.kind === "delete" ? (
          <DeleteUserConfirm
            key={dialog.user.id}
            user={dialog.user}
            onCancel={closeDialog}
            onDeleted={(user) => {
              setUsers((current) => current?.filter((item) => item.id !== user.id) ?? null);
              closeDialog();
              setToast(`${user.email} deleted.`);
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={dialogOpen && dialog?.kind === "credentials"}
        onClose={closeDialog}
        title={dialog?.kind === "credentials" ? dialog.title : ""}
        description="Share these with the user. They'll choose a new password when they sign in."
        icon={CheckCircle2}
        tone="emerald"
      >
        {dialog?.kind === "credentials" ? <Credentials email={dialog.email} password={dialog.password} onDone={closeDialog} /> : null}
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
};

export default UsersClientPage;

/* ------------------------------------------------------------------ forms */

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label}>
      <div className="flex gap-2">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={8}
          required
          autoComplete="new-password"
          className={cn(fieldClass, "font-mono")}
        />
        <SecondaryButton type="button" className="w-10 px-0" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </SecondaryButton>
        <SecondaryButton
          type="button"
          className="w-10 px-0"
          onClick={() => {
            onChange(generateTemporaryPassword());
            setVisible(true);
          }}
          aria-label="Generate a password"
          title="Generate"
        >
          <KeyRound className="size-4" />
        </SecondaryButton>
      </div>
    </Field>
  );
}

function RoleSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: MembershipRole;
  onChange: (role: MembershipRole) => void;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as MembershipRole)}
      disabled={disabled}
      className={cn(fieldClass, "pr-2")}
    >
      {MEMBERSHIP_ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLES[role].label}
        </option>
      ))}
    </select>
  );
}

function CreateUserForm({
  applications,
  onCancel,
  onCreated,
}: {
  applications: Application[];
  onCancel: () => void;
  onCreated: (user: PlatformUser, password: string) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const [form, setForm] = useState(() => ({
    email: "",
    firstName: "",
    lastName: "",
    temporaryPassword: generateTemporaryPassword(),
    applicationId: "",
    role: "STAFF" as MembershipRole,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const user = await createUser({
        accessToken,
        data: {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName.trim() || undefined,
          temporaryPassword: form.temporaryPassword,
          ...(form.applicationId ? { applicationId: form.applicationId, role: form.role } : {}),
        },
      });
      onCreated(user, form.temporaryPassword);
    } catch (createError) {
      setError(apiError(createError, "Could not create the user."));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <Field id="user-email" label="Email">
        <input id="user-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoFocus className={fieldClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="user-first" label="First name">
          <input id="user-first" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required className={fieldClass} />
        </Field>
        <Field id="user-last" label="Last name (optional)">
          <input id="user-last" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={fieldClass} />
        </Field>
      </div>
      <PasswordField id="user-password" label="Temporary password" value={form.temporaryPassword} onChange={(temporaryPassword) => setForm({ ...form, temporaryPassword })} />
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <Field id="user-app" label="Application (optional)">
          <select id="user-app" value={form.applicationId} onChange={(event) => setForm({ ...form, applicationId: event.target.value })} className={fieldClass}>
            <option value="">No application yet</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.name} · /{application.slug}
              </option>
            ))}
          </select>
        </Field>
        <Field id="user-role" label="Role">
          <RoleSelect id="user-role" value={form.role} onChange={(role) => setForm({ ...form, role })} disabled={!form.applicationId} />
        </Field>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create user"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function EditUserForm({
  user,
  onCancel,
  onSaved,
}: {
  user: PlatformUser;
  onCancel: () => void;
  onSaved: (user: PlatformUser, newPassword: string | null) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const [form, setForm] = useState({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName ?? "",
    isActive: user.isActive,
  });
  const [resetPassword, setResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await updateUser({
        accessToken,
        userId: user.id,
        data: {
          ...(form.email !== user.email ? { email: form.email } : {}),
          ...(form.firstName !== user.firstName ? { firstName: form.firstName } : {}),
          ...(form.lastName !== (user.lastName ?? "") ? { lastName: form.lastName } : {}),
          ...(form.isActive !== user.isActive ? { isActive: form.isActive } : {}),
          ...(resetPassword ? { temporaryPassword: newPassword } : {}),
        },
      });
      onSaved(saved, resetPassword ? newPassword : null);
    } catch (saveError) {
      setError(apiError(saveError, "Could not save the user."));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <Field id="edit-email" label="Email">
        <input id="edit-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required className={fieldClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="edit-first" label="First name">
          <input id="edit-first" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required className={fieldClass} />
        </Field>
        <Field id="edit-last" label="Last name">
          <input id="edit-last" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={fieldClass} />
        </Field>
      </div>
      <Toggle checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label="Active" description="When off, they can't sign in anywhere." />
      <Toggle
        checked={resetPassword}
        onChange={(checked) => {
          setResetPassword(checked);
          if (checked && !newPassword) setNewPassword(generateTemporaryPassword());
        }}
        label="Reset password"
        description="Gives them a new temporary password; they choose their own at next sign-in."
      />
      <AnimatePresence initial={false}>
        {resetPassword ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <PasswordField id="edit-password" label="New temporary password" value={newPassword} onChange={setNewPassword} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="mt-2 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function MembershipForm({
  user,
  applications,
  onCancel,
  onSaved,
}: {
  user: PlatformUser;
  applications: Application[];
  onCancel: () => void;
  onSaved: (user: PlatformUser, applicationName: string) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const available = applications.filter((application) => !user.memberships.some((m) => m.applicationId === application.id));
  const [applicationId, setApplicationId] = useState(available[0]?.id ?? "");
  const [role, setRole] = useState<MembershipRole>("STAFF");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !applicationId) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await setMembership({ accessToken, userId: user.id, applicationId, role });
      onSaved(saved, applications.find((application) => application.id === applicationId)?.name ?? "the application");
    } catch (saveError) {
      setError(apiError(saveError, "Could not add the access."));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {error ? <Alert>{error}</Alert> : null}
      {available.length ? (
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field id="membership-app" label="Application">
            <select id="membership-app" value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className={fieldClass}>
              {available.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.name} · /{application.slug}
                </option>
              ))}
            </select>
          </Field>
          <Field id="membership-role" label="Role">
            <RoleSelect id="membership-role" value={role} onChange={setRole} />
          </Field>
        </div>
      ) : (
        <p className="text-sm text-slate-500">This user already belongs to every application.</p>
      )}
      <div className="mt-2 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={saving || !applicationId}>
          {saving ? "Adding…" : "Give access"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function DeleteUserConfirm({
  user,
  onCancel,
  onDeleted,
}: {
  user: PlatformUser;
  onCancel: () => void;
  onDeleted: (user: PlatformUser) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!accessToken) return;
    setDeleting(true);
    setError(null);
    try {
      onDeleted(await deleteUser({ accessToken, userId: user.id }));
    } catch (deleteError) {
      setError(apiError(deleteError, "Could not delete the user."));
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <Avatar name={user.name || user.email} size={40} />
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">
            {user.memberships.length ? `${user.memberships.length} application${user.memberships.length === 1 ? "" : "s"}` : "No application"}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">
        This deletes the account and all its access. <span className="font-medium text-slate-900">It can&apos;t be undone.</span> To only
        block sign-in, edit the user and turn off <span className="font-medium">Active</span>.
      </p>
      <div className="mt-2 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onCancel} disabled={deleting}>
          Cancel
        </SecondaryButton>
        <DangerButton type="button" onClick={confirm} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete user"}
        </DangerButton>
      </div>
    </div>
  );
}

function Credentials({ email, password, onDone }: { email: string; password: string; onDone: () => void }) {
  const { copied, copy } = useCopy();
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700">
        <p>Email: {email}</p>
        <p>Temporary password: {password}</p>
      </div>
      <div className="flex justify-end gap-2">
        <SecondaryButton type="button" onClick={() => copy(`Email: ${email}\nTemporary password: ${password}`, "credentials")}>
          {copied === "credentials" ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          {copied === "credentials" ? "Copied" : "Copy credentials"}
        </SecondaryButton>
        <PrimaryButton type="button" onClick={onDone}>
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}
