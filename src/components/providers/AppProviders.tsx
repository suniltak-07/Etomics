"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/store";
import { AuthHydrator } from "@/features/auth/components/AuthHydrator";

export interface AppProvidersProps {
  children: ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator>{children}</AuthHydrator>
      </QueryClientProvider>
    </Provider>
  );
}
