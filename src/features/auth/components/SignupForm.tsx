"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signupSchema,
  type SignupInput,
} from "@/features/auth/schemas/authSchemas";
import { authService } from "@/features/auth/services/authService";
import { persistAuthSession } from "@/features/auth/persistSession";
import { ApiError } from "@/lib/api/errors";
import { portalHomeForRole } from "@/lib/backend/roles";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";

export function SignupForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      mobile: "",
    },
  });

  const onSubmit = async (values: SignupInput) => {
    setFormError(null);
    try {
      const payload = {
        ...values,
        mobile: values.mobile?.trim() ? values.mobile.trim() : undefined,
      };
      const response = await authService.signup(payload);
      const { user, token, expiresIn } = response.data;
      persistAuthSession(user, token, expiresIn);
      dispatch(setCredentials({ user, token }));
      router.replace(portalHomeForRole(user.role));
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to create account. Please try again.",
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
          Create account
        </h1>
        <p className="text-brand-muted mt-1 text-sm">
          Start your EatOmics subscription journey.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-firstName">First name</Label>
          <Input
            id="signup-firstName"
            autoComplete="given-name"
            {...register("firstName")}
          />
          {errors.firstName ? (
            <p className="text-brand-danger text-xs">
              {errors.firstName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-lastName">Last name</Label>
          <Input
            id="signup-lastName"
            autoComplete="family-name"
            {...register("lastName")}
          />
          {errors.lastName ? (
            <p className="text-brand-danger text-xs">
              {errors.lastName.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-brand-danger text-xs">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-mobile">Mobile (optional)</Label>
        <Input
          id="signup-mobile"
          type="tel"
          autoComplete="tel"
          {...register("mobile")}
        />
        {errors.mobile ? (
          <p className="text-brand-danger text-xs">{errors.mobile.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-brand-danger text-xs">{errors.password.message}</p>
        ) : (
          <p className="text-brand-muted text-xs">
            At least 8 characters, with uppercase, lowercase, a number, and a
            special character.
          </p>
        )}
      </div>

      {formError ? (
        <p className="bg-brand-danger/10 text-brand-danger rounded-md px-3 py-2 text-sm">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating…" : "Create account"}
      </Button>

      <p className="text-brand-muted text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand-green hover:text-brand-green-light font-medium"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
