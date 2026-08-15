"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Home,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AddressMapPicker } from "@/features/addresses/components/AddressMapPicker";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from "@/features/addresses/hooks/useAddresses";
import {
  createAddressSchema,
  type CreateAddressInput,
} from "@/features/addresses/schemas/addressSchemas";
import { serviceabilityService } from "@/features/serviceability/services/serviceabilityService";
import type { ServiceabilityResult } from "@/lib/serviceability/checkPincode";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import { AddressType } from "@/types/enums";
import type { Address } from "@/types/entities";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";

type AddressFormValues = CreateAddressInput;

const emptyValues: AddressFormValues = {
  fullName: "",
  mobile: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  latitude: 12.9716,
  longitude: 77.5946,
  googleMapsUrl: "",
  addressType: AddressType.HOME,
  isDefault: false,
};

export default function CustomerAddressesPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const addressesQuery = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [pincodeInput, setPincodeInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [serviceability, setServiceability] =
    useState<ServiceabilityResult | null>(null);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(createAddressSchema) as never,
    defaultValues: emptyValues,
  });

  const addresses = addressesQuery.data?.data ?? [];
  const lat = form.watch("latitude");
  const lng = form.watch("longitude");

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [addresses],
  );

  function resetFlow() {
    setStep(1);
    setPincodeInput("");
    setServiceability(null);
    setEditing(null);
    form.reset({
      ...emptyValues,
      fullName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
      mobile: user?.mobile ?? "",
    });
  }

  function openCreate() {
    resetFlow();
    setModalOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setStep(2);
    setPincodeInput(address.pincode);
    setServiceability({
      serviceable: true,
      pincode: address.pincode,
      message: "Editing an existing serviceable address.",
      city: {
        id: address.cityId ?? "",
        name: address.city,
        slug: "",
        state: address.state,
        status: "ACTIVE",
        centerLat: address.latitude ?? 12.9716,
        centerLng: address.longitude ?? 77.5946,
        createdAt: "",
        updatedAt: "",
      },
    });
    form.reset({
      fullName: address.fullName,
      mobile: address.mobile,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      landmark: address.landmark ?? "",
      area: address.area ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      cityId: address.cityId,
      latitude: address.latitude ?? 12.9716,
      longitude: address.longitude ?? 77.5946,
      googleMapsUrl: address.googleMapsUrl ?? "",
      addressType: address.addressType,
      isDefault: address.isDefault,
    });
    setModalOpen(true);
  }

  async function checkPincode() {
    setChecking(true);
    setServiceability(null);
    try {
      const res = await serviceabilityService.check(pincodeInput.trim());
      const result = res.data;
      setServiceability(result);
      if (result.serviceable && result.city) {
        form.setValue("pincode", result.pincode);
        form.setValue("city", result.city.name);
        form.setValue("state", result.city.state);
        form.setValue("cityId", result.city.id);
        form.setValue("area", result.servicePincode?.areaName ?? "");
        form.setValue("latitude", result.city.centerLat);
        form.setValue("longitude", result.city.centerLng);
        if (!form.getValues("fullName") && user) {
          form.setValue(
            "fullName",
            `${user.firstName} ${user.lastName}`.trim(),
          );
        }
        if (!form.getValues("mobile") && user?.mobile) {
          form.setValue("mobile", user.mobile);
        }
        setStep(2);
      }
    } catch (error) {
      setServiceability({
        serviceable: false,
        pincode: pincodeInput,
        message:
          error instanceof ApiError
            ? error.message
            : "Could not check serviceability.",
      });
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(values: AddressFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input: values });
        dispatch(addToast({ title: "Address updated", variant: "success" }));
      } else {
        await createMutation.mutateAsync(values);
        dispatch(addToast({ title: "Address added", variant: "success" }));
      }
      setModalOpen(false);
      resetFlow();
    } catch (error) {
      dispatch(
        addToast({
          title: "Could not save address",
          description:
            error instanceof ApiError ? error.message : "Please try again.",
          variant: "danger",
        }),
      );
    }
  }

  if (addressesQuery.isLoading) {
    return <LoadingState title="Loading addresses" />;
  }

  if (addressesQuery.isError) {
    return (
      <ErrorState
        action={
          <Button variant="outline" onClick={() => addressesQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Delivery addresses"
        description="We deliver only to serviceable pincodes. Check yours, pin the location on the map, then save."
        action={
          <Button onClick={openCreate} className="rounded-full">
            <Plus className="size-4" />
            Add address
          </Button>
        }
      />

      {sortedAddresses.length === 0 ? (
        <EmptyState
          title="No addresses yet"
          description="Start by entering your pincode to see if EatOmics delivers to your area."
          action={
            <Button onClick={openCreate} className="rounded-full">
              Check pincode & add
            </Button>
          }
          className="border-brand-border bg-brand-surface/80 rounded-3xl border border-dashed py-16"
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sortedAddresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "group bg-brand-surface relative overflow-hidden rounded-3xl border p-5 shadow-[0_18px_50px_-36px_rgba(11,31,58,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-30px_rgba(11,31,58,0.5)]",
                address.isDefault
                  ? "border-brand-green/40 ring-brand-green/20 ring-1"
                  : "border-brand-border/70",
              )}
            >
              <div className="bg-brand-green-muted/40 absolute -top-6 -right-6 size-24 rounded-full blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="bg-brand-navy text-brand-green-muted flex size-11 items-center justify-center rounded-2xl">
                    {address.addressType === AddressType.HOME ? (
                      <Home className="size-5" />
                    ) : (
                      <MapPin className="size-5" />
                    )}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-brand-navy text-lg font-semibold">
                        {address.fullName}
                      </h2>
                      <Badge variant="muted">{address.addressType}</Badge>
                      {address.isDefault ? (
                        <Badge variant="success">Default</Badge>
                      ) : null}
                    </div>
                    <p className="text-brand-ink mt-2 text-sm leading-relaxed">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                    </p>
                    <p className="text-brand-muted mt-1 text-sm">
                      {[
                        address.area,
                        address.city,
                        address.state,
                        address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="text-brand-muted mt-2 text-sm">
                      {address.mobile}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => openEdit(address)}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                {!address.isDefault ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={setDefaultMutation.isPending}
                    onClick={async () => {
                      try {
                        await setDefaultMutation.mutateAsync(address.id);
                        dispatch(
                          addToast({
                            title: "Default address updated",
                            variant: "success",
                          }),
                        );
                      } catch (error) {
                        dispatch(
                          addToast({
                            title: "Could not set default",
                            description:
                              error instanceof ApiError
                                ? error.message
                                : undefined,
                            variant: "danger",
                          }),
                        );
                      }
                    }}
                  >
                    Set default
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="danger"
                  className="rounded-full"
                  disabled={deleteMutation.isPending}
                  onClick={async () => {
                    try {
                      await deleteMutation.mutateAsync(address.id);
                      dispatch(
                        addToast({
                          title: "Address removed",
                          variant: "success",
                        }),
                      );
                    } catch (error) {
                      dispatch(
                        addToast({
                          title: "Could not delete address",
                          description:
                            error instanceof ApiError
                              ? error.message
                              : undefined,
                          variant: "danger",
                        }),
                      );
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetFlow();
        }}
        title={editing ? "Edit address" : "Add delivery address"}
        className="max-w-2xl"
      >
        {step === 1 && !editing ? (
          <div className="space-y-5">
            <div className="border-brand-border/70 bg-brand-sand/60 rounded-2xl border p-4">
              <p className="text-brand-muted text-sm">
                Enter your 6-digit pincode. We will confirm whether EatOmics
                delivers there before you save an address.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode-check">Pincode</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="pincode-check"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 560038"
                  value={pincodeInput}
                  onChange={(event) =>
                    setPincodeInput(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  className="sm:flex-1"
                />
                <Button
                  type="button"
                  className="rounded-full sm:w-40"
                  disabled={checking || pincodeInput.length !== 6}
                  onClick={checkPincode}
                >
                  {checking ? "Checking…" : "Check availability"}
                </Button>
              </div>
            </div>

            {serviceability ? (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
                  serviceability.serviceable
                    ? "border-brand-success/30 text-brand-success bg-emerald-50"
                    : "border-brand-danger/30 text-brand-danger bg-red-50",
                )}
              >
                {serviceability.serviceable ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0" />
                )}
                <div>
                  <p className="font-medium">{serviceability.message}</p>
                  {serviceability.serviceable && serviceability.city ? (
                    <p className="mt-1 opacity-80">
                      {serviceability.servicePincode?.areaName
                        ? `${serviceability.servicePincode.areaName}, `
                        : ""}
                      {serviceability.city.name}, {serviceability.city.state}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  resetFlow();
                }}
              >
                Cancel
              </Button>
            </ModalFooter>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {serviceability?.serviceable ? (
              <div className="border-brand-green/25 bg-brand-green-muted/50 text-brand-navy flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm">
                <Navigation className="text-brand-green size-4" />
                Delivering to{" "}
                <strong>
                  {form.watch("area") ||
                    serviceability.servicePincode?.areaName ||
                    form.watch("pincode")}
                </strong>
                , {form.watch("city")}
                {!editing ? (
                  <button
                    type="button"
                    className="text-brand-green ml-auto text-xs font-semibold hover:underline"
                    onClick={() => setStep(1)}
                  >
                    Change pincode
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Pin your exact location</Label>
                <span className="text-brand-muted text-xs">
                  Tap the map or drag the marker
                </span>
              </div>
              <AddressMapPicker
                latitude={lat}
                longitude={lng}
                onChange={(nextLat, nextLng) => {
                  form.setValue("latitude", nextLat, { shouldValidate: true });
                  form.setValue("longitude", nextLng, { shouldValidate: true });
                }}
              />
              <p className="text-brand-muted font-mono text-[11px]">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
              <Field label="Google Maps link (optional)">
                <Input
                  placeholder="https://maps.google.com/..."
                  {...form.register("googleMapsUrl")}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                error={form.formState.errors.fullName?.message}
              >
                <Input {...form.register("fullName")} />
              </Field>
              <Field
                label="Mobile"
                error={form.formState.errors.mobile?.message}
              >
                <Input {...form.register("mobile")} />
              </Field>
            </div>

            <Field
              label="House / flat / building"
              error={form.formState.errors.addressLine1?.message}
            >
              <Input
                {...form.register("addressLine1")}
                placeholder="12, Palm Grove Apartments"
              />
            </Field>
            <Field label="Street / locality (optional)">
              <Input {...form.register("addressLine2")} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Landmark">
                <Input {...form.register("landmark")} />
              </Field>
              <Field label="Area">
                <Input {...form.register("area")} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="City">
                <Input
                  {...form.register("city")}
                  readOnly
                  className="bg-brand-sand/70"
                />
              </Field>
              <Field label="State">
                <Input
                  {...form.register("state")}
                  readOnly
                  className="bg-brand-sand/70"
                />
              </Field>
              <Field label="Pincode">
                <Input
                  {...form.register("pincode")}
                  readOnly
                  className="bg-brand-sand/70"
                />
              </Field>
            </div>

            <Field label="Address type">
              <Select {...form.register("addressType")}>
                <option value={AddressType.HOME}>Home</option>
                <option value={AddressType.WORK}>Work</option>
                <option value={AddressType.OTHER}>Other</option>
              </Select>
            </Field>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  resetFlow();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editing ? "Save changes" : "Save address"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-brand-danger text-xs">{error}</p> : null}
    </div>
  );
}
