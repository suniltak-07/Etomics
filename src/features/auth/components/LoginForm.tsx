"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/schemas/authSchemas";
import { authService } from "@/features/auth/services/authService";
import { AUTH_TOKEN_KEY } from "@/lib/api/client";
import { setClientSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { UserRole } from "@/types/enums";

const DEMO_HINT =
  "Demo: customer@etomics.com / Customer123! · admin@etomics.com / Admin123!";

function redirectForRole(role: string, fallback?: string | null) {
  if (fallback && fallback.startsWith("/")) return fallback;
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    return "/admin/dashboard";
  }
  return "/customer/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [formError, setFormError] = useState<string | null>(null);

  const redirect = useMemo(() => {
    return searchParams.get("returnUrl") ?? searchParams.get("redirect");
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      const response = await authService.login(values);
      const { user, token } = response.data;
      setClientSession(token, user);
      try {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch {
        // ignore storage failures
      }
      dispatch(setCredentials({ user, token }));
      router.replace(redirectForRole(user.role, redirect));
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="animate-fade-up border-brand-border bg-brand-surface space-y-5 rounded-2xl border p-6 shadow-sm"
      noValidate
    >
      <div>
        <h1 className="font-display text-brand-navy text-2xl font-semibold">
          Log in
        </h1>
        <p className="text-brand-muted mt-1 text-sm">
          Welcome back to your EatOmics account.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-brand-danger text-xs">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="login-password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-brand-green hover:text-brand-green-light text-xs font-medium"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-brand-danger text-xs">{errors.password.message}</p>
        ) : null}
      </div>

      {formError ? (
        <p className="bg-brand-danger/10 text-brand-danger rounded-md px-3 py-2 text-sm">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-brand-muted text-center text-sm">
        New here?{" "}
        <Link
          href="/signup"
          className="text-brand-green hover:text-brand-green-light font-medium"
        >
          Create an account
        </Link>
      </p>

      <p className="bg-brand-sand text-brand-muted rounded-md px-3 py-2 text-center text-[11px] leading-relaxed">
        {DEMO_HINT}
      </p>
    </form>
  );
}
