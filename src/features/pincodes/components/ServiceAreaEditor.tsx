"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  hasDefinedServiceArea,
  type ServiceAreaRing,
} from "@/features/pincodes/serviceArea";

const Map = dynamic(
  () =>
    import("@/features/pincodes/components/ServiceAreaMap").then(
      (mod) => mod.ServiceAreaMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bg-brand-sand flex h-72 items-center justify-center">
        <Spinner />
      </div>
    ),
  },
);

export function ServiceAreaEditor({
  ring,
  onChange,
  center,
  pin,
  bounds,
  locating,
  locateError,
  onLocate,
  pincode,
}: {
  ring: ServiceAreaRing;
  onChange: (next: ServiceAreaRing) => void;
  center: [number, number];
  pin?: [number, number] | null;
  bounds?: [[number, number], [number, number]] | null;
  locating?: boolean;
  locateError?: string | null;
  onLocate?: () => void;
  pincode: string;
}) {
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<ServiceAreaRing>([]);
  const [drawError, setDrawError] = useState<string | null>(null);

  function startDraw() {
    setDraft([]);
    setDrawing(true);
    setDrawError(null);
  }

  function finishDraw() {
    if (draft.length < 3) {
      setDrawError("Draw at least 3 points to close the area.");
      return;
    }
    onChange(draft);
    setDrawing(false);
    setDraft([]);
    setDrawError(null);
  }

  function clearArea() {
    onChange([]);
    setDraft([]);
    setDrawing(false);
    setDrawError(null);
  }

  const error = drawError ?? locateError ?? null;

  return (
    <div className="space-y-2">
      <div className="border-brand-border etomics-service-area-map h-72 overflow-hidden rounded-xl border">
        <Map
          ring={ring}
          draft={draft}
          drawing={drawing}
          center={center}
          pin={pin}
          bounds={bounds}
          onAddPoint={(point) => setDraft((current) => [...current, point])}
          onMoveVertex={(index, point) =>
            onChange(
              ring.map((item, itemIndex) =>
                itemIndex === index ? point : item,
              ),
            )
          }
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onLocate?.()}
          disabled={locating || !/^\d{6}$/.test(pincode.trim())}
        >
          {locating ? "Locating…" : "Locate pincode"}
        </Button>
        {drawing ? (
          <>
            <Button type="button" size="sm" onClick={finishDraw}>
              Finish polygon
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft([]);
                setDrawing(false);
                setDrawError(null);
              }}
            >
              Cancel draw
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={startDraw}
            >
              {hasDefinedServiceArea(ring) ? "Redraw" : "Draw polygon"}
            </Button>
            {hasDefinedServiceArea(ring) ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={clearArea}
              >
                Clear
              </Button>
            ) : null}
          </>
        )}
      </div>
      <p className="text-brand-muted text-xs">
        {drawing
          ? "Click the map to add points. Use Finish polygon when the shape is closed (3+ points). Drag vertices after saving to edit."
          : hasDefinedServiceArea(ring)
            ? "Suggested from the pincode. Drag the green points to edit, or redraw / clear."
            : "Looking up the pincode boundary. You can draw one if none is found."}
      </p>
      {error ? <p className="text-brand-danger text-xs">{error}</p> : null}
    </div>
  );
}
