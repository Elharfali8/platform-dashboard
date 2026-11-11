"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Boxes,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Truck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { Field } from "@/components/platform/ApplicationModals";
import {
  Alert,
  Avatar,
  PrimaryButton,
  SecondaryButton,
  fieldClass,
  spring,
  useCopy,
} from "@/components/platform/ui";
import { cn } from "@/lib/utils";
import { generateTemporaryPassword, useApiError } from "@/lib/use-api-error";
import { createApplication, createApplicationOwner, type Application } from "@/services/applications.service";
import { listUsers, type PlatformUser } from "@/services/users.service";
import { useAuthStore } from "@/store/auth.store";

/** Only guides the wizard (hints and next steps); platform-api doesn't store it. */
type Kind = "riad" | "delivery" | "other";

const KINDS: { value: Kind; label: string; description: string; icon: LucideIcon; gradient: string }[] = [
  {
    value: "riad",
    label: "Riad",
    description: "Rooms, bookings and a public booking site.",
    icon: BedDouble,
    gradient: "from-amber-400 to-rose-500",
  },
  {
    value: "delivery",
    label: "Delivery",
    description: "Drivers, clients and cash transactions.",
    icon: Truck,
    gradient: "from-sky-400 to-indigo-500",
  },
  {
    value: "other",
    label: "Other",
    description: "Any other business on the platform.",
    icon: Boxes,
    gradient: "from-violet-400 to-fuchsia-500",
  },
];

const STEPS = ["Type", "Details", "Owner", "Review"] as const;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BOOKING_SITE = "http://localhost:3030";
const RIAD_DASHBOARD = "http://localhost:4040";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const slide = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

