"use client";

import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";

export function useToast() {
  const dispatch = useAppDispatch();

  return {
    success(title: string, description?: string) {
      dispatch(addToast({ title, description, variant: "success" }));
    },
    error(title: string, description?: string) {
      dispatch(addToast({ title, description, variant: "danger" }));
    },
  };
}
