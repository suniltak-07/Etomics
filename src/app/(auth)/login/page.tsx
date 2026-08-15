import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your EatOmics account.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
