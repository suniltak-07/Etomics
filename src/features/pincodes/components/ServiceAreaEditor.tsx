"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  hasDefinedServiceArea,
  locatePincodeArea,
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
  pincode,
  areaName,
}: {
  ring: ServiceAreaRing;
  onChange: (next: ServiceAreaRing) => void;
  center: [number, number];
  pincode: string;
  areaName?: string;
}) {
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<ServiceAreaRing>([]);
  const [located, setLocated] = useState<{
    pincode: string;
    point: [number, number];
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const mapCenter =
    located?.pincode === pincode.trim() ? located.point : center;

  async function locate() {
    setLocateError(null);
    setLocating(true);
    try {
      const found = await locatePincodeArea(pincode, areaName);
      if (!found) {
        setLocateError(
          "Could not find that pincode on the map. Zoom manually.",
        );
        return;
      }
      setLocated({ pincode: pincode.trim(), point: [found.lat, found.lng] });
    } finally {
      setLocating(false);
    }
  }

  function startDraw() {
    setDraft([]);
    setDrawing(true);
  }

  function finishDraw() {
    if (draft.length < 3) {
      setLocateError("Draw at least 3 points to close the area.");
      return;
    }
    onChange(draft);
    setDrawing(false);
    setDraft([]);
    setLocateError(null);
  }

  function clearArea() {
    onChange([]);
    setDraft([]);
    setDrawing(false);
    setLocateError(null);
  }

  return (
    <div className="space-y-2">
      <div className="border-brand-border etomics-service-area-map h-72 overflow-hidden rounded-xl border">
        <Map
          ring={ring}
          draft={draft}
          drawing={drawing}
          center={mapCenter}
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
          onClick={() => void locate()}
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
            ? "Service area is defined. Drag the green points to edit, or redraw / clear."
            : "Optional. Draw the delivery boundary for this pincode."}
      </p>
      {locateError ? (
        <p className="text-brand-danger text-xs">{locateError}</p>
      ) : null}
    </div>
  );
}
