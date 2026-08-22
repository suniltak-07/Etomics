import type { Metadata } from "next";
import { Suspense } from "react";
import { SplashScreen } from "@/features/auth/components/SplashScreen";
import { LoadingState } from "@/components/states";

export const metadata: Metadata = {
  title: "Loading",
  description: "Preparing your EatOmics workspace.",
};

export default function SplashPage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          title="Checking your session"
          description="Hang tight while we confirm you’re signed in."
        />
      }
    >
      <SplashScreen />
    </Suspense>
  );
}
