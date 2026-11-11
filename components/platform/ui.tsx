"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView } from "framer-motion";
import { AlertCircle, CheckCircle2, Search, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * The platform dashboard's building blocks: one look for every page.
 * Indigo/violet accents (like the sidebar), white cards on a soft slate background.
 */

export const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

export type Tone = "indigo" | "violet" | "emerald" | "amber" | "rose" | "sky" | "slate";

const TONES: Record<Tone, { soft: string; text: string; ring: string; solid: string; dot: string }> = {
  indigo: { soft: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-600/15", solid: "from-indigo-500 to-indigo-600", dot: "bg-indigo-500" },
  violet: { soft: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-600/15", solid: "from-violet-500 to-fuchsia-500", dot: "bg-violet-500" },
  emerald: { soft: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/15", solid: "from-emerald-500 to-teal-500", dot: "bg-emerald-500" },
  amber: { soft: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-600/20", solid: "from-amber-400 to-orange-500", dot: "bg-amber-500" },
  rose: { soft: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-600/15", solid: "from-rose-500 to-pink-500", dot: "bg-rose-500" },
  sky: { soft: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-600/15", solid: "from-sky-400 to-blue-500", dot: "bg-sky-500" },
  slate: { soft: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-500/15", solid: "from-slate-400 to-slate-500", dot: "bg-slate-400" },
};

export const toneClasses = (tone: Tone) => TONES[tone];

/* ------------------------------------------------------------------ layout */

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/25">
          <Icon className="size-[22px]" />
        </div>
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600/80">{eyebrow}</p>
          ) : null}
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 lg:text-[28px]">{title}</h1>
          {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </motion.header>
  );
}

export function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
  delay = 0,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      {title ? (
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ numbers */

/** Counts up to `value` the first time it's on screen. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    const controls = animate(Number(node.dataset.shown ?? 0), value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString();
        node.dataset.shown = String(latest);
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      0
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  hint,
  loading,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: React.ReactNode;
  loading?: boolean;
  delay?: number;
}) {
  const t = TONES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ ...spring, delay }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-14px_rgba(15,23,42,0.1)]"
    >
      <div
        aria-hidden
        className={cn(
          "absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.16]",
          t.solid,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded-md bg-slate-100" /> : <CountUp value={value} />}
          </p>
        </div>
        <div className={cn("grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", t.solid)}>
          <Icon className="size-5" />
        </div>
      </div>
      {hint ? <div className="relative mt-3 text-xs text-slate-500">{hint}</div> : null}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ small pieces */

export function Badge({
  tone = "slate",
  dot,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        t.soft,
        t.text,
        t.ring,
        className,
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", t.dot)} /> : null}
      {children}
    </span>
  );
}

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500",
  "from-sky-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-fuchsia-400 to-purple-500",
];

/** Initials on a gradient picked from the name, or the image when there is one. */
export function Avatar({
  name,
  src,
  size = 36,
  square,
}: {
  name: string;
  src?: string | null;
  size?: number;
  square?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const gradient = AVATAR_GRADIENTS[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_GRADIENTS.length];
  const shape = square ? "rounded-xl" : "rounded-full";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={{ width: size, height: size }}
        className={cn("shrink-0 object-cover ring-1 ring-slate-200", shape)}
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
      className={cn("grid shrink-0 place-items-center bg-gradient-to-br font-semibold text-white shadow-sm", gradient, shape)}
    >
      {initials || "?"}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** Pill tabs with a sliding background. */
export function SegmentedControl<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex h-10 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative h-8 rounded-lg px-3 text-[13px] font-medium transition-colors",
              active ? "text-slate-900" : "text-slate-500 hover:text-slate-800",
            )}
            aria-pressed={active}
          >
            {active ? (
              <motion.span
                layoutId={`segment-${id}`}
                transition={spring}
                className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80"
              />
            ) : null}
            <span className="relative flex items-center gap-1.5">
              {option.label}
              {option.count !== undefined ? (
                <span className={cn("rounded-md px-1.5 text-[11px] tabular-nums", active ? "bg-indigo-50 text-indigo-600" : "bg-slate-200/70 text-slate-500")}>
                  {option.count}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const selectClass =
  "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10";

export const fieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400";

export function PrimaryButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 text-sm font-medium text-white shadow-md shadow-indigo-500/25 outline-none transition hover:shadow-lg hover:shadow-indigo-500/30 hover:brightness-110 focus-visible:ring-4 focus-visible:ring-indigo-500/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-indigo-500/15 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-medium text-white shadow-md shadow-rose-600/20 outline-none transition hover:bg-rose-500 focus-visible:ring-4 focus-visible:ring-rose-500/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Square icon button for table rows. */
export function IconButton({
  tone = "slate",
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { tone?: "slate" | "rose" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "grid size-8 place-items-center rounded-lg text-slate-400 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-50",
        tone === "rose" ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-slate-100 hover:text-slate-700",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative">
        <div aria-hidden className="absolute inset-0 -z-10 scale-150 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-500 ring-1 ring-indigo-100">
          <Icon className="size-6" />
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 5, height = 56 }: { rows?: number; height?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          style={{ height, animationDelay: `${index * 80}ms` }}
          className="animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
        />
      ))}
    </div>
  );
}

export function Alert({ tone = "rose", children }: { tone?: "rose" | "emerald"; children: React.ReactNode }) {
  const Icon = tone === "rose" ? AlertCircle : CheckCircle2;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        tone === "rose" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ overlays */

/** Centered dialog with a blurred backdrop. Escape and a click outside close it. */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  tone = "indigo",
  width = "max-w-lg",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  width?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={spring}
            className={cn(
              "relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20",
              width,
            )}
          >
            <div className="flex items-start gap-3.5 px-6 pb-2 pt-6">
              {Icon ? (
                <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", TONES[tone].solid)}>
                  <Icon className="size-5" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
                {description ? <div className="mt-0.5 text-sm text-slate-500">{description}</div> : null}
              </div>
              <IconButton onClick={onClose} aria-label="Close" className="-mr-2 -mt-1">
                <X className="size-4" />
              </IconButton>
            </div>
            <div className="px-6 pb-6 pt-4">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/** Bottom-right toast that disappears by itself. */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 3800);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60]">
      <AnimatePresence>
        {message ? (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={spring}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl bg-slate-900 py-3 pl-3.5 pr-2 text-sm text-white shadow-2xl shadow-slate-900/30"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="size-4" />
            </span>
            <span className="flex-1">{message}</span>
            <button type="button" onClick={onDone} className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Dismiss">
              <X className="size-3.5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Small "x ago" / date label. */
export function timeAgo(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(-Math.round(seconds / size), unit);
  }
  return "just now";
}

/** Copies text and shows a check for a moment. */
export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(text: string, key = text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
    } catch {
      // Clipboard unavailable: nothing to do, the text is on screen.
    }
  }
  return { copied, copy };
}
