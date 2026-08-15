"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useCustomer,
  useCustomers,
  useUpdateCustomer,
} from "@/features/customers/queries/useCustomers";
import { useSubscriptions } from "@/features/subscriptions/queries/useSubscriptions";
import { usePayments } from "@/features/payments/queries/usePayments";
import { useAddresses } from "@/features/addresses/queries/useAddresses";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Tabs } from "@/components/ui/tabs";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { PageHeader, StatusBadge } from "@/portals/admin/components/AdminUi";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PublicCustomer } from "@/features/customers/services/customerService";
import type { Address, Payment, Subscription } from "@/types/entities";
import {
  formatFoodPreference,
  formatHealthGoal,
  formatMealTypes,
} from "@/lib/meals/labels";
import { FoodPreference, HealthGoal } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import { ApiError } from "@/lib/api/errors";

export function CustomersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const query = useCustomers({
    page,
    pageSize: 10,
    search: search || undefined,
  });

  const columns: DataTableColumn<PublicCustomer>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Customer",
        cell: (row) => (
          <Link
            href={`/admin/customers/${row.id}`}
            className="text-brand-navy hover:text-brand-green font-medium"
          >
            {row.firstName} {row.lastName}
          </Link>
        ),
      },
      { id: "email", header: "Email", cell: (row) => row.email },
      {
        id: "mobile",
        header: "Mobile",
        cell: (row) => row.mobile ?? "—",
      },
      {
        id: "diet",
        header: "Diet",
        cell: (row) => formatFoodPreference(row.preferences?.foodPreference),
      },
      {
        id: "goal",
        header: "Health goal",
        cell: (row) => formatHealthGoal(row.preferences?.healthGoal),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />
        ),
      },
      {
        id: "createdAt",
        header: "Joined",
        cell: (row) => formatDate(row.createdAt),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Search and review customer accounts."
      />
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        loading={query.isLoading}
        error={query.error instanceof Error ? query.error.message : null}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name or email…"
        page={page}
        pageSize={10}
        total={query.data?.meta.total ?? 0}
        onPageChange={setPage}
        emptyTitle="No customers found"
      />
    </div>
  );
}

