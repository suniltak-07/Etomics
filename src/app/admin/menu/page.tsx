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
import type { DailyMenu } from "@/types/entities";

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
        description="Update breakfast, lunch, and dinner. Only subscribers see the published tab."
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

function MenuEditor({
  date,
  existing,
}: {
  date: string;
  existing?: DailyMenu;
}) {
  const queryClient = useQueryClient();
  const [breakfastName, setBreakfastName] = useState(
    existing?.breakfast?.name ?? "",
  );
  const [breakfastDesc, setBreakfastDesc] = useState(
    existing?.breakfast?.description ?? "",
  );
  const [lunchName, setLunchName] = useState(existing?.lunch?.name ?? "");
  const [lunchDesc, setLunchDesc] = useState(
    existing?.lunch?.description ?? "",
  );
  const [dinnerName, setDinnerName] = useState(existing?.dinner?.name ?? "");
  const [dinnerDesc, setDinnerDesc] = useState(
    existing?.dinner?.description ?? "",
  );
  const [published, setPublished] = useState(existing?.published ?? true);

  const save = useMutation({
    mutationFn: () =>
      menuService.save({
        date,
        published,
        breakfast: breakfastName
          ? { name: breakfastName, description: breakfastDesc }
          : undefined,
        lunch: lunchName
          ? { name: lunchName, description: lunchDesc }
          : undefined,
        dinner: dinnerName
          ? { name: dinnerName, description: dinnerDesc }
          : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-menus"] });
      void queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  return (
    <form
      className="border-brand-border bg-brand-surface max-w-2xl space-y-4 rounded-xl border p-5"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <MealFields
        title="Breakfast"
        name={breakfastName}
        description={breakfastDesc}
        onName={setBreakfastName}
        onDescription={setBreakfastDesc}
      />
      <MealFields
        title="Lunch"
        name={lunchName}
        description={lunchDesc}
        onName={setLunchName}
        onDescription={setLunchDesc}
      />
      <MealFields
        title="Dinner"
        name={dinnerName}
        description={dinnerDesc}
        onName={setDinnerName}
        onDescription={setDinnerDesc}
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

function MealFields({
  title,
  name,
  description,
  onName,
  onDescription,
}: {
  title: string;
  name: string;
  description: string;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
}) {
  return (
    <div className="border-brand-border/70 space-y-2 rounded-xl border p-3">
      <p className="text-brand-navy text-sm font-medium">{title}</p>
      <Input
        placeholder={`${title} name`}
        value={name}
        onChange={(event) => onName(event.target.value)}
      />
      <Textarea
        rows={2}
        placeholder="Short description"
        value={description}
        onChange={(event) => onDescription(event.target.value)}
      />
    </div>
  );
}
