"use client";

import { motion } from "framer-motion";
import { Check, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useRouter } from "next/navigation";

import { changePassword } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

const checks = {
  container: {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.35,
      },
    },
  },
  item: {
    hidden: { opacity: 0, x: -8 },
    show: { opacity: 1, x: 0 },
  },
};

const ChangePasswordClientPage = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

const accessToken = useAuthStore((state) => state.accessToken);
const setAuth = useAuthStore((state) => state.setAuth);
    

  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const checklist = useMemo(
    () => [
      {
        label: "At least 8 characters",
        isValid: hasMinLength,
      },
      {
        label: "Passwords match",
        isValid: passwordsMatch,
      },
    ],
    [hasMinLength, passwordsMatch],
  );

    const canSubmit =
  currentPassword.length > 0 &&
  hasMinLength &&
  passwordsMatch;

    async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (!accessToken) {
    setError("Your session has expired. Please sign in again.");
    return;
  }

  if (!canSubmit) {
    return;
  }

  setError("");
  setIsLoading(true);

  try {
    await changePassword(
      {
        currentPassword,
        newPassword,
      },
      accessToken,
    );

    setAuth({
      accessToken,
      mustChangePassword: false,
    });

    router.push("/dashboard");
  } catch {
    setError("Unable to change password. Please try again.");
  } finally {
    setIsLoading(false);
  }
}

  return (
    <motion.section
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-md"
    >
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className="absolute -inset-x-8 top-10 h-40 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-slate-950/10">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="h-1 origin-left bg-primary"
        />

        <div className="px-5 py-7 sm:px-8 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mb-7 flex items-center gap-3"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-slate-950/10">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Secure access
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
                Welcome, Naser 👋
              </h1>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mb-7 text-sm leading-6 text-muted-foreground"
          >
            For security, you need to change your temporary password before
            continuing.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
                      className="space-y-4"
                      onSubmit={handleSubmit}
                  >
                      <label className="block">
  <span className="sr-only">Current password</span>

  <div className="relative">
    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

    <Input
      type="password"
      value={currentPassword}
      onChange={(event) =>
        setCurrentPassword(event.target.value)
      }
      placeholder="Current temporary password"
      autoComplete="current-password"
      disabled={isLoading}
      className="h-12 rounded-md bg-background pl-10 pr-3"
    />
  </div>
</label>
            <label className="block">
              <span className="sr-only">New password</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  className="h-12 rounded-md bg-background pl-10 pr-3"
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">Confirm new password</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="h-12 rounded-md bg-background pl-10 pr-3"
                />
              </div>
            </label>

            <motion.ul
              variants={checks.container}
              initial="hidden"
              animate="show"
              className="space-y-2 py-1"
            >
              {checklist.map((item) => (
                <motion.li
                  key={item.label}
                  variants={checks.item}
                  className="flex min-h-6 items-center gap-2 text-sm text-foreground"
                >
                  <span
                    className={
                      item.isValid
                        ? "grid size-5 place-items-center rounded-full bg-success text-white"
                        : "grid size-5 place-items-center rounded-full border border-border text-muted-foreground"
                    }
                  >
                    <Check className="size-3.5" />
                  </span>
                  {item.label}
                </motion.li>
              ))}
            </motion.ul>

            <Button
              type="submit"
              size="lg"
                          className="mt-2 h-12 w-full rounded-md text-base"
                          disabled={!canSubmit || isLoading}
            >
              {isLoading ? "Changing password..." : "Change password"}
                      </Button>
                      {error && (
  <p className="text-sm text-danger">
    {error}
  </p>
)}
          </motion.form>
        </div>
      </div>
    </motion.section>
  );
};

export default ChangePasswordClientPage;
