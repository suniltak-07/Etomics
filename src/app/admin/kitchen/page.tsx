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

export default function AdminKitchenPage() {
  const [date, setDate] = useState(toDateOnly(new Date()));
  const [mealType, setMealType] = useState("");
  const query = useQuery({
    queryKey: ["kitchen", date, mealType],
    queryFn: () =>
      kitchenService.list({
        date,
        mealType: mealType || undefined,
      }),
  });

  const rows = query.data?.data.rows ?? [];

  const columns: DataTableColumn<KitchenSheetRow>[] = useMemo(
    () => [
      { id: "customer", header: "Customer", cell: (row) => row.customerName },
      { id: "mobile", header: "Mobile", cell: (row) => row.mobile ?? "—" },
      { id: "plan", header: "Plan", cell: (row) => row.planName },
      {
        id: "meals",
        header: "Meals",
        cell: (row) => row.mealTypes.join(", "),
      },
      {
        id: "diet",
        header: "Diet",
        cell: (row) => row.foodPreference ?? "—",
      },
      {
        id: "allergies",
        header: "Allergies",
        cell: (row) => row.allergies.join(", ") || "—",
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
      "Diet",
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
          row.foodPreference ?? "",
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
        description="Active subscribers with plan, meals, diet, and address for packing."
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
      </div>
      <DataTable
        columns={columns}
        data={rows}
        emptyTitle="No deliveries for this date"
      />
    </div>
  );
}
