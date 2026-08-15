"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";

const LocationPickerMap = dynamic(
  () =>
    import("@/features/addresses/components/LocationPickerMap").then(
      (mod) => mod.LocationPickerMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="border-brand-border bg-brand-sand flex h-64 items-center justify-center rounded-2xl border">
        <Spinner />
      </div>
    ),
  },
);

export function AddressMapPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <LocationPickerMap
      latitude={latitude}
      longitude={longitude}
      onChange={onChange}
      className="border-brand-border h-52 overflow-hidden rounded-2xl border shadow-sm sm:h-64"
    />
  );
}
