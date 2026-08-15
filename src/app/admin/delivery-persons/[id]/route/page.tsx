"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/portals/admin/components/AdminUi";
import { ErrorState, LoadingState } from "@/components/states";
import { deliveryPersonService } from "@/features/delivery-persons/services/deliveryPersonService";
import { RouteStopsMapLazy } from "@/features/delivery-persons/components/RouteStopsMapLazy";
import { toDateOnly } from "@/lib/calendar/deliveryCalendar";
import { MealType } from "@/types/enums";

export default function DeliveryRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [date, setDate] = useState(toDateOnly(new Date()));
  const [mealType, setMealType] = useState("");
  const query = useQuery({
    queryKey: ["delivery-route", id, date, mealType],
    queryFn: () =>
      deliveryPersonService.stops(id, {
        date,
        mealType: mealType || undefined,
      }),
  });

  if (query.isLoading) return <LoadingState title="Building route" />;
  if (query.isError || !query.data?.data) {
    return <ErrorState title="Could not load route" />;
  }

  const data = query.data.data;

  return (
    <div>
      <PageHeader
        title={`${data.person.fullName} — route`}
        description="Suggested nearest-neighbour order for today’s stops. Not live GPS."
        actions={
          <Link href="/admin/delivery-persons">
            <Button variant="outline" size="sm">
              Back to team
            </Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          type="date"
          className="w-44"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Select
          className="w-44"
          value={mealType}
          onChange={(event) => setMealType(event.target.value)}
        >
          <option value="">All meals</option>
          <option value={MealType.BREAKFAST}>Breakfast</option>
          <option value={MealType.LUNCH}>Lunch</option>
          <option value={MealType.DINNER}>Dinner</option>
        </Select>
      </div>
      <RouteStopsMapLazy
        origin={data.origin}
        stops={data.stops.map((stop) => ({
          sequence: stop.sequence,
          latitude: stop.latitude,
          longitude: stop.longitude,
          label: stop.customerName,
          detail: `${stop.address} · ${stop.mealTypes.join(", ")}`,
        }))}
        className="border-brand-border mb-6 h-[28rem] overflow-hidden rounded-2xl border"
      />
      <ol className="space-y-2">
        {data.stops.map((stop) => (
          <li
            key={stop.id}
            className="border-brand-border bg-brand-surface rounded-xl border px-4 py-3 text-sm"
          >
            <span className="text-brand-green mr-2 font-mono">
              #{stop.sequence}
            </span>
            <span className="font-medium">{stop.customerName}</span>
            <span className="text-brand-muted">
              {" "}
              · {stop.address} · {stop.pincode} · {stop.mealTypes.join(", ")}
            </span>
          </li>
        ))}
        {data.stops.length === 0 ? (
          <p className="text-brand-muted text-sm">
            No stops in this rider’s pincodes.
          </p>
        ) : null}
      </ol>
    </div>
  );
}
