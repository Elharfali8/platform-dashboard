"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Building2, Copy, Eye, EyeOff, Plus, RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import PageTitle from "@/components/applications/global/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createApplication,
  createApplicationOwner,
  listApplications,
  type Application,
} from "@/services/applications.service";
import { useAuthStore } from "@/store/auth.store";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateTemporaryPassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}

const EMPTY_APPLICATION_FORM = { name: "", slug: "", logoUrl: "" };
const EMPTY_OWNER_FORM = {
  email: "",
  firstName: "",
  lastName: "",
  temporaryPassword: "",
};

type WizardStep = 1 | 2 | 3 | 4;

const ApplicationsClientPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  const [applications, setApplications] = useState<Application[]>([]);
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

  const fetchApplications = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await listApplications({ accessToken });
      setApplications(response.data);
    } catch (fetchError) {
      setError(handleApiError(fetchError, "Could not load applications."));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, handleApiError]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // CREATE APPLICATION WIZARD
  const [createModal, setCreateModal] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [appForm, setAppForm] = useState(EMPTY_APPLICATION_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [ownerForm, setOwnerForm] = useState(EMPTY_OWNER_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [createdApplication, setCreatedApplication] =
    useState<Application | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function resetWizard() {
    setStep(1);
    setAppForm(EMPTY_APPLICATION_FORM);
    setSlugTouched(false);
    setOwnerForm({
      ...EMPTY_OWNER_FORM,
      temporaryPassword: generateTemporaryPassword(),
    });
    setShowPassword(false);
    setCreatedApplication(null);
    setSubmitError(null);
    setCopied(false);
  }

  function openCreateModal() {
    resetWizard();
    setCreateModal(true);
  }

  function closeCreateModal() {
    setCreateModal(false);
  }

  function handleAppFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setAppForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "name" && !slugTouched) {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  function handleSlugChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSlugTouched(true);
    setAppForm((prev) => ({ ...prev, slug: event.target.value }));
  }

  function handleOwnerFieldChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;
    setOwnerForm((prev) => ({ ...prev, [name]: value }));
  }

  function goToStep2(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(2);
  }

  function goToStep3(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(3);
  }

  async function handleFinalSubmit() {
    if (!accessToken) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let application = createdApplication;

      if (!application) {
        application = await createApplication({
          accessToken,
          data: {
            name: appForm.name,
            slug: appForm.slug,
            logoUrl: appForm.logoUrl.trim() || undefined,
          },
        });

        setCreatedApplication(application);
        setApplications((prev) => [application as Application, ...prev]);
      }

      await createApplicationOwner({
        applicationId: application.id,
        accessToken,
        data: {
          email: ownerForm.email,
          firstName: ownerForm.firstName,
          lastName: ownerForm.lastName.trim() || undefined,
          temporaryPassword: ownerForm.temporaryPassword,
        },
      });

      setStep(4);
    } catch (submitErr) {
      // If the application step already succeeded, retrying only re-attempts
      // owner creation instead of re-submitting the (now duplicate) application.
      setSubmitError(
        handleApiError(submitErr, "Could not create application."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyCredentials() {
    const text = `Email: ${ownerForm.email}\nTemporary password: ${ownerForm.temporaryPassword}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — credentials are already visible on screen.
    }
  }

  return (
    <div>
      <PageTitle title="Applications" icon={Building2} />
      <div className="my-3 h-px w-full bg-gray-300 lg:my-5" />

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={fetchApplications}
          disabled={isLoading}
          className="h-10 gap-2"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <Button
          type="button"
          onClick={openCreateModal}
          className="h-10 gap-2 bg-blue-500 px-6 hover:bg-blue-600"
        >
          <Plus size={16} />
          Create Application
        </Button>
      </div>

      <section className="mt-5 rounded-lg border border-border bg-surface p-4 shadow-[var(--card-shadow)] lg:mt-8">
        {error ? (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg border border-border bg-muted/60"
              />
            ))}
          </div>
        ) : applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Slug</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {application.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={application.logoUrl}
                            alt=""
                            className="size-6 rounded object-cover"
                          />
                        ) : (
                          <span className="grid size-6 place-items-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                            {application.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        {application.name}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {application.slug}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          application.isActive
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {application.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/35 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No applications yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create the first tenant application to get started.
            </p>
          </div>
        )}
      </section>

      {createModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Create Application</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Step {Math.min(step, 3)} of 3
              </p>
            </div>

            {submitError ? (
              <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                {submitError}
              </div>
            ) : null}

            {step === 1 && (
              <form onSubmit={goToStep2} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Application name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={appForm.name}
                    onChange={handleAppFieldChange}
                    placeholder="Naser Delivery"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={appForm.slug}
                    onChange={handleSlugChange}
                    placeholder="naser-delivery"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={appForm.logoUrl}
                    onChange={handleAppFieldChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeCreateModal}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                    Next
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={goToStep3} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Owner email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={ownerForm.email}
                    onChange={handleOwnerFieldChange}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={ownerForm.firstName}
                    onChange={handleOwnerFieldChange}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last name (optional)</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={ownerForm.lastName}
                    onChange={handleOwnerFieldChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="temporaryPassword">Temporary password</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="temporaryPassword"
                      name="temporaryPassword"
                      type={showPassword ? "text" : "password"}
                      value={ownerForm.temporaryPassword}
                      onChange={handleOwnerFieldChange}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex justify-between gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={closeCreateModal}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                      Next
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                  <p className="font-medium text-foreground">{appForm.name}</p>
                  <p className="text-muted-foreground">/{appForm.slug}</p>
                  {appForm.logoUrl ? (
                    <p className="mt-1 truncate text-muted-foreground">
                      {appForm.logoUrl}
                    </p>
                  ) : null}

                  <div className="my-3 h-px w-full bg-border" />

                  <p className="text-foreground">
                    {ownerForm.firstName} {ownerForm.lastName}
                  </p>
                  <p className="text-muted-foreground">{ownerForm.email}</p>
                  <p className="text-muted-foreground">
                    Temporary password: {ownerForm.temporaryPassword}
                  </p>
                </div>

                <div className="mt-2 flex justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeCreateModal}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {isSubmitting ? "Creating..." : "Create Application"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4">
                <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
                  <p className="font-medium text-foreground">
                    Application created
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Hand these credentials to the new owner:
                  </p>
                  <div className="mt-3 space-y-1 rounded-lg border border-border bg-background p-3 font-mono text-xs">
                    <p>Email: {ownerForm.email}</p>
                    <p>Temporary password: {ownerForm.temporaryPassword}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyCredentials}
                    className="gap-2"
                  >
                    <Copy size={14} />
                    {copied ? "Copied!" : "Copy credentials"}
                  </Button>
                  <Button
                    type="button"
                    onClick={closeCreateModal}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsClientPage;
