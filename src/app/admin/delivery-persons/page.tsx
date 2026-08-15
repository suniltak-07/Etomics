"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { PageHeader, StatusBadge } from "@/portals/admin/components/AdminUi";
import { useCities } from "@/features/cities/hooks/useCities";
import { usePincodes } from "@/features/pincodes/hooks/usePincodes";
import {
  useCreateDeliveryPerson,
  useDeleteDeliveryPerson,
  useDeliveryPersons,
  useUpdateDeliveryPerson,
} from "@/features/delivery-persons/hooks/useDeliveryPersons";
import {
  createDeliveryPersonSchema,
  type CreateDeliveryPersonInput,
} from "@/features/delivery-persons/schemas/deliveryPersonSchemas";
import { DeliveryPersonStatus, VehicleType } from "@/types/enums";
import type { DeliveryPerson } from "@/types/entities";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";

export default function AdminDeliveryPersonsPage() {
  const personsQuery = useDeliveryPersons();
  const citiesQuery = useCities();
  const pincodesQuery = usePincodes({ activeOnly: true });
  const createMutation = useCreateDeliveryPerson();
  const updateMutation = useUpdateDeliveryPerson();
  const deleteMutation = useDeleteDeliveryPerson();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryPerson | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("");

  const form = useForm<CreateDeliveryPersonInput>({
    resolver: zodResolver(createDeliveryPersonSchema) as never,
    defaultValues: {
      fullName: "",
      mobile: "",
      email: "",
      vehicleType: VehicleType.BIKE,
      vehicleNumber: "",
      status: DeliveryPersonStatus.ACTIVE,
      pincodeIds: [],
      notes: "",
    },
  });

  const selectedPinIds = form.watch("pincodeIds") ?? [];

  const pinLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const pin of pincodesQuery.data ?? []) {
      const city = citiesQuery.data?.find((item) => item.id === pin.cityId);
      map.set(
        pin.id,
        `${pin.pincode}${pin.areaName ? ` · ${pin.areaName}` : ""}${city ? ` (${city.name})` : ""}`,
      );
    }
    return map;
  }, [pincodesQuery.data, citiesQuery.data]);

  const selectablePins = useMemo(() => {
    const items = pincodesQuery.data ?? [];
    if (!cityFilter) return items;
    return items.filter((item) => item.cityId === cityFilter);
  }, [pincodesQuery.data, cityFilter]);

  const rows = useMemo(() => {
    let items = personsQuery.data ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.fullName.toLowerCase().includes(q) ||
          item.mobile.includes(q) ||
          item.email?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [personsQuery.data, search]);

  function openCreate() {
    setEditing(null);
    setError(null);
    form.reset({
      fullName: "",
      mobile: "",
      email: "",
      vehicleType: VehicleType.BIKE,
      vehicleNumber: "",
      status: DeliveryPersonStatus.ACTIVE,
      pincodeIds: [],
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(person: DeliveryPerson) {
    setEditing(person);
    setError(null);
    form.reset({
      fullName: person.fullName,
      mobile: person.mobile,
      email: person.email ?? "",
      vehicleType: person.vehicleType,
      vehicleNumber: person.vehicleNumber ?? "",
      status: person.status,
      pincodeIds: person.pincodeIds,
      notes: person.notes ?? "",
    });
    setOpen(true);
  }

  function togglePincode(id: string) {
    const current = form.getValues("pincodeIds") ?? [];
    if (current.includes(id)) {
      form.setValue(
        "pincodeIds",
        current.filter((item) => item !== id),
        { shouldValidate: true },
      );
    } else {
      form.setValue("pincodeIds", [...current, id], { shouldValidate: true });
    }
  }

  async function onSubmit(values: CreateDeliveryPersonInput) {
    setError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save delivery person",
      );
    }
  }

  const columns: DataTableColumn<DeliveryPerson>[] = [
    {
      id: "name",
      header: "Delivery person",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.fullName}</p>
          <p className="text-brand-muted text-xs">{row.mobile}</p>
        </div>
      ),
    },
    {
      id: "vehicle",
      header: "Vehicle",
      cell: (row) => (
        <span className="text-sm">
          {row.vehicleType}
          {row.vehicleNumber ? ` · ${row.vehicleNumber}` : ""}
        </span>
      ),
    },
    {
      id: "pincodes",
      header: "Pincodes",
      cell: (row) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {row.pincodeIds.slice(0, 4).map((id) => (
            <span
              key={id}
              className="bg-brand-sand text-brand-ink rounded-full px-2 py-0.5 font-mono text-[11px]"
            >
              {pinLabelById.get(id)?.split(" · ")[0] ?? id}
            </span>
          ))}
          {row.pincodeIds.length > 4 ? (
            <span className="text-brand-muted text-xs">
              +{row.pincodeIds.length - 4}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Link href={`/admin/delivery-persons/${row.id}/route`}>
            <Button size="sm" variant="outline">
              Route map
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (!window.confirm(`Remove ${row.fullName}?`)) return;
              try {
                await deleteMutation.mutateAsync(row.id);
              } catch (err) {
                window.alert(
                  err instanceof ApiError ? err.message : "Delete failed",
                );
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (personsQuery.isLoading) {
    return <LoadingState title="Loading delivery team" />;
  }

  if (personsQuery.isError) {
    const status =
      personsQuery.error instanceof ApiError
        ? personsQuery.error.statusCode
        : undefined;
    const unauthorized = status === 401;
    return (
      <ErrorState
        title={unauthorized ? "Sign in required" : "Something went wrong"}
        description={
          unauthorized
            ? "Your admin session expired. Please log in again to manage delivery staff."
            : personsQuery.error instanceof Error
              ? personsQuery.error.message
              : "We could not load delivery persons."
        }
        action={
          unauthorized ? (
            <Button
              onClick={() => {
                window.location.href =
                  "/login?returnUrl=/admin/delivery-persons";
              }}
            >
              Go to login
            </Button>
          ) : (
            <Button variant="outline" onClick={() => personsQuery.refetch()}>
              Retry
            </Button>
          )
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Delivery team"
        description="Assign riders to the pincodes they are responsible for."
        actions={<Button onClick={openCreate}>Add delivery person</Button>}
      />

      {(personsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No delivery persons yet"
          action={<Button onClick={openCreate}>Add delivery person</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No matching people"
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit delivery person" : "Add delivery person"}
        className="max-w-2xl"
      >
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input {...form.register("fullName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input {...form.register("mobile")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Vehicle</Label>
              <Select {...form.register("vehicleType")}>
                {Object.values(VehicleType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle number</Label>
              <Input {...form.register("vehicleNumber")} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select {...form.register("status")}>
                <option value={DeliveryPersonStatus.ACTIVE}>ACTIVE</option>
                <option value={DeliveryPersonStatus.INACTIVE}>INACTIVE</option>
              </Select>
            </div>
          </div>

          <div className="border-brand-border bg-brand-sand/50 space-y-2 rounded-xl border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Responsible pincodes</Label>
              <Select
                className="w-44"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
              >
                <option value="">All cities</option>
                {(citiesQuery.data ?? []).map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {selectablePins.map((pin) => {
                const checked = selectedPinIds.includes(pin.id);
                return (
                  <label
                    key={pin.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                      checked
                        ? "bg-brand-green-muted/70"
                        : "hover:bg-brand-surface",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => togglePincode(pin.id)}
                    />
                    <span>
                      <span className="font-mono font-medium">
                        {pin.pincode}
                      </span>
                      {pin.areaName ? ` · ${pin.areaName}` : ""}
                    </span>
                  </label>
                );
              })}
            </div>
            {form.formState.errors.pincodeIds ? (
              <p className="text-brand-danger text-xs">
                {form.formState.errors.pincodeIds.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} {...form.register("notes")} />
          </div>

          {error ? <p className="text-brand-danger text-sm">{error}</p> : null}
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Save" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
