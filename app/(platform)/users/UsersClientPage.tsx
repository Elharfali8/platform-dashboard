"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, Pencil, Plus, RefreshCw, Trash2, Users, X } from "lucide-react";

import PageTitle from "@/components/applications/global/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ROLE_LABELS: Record<MembershipRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  STAFF: "Staff",
  DRIVER: "Driver",
  USER: "User",
};

const selectClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type Modal =
  | { type: "create" }
  | { type: "edit"; user: PlatformUser }
  | { type: "membership"; user: PlatformUser }
  | { type: "delete"; user: PlatformUser }
  | { type: "credentials"; email: string; password: string; title: string };

const UsersClientPage = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();

  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [modal, setModal] = useState<Modal | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const [usersResponse, applicationsResponse] = await Promise.all([
        listUsers({ accessToken, search, applicationId: applicationFilter || undefined }),
        listApplications({ accessToken }),
      ]);
      setUsers(usersResponse.data);
      setApplications(applicationsResponse.data);
    } catch (fetchError) {
      setError(apiError(fetchError, "Could not load users."));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, apiError, search, applicationFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 300 : 0); // wait for typing to pause
    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  /** Puts the updated user back in the list. */
  function replaceUser(updated: PlatformUser) {
    setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
  }

  async function handleRemoveMembership(user: PlatformUser, applicationId: string, applicationName: string) {
    if (!accessToken) return;
    if (!window.confirm(`Remove ${user.email} from ${applicationName}? Their account stays.`)) return;
    setBusyKey(`${user.id}:${applicationId}`);
    setError(null);
    try {
      replaceUser(await removeMembership({ accessToken, userId: user.id, applicationId }));
      setNotice(`${user.email} no longer has access to ${applicationName}.`);
    } catch (removeError) {
      setError(apiError(removeError, "Could not remove the access."));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRoleChange(user: PlatformUser, applicationId: string, role: MembershipRole) {
    if (!accessToken) return;
    setBusyKey(`${user.id}:${applicationId}`);
    setError(null);
    try {
      replaceUser(await setMembership({ accessToken, userId: user.id, applicationId, role }));
    } catch (roleError) {
      setError(apiError(roleError, "Could not change the role."));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <PageTitle title="Users" icon={Users} />
      <div className="my-3 h-px w-full bg-gray-300 lg:my-5" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email…"
            className="h-10 max-w-xs"
            aria-label="Search users"
          />
          <select
            value={applicationFilter}
            onChange={(event) => setApplicationFilter(event.target.value)}
            className={`${selectClass} max-w-xs`}
            aria-label="Filter by application"
          >
            <option value="">All applications</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.name} ({application.slug})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={fetchUsers} disabled={isLoading} className="h-10 gap-2">
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="h-10 gap-2 bg-blue-500 px-6 hover:bg-blue-600"
          >
            <Plus size={16} />
            Add User
          </Button>
        </div>
      </div>

      {notice ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ) : null}

      <section className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-[var(--card-shadow)] lg:mt-8">
        {error ? (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</div>
        ) : null}

        {isLoading && users.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg border border-border bg-muted/60" />
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Applications &amp; roles</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border align-top last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                      {user.platformRole === "PLATFORM_OWNER" ? (
                        <span className="mt-1 inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                          Platform owner
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      {user.memberships.length ? (
                        <ul className="space-y-1.5">
                          {user.memberships.map((membership) => {
                            const busy = busyKey === `${user.id}:${membership.applicationId}`;
                            return (
                              <li key={membership.applicationId} className="flex items-center gap-2">
                                <span className="min-w-0 truncate">
                                  {membership.applicationName}{" "}
                                  <span className="text-muted-foreground">/{membership.applicationSlug}</span>
                                </span>
                                <select
                                  value={membership.role}
                                  onChange={(event) =>
                                    handleRoleChange(user, membership.applicationId, event.target.value as MembershipRole)
                                  }
                                  disabled={busy}
                                  className="h-7 rounded-md border border-border bg-background px-1.5 text-xs"
                                  aria-label={`Role of ${user.email} in ${membership.applicationName}`}
                                >
                                  {MEMBERSHIP_ROLES.map((role) => (
                                    <option key={role} value={role}>
                                      {ROLE_LABELS[role]}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveMembership(user, membership.applicationId, membership.applicationName)
                                  }
                                  disabled={busy}
                                  className="rounded p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                                  aria-label={`Remove ${user.email} from ${membership.applicationName}`}
                                  title="Remove from this application"
                                >
                                  <X size={14} />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">No application</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setModal({ type: "membership", user })}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        <Plus size={12} />
                        Add to application
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                      {user.mustChangePassword ? (
                        <p className="mt-1 text-xs text-muted-foreground">Temporary password</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setModal({ type: "edit", user })}
                          aria-label={`Edit ${user.email}`}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => setModal({ type: "delete", user })}
                          aria-label={`Delete ${user.email}`}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/35 p-8 text-center">
            <p className="text-sm font-medium text-foreground">No users found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || applicationFilter ? "Try another search or filter." : "Add the first user."}
            </p>
          </div>
        )}
      </section>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {modal.type === "create" ? (
              <CreateUserForm
                applications={applications}
                onCancel={() => setModal(null)}
                onCreated={(user, password) => {
                  setUsers((current) => [user, ...current]);
                  setModal({ type: "credentials", email: user.email, password, title: "User created" });
                }}
              />
            ) : modal.type === "edit" ? (
              <EditUserForm
                user={modal.user}
                onCancel={() => setModal(null)}
                onSaved={(user, newPassword) => {
                  replaceUser(user);
                  if (newPassword) {
                    setModal({ type: "credentials", email: user.email, password: newPassword, title: "Password reset" });
                  } else {
                    setModal(null);
                    setNotice(`${user.email} updated.`);
                  }
                }}
              />
            ) : modal.type === "membership" ? (
              <MembershipForm
                user={modal.user}
                applications={applications}
                onCancel={() => setModal(null)}
                onSaved={(user, applicationName) => {
                  replaceUser(user);
                  setModal(null);
                  setNotice(`${user.email} now has access to ${applicationName}.`);
                }}
              />
            ) : modal.type === "delete" ? (
              <DeleteUserConfirm
                user={modal.user}
                onCancel={() => setModal(null)}
                onDeleted={(user) => {
                  setUsers((current) => current.filter((item) => item.id !== user.id));
                  setModal(null);
                  setNotice(`${user.email} deleted.`);
                }}
              />
            ) : (
              <Credentials {...modal} onDone={() => setModal(null)} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UsersClientPage;

function ModalHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  return message ? (
    <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{message}</div>
  ) : null;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={8}
          required={required}
          autoComplete="new-password"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => {
            onChange(generateTemporaryPassword());
            setVisible(true);
          }}
          aria-label="Generate a password"
          title="Generate"
        >
          <KeyRound size={16} />
        </Button>
      </div>
    </div>
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
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    temporaryPassword: generateTemporaryPassword(),
    applicationId: "",
    role: "STAFF" as MembershipRole,
  });
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
      <ModalHeader title="Add User" description="They sign in with this temporary password and must change it." />
      <FormError message={error} />
      <div className="grid gap-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="user-first">First name</Label>
          <Input
            id="user-first"
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="user-last">Last name (optional)</Label>
          <Input
            id="user-last"
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
          />
        </div>
      </div>
      <PasswordField
        id="user-password"
        label="Temporary password"
        value={form.temporaryPassword}
        onChange={(temporaryPassword) => setForm({ ...form, temporaryPassword })}
        required
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <div className="grid gap-2">
          <Label htmlFor="user-app">Application (optional)</Label>
          <select
            id="user-app"
            value={form.applicationId}
            onChange={(event) => setForm({ ...form, applicationId: event.target.value })}
            className={selectClass}
          >
            <option value="">No application yet</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.name} ({application.slug})
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="user-role">Role</Label>
          <select
            id="user-role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as MembershipRole })}
            disabled={!form.applicationId}
            className={selectClass}
          >
            {MEMBERSHIP_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="bg-blue-500 hover:bg-blue-600">
          {saving ? "Creating..." : "Create User"}
        </Button>
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
      <ModalHeader title="Edit User" description={user.email} />
      <FormError message={error} />
      <div className="grid gap-2">
        <Label htmlFor="edit-email">Email</Label>
        <Input
          id="edit-email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="edit-first">First name</Label>
          <Input
            id="edit-first"
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-last">Last name</Label>
          <Input
            id="edit-last"
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
          />
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          className="mt-0.5 size-4"
        />
        <span>
          <span className="block font-medium">Active</span>
          <span className="block text-xs text-muted-foreground">When off, they can&apos;t sign in anywhere.</span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
        <input
          type="checkbox"
          checked={resetPassword}
          onChange={(event) => {
            setResetPassword(event.target.checked);
            if (event.target.checked && !newPassword) setNewPassword(generateTemporaryPassword());
          }}
          className="mt-0.5 size-4"
        />
        <span>
          <span className="block font-medium">Reset password</span>
          <span className="block text-xs text-muted-foreground">
            Gives them a new temporary password; they choose their own at next sign-in.
          </span>
        </span>
      </label>
      {resetPassword ? (
        <PasswordField id="edit-password" label="New temporary password" value={newPassword} onChange={setNewPassword} required />
      ) : null}
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="bg-blue-500 hover:bg-blue-600">
          {saving ? "Saving..." : "Save"}
        </Button>
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
  const available = applications.filter(
    (application) => !user.memberships.some((membership) => membership.applicationId === application.id),
  );
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
      <ModalHeader title="Add to Application" description={user.email} />
      <FormError message={error} />
      {available.length ? (
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <div className="grid gap-2">
            <Label htmlFor="membership-app">Application</Label>
            <select
              id="membership-app"
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              className={selectClass}
            >
              {available.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.name} ({application.slug})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="membership-role">Role</Label>
            <select
              id="membership-role"
              value={role}
              onChange={(event) => setRole(event.target.value as MembershipRole)}
              className={selectClass}
            >
              {MEMBERSHIP_ROLES.map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">This user already belongs to every application.</p>
      )}
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !applicationId} className="bg-blue-500 hover:bg-blue-600">
          {saving ? "Adding..." : "Add"}
        </Button>
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
      <ModalHeader title="Delete User" description={user.email} />
      <FormError message={error} />
      <p className="text-sm text-muted-foreground">
        This deletes the account and removes it from{" "}
        {user.memberships.length ? `${user.memberships.length} application(s)` : "every application"}. It can&apos;t be
        undone. To only block sign-in, edit the user and turn off <span className="font-medium">Active</span> instead.
      </p>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={confirm} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete User"}
        </Button>
      </div>
    </div>
  );
}

function Credentials({
  title,
  email,
  password,
  onDone,
}: {
  title: string;
  email: string;
  password: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Email: ${email}\nTemporary password: ${password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the credentials are on screen.
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-muted-foreground">Share these with the user. They&apos;ll choose a new password when they sign in.</p>
        <div className="mt-3 space-y-1 rounded-lg border border-border bg-background p-3 font-mono text-xs">
          <p>Email: {email}</p>
          <p>Temporary password: {password}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={copy} className="gap-2">
          <Copy size={14} />
          {copied ? "Copied!" : "Copy credentials"}
        </Button>
        <Button type="button" onClick={onDone} className="bg-blue-500 hover:bg-blue-600">
          Done
        </Button>
      </div>
    </div>
  );
}