export function CustomerDetailPage({ id }: { id: string }) {
  const [tab, setTab] = useState("overview");
  const customer = useCustomer(id);
  const subscriptions = useSubscriptions({
    customerId: id,
    pageSize: 50,
  });
  const payments = usePayments({ customerId: id, pageSize: 50 });
  const addresses = useAddresses(id);

  if (customer.isLoading) return <LoadingState title="Loading customer" />;
  if (customer.isError || !customer.data) {
    return (
      <ErrorState
        title="Customer not found"
        description={
          customer.error instanceof Error ? customer.error.message : undefined
        }
      />
    );
  }

  const person = customer.data;

  const subscriptionColumns: DataTableColumn<Subscription>[] = [
    {
      id: "id",
      header: "ID",
      cell: (row) => (
        <span className="font-mono text-xs">{row.id.slice(0, 10)}…</span>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      cell: (row) => (
        <Link
          href={`/admin/plans/${row.planId}`}
          className="text-brand-green hover:underline"
        >
          {row.planId}
        </Link>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "meals",
      header: "Meals",
      cell: (row) => formatMealTypes(row.mealTypes),
    },
    {
      id: "dates",
      header: "Start → end",
      cell: (row) =>
        `${formatDate(row.startDate)} → ${formatDate(row.endDate)}`,
    },
    {
      id: "amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.finalAmount),
    },
  ];

  const paymentColumns: DataTableColumn<Payment>[] = [
    {
      id: "id",
      header: "Payment",
      cell: (row) => (
        <span className="font-mono text-xs">{row.id.slice(0, 10)}…</span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.amount, row.currency),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "method",
      header: "Method",
      cell: (row) => row.method ?? row.provider,
    },
    {
      id: "createdAt",
      header: "Date",
      cell: (row) => formatDate(row.createdAt),
    },
  ];

  const addressColumns: DataTableColumn<Address>[] = [
    {
      id: "label",
      header: "Address",
      cell: (row) => (
        <div>
          <p className="font-medium">
            {row.fullName}{" "}
            {row.isDefault ? (
              <span className="text-brand-green text-xs">(default)</span>
            ) : null}
          </p>
          <p className="text-brand-muted text-xs">
            {row.addressLine1}, {row.city} {row.pincode}
          </p>
        </div>
      ),
    },
    { id: "type", header: "Type", cell: (row) => row.addressType },
    { id: "mobile", header: "Mobile", cell: (row) => row.mobile },
  ];

  return (
    <div>
      <PageHeader
        title={`${person.firstName} ${person.lastName}`}
        description={person.email}
      />

      <Tabs
        items={[
          { id: "overview", label: "Overview" },
          { id: "subscriptions", label: "Subscriptions" },
          { id: "orders", label: "Orders" },
          { id: "payments", label: "Payments" },
          { id: "addresses", label: "Addresses" },
        ]}
        value={tab}
        onValueChange={setTab}
      >
        {tab === "overview" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="border-brand-border bg-brand-surface rounded-lg border p-4 text-sm">
              <h2 className="text-brand-navy mb-3 text-sm font-semibold">
                Profile
              </h2>
              <dl className="space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-brand-muted">Status</dt>
                  <dd>
                    <StatusBadge
                      status={person.isActive ? "ACTIVE" : "INACTIVE"}
                    />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brand-muted">Mobile</dt>
                  <dd>{person.mobile ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brand-muted">Joined</dt>
                  <dd>{formatDate(person.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brand-muted">DOB</dt>
                  <dd>
                    {person.dateOfBirth ? formatDate(person.dateOfBirth) : "—"}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="border-brand-border bg-brand-surface rounded-lg border p-4 text-sm">
              <h2 className="text-brand-navy mb-3 text-sm font-semibold">
                Food preference & goals
              </h2>
              <CustomerPreferencesEditor customer={person} />
            </section>
          </div>
        ) : null}

        {tab === "subscriptions" ? (
          <DataTable
            columns={subscriptionColumns}
            data={subscriptions.data?.data ?? []}
            loading={subscriptions.isLoading}
            emptyTitle="No subscriptions"
            total={subscriptions.data?.meta.total ?? 0}
            page={1}
            pageSize={50}
          />
        ) : null}

        {tab === "orders" ? (
          <EmptyState
            title="No orders yet"
            description="Order history will appear here when delivery orders are tracked."
          />
        ) : null}

        {tab === "payments" ? (
          <DataTable
            columns={paymentColumns}
            data={payments.data?.data ?? []}
            loading={payments.isLoading}
            emptyTitle="No payments"
            total={payments.data?.meta.total ?? 0}
            page={1}
            pageSize={50}
          />
        ) : null}

        {tab === "addresses" ? (
          <DataTable
            columns={addressColumns}
            data={addresses.data ?? []}
            loading={addresses.isLoading}
            emptyTitle="No addresses"
            total={(addresses.data ?? []).length}
            page={1}
            pageSize={50}
          />
        ) : null}
      </Tabs>
    </div>
  );
}

function CustomerPreferencesEditor({ customer }: { customer: PublicCustomer }) {
  const dispatch = useAppDispatch();
  const update = useUpdateCustomer();
  const [foodPreference, setFoodPreference] = useState(
    customer.preferences?.foodPreference ?? "",
  );
  const [healthGoal, setHealthGoal] = useState(
    customer.preferences?.healthGoal ?? "",
  );
  const [allergies, setAllergies] = useState(
    customer.preferences?.allergies?.join(", ") ?? "",
  );

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate(
          {
            id: customer.id,
            input: {
              preferences: {
                foodPreference: foodPreference
                  ? (foodPreference as FoodPreference)
                  : undefined,
                healthGoal: healthGoal ? (healthGoal as HealthGoal) : undefined,
                allergies: allergies
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              },
            },
          },
          {
            onSuccess: () => {
              dispatch(
                addToast({
                  title: "Preferences saved",
                  variant: "success",
                }),
              );
            },
            onError: (error) => {
              dispatch(
                addToast({
                  title: "Could not save preferences",
                  description:
                    error instanceof ApiError
                      ? error.message
                      : "Please try again.",
                  variant: "danger",
                }),
              );
            },
          },
        );
      }}
    >
      <div className="space-y-1.5">
        <Label>Food preference</Label>
        <Select
          value={foodPreference}
          onChange={(event) => setFoodPreference(event.target.value)}
        >
          <option value="">Select</option>
          <option value={FoodPreference.VEG}>Veg</option>
          <option value={FoodPreference.NON_VEG}>Non-veg</option>
          <option value={FoodPreference.EGGETARIAN}>Eggetarian</option>
          <option value={FoodPreference.VEGAN}>Vegan</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Health goal</Label>
        <Select
          value={healthGoal}
          onChange={(event) => setHealthGoal(event.target.value)}
        >
          <option value="">Select</option>
          <option value={HealthGoal.WEIGHT_LOSS}>Weight loss</option>
          <option value={HealthGoal.WEIGHT_GAIN}>Weight gain</option>
          <option value={HealthGoal.FITNESS}>Fitness</option>
          <option value={HealthGoal.DIABETES_FRIENDLY}>
            Diabetes-friendly
          </option>
          <option value={HealthGoal.HEALTHY_LIFESTYLE}>
            Healthy lifestyle
          </option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Allergies or foods to avoid</Label>
        <Textarea
          rows={2}
          value={allergies}
          onChange={(event) => setAllergies(event.target.value)}
          placeholder="Peanuts, dairy…"
        />
      </div>
      <Button type="submit" size="sm" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
