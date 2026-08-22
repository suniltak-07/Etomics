"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf } from "lucide-react";
import { LoadingState } from "@/components/states";
import { fetchCurrentUser } from "@/features/auth/loadCurrentUser";
import { AUTH_TOKEN_KEY } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { clearClientSession, getClientToken } from "@/lib/auth/session";
import { sanitizeNextPath } from "@/lib/auth/splash";
import { resolvePostLoginPath } from "@/lib/backend/roles";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, setCredentials } from "@/store/slices/authSlice";

type SplashPhase = "checking" | "loading" | "redirecting";

const COPY: Record<SplashPhase, { title: string; description: string }> = {
  checking: {
    title: "Checking your session",
    description: "Hang tight while we confirm you’re signed in.",
  },
  loading: {
    title: "Loading your account",
    description: "Fetching the latest profile so everything is up to date.",
  },
  redirecting: {
    title: "Taking you to your dashboard",
    description: "Almost there — opening the right portal for your role.",
  },
};

export function SplashScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const sessionVerified = useAppSelector((state) => state.auth.sessionVerified);
  const user = useAppSelector((state) => state.auth.user);
  const [phase, setPhase] = useState<SplashPhase>("checking");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const next = sanitizeNextPath(searchParams.get("next"));

      if (sessionVerified && user) {
        setPhase("redirecting");
        router.replace(resolvePostLoginPath(user.role, next));
        return;
      }

      const token = getClientToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      setPhase("loading");
      try {
        const session = await fetchCurrentUser();
        if (cancelled) return;
        dispatch(setCredentials({ user: session.user, token: session.token }));
        setPhase("redirecting");
        router.replace(resolvePostLoginPath(session.user.role, next));
      } catch (error) {
        if (cancelled) return;
        const unauthorized =
          error instanceof ApiError &&
          (error.statusCode === 401 || error.statusCode === 403);
        if (unauthorized) {
          clearClientSession();
          try {
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
          } catch {
            // ignore
          }
          dispatch(logout());
        }
        router.replace("/login");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [dispatch, router, searchParams, sessionVerified, user]);

  const copy = COPY[phase];

  return (
    <div className="bg-brand-sand relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(216,232,223,0.9),_transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <span className="text-brand-navy inline-flex items-center gap-2.5">
            <span className="bg-brand-navy text-brand-green-muted flex size-10 items-center justify-center rounded-xl">
              <Leaf className="size-4" aria-hidden />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">
              Eat<span className="text-brand-green">Omics</span>
            </span>
          </span>
        </div>
        <LoadingState title={copy.title} description={copy.description} />
      </div>
    </div>
  );
}
