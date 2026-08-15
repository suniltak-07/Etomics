"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/portals/admin/components/AdminUi";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { ErrorState, LoadingState } from "@/components/states";
import { kitchenService } from "@/features/kitchen/services/kitchenService";
import { toDateOnly } from "@/lib/calendar/deliveryCalendar";
import type { KitchenSheetRow } from "@/lib/kitchen/buildKitchenSheet";
import { MealType } from "@/types/enums";
import {
  formatFoodPreference,
  formatHealthGoal,
  formatMealTypes,
} from "@/lib/meals/labels";

export default function AdminKitchenPage() {
  const [date, setDate] = useState(toDateOnly(new Date()));
  const [mealType, setMealType] = useState("");
  const [dietLine, setDietLine] = useState("");
  const query = useQuery({
    queryKey: ["kitchen", date, mealType],
    queryFn: () =>
      kitchenService.list({
        date,
        mealType: mealType || undefined,
      }),
  });

  const rows = useMemo(() => {
    const all = query.data?.data.rows ?? [];
    if (!dietLine) return all;
    return all.filter((row) => row.packingLine === dietLine);
  }, [query.data, dietLine]);

  const columns: DataTableColumn<KitchenSheetRow>[] = useMemo(
    () => [
      { id: "customer", header: "Customer", cell: (row) => row.customerName },
      { id: "mobile", header: "Mobile", cell: (row) => row.mobile ?? "—" },
      { id: "plan", header: "Plan", cell: (row) => row.planName },
      {
        id: "meals",
        header: "Meals",
        cell: (row) => formatMealTypes(row.mealTypes),
      },
      {
        id: "dishes",
        header: "Dishes",
        cell: (row) =>
          row.mealTypes
            .map(
              (meal) =>
                `${formatMealTypes([meal])}: ${row.packedMeals[meal] ?? "TBA"}`,
            )
            .join(" · "),
      },
      {
        id: "diet",
        header: "Diet",
        cell: (row) =>
          `${formatFoodPreference(row.foodPreference)} (${row.packingLine === "NON_VEG" ? "non-veg line" : "veg line"})`,
      },
      {
        id: "goal",
        header: "Goal",
        cell: (row) => formatHealthGoal(row.healthGoal),
      },
      {
        id: "allergies",
        header: "Allergies",
        cell: (row) => row.allergies.join(", ") || "None noted",
      },
      { id: "address", header: "Address", cell: (row) => row.address },
      { id: "pin", header: "Pin", cell: (row) => row.pincode },
    ],
    [],
  );

  function downloadCsv() {
    const header = [
      "Customer",
      "Mobile",
      "Plan",
      "Meals",
      "Dishes",
      "Diet",
      "Packing line",
      "Health goal",
      "Allergies",
      "Address",
      "Pincode",
    ];
    const lines = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.customerName,
          row.mobile ?? "",
          row.planName,
          row.mealTypes.join(" "),
          `"${row.mealTypes
            .map((meal) => `${meal}:${row.packedMeals[meal] ?? "TBA"}`)
            .join(" | ")
            .replaceAll('"', '""')}"`,
          row.foodPreference ?? "",
          row.packingLine,
          row.healthGoal ?? "",
          row.allergies.join(" "),
          `"${row.address.replaceAll('"', '""')}"`,
          row.pincode,
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kitchen-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (query.isLoading) return <LoadingState title="Loading kitchen sheet" />;
  if (query.isError) return <ErrorState title="Could not load kitchen sheet" />;

  return (
    <div>
      <PageHeader
        title="Kitchen — daily list"
        description="Pack veg or non-veg dishes from today’s menu using each customer’s food preference, meals, allergies, and health goal."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={downloadCsv}
              disabled={rows.length === 0}
            >
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print
            </Button>
          </div>
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
        <Select
          className="w-44"
          value={dietLine}
          onChange={(event) => setDietLine(event.target.value)}
        >
          <option value="">All packing lines</option>
          <option value="VEG">Veg line</option>
          <option value="NON_VEG">Non-veg line</option>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No deliveries for this date"
      />
    </div>
  );
}
