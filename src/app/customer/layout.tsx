import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthHydrator } from "@/features/auth/components/AuthHydrator";
import { ToastHost } from "@/components/ui/toast-host";
import { LoadingState } from "@/components/states";
import { CustomerGuard } from "@/portals/customer/components/CustomerGuard";
import { CustomerHeader } from "@/portals/customer/components/CustomerHeader";

export const metadata = {
  title: "Customer",
};

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthHydrator>
      <Suspense fallback={<LoadingState title="Loading" />}>
        <CustomerGuard>
          <div className="flex min-h-full flex-col bg-[radial-gradient(ellipse_at_top,_rgba(216,232,223,0.7)_0%,_var(--sand)_42%,_#e8ece9_100%)]">
            <CustomerHeader />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
              <div className="animate-fade-up">{children}</div>
            </main>
            <ToastHost />
          </div>
        </CustomerGuard>
      </Suspense>
    </AuthHydrator>
  );
}
