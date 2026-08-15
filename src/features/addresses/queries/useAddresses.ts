"use client";

import { useQuery } from "@tanstack/react-query";
import { addressService } from "@/features/addresses/services/addressService";

export const addressKeys = {
  all: ["addresses"] as const,
  list: (customerId?: string) =>
    [...addressKeys.all, "list", customerId ?? "all"] as const,
};

export function useAddresses(customerId?: string, enabled = true) {
  return useQuery({
    queryKey: addressKeys.list(customerId),
    queryFn: async () => {
      const res = await addressService.list(customerId);
      return res.data;
    },
    enabled,
  });
}
