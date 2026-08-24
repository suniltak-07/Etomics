"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { PageHeader, StatusBadge } from "@/portals/admin/components/AdminUi";
import {
  useCities,
  useCreateCity,
  useDeleteCity,
  useUpdateCity,
} from "@/features/cities/hooks/useCities";
import {
  createCitySchema,
  type CreateCityInput,
} from "@/features/cities/schemas/citySchemas";
import { CITY_CATALOG, findCityCatalogEntry } from "@/features/cities/catalog";
import { CityStatus } from "@/types/enums";
import type { City } from "@/types/entities";
import { ApiError } from "@/lib/api/errors";

export default function AdminCitiesPage() {
  const citiesQuery = useCities();
  const createMutation = useCreateCity();
  const updateMutation = useUpdateCity();
  const deleteMutation = useDeleteCity();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateCityInput>({
    resolver: zodResolver(createCitySchema) as never,
    defaultValues: {
      name: "",
      slug: "",
      state: "",
      status: CityStatus.ACTIVE,
    },
  });

  const selectedName = form.watch("name");
  const selectedState = form.watch("state");

  const cities = useMemo(() => {
    const items = citiesQuery.data ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        city.state.toLowerCase().includes(q),
    );
  }, [citiesQuery.data, search]);

  const cityOptions = useMemo(() => {
    const taken = new Set(
      (citiesQuery.data ?? [])
        .filter((city) => city.id !== editing?.id)
        .map((city) => city.name.toLowerCase()),
    );
    const options = CITY_CATALOG.filter(
      (city) => !taken.has(city.name.toLowerCase()),
    );
    if (
      editing &&
      !options.some(
        (city) => city.name.toLowerCase() === editing.name.toLowerCase(),
      )
    ) {
      return [
        {
          name: editing.name,
          slug: editing.slug,
          state: editing.state,
        },
        ...options,
      ];
    }
    return options;
  }, [citiesQuery.data, editing]);

  function applyCatalogCity(name: string) {
    const entry = findCityCatalogEntry(name);
    if (!entry) {
      form.setValue("name", name, { shouldValidate: true });
      return;
    }
    form.setValue("name", entry.name, { shouldValidate: true });
    form.setValue("slug", entry.slug, { shouldValidate: true });
    form.setValue("state", entry.state, { shouldValidate: true });
  }

  function openCreate() {
    setEditing(null);
    setError(null);
    form.reset({
      name: "",
      slug: "",
      state: "",
      status: CityStatus.ACTIVE,
    });
    setOpen(true);
  }

  function openEdit(city: City) {
    setEditing(city);
    setError(null);
    form.reset({
      name: city.name,
      slug: city.slug,
      state: city.state,
      status: city.status,
    });
    setOpen(true);
  }

  async function onSubmit(values: CreateCityInput) {
    setError(null);
    const catalog = findCityCatalogEntry(values.name);
    const payload: CreateCityInput = catalog
      ? {
          ...values,
          name: catalog.name,
          slug: catalog.slug,
          state: catalog.state,
        }
      : values;
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save city");
    }
  }

  const columns: DataTableColumn<City>[] = [
    {
      id: "name",
      header: "City",
      cell: (row) => row.name,
    },
    { id: "state", header: "State", cell: (row) => row.state },
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
          <Button
            size="sm"
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={async () => {
              if (!window.confirm(`Delete ${row.name}?`)) return;
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

  if (citiesQuery.isLoading) return <LoadingState title="Loading cities" />;
  if (citiesQuery.isError) {
    return (
      <ErrorState
        action={
          <Button variant="outline" onClick={() => citiesQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Cities"
        description="Choose operating cities. State is set automatically from the city."
        actions={<Button onClick={openCreate}>Add city</Button>}
      />

      {(citiesQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No cities yet"
          description="Add your first operating city."
          action={<Button onClick={openCreate}>Add city</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={cities}
          searchValue={search}
          onSearchChange={setSearch}
          emptyTitle="No matching cities"
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit city" : "Add city"}
        className="max-w-lg"
      >
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="city-name">City</Label>
            <Select
              id="city-name"
              value={selectedName}
              onChange={(event) => applyCatalogCity(event.target.value)}
            >
              <option value="">Select city</option>
              {cityOptions.map((city) => (
                <option key={city.slug} value={city.name}>
                  {city.name}
                </option>
              ))}
            </Select>
            {form.formState.errors.name ? (
              <p className="text-brand-danger text-xs">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city-state">State</Label>
            <Input
              id="city-state"
              readOnly
              tabIndex={-1}
              value={selectedState}
              placeholder="Select a city first"
              className="bg-brand-sand cursor-not-allowed"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select {...form.register("status")}>
              <option value={CityStatus.ACTIVE}>ACTIVE</option>
              <option value={CityStatus.INACTIVE}>INACTIVE</option>
            </Select>
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
              {editing ? "Save" : "Create city"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
