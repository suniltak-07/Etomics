"use client";

import type { ReactNode } from "react";
import { useAuthHydration } from "@/features/auth/hooks/useAuthHydration";

export function AuthHydrator({ children }: { children: ReactNode }) {
  useAuthHydration();
  return children;
}
