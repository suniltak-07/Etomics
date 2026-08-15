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
import { CityStatus } from "@/types/enums";
import type { City } from "@/types/entities";
import { slugify } from "@/lib/utils/format";
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
      centerLat: 12.9716,
      centerLng: 77.5946,
    },
  });

  const cities = useMemo(() => {
    const items = citiesQuery.data ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        city.state.toLowerCase().includes(q) ||
        city.slug.includes(q),
    );
  }, [citiesQuery.data, search]);

  function openCreate() {
    setEditing(null);
    setError(null);
    form.reset({
      name: "",
      slug: "",
      state: "",
      status: CityStatus.ACTIVE,
      centerLat: 12.9716,
      centerLng: 77.5946,
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
      centerLat: city.centerLat,
      centerLng: city.centerLng,
    });
    setOpen(true);
  }

  async function onSubmit(values: CreateCityInput) {
    setError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
      } else {
        await createMutation.mutateAsync(values);
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
      cell: (row) => (
        <div>
          <p className="text-brand-ink font-medium">{row.name}</p>
          <p className="text-brand-muted text-xs">{row.slug}</p>
        </div>
      ),
    },
    { id: "state", header: "State", cell: (row) => row.state },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "center",
      header: "Map center",
      cell: (row) => (
        <span className="text-brand-muted font-mono text-xs">
          {row.centerLat.toFixed(4)}, {row.centerLng.toFixed(4)}
        </span>
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
        description="Expand EatOmics delivery coverage beyond Bengaluru."
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
            <Label>City name</Label>
            <Input
              {...form.register("name")}
              onBlur={(event) => {
                form.register("name").onBlur(event);
                if (!editing && !form.getValues("slug")) {
                  form.setValue("slug", slugify(event.target.value), {
                    shouldValidate: true,
                  });
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input {...form.register("slug")} />
          </div>
          <div className="space-y-1.5">
            <Label>State</Label>
            <Input {...form.register("state")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Center latitude</Label>
              <Input type="number" step="any" {...form.register("centerLat")} />
            </div>
            <div className="space-y-1.5">
              <Label>Center longitude</Label>
              <Input type="number" step="any" {...form.register("centerLng")} />
            </div>
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
