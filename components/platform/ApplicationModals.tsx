"use client";

import { FormEvent, useState } from "react";
import { Power } from "lucide-react";

import { Alert, DangerButton, PrimaryButton, SecondaryButton, fieldClass } from "@/components/platform/ui";
import { cn } from "@/lib/utils";
import { useApiError } from "@/lib/use-api-error";
import { deleteApplication, updateApplication, type Application } from "@/services/applications.service";
import { useAuthStore } from "@/store/auth.store";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/** An on/off switch with a label and an explanation. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition hover:border-slate-300 hover:bg-slate-50/60"
    >
      <span
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-gradient-to-r from-indigo-500 to-violet-500" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
    </button>
  );
}

/** Platform owner: rename, change the slug, or switch the application on/off. */
export function EditApplicationForm({
  application,
  onClose,
  onSaved,
}: {
  application: Application;
  onClose: () => void;
  onSaved: (application: Application) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const [name, setName] = useState(application.name);
  const [slug, setSlug] = useState(application.slug);
  const [isActive, setIsActive] = useState(application.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    if (!SLUG.test(slug)) return setError("Slug: lowercase letters, numbers and hyphens only (e.g. dar-anika).");

    setSaving(true);
    setError(null);
    try {
      const saved = await updateApplication({
        accessToken,
        applicationId: application.id,
        data: {
          ...(name.trim() !== application.name ? { name: name.trim() } : {}),
          ...(slug !== application.slug ? { slug } : {}),
          ...(isActive !== application.isActive ? { isActive } : {}),
        },
      });
      onSaved(saved);
    } catch (saveError) {
      setError(apiError(saveError, "Could not save the application."));
      setSaving(false);
    }
  }

  const unchanged = name.trim() === application.name && slug === application.slug && isActive === application.isActive;

  return (
    <form onSubmit={submit} className="grid gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <Field id="edit-app-name" label="Name">
        <input id="edit-app-name" value={name} onChange={(event) => setName(event.target.value)} required className={fieldClass} />
      </Field>
      <Field
        id="edit-app-slug"
        label="Slug"
        hint={
          <>
            For a riad this is its booking site address:{" "}
            <span className="font-mono text-slate-700">localhost:3030/{slug || "slug"}</span>. Old links stop working
            when it changes.
          </>
        }
      >
        <input
          id="edit-app-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value.toLowerCase())}
          required
          className={cn(fieldClass, "font-mono")}
        />
      </Field>
      <Toggle
        checked={isActive}
        onChange={setIsActive}
        label="Active"
        description="When off, nobody can open it and its public pages are hidden. Nothing is deleted."
      />
      <div className="mt-2 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose} disabled={saving}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={saving || unchanged}>
          {saving ? "Saving…" : "Save changes"}
        </PrimaryButton>
      </div>
    </form>
  );
}

/** Platform owner: deletes the application and everything in it. Type the slug to confirm. */
export function DeleteApplicationForm({
  application,
  onClose,
  onDeleted,
  onDeactivate,
}: {
  application: Application;
  onClose: () => void;
  onDeleted: (application: Application) => void;
  /** Offered when the API refuses (bookings or transactions). */
  onDeactivate: (application: Application) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || typed !== application.slug) return;
    setBusy(true);
    setError(null);
    try {
      onDeleted(await deleteApplication({ accessToken, applicationId: application.id }));
    } catch (deleteError) {
      const message = apiError(deleteError, "Could not delete the application.");
      setError(message);
      setBlocked(/deactivate/i.test(message));
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!accessToken) return;
    setBusy(true);
    try {
      onDeactivate(
        await updateApplication({ accessToken, applicationId: application.id, data: { isActive: false } }),
      );
    } catch (updateError) {
      setError(apiError(updateError, "Could not deactivate the application."));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={confirm} className="grid gap-4">
      {error ? (
        <Alert>
          {error}
          {blocked && application.isActive ? (
            <button
              type="button"
              onClick={deactivate}
              disabled={busy}
              className="mt-2 flex items-center gap-1.5 font-medium text-rose-800 underline-offset-2 hover:underline"
            >
              <Power className="size-3.5" />
              Deactivate it instead
            </button>
          ) : null}
        </Alert>
      ) : null}
      <p className="text-sm leading-relaxed text-slate-600">
        This deletes the application with everything in it: who can access it, rooms, experiences, clients, drivers and
        their photos. User accounts stay. <span className="font-medium text-slate-900">This can&apos;t be undone.</span>
      </p>
      <Field id="delete-app-confirm" label={`Type ${application.slug} to confirm`}>
        <input
          id="delete-app-confirm"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          placeholder={application.slug}
          className={cn(fieldClass, "font-mono")}
        />
      </Field>
      <div className="mt-2 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose} disabled={busy}>
          Cancel
        </SecondaryButton>
        <DangerButton type="submit" disabled={busy || typed !== application.slug}>
          {busy ? "Deleting…" : "Delete application"}
        </DangerButton>
      </div>
    </form>
  );
}
