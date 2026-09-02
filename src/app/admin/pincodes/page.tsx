"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { PageHeader } from "@/portals/admin/components/AdminUi";
import { useCities } from "@/features/cities/hooks/useCities";
import {
  useCreatePincode,
  useDeletePincode,
  usePincodeLookup,
  usePincodes,
  useUpdatePincode,
} from "@/features/pincodes/hooks/usePincodes";
import {
  createPincodeSchema,
  type CreatePincodeInput,
} from "@/features/pincodes/schemas/pincodeSchemas";
import type { ServicePincode } from "@/types/entities";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/store/useToast";
import { mapCenterForCityName } from "@/features/cities/catalog";
import { ServiceAreaEditor } from "@/features/pincodes/components/ServiceAreaEditor";
import {
  hasDefinedServiceArea,
  type ServiceAreaRing,
} from "@/features/pincodes/serviceArea";

export default function AdminPincodesPage() {
  const citiesQuery = useCities();
  const [cityFilter, setCityFilter] = useState("");
  const pincodesQuery = usePincodes({
    cityId: cityFilter || undefined,
  });
  const createMutation = useCreatePincode();
  const updateMutation = useUpdatePincode();
  const deleteMutation = useDeletePincode();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServicePincode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ServicePincode | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [serviceRing, setServiceRing] = useState<ServiceAreaRing>([]);

  const form = useForm<CreatePincodeInput>({
    resolver: zodResolver(createPincodeSchema) as never,
    defaultValues: {
      cityId: "",
      pincode: "",
      areaName: "",
      isActive: true,
    },
  });

  const selectedCityId = form.watch("cityId");
  const pincodeValue = form.watch("pincode") ?? "";
  const [debouncedPincode, setDebouncedPincode] = useState("");
  const filledLookupPincode = useRef("");

  useEffect(() => {
    const handle = window.setTimeout(
      () => setDebouncedPincode(pincodeValue.trim()),
      450,
    );
    return () => window.clearTimeout(handle);
  }, [pincodeValue]);

  const lookup = usePincodeLookup(debouncedPincode, open);

  useEffect(() => {
    const result = lookup.data;
    if (!result) return;

    const suggestedRing =
      result.ring && result.ring.length >= 3 ? result.ring : null;
    const sameAsEditing = Boolean(
      editing && result.pincode === editing.pincode,
    );

    if (sameAsEditing && filledLookupPincode.current === "") {
      filledLookupPincode.current = result.pincode;
      if (suggestedRing && !hasDefinedServiceArea(editing?.serviceArea?.ring)) {
        setServiceRing(suggestedRing);
      }
      return;
    }

    if (result.pincode === filledLookupPincode.current) return;
    if (result.areaName) {
      form.setValue("areaName", result.areaName, { shouldValidate: true });
    }
    if (suggestedRing) setServiceRing(suggestedRing);
    filledLookupPincode.current = result.pincode;
  }, [editing, form, lookup.data]);

  const locatedPoint = useMemo((): [number, number] | null => {
    if (lookup.data?.lat == null || lookup.data?.lng == null) return null;
    return [lookup.data.lat, lookup.data.lng];
  }, [lookup.data?.lat, lookup.data?.lng]);

  const cityCenter = useMemo(() => {
    const city = (citiesQuery.data ?? []).find(
      (item) => item.id === selectedCityId,
    );
    return mapCenterForCityName(city?.name ?? "");
  }, [citiesQuery.data, selectedCityId]);

  const mapCenter = locatedPoint ?? cityCenter;

  const cityNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const city of citiesQuery.data ?? []) {
      map.set(city.id, city.name);
    }
    return map;
  }, [citiesQuery.data]);

  const rows = useMemo(() => {
    let items = pincodesQuery.data ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.pincode.includes(q) ||
          item.areaName?.toLowerCase().includes(q) ||
          cityNameById.get(item.cityId)?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [pincodesQuery.data, search, cityNameById]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setServiceRing([]);
    filledLookupPincode.current = "";
    form.reset({
      cityId: cityFilter || citiesQuery.data?.[0]?.id || "",
      pincode: "",
      areaName: "",
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(item: ServicePincode) {
    setEditing(item);
    setError(null);
    setServiceRing(item.serviceArea?.ring ?? []);
    filledLookupPincode.current = "";
    form.reset({
      cityId: item.cityId,
      pincode: item.pincode,
      areaName: item.areaName ?? "",
      isActive: item.isActive,
    });
    setOpen(true);
  }

  async function onSubmit(values: CreatePincodeInput) {
    setError(null);
    try {
      const payload = {
        ...values,
        serviceArea: hasDefinedServiceArea(serviceRing)
          ? { ring: serviceRing }
          : null,
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: payload });
        toast.success("Pincode updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Pincode added");
      }
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save pincode",
      );
    }
  }

  const columns: DataTableColumn<ServicePincode>[] = [
    {
      id: "pincode",
      header: "Pincode",
      cell: (row) => (
        <span className="font-mono font-medium">{row.pincode}</span>
      ),
    },
    {
      id: "area",
      header: "Area",
      cell: (row) => row.areaName ?? "—",
    },
    {
      id: "city",
      header: "City",
      cell: (row) => cityNameById.get(row.cityId) ?? row.cityId,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "success" : "muted"}>
          {row.isActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      id: "serviceArea",
      header: "Service Area",
      cell: (row) =>
        hasDefinedServiceArea(row.serviceArea?.ring) ? (
          <span className="text-brand-success text-sm font-medium">
            ✓ Defined
          </span>
        ) : (
          <span className="text-brand-muted text-sm">— Not defined</span>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit area
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => setPendingDelete(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (pincodesQuery.isLoading || citiesQuery.isLoading) {
    return <LoadingState title="Loading pincodes" />;
  }

  if (pincodesQuery.isError) {
    return (
      <ErrorState
        action={
          <Button variant="outline" onClick={() => pincodesQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Service pincodes"
        description="Define exactly where EatOmics can deliver within each city."
        actions={<Button onClick={openCreate}>Add pincode</Button>}
      />

      <div className="mb-3 max-w-xs">
        <Select
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
          aria-label="Filter by city"
        >
          <option value="">All cities</option>
          {(citiesQuery.data ?? []).map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </Select>
      </div>

      {(pincodesQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No pincodes yet"
          description="Add operating pincodes for a city."
          action={<Button onClick={openCreate}>Add pincode</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          searchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No matching pincodes"
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit pincode" : "Add pincode"}
        className="max-w-3xl"
      >
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Select {...form.register("cityId")}>
              <option value="">Select city</option>
              {(citiesQuery.data ?? []).map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Pincode</Label>
            <Input
              {...form.register("pincode")}
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              placeholder="560038"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Area name</Label>
            <Input {...form.register("areaName")} placeholder="Indiranagar" />
            {lookup.isFetching ? (
              <p className="text-brand-muted text-xs">
                Looking up area from pincode…
              </p>
            ) : lookup.data?.areaName ? (
              <p className="text-brand-muted text-xs">
                Filled from India Post / OpenStreetMap. You can edit it.
              </p>
            ) : lookup.isError ? (
              <p className="text-brand-muted text-xs">
                Could not find that pincode. Enter the area name and zoom the
                map manually.
              </p>
            ) : null}
          </div>
          <label className="text-brand-ink flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(form.watch("isActive"))}
              onChange={(event) =>
                form.setValue("isActive", event.target.checked)
              }
            />
            Active for delivery
          </label>
          <div className="space-y-1.5">
            <Label>Serviceable area</Label>
            {open ? (
              <ServiceAreaEditor
                ring={serviceRing}
                onChange={setServiceRing}
                center={mapCenter}
                pin={locatedPoint}
                bounds={lookup.data?.bounds ?? null}
                locating={lookup.isFetching}
                locateError={
                  lookup.isError && /^\d{6}$/.test(debouncedPincode)
                    ? "Could not find that pincode on the map. Zoom manually."
                    : null
                }
                onLocate={() => {
                  void lookup.refetch();
                }}
                pincode={pincodeValue}
              />
            ) : null}
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
              {editing ? "Save" : "Add pincode"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        description={
          pendingDelete
            ? `Delete pincode ${pendingDelete.pincode}? This action can't be undone.`
            : undefined
        }
        confirmVariant="danger"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteMutation.mutateAsync(pendingDelete.id);
            toast.success("Pincode deleted");
          } catch (err) {
            toast.error(
              "Could not delete pincode",
              err instanceof ApiError ? err.message : "Please try again.",
            );
            throw err;
          }
        }}
      />
    </div>
  );
}
