"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas/authSchemas";
import { authService } from "@/features/auth/services/authService";
import { ApiError } from "@/lib/api/errors";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setFormError(null);
    try {
      await authService.forgotPassword(values);
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to send reset email. Please try again.",
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
          Forgot password
        </h1>
        <p className="text-brand-muted mt-1 text-sm">
          Enter your email and we&apos;ll send reset instructions.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-brand-danger text-xs">{errors.email.message}</p>
        ) : null}
      </div>

      {formError ? (
        <p className="bg-brand-danger/10 text-brand-danger rounded-md px-3 py-2 text-sm">
          {formError}
        </p>
      ) : null}

      {sent ? (
        <p className="bg-brand-success/10 text-brand-success rounded-md px-3 py-2 text-sm">
          If an account exists for that email, reset instructions have been
          sent.
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting || sent} className="w-full">
        {isSubmitting ? "Sending…" : sent ? "Email sent" : "Send reset link"}
      </Button>

      <p className="text-brand-muted text-center text-sm">
        <Link
          href="/login"
          className="text-brand-green hover:text-brand-green-light font-medium"
        >
          Back to log in
        </Link>
      </p>
    </form>
  );
}
