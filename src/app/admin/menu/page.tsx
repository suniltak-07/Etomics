"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/portals/admin/components/AdminUi";
import { ErrorState, LoadingState } from "@/components/states";
import { menuService } from "@/features/menus/services/menuService";
import { toDateOnly } from "@/lib/calendar/deliveryCalendar";
import { ApiError } from "@/lib/api/errors";
import type { DailyMenu, DailyMenuSlot } from "@/types/entities";

export default function AdminMenuPage() {
  const [date, setDate] = useState(toDateOnly(new Date()));
  const query = useQuery({
    queryKey: ["admin-menus", date],
    queryFn: () => menuService.list(date),
  });

  if (query.isLoading) return <LoadingState title="Loading menu" />;
  if (query.isError) return <ErrorState title="Could not load menus" />;

  const existing = query.data?.data[0];

  return (
    <div>
      <PageHeader
        title="Daily menu"
        description="Set a veg line and a non-veg line for breakfast, lunch, and dinner. Packing follows each customer’s food preference."
      />
      <div className="mb-4 max-w-2xl space-y-1.5">
        <Label>Date</Label>
        <Input
          type="date"
          className="w-44"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <MenuEditor
        key={`${date}-${existing?.updatedAt ?? "new"}`}
        date={date}
        existing={existing}
      />
    </div>
  );
}

function slotFrom(
  vegName: string,
  vegDesc: string,
  nonVegName: string,
  nonVegDesc: string,
): DailyMenuSlot | undefined {
  const veg = vegName.trim()
    ? { name: vegName.trim(), description: vegDesc.trim() || undefined }
    : undefined;
  const nonVeg = nonVegName.trim()
    ? { name: nonVegName.trim(), description: nonVegDesc.trim() || undefined }
    : undefined;
  if (!veg && !nonVeg) return undefined;
  return { veg, nonVeg };
}

function MenuEditor({
  date,
  existing,
}: {
  date: string;
  existing?: DailyMenu;
}) {
  const queryClient = useQueryClient();
  const [breakfastVeg, setBreakfastVeg] = useState(
    existing?.breakfast?.veg?.name ?? "",
  );
  const [breakfastVegDesc, setBreakfastVegDesc] = useState(
    existing?.breakfast?.veg?.description ?? "",
  );
  const [breakfastNonVeg, setBreakfastNonVeg] = useState(
    existing?.breakfast?.nonVeg?.name ?? "",
  );
  const [breakfastNonVegDesc, setBreakfastNonVegDesc] = useState(
    existing?.breakfast?.nonVeg?.description ?? "",
  );
  const [lunchVeg, setLunchVeg] = useState(existing?.lunch?.veg?.name ?? "");
  const [lunchVegDesc, setLunchVegDesc] = useState(
    existing?.lunch?.veg?.description ?? "",
  );
  const [lunchNonVeg, setLunchNonVeg] = useState(
    existing?.lunch?.nonVeg?.name ?? "",
  );
  const [lunchNonVegDesc, setLunchNonVegDesc] = useState(
    existing?.lunch?.nonVeg?.description ?? "",
  );
  const [dinnerVeg, setDinnerVeg] = useState(existing?.dinner?.veg?.name ?? "");
  const [dinnerVegDesc, setDinnerVegDesc] = useState(
    existing?.dinner?.veg?.description ?? "",
  );
  const [dinnerNonVeg, setDinnerNonVeg] = useState(
    existing?.dinner?.nonVeg?.name ?? "",
  );
  const [dinnerNonVegDesc, setDinnerNonVegDesc] = useState(
    existing?.dinner?.nonVeg?.description ?? "",
  );
  const [published, setPublished] = useState(existing?.published ?? true);

  const save = useMutation({
    mutationFn: () =>
      menuService.save({
        date,
        published,
        breakfast: slotFrom(
          breakfastVeg,
          breakfastVegDesc,
          breakfastNonVeg,
          breakfastNonVegDesc,
        ),
        lunch: slotFrom(lunchVeg, lunchVegDesc, lunchNonVeg, lunchNonVegDesc),
        dinner: slotFrom(
          dinnerVeg,
          dinnerVegDesc,
          dinnerNonVeg,
          dinnerNonVegDesc,
        ),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
      void queryClient.invalidateQueries({ queryKey: ["menus"] });
      void queryClient.invalidateQueries({ queryKey: ["kitchen"] });
    },
  });

  return (
    <form
      className="border-brand-border bg-brand-surface max-w-4xl space-y-4 rounded-xl border p-5"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <MealSlotFields
        title="Breakfast"
        vegName={breakfastVeg}
        vegDescription={breakfastVegDesc}
        nonVegName={breakfastNonVeg}
        nonVegDescription={breakfastNonVegDesc}
        onVegName={setBreakfastVeg}
        onVegDescription={setBreakfastVegDesc}
        onNonVegName={setBreakfastNonVeg}
        onNonVegDescription={setBreakfastNonVegDesc}
      />
      <MealSlotFields
        title="Lunch"
        vegName={lunchVeg}
        vegDescription={lunchVegDesc}
        nonVegName={lunchNonVeg}
        nonVegDescription={lunchNonVegDesc}
        onVegName={setLunchVeg}
        onVegDescription={setLunchVegDesc}
        onNonVegName={setLunchNonVeg}
        onNonVegDescription={setLunchNonVegDesc}
      />
      <MealSlotFields
        title="Dinner"
        vegName={dinnerVeg}
        vegDescription={dinnerVegDesc}
        nonVegName={dinnerNonVeg}
        nonVegDescription={dinnerNonVegDesc}
        onVegName={setDinnerVeg}
        onVegDescription={setDinnerVegDesc}
        onNonVegName={setDinnerNonVeg}
        onNonVegDescription={setDinnerNonVegDesc}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={published}
          onChange={(event) => setPublished(event.target.checked)}
        />
        Published for subscribers
      </label>
      {save.isError ? (
        <p className="text-brand-danger text-sm">
          {save.error instanceof ApiError ? save.error.message : "Save failed"}
        </p>
      ) : null}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save menu"}
      </Button>
    </form>
  );
}

function MealSlotFields({
  title,
  vegName,
  vegDescription,
  nonVegName,
  nonVegDescription,
  onVegName,
  onVegDescription,
  onNonVegName,
  onNonVegDescription,
}: {
  title: string;
  vegName: string;
  vegDescription: string;
  nonVegName: string;
  nonVegDescription: string;
  onVegName: (value: string) => void;
  onVegDescription: (value: string) => void;
  onNonVegName: (value: string) => void;
  onNonVegDescription: (value: string) => void;
}) {
  return (
    <div className="border-brand-border/70 space-y-3 rounded-xl border p-3">
      <p className="text-brand-navy text-sm font-medium">{title}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-brand-muted text-xs tracking-wide uppercase">
            Veg line (veg, vegan, eggetarian)
          </p>
          <Input
            placeholder={`${title} veg dish`}
            value={vegName}
            onChange={(event) => onVegName(event.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="Short description"
            value={vegDescription}
            onChange={(event) => onVegDescription(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <p className="text-brand-muted text-xs tracking-wide uppercase">
            Non-veg line
          </p>
          <Input
            placeholder={`${title} non-veg dish`}
            value={nonVegName}
            onChange={(event) => onNonVegName(event.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="Short description"
            value={nonVegDescription}
            onChange={(event) => onNonVegDescription(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
