"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiError } from "@/lib/use-api-error";
import { deleteApplication, updateApplication, type Application } from "@/services/applications.service";
import { useAuthStore } from "@/store/auth.store";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/** Platform owner: rename, change the slug, or turn the application on/off. */
export function EditApplicationModal({
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
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="mb-2">
          <h2 className="text-xl font-semibold">Edit Application</h2>
          <p className="mt-1 text-sm text-muted-foreground">{application.slug}</p>
        </div>
        {error ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</div>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="edit-app-name">Name</Label>
          <Input id="edit-app-name" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-app-slug">Slug</Label>
          <Input
            id="edit-app-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            required
          />
          <p className="text-xs text-muted-foreground">
            For a riad this is also its booking site address: localhost:3030/{slug || "slug"}. Old links stop working
            when it changes.
          </p>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="mt-0.5 size-4"
          />
          <span>
            <span className="block font-medium">Active</span>
            <span className="block text-xs text-muted-foreground">
              When off, nobody can open it and its public pages are hidden. Nothing is deleted.
            </span>
          </span>
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || unchanged} className="bg-blue-500 hover:bg-blue-600">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Platform owner: deletes the application and everything in it. Type the slug to confirm. */
export function DeleteApplicationModal({
  application,
  onClose,
  onDeleted,
}: {
  application: Application;
  onClose: () => void;
  onDeleted: (application: Application) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || typed !== application.slug) return;
    setDeleting(true);
    setError(null);
    try {
      onDeleted(await deleteApplication({ accessToken, applicationId: application.id }));
    } catch (deleteError) {
      setError(apiError(deleteError, "Could not delete the application."));
      setDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={confirm} className="grid gap-4">
        <div className="mb-2">
          <h2 className="text-xl font-semibold">Delete {application.name}?</h2>
          <p className="mt-1 text-sm text-muted-foreground">{application.slug}</p>
        </div>
        {error ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          This deletes the application with everything in it: who can access it, rooms, experiences, clients, drivers
          and their photos. User accounts stay. It can&apos;t be undone. Applications with bookings or transactions
          can&apos;t be deleted; turn off <span className="font-medium">Active</span> instead.
        </p>
        <div className="grid gap-2">
          <Label htmlFor="delete-app-confirm">
            Type <span className="font-mono">{application.slug}</span> to confirm
          </Label>
          <Input
            id="delete-app-confirm"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={deleting || typed !== application.slug}>
            {deleting ? "Deleting..." : "Delete Application"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
