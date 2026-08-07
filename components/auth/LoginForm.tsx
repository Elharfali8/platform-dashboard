"use client";

import Image from "next/image";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

import { login } from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";

type ApiErrorResponse = {
  message?: string;
};

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await login({
                email,
                password,
            })
        
            setAuth({
        accessToken: response.accessToken,
        mustChangePassword: response.mustChangePassword,
      });

      if (response.mustChangePassword) {
        router.push("/auth/change-password");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
         if (error instanceof AxiosError) {
        const data = error.response?.data as
          | ApiErrorResponse
          | undefined;

        setError(
          data?.message ??
            "Unable to sign in. Please try again.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }

    }

  return (
    <section className="w-full max-w-md rounded-lg border border-border bg-card px-5 py-6 shadow-xl shadow-slate-950/5 sm:px-8 sm:py-8">
      <div className="mb-8 text-center">
        <Image
          src="/images/logo.png"
          alt="Platform Dashboard"
          width={220}
          height={56}
          priority
          className="mx-auto h-auto w-44 sm:w-52"
        />
        <h1 className="mt-6 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Login to continue to your dashboard.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isLoading}
        
            className="h-11 rounded-md bg-background px-3"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <Input
               id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isLoading}
          minLength={8}
          required
              className="h-11 rounded-md bg-background px-3 pr-11"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full rounded-md" disabled={isLoading}>
          <LogIn data-icon="inline-start" />
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </section>
  );
};

export default LoginForm;
