"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import type { RouteStopMarker } from "@/features/delivery-persons/components/RouteStopsMap";

const Map = dynamic(
  () =>
    import("@/features/delivery-persons/components/RouteStopsMap").then(
      (mod) => mod.RouteStopsMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="border-brand-border bg-brand-sand flex h-[28rem] items-center justify-center rounded-2xl border">
        <Spinner />
      </div>
    ),
  },
);

export function RouteStopsMapLazy(props: {
  origin: { latitude: number; longitude: number };
  stops: RouteStopMarker[];
  className?: string;
}) {
  return <Map {...props} />;
}