export function CreateApplicationWizard({
  applications,
  onClose,
  onCreated,
}: {
  /** Already loaded, to check that the slug is free. */
  applications: Application[];
  onClose: () => void;
  onCreated: (application: Application) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const apiError = useApiError();
  const { copied, copy } = useCopy();
  const shake = useAnimationControls();

  const [[step, direction], setStepState] = useState<[number, number]>([1, 1]);
  const [kind, setKind] = useState<Kind>("riad");
  const [app, setApp] = useState({ name: "", slug: "", logoUrl: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [owner, setOwner] = useState(() => ({
    email: "",
    firstName: "",
    lastName: "",
    temporaryPassword: generateTemporaryPassword(),
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [created, setCreated] = useState<Application | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string[]>([]);

  // Known accounts, so an existing owner is recognised by email.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    listUsers({ accessToken, limit: 100 })
      .then((response) => !cancelled && setUsers(response.data))
      .catch(() => undefined); // only a convenience
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const slugTaken = useMemo(
    () => applications.some((application) => application.slug === app.slug && application.id !== created?.id),
    [applications, app.slug, created],
  );
  const existingUser = useMemo(
    () => users.find((user) => user.email.toLowerCase() === owner.email.trim().toLowerCase()) ?? null,
    [users, owner.email],
  );
  const kindInfo = KINDS.find((item) => item.value === kind)!;

  function goTo(next: number) {
    setError(null);
    setInvalid([]);
    setStepState([next, next > step ? 1 : -1]);
  }

  /** Checks the current step; shakes and marks the fields when something is missing. */
  function validate() {
    const problems: string[] = [];
    if (step === 2) {
      if (!app.name.trim()) problems.push("name");
      if (!SLUG.test(app.slug) || slugTaken) problems.push("slug");
    }
    if (step === 3) {
      if (!EMAIL.test(owner.email.trim())) problems.push("email");
      if (!existingUser) {
        if (!owner.firstName.trim()) problems.push("firstName");
        if (owner.temporaryPassword.length < 8) problems.push("password");
      }
    }
    setInvalid(problems);
    if (problems.length) void shake.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
    return problems.length === 0;
  }

  function next() {
    if (validate()) goTo(step + 1);
  }

  async function finish() {
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      // A retry after the owner step failed must not create the application twice.
      let application = created;
      if (!application) {
        application = await createApplication({
          accessToken,
          data: { name: app.name.trim(), slug: app.slug, logoUrl: app.logoUrl.trim() || undefined },
        });
        setCreated(application);
        onCreated(application);
      }
      await createApplicationOwner({
        applicationId: application.id,
        accessToken,
        data: {
          email: owner.email.trim().toLowerCase(),
          firstName: existingUser?.firstName ?? owner.firstName.trim(),
          lastName: (existingUser?.lastName ?? owner.lastName.trim()) || undefined,
          temporaryPassword: owner.temporaryPassword, // ignored for an existing account
        },
      });
      setStepState([5, 1]);
    } catch (submitError) {
      setError(apiError(submitError, "Could not create the application."));
      void shake.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
    } finally {
      setSubmitting(false);
    }
  }

  const isInvalid = (field: string) => invalid.includes(field);
  const fieldState = (field: string) =>
    cn(fieldClass, isInvalid(field) && "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-500/10");

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Enter" && step <= 3 && (event.target as HTMLElement).tagName === "INPUT") {
          event.preventDefault();
          next();
        }
      }}
    >
      {/* Progress */}
      {step <= 4 ? (
        <div className="mb-6">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
              initial={false}
              animate={{ width: `${(step / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((label, index) => {
              const number = index + 1;
              const done = step > number;
              const current = step === number;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => done && goTo(number)}
                    disabled={!done}
                    className="flex w-full items-center gap-2 text-left disabled:cursor-default"
                  >
                    <motion.span
                      animate={{ scale: current ? 1.08 : 1 }}
                      transition={spring}
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors duration-300",
                        done
                          ? "bg-emerald-500 text-white"
                          : current
                            ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30"
                            : "bg-slate-100 text-slate-400",
                      )}
                    >
                      {done ? <Check className="size-3.5" /> : number}
                    </motion.span>
                    <span
                      className={cn(
                        "truncate text-xs font-medium transition-colors",
                        current ? "text-slate-900" : done ? "text-slate-600 hover:text-indigo-600" : "text-slate-400",
                      )}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <motion.div animate={shake}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 1. Type */}
            {step === 1 ? (
              <div className="grid gap-4">
                <p className="text-sm text-slate-500">What kind of business is it?</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {KINDS.map((item) => {
                    const selected = kind === item.value;
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.value}
                        type="button"
                        onClick={() => setKind(item.value)}
                        onDoubleClick={() => goTo(2)}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={spring}
                        className={cn(
                          "relative rounded-2xl border p-4 text-left transition-colors",
                          selected ? "border-transparent" : "border-slate-200 hover:border-slate-300",
                        )}
                        aria-pressed={selected}
                      >
                        {selected ? (
                          <motion.span
                            layoutId="kind-selected"
                            transition={spring}
                            className="absolute inset-0 rounded-2xl bg-indigo-50/60 ring-2 ring-indigo-500"
                          />
                        ) : null}
                        <span className="relative block">
                          <span className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", item.gradient)}>
                            <Icon className="size-5" />
                          </span>
                          <span className="mt-3 block text-sm font-semibold text-slate-900">{item.label}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{item.description}</span>
                        </span>
                        <AnimatePresence>
                          {selected ? (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={spring}
                              className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-indigo-500 text-white"
                            >
                              <Check className="size-3" />
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* 2. Details */}
            {step === 2 ? (
              <div className="grid gap-4">
                <Field id="app-name" label="Name">
                  <input
                    id="app-name"
                    value={app.name}
                    onChange={(event) =>
                      setApp((current) => ({
                        ...current,
                        name: event.target.value,
                        slug: slugTouched ? current.slug : slugify(event.target.value),
                      }))
                    }
                    placeholder={kind === "riad" ? "Riad Yasmine" : kind === "delivery" ? "Naser Delivery" : "My business"}
                    autoFocus
                    className={fieldState("name")}
                  />
                </Field>
                <Field
                  id="app-slug"
                  label="Slug"
                  hint={
                    kind === "riad" ? (
                      <>
                        Booking site: <span className="font-mono text-slate-700">{BOOKING_SITE.replace("http://", "")}/{app.slug || "slug"}</span>
                      </>
                    ) : (
                      "Lowercase letters, numbers and hyphens. Used in links."
                    )
                  }
                >
                  <div className="relative">
                    <input
                      id="app-slug"
                      value={app.slug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        setApp((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") }));
                      }}
                      placeholder="riad-yasmine"
                      className={cn(fieldState("slug"), "pr-28 font-mono")}
                    />
                    <AnimatePresence mode="wait">
                      {app.slug ? (
                        <motion.span
                          key={!SLUG.test(app.slug) ? "bad" : slugTaken ? "taken" : "ok"}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className={cn(
                            "absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium",
                            !SLUG.test(app.slug) || slugTaken ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600",
                          )}
                        >
                          {!SLUG.test(app.slug) ? (
                            <>
                              <X className="size-3" /> Invalid
                            </>
                          ) : slugTaken ? (
                            <>
                              <X className="size-3" /> Taken
                            </>
                          ) : (
                            <>
                              <Check className="size-3" /> Available
                            </>
                          )}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </Field>
                <Field id="app-logo" label="Logo URL (optional)" hint="The owner can also upload a logo later from their own dashboard.">
                  <div className="flex items-center gap-3">
                    <Avatar name={app.name || "?"} src={app.logoUrl || null} size={40} square />
                    <input
                      id="app-logo"
                      type="url"
                      value={app.logoUrl}
                      onChange={(event) => setApp((current) => ({ ...current, logoUrl: event.target.value }))}
                      placeholder="https://…"
                      className={fieldClass}
                    />
                  </div>
                </Field>
              </div>
            ) : null}

            {/* 3. Owner */}
            {step === 3 ? (
              <div className="grid gap-4">
                <Field id="owner-email" label="Owner email">
                  <input
                    id="owner-email"
                    type="email"
                    value={owner.email}
                    onChange={(event) => setOwner((current) => ({ ...current, email: event.target.value }))}
                    placeholder="owner@example.com"
                    autoFocus
                    autoComplete="off"
                    className={fieldState("email")}
                  />
                </Field>

                <AnimatePresence mode="wait" initial={false}>
                  {existingUser ? (
                    <motion.div
                      key="existing"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                        <Avatar name={existingUser.name || existingUser.email} size={40} />
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="font-medium text-slate-900">
                            {existingUser.name} <span className="font-normal text-emerald-700">· existing account</span>
                          </p>
                          <p className="text-xs text-slate-600">
                            They&apos;ll be linked as owner and keep their own password
                            {existingUser.memberships.length
                              ? ` (already in ${existingUser.memberships.map((m) => m.applicationName).join(", ")})`
                              : ""}
                            .
                          </p>
                        </div>
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="new"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid gap-4 overflow-hidden"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="owner-first" label="First name">
                          <input
                            id="owner-first"
                            value={owner.firstName}
                            onChange={(event) => setOwner((current) => ({ ...current, firstName: event.target.value }))}
                            className={fieldState("firstName")}
                          />
                        </Field>
                        <Field id="owner-last" label="Last name (optional)">
                          <input
                            id="owner-last"
                            value={owner.lastName}
                            onChange={(event) => setOwner((current) => ({ ...current, lastName: event.target.value }))}
                            className={fieldClass}
                          />
                        </Field>
                      </div>
                      <Field id="owner-password" label="Temporary password" hint="They choose their own when they first sign in.">
                        <div className="flex gap-2">
                          <input
                            id="owner-password"
                            type={showPassword ? "text" : "password"}
                            value={owner.temporaryPassword}
                            onChange={(event) => setOwner((current) => ({ ...current, temporaryPassword: event.target.value }))}
                            className={cn(fieldState("password"), "font-mono")}
                          />
                          <SecondaryButton
                            type="button"
                            className="w-10 px-0"
                            onClick={() => setShowPassword((value) => !value)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </SecondaryButton>
                          <SecondaryButton
                            type="button"
                            className="w-10 px-0"
                            onClick={() => {
                              setOwner((current) => ({ ...current, temporaryPassword: generateTemporaryPassword() }));
                              setShowPassword(true);
                            }}
                            aria-label="Generate a password"
                            title="Generate"
                          >
                            <KeyRound className="size-4" />
                          </SecondaryButton>
                        </div>
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}

            {/* 4. Review */}
            {step === 4 ? (
              <div className="grid gap-3">
                <ReviewRow label="Type" onEdit={() => goTo(1)}>
                  <span className={cn("grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white", kindInfo.gradient)}>
                    <kindInfo.icon className="size-4" />
                  </span>
                  <p className="font-medium text-slate-900">{kindInfo.label}</p>
                </ReviewRow>
                <ReviewRow label="Application" onEdit={() => goTo(2)}>
                  <Avatar name={app.name} src={app.logoUrl || null} size={36} square />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{app.name}</p>
                    <p className="truncate font-mono text-xs text-slate-500">/{app.slug}</p>
                  </div>
                </ReviewRow>
                <ReviewRow label="Owner" onEdit={() => goTo(3)}>
                  <span className="grid size-9 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                    <UserRound className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {existingUser ? existingUser.name : `${owner.firstName} ${owner.lastName}`.trim()}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {owner.email.trim()} · {existingUser ? "existing account" : "new account"}
                    </p>
                  </div>
                </ReviewRow>
              </div>
            ) : null}

            {/* 5. Done */}
            {step === 5 ? (
              <div className="grid gap-5 text-center">
                <Celebration />
                <div>
                  <p className="text-lg font-semibold text-slate-900">{app.name} is ready 🎉</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {existingUser
                      ? `${existingUser.name} can open it with their usual password.`
                      : "Hand these credentials to the owner."}
                  </p>
                </div>

                {!existingUser ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left font-mono text-xs leading-6 text-slate-700">
                    <p>Email: {owner.email.trim()}</p>
                    <p>Temporary password: {owner.temporaryPassword}</p>
                  </div>
                ) : null}

                {kind === "riad" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-left">
                    <p className="text-sm font-semibold text-slate-900">To show it on the booking site</p>
                    <ol className="mt-2 space-y-1.5 text-sm text-slate-600">
                      {[
                        <>Owner signs in to the <a href={RIAD_DASHBOARD} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline">riad dashboard</a></>,
                        "Adds at least one room",
                        "Settings → WhatsApp + Published → Save",
                      ].map((text, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-amber-200 text-[10px] font-semibold text-amber-800">
                            {index + 1}
                          </span>
                          <span>{text}</span>
                        </motion.li>
                      ))}
                    </ol>
                    <a
                      href={`${BOOKING_SITE}/${app.slug}/book`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-indigo-600 hover:underline"
                    >
                      {BOOKING_SITE.replace("http://", "")}/{app.slug}/book
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-center gap-2">
                  {!existingUser ? (
                    <SecondaryButton
                      type="button"
                      onClick={() => copy(`Email: ${owner.email.trim()}\nTemporary password: ${owner.temporaryPassword}`, "credentials")}
                    >
                      {copied === "credentials" ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                      {copied === "credentials" ? "Copied" : "Copy credentials"}
                    </SecondaryButton>
                  ) : null}
                  <PrimaryButton type="button" onClick={onClose}>
                    Done
                  </PrimaryButton>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Navigation */}
      {step <= 4 ? (
        <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          {step > 1 ? (
            <SecondaryButton type="button" onClick={() => goTo(step - 1)} disabled={submitting}>
              <ArrowLeft className="size-4" />
              Back
            </SecondaryButton>
          ) : (
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
          )}
          {step < 4 ? (
            <PrimaryButton type="button" onClick={next}>
              Continue
              <ArrowRight className="size-4" />
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={finish} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {submitting ? "Creating…" : created ? "Retry adding the owner" : "Create application"}
            </PrimaryButton>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ReviewRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
    >
      <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <button
        type="button"
        onClick={onEdit}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
        aria-label={`Edit ${label.toLowerCase()}`}
        title="Edit"
      >
        <Pencil className="size-3.5" />
      </button>
    </motion.div>
  );
}

const BURST = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2;
  return {
    x: Math.cos(angle) * (56 + (index % 3) * 14),
    y: Math.sin(angle) * (56 + (index % 3) * 14),
    color: ["bg-indigo-400", "bg-violet-400", "bg-fuchsia-400", "bg-emerald-400", "bg-amber-400"][index % 5],
  };
});

/** A check mark with a small burst of dots around it. */
function Celebration() {
  return (
    <div className="relative mx-auto grid size-20 place-items-center">
      {BURST.map((dot, index) => (
        <motion.span
          key={index}
          className={cn("absolute size-2 rounded-full", dot.color)}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: dot.x, y: dot.y, scale: [0, 1.2, 0.6], opacity: [1, 1, 0] }}
          transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
        className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-50"
      >
        <Check className="size-8" strokeWidth={3} />
      </motion.div>
    </div>
  );
}
