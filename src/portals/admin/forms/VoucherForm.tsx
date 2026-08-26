"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createVoucherSchema,
  type CreateVoucherInput,
} from "@/features/vouchers/schemas/voucherSchemas";
import { DiscountType, VoucherStatus } from "@/types/enums";
import type { Voucher } from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  useCreateVoucher,
  useUpdateVoucher,
} from "@/features/vouchers/queries/useVouchers";
import { usePlans } from "@/features/plans/queries/usePlans";
import { useToast } from "@/store/useToast";

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function voucherToFormValues(voucher?: Voucher): CreateVoucherInput {
  if (!voucher) {
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return {
      code: "",
      name: "",
      description: "",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      maxDiscount: undefined,
      minimumOrderValue: undefined,
      startDate: today,
      expiryDate: nextMonth.toISOString().slice(0, 10),
      usageLimit: undefined,
      usagePerCustomer: 1,
      applicablePlans: [],
      status: VoucherStatus.DRAFT,
    };
  }

  return {
    code: voucher.code,
    name: voucher.name,
    description: voucher.description ?? "",
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    maxDiscount: voucher.maxDiscount,
    minimumOrderValue: voucher.minimumOrderValue,
    startDate: toDateInput(voucher.startDate),
    expiryDate: toDateInput(voucher.expiryDate),
    usageLimit: voucher.usageLimit,
    usagePerCustomer: voucher.usagePerCustomer,
    applicablePlans: voucher.applicablePlans ?? [],
    status: voucher.status,
  };
}

export function VoucherForm({
  voucherId,
  initialVoucher,
}: {
  voucherId?: string;
  initialVoucher?: Voucher;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateVoucher();
  const updateMutation = useUpdateVoucher(voucherId ?? "");
  const plansQuery = usePlans({ pageSize: 100 });
  const toast = useToast();

  const defaults = useMemo(
    () => voucherToFormValues(initialVoucher),
    [initialVoucher],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateVoucherInput>({
    resolver: zodResolver(createVoucherSchema) as Resolver<CreateVoucherInput>,
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!initialVoucher) return;
    Object.entries(voucherToFormValues(initialVoucher)).forEach(
      ([key, value]) => {
        setValue(key as keyof CreateVoucherInput, value as never);
      },
    );
  }, [initialVoucher, setValue]);

  const discountType = watch("discountType");
  const applicablePlans = watch("applicablePlans") ?? [];

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload: CreateVoucherInput = {
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      expiryDate: new Date(values.expiryDate).toISOString(),
      applicablePlans: values.applicablePlans ?? [],
    };
    try {
      if (voucherId) {
        await updateMutation.mutateAsync(payload);
        toast.success("Voucher updated");
        router.push("/admin/vouchers");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Voucher created");
        router.push("/admin/vouchers");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save voucher";
      toast.error(
        voucherId ? "Could not update voucher" : "Could not create voucher",
        message,
      );
      setSubmitError(message);
    }
  });

  const togglePlan = (planId: string) => {
    const next = applicablePlans.includes(planId)
      ? applicablePlans.filter((id) => id !== planId)
      : [...applicablePlans, planId];
    setValue("applicablePlans", next);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="border-brand-border bg-brand-surface grid gap-4 rounded-lg border p-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" className="uppercase" {...register("code")} />
          {errors.code ? (
            <p className="text-brand-danger text-xs">{errors.code.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? (
            <p className="text-brand-danger text-xs">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} {...register("description")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discountType">Discount type</Label>
          <Select id="discountType" {...register("discountType")}>
            {Object.values(DiscountType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discountValue">
            Discount value
            {discountType === DiscountType.PERCENTAGE ? " (%)" : " (amount)"}
          </Label>
          <Input
            id="discountValue"
            type="number"
            step="0.01"
            {...register("discountValue", { valueAsNumber: true })}
          />
          {errors.discountValue ? (
            <p className="text-brand-danger text-xs">
              {errors.discountValue.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxDiscount">Max discount</Label>
          <Input
            id="maxDiscount"
            type="number"
            step="0.01"
            {...register("maxDiscount", {
              setValueAs: (v) =>
                v === "" || v === null || Number.isNaN(Number(v))
                  ? null
                  : Number(v),
            })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minimumOrderValue">Minimum order value</Label>
          <Input
            id="minimumOrderValue"
            type="number"
            step="0.01"
            {...register("minimumOrderValue", {
              setValueAs: (v) =>
                v === "" || v === null || Number.isNaN(Number(v))
                  ? null
                  : Number(v),
            })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiryDate">Expiry date</Label>
          <Input id="expiryDate" type="date" {...register("expiryDate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="usageLimit">Usage limit</Label>
          <Input
            id="usageLimit"
            type="number"
            {...register("usageLimit", {
              setValueAs: (v) =>
                v === "" || v === null || Number.isNaN(Number(v))
                  ? null
                  : Number(v),
            })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="usagePerCustomer">Usage per customer</Label>
          <Input
            id="usagePerCustomer"
            type="number"
            {...register("usagePerCustomer", {
              setValueAs: (v) =>
                v === "" || v === null || Number.isNaN(Number(v))
                  ? null
                  : Number(v),
            })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            {Object.values(VoucherStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Applicable plans (empty = all)</Label>
          <div className="border-brand-border mt-2 grid max-h-48 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
            {(plansQuery.data?.data ?? []).map((plan) => (
              <label
                key={plan.id}
                className="inline-flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="accent-brand-green"
                  checked={applicablePlans.includes(plan.id)}
                  onChange={() => togglePlan(plan.id)}
                />
                {plan.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      {submitError ? (
        <p className="text-brand-danger text-sm">{submitError}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {voucherId ? "Save voucher" : "Create voucher"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/vouchers")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
