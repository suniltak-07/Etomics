"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { CheckoutOrderSummary } from "@/features/checkout/components/CheckoutOrderSummary";
import { EatOmicsSuccessCard } from "@/features/checkout/components/EatOmicsSuccessCard";
import { WellnessNotice } from "@/components/brand/WellnessNotice";
import {
  CHECKOUT_STEPS,
  type CheckoutState,
} from "@/features/checkout/schemas/checkoutTypes";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { usePlans } from "@/features/plans/hooks/usePlans";
import { useCreatePayment } from "@/features/payments/hooks/usePayments";
import { useValidateVoucher } from "@/features/dashboard/hooks/useCustomerDashboard";
import { calculateTrialPrice } from "@/lib/pricing/pricingEngine";
import { formatCurrency } from "@/lib/utils/format";
import type { Address, Plan } from "@/types/entities";
import {
  DurationKind,
  FoodPreference,
  HealthGoal,
  MealType,
  PlanStatus,
} from "@/types/enums";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCheckoutStep, addToast } from "@/store/slices/uiSlice";
import type { CreatePaymentResult } from "@/features/payments/services/paymentService";
import { nextDeliveryDate, toDateOnly } from "@/lib/calendar/deliveryCalendar";
import { addDays } from "date-fns";

function defaultStartDate(): string {
  return toDateOnly(nextDeliveryDate(addDays(new Date(), 1)));
}

const initialState = (
  planId: string | null,
  user?: { firstName?: string; lastName?: string; mobile?: string } | null,
): CheckoutState => ({
  planId,
  addressId: null,
  voucherCode: "",
  voucherApplied: false,
  voucherDiscount: 0,
  voucherMessage: null,
  voucherError: null,
  paymentMethod: "upi",
  durationKind: DurationKind.FULL,
  mealTypes: [],
  startDate: defaultStartDate(),
  firstName: user?.firstName ?? "",
  lastName: user?.lastName ?? "",
  mobile: user?.mobile ?? "",
  foodPreference: "",
  allergies: "",
  healthGoal: "",
  result: null,
});

export function CheckoutWizard({ initialPlanId }: { initialPlanId?: string }) {
  const dispatch = useAppDispatch();
  const step = useAppSelector((state) => state.ui.checkoutStep);
  const user = useAppSelector((state) => state.auth.user);

  const [state, setState] = useState<CheckoutState>(() =>
    initialState(initialPlanId ?? null, user),
  );
  const effectivePlanId = state.planId ?? initialPlanId ?? null;

  const plansQuery = usePlans({
    status: PlanStatus.ACTIVE,
    pageSize: 50,
  });
  const addressesQuery = useAddresses();
  const validateMutation = useValidateVoucher();
  const payMutation = useCreatePayment();

  useEffect(() => {
    dispatch(setCheckoutStep(0));
    return () => {
      dispatch(setCheckoutStep(0));
    };
  }, [dispatch]);

  const plans = plansQuery.data?.data ?? [];
  const addresses = addressesQuery.data?.data ?? [];
  const selectedPlan =
    plans.find((plan) => plan.id === effectivePlanId) ?? null;
  const defaultAddressId =
    addresses.find((item) => item.isDefault)?.id ?? addresses[0]?.id ?? null;
  const selectedAddressId = state.addressId ?? defaultAddressId;
  const selectedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? null;

  const clientPricing = useMemo(() => {
    if (!selectedPlan) return null;
    const planPrice =
      state.durationKind === DurationKind.TRIAL
        ? calculateTrialPrice(selectedPlan.price)
        : selectedPlan.price;
    const voucherDiscount = state.voucherApplied ? state.voucherDiscount : 0;
    const planDiscount =
      state.durationKind === DurationKind.FULL &&
      selectedPlan.compareAtPrice &&
      selectedPlan.compareAtPrice > selectedPlan.price
        ? selectedPlan.compareAtPrice - selectedPlan.price
        : 0;
    const subtotal = Math.max(planPrice - voucherDiscount, 0);
    return {
      planPrice,
      planDiscount,
      voucherDiscount,
      tax: 0,
      deliveryFee: 0,
      subtotal,
      finalAmount: subtotal,
    };
  }, [
    selectedPlan,
    state.durationKind,
    state.voucherApplied,
    state.voucherDiscount,
  ]);

  function goTo(next: number) {
    dispatch(setCheckoutStep(next));
  }

  async function applyVoucher() {
    if (!effectivePlanId) return;
    try {
      const response = await validateMutation.mutateAsync({
        code: state.voucherCode,
        planId: effectivePlanId,
        orderAmount: clientPricing?.planPrice,
      });
      setState((current) => ({
        ...current,
        voucherApplied: true,
        voucherDiscount: response.data.discountAmount,
        voucherMessage: response.data.message ?? "Voucher applied",
        voucherError: null,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        voucherApplied: false,
        voucherDiscount: 0,
        voucherMessage: null,
        voucherError:
          error instanceof ApiError ? error.message : "Could not apply voucher",
      }));
    }
  }

  async function pay() {
    if (!effectivePlanId || !selectedAddressId) return;
    if (
      !state.foodPreference ||
      state.mealTypes.length === 0 ||
      !state.healthGoal
    ) {
      dispatch(
        addToast({
          title: "Complete your details",
          description:
            "Choose food preference, meals, and a health goal before paying.",
          variant: "warning",
        }),
      );
      goTo(1);
      return;
    }
    try {
      const response = await payMutation.mutateAsync({
        planId: effectivePlanId,
        addressId: selectedAddressId,
        voucherCode: state.voucherApplied
          ? state.voucherCode.trim()
          : undefined,
        method: state.paymentMethod,
        durationKind: state.durationKind,
        mealTypes:
          state.mealTypes.length > 0
            ? state.mealTypes
            : selectedPlan?.mealTypes,
        startDate: state.startDate,
        firstName: state.firstName,
        lastName: state.lastName,
        mobile: state.mobile,
        foodPreference: state.foodPreference,
        allergies: state.allergies || undefined,
        healthGoal: state.healthGoal || undefined,
      });
      setState((current) => ({
        ...current,
        planId: effectivePlanId,
        addressId: selectedAddressId,
        result: response.data,
      }));
      goTo(5);
      dispatch(
        addToast({
          title: "Payment successful",
          description: "Your EatOmics card is ready.",
          variant: "success",
        }),
      );
    } catch (error) {
      dispatch(
        addToast({
          title: "Payment failed",
          description:
            error instanceof ApiError ? error.message : "Please try again.",
          variant: "danger",
        }),
      );
    }
  }

  if (plansQuery.isLoading || addressesQuery.isLoading) {
    return <LoadingState title="Preparing checkout" />;
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        action={
          <Button variant="outline" onClick={() => plansQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const summaryModel = {
    plan: selectedPlan,
    address: selectedAddress,
    pricing: clientPricing,
    voucherCode: state.voucherApplied ? state.voucherCode : undefined,
    durationKind: state.durationKind,
    startDate: state.startDate,
    foodPreference: state.foodPreference,
    mealTypes: state.mealTypes,
    healthGoal: state.healthGoal,
    allergies: state.allergies,
  };

  return (
    <div className="animate-[fade-up_0.45s_ease-out]">
      <div className="mb-8">
        <p className="text-brand-green text-sm font-medium tracking-[0.18em] uppercase">
          Subscribe
        </p>
        <h1 className="font-display text-brand-navy mt-2 text-3xl font-semibold sm:text-4xl">
          Tell us how to prepare your meals
        </h1>
      </div>

      <WellnessNotice className="mb-6" />

      <ol className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {CHECKOUT_STEPS.map((item) => {
          const active = step === item.id;
          const done = step > item.id;
          return (
            <li
              key={item.id}
              className={cn(
                "flex min-w-[5.5rem] flex-1 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium sm:text-sm",
                active
                  ? "border-brand-green bg-brand-green-muted text-brand-green"
                  : done
                    ? "border-brand-border bg-brand-surface text-brand-ink"
                    : "bg-brand-sand/80 text-brand-muted border-transparent",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[11px]",
                  active || done
                    ? "bg-brand-green text-white"
                    : "bg-brand-border/70 text-brand-muted",
                )}
              >
                {done ? <Check className="size-3.5" /> : item.id + 1}
              </span>
              {item.label}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="border-brand-border bg-brand-surface min-w-0 rounded-2xl border p-5 sm:p-6">
          {step === 0 ? (
            <StepPlan
              plans={plans}
              selectedPlanId={effectivePlanId}
              onSelect={(planId) =>
                setState((current) => ({
                  ...current,
                  planId,
                  mealTypes:
                    plans.find((plan) => plan.id === planId)?.mealTypes ?? [],
                  voucherApplied: false,
                  voucherDiscount: 0,
                  voucherError: null,
                  voucherMessage: null,
                }))
              }
              onNext={() => {
                if (!effectivePlanId) {
                  dispatch(
                    addToast({ title: "Choose a plan", variant: "warning" }),
                  );
                  return;
                }
                setState((current) => ({
                  ...current,
                  mealTypes:
                    current.mealTypes.length > 0
                      ? current.mealTypes
                      : (selectedPlan?.mealTypes ?? []),
                }));
                goTo(1);
              }}
            />
          ) : null}

          {step === 1 ? (
            <StepDetails
              state={state}
              plan={selectedPlan}
              onChange={(patch) =>
                setState((current) => ({ ...current, ...patch }))
              }
              onBack={() => goTo(0)}
              onNext={() => {
                if (
                  !state.firstName ||
                  !state.mobile ||
                  !state.foodPreference ||
                  state.mealTypes.length === 0 ||
                  !state.startDate ||
                  !state.healthGoal
                ) {
                  dispatch(
                    addToast({
                      title: "Fill the required details",
                      description:
                        "Food preference, meals, start date, and health goal are required.",
                      variant: "warning",
                    }),
                  );
                  return;
                }
                goTo(2);
              }}
            />
          ) : null}

          {step === 2 ? (
            <StepAddress
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={(addressId) =>
                setState((current) => ({ ...current, addressId }))
              }
              onBack={() => goTo(1)}
              onNext={() => {
                if (!selectedAddressId) {
                  dispatch(
                    addToast({
                      title: "Choose a delivery address",
                      variant: "warning",
                    }),
                  );
                  return;
                }
                goTo(3);
              }}
            />
          ) : null}

          {step === 3 ? (
            <StepVoucher
              code={state.voucherCode}
              error={state.voucherError}
              message={state.voucherMessage}
              applied={state.voucherApplied}
              discount={state.voucherDiscount}
              currency={selectedPlan?.currency}
              loading={validateMutation.isPending}
              onChange={(voucherCode) =>
                setState((current) => ({
                  ...current,
                  voucherCode,
                  voucherApplied: false,
                  voucherDiscount: 0,
                  voucherError: null,
                  voucherMessage: null,
                }))
              }
              onApply={applyVoucher}
              onSkip={() => {
                setState((current) => ({
                  ...current,
                  voucherApplied: false,
                  voucherDiscount: 0,
                  voucherError: null,
                  voucherMessage: null,
                  voucherCode: "",
                }));
                goTo(4);
              }}
              onBack={() => goTo(2)}
              onNext={() => goTo(4)}
            />
          ) : null}

          {step === 4 ? (
            <StepPayment
              method={state.paymentMethod}
              amount={clientPricing?.finalAmount ?? selectedPlan?.price ?? 0}
              currency={selectedPlan?.currency ?? "INR"}
              loading={payMutation.isPending}
              onMethodChange={(paymentMethod) =>
                setState((current) => ({ ...current, paymentMethod }))
              }
              onBack={() => goTo(3)}
              onPay={pay}
            />
          ) : null}

          {step === 5 && state.result ? (
            <StepConfirmation
              result={state.result}
              planName={selectedPlan?.name ?? "Your plan"}
              address={selectedAddress}
              customerName={`${state.firstName} ${state.lastName}`.trim()}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="hidden lg:block">
            <CheckoutOrderSummary model={summaryModel} sticky />
          </div>
          <div className="lg:hidden">
            <div className="sticky bottom-3 z-30">
              <CheckoutOrderSummary
                model={summaryModel}
                className="border-brand-green/20 shadow-[0_18px_50px_-20px_rgba(45,106,79,0.45)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPlan({
  plans,
  selectedPlanId,
  onSelect,
  onNext,
}: {
  plans: Plan[];
  selectedPlanId: string | null;
  onSelect: (planId: string) => void;
  onNext: () => void;
}) {
  if (plans.length === 0) {
    return <EmptyState title="No plans available" />;
  }

  return (
    <div>
      <h2 className="font-display text-brand-navy text-xl font-semibold">
        Preferred plan
      </h2>
      <p className="text-brand-muted mt-1 text-sm">
        All 10 plans include a 7-day trial: plan price ÷ 7, Sundays off.
      </p>
      <ul className="mt-5 space-y-3">
        {plans.map((plan) => {
          const selected = plan.id === selectedPlanId;
          const trial = calculateTrialPrice(plan.price);
          return (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => onSelect(plan.id)}
                className={cn(
                  "flex w-full gap-4 rounded-xl border p-3 text-left transition",
                  selected
                    ? "border-brand-green bg-brand-green-muted/40 ring-brand-green ring-1"
                    : "border-brand-border hover:border-brand-green/40",
                )}
              >
                <div className="bg-brand-sand relative size-20 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={plan.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-brand-ink font-medium">{plan.name}</p>
                  <p className="text-brand-muted mt-1 line-clamp-2 text-sm">
                    {plan.shortDescription}
                  </p>
                  <p className="text-brand-navy mt-2 text-sm font-semibold">
                    {formatCurrency(plan.price, plan.currency)} / 26 days
                    <span className="text-brand-green ml-2 font-normal">
                      Trial {formatCurrency(trial, plan.currency)}
                    </span>
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex justify-end">
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

function StepDetails({
  state,
  plan,
  onChange,
  onBack,
  onNext,
}: {
  state: CheckoutState;
  plan: Plan | null;
  onChange: (patch: Partial<CheckoutState>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const allowedMeals = plan?.mealTypes ?? [
    MealType.BREAKFAST,
    MealType.LUNCH,
    MealType.DINNER,
  ];
  const selectedMeals =
    state.mealTypes.length > 0 ? state.mealTypes : allowedMeals;
  const trialPrice = plan ? calculateTrialPrice(plan.price) : 0;

  function toggleMeal(meal: MealType) {
    const next = selectedMeals.includes(meal)
      ? selectedMeals.filter((item) => item !== meal)
      : [...selectedMeals, meal];
    onChange({ mealTypes: next });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-brand-navy text-xl font-semibold">
          Your details
        </h2>
        <p className="text-brand-muted mt-1 text-sm">
          Food preference, meals, start date, allergies, and health goal — so
          kitchen packs the right veg or non-veg plate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full first name">
          <Input
            value={state.firstName}
            onChange={(event) => onChange({ firstName: event.target.value })}
          />
        </Field>
        <Field label="Last name">
          <Input
            value={state.lastName}
            onChange={(event) => onChange({ lastName: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Mobile number">
        <Input
          value={state.mobile}
          onChange={(event) => onChange({ mobile: event.target.value })}
        />
      </Field>

      <Field label="Food preference" required>
        <Select
          value={state.foodPreference}
          onChange={(event) =>
            onChange({
              foodPreference: event.target.value as FoodPreference,
            })
          }
        >
          <option value="">Select</option>
          <option value={FoodPreference.VEG}>Veg</option>
          <option value={FoodPreference.NON_VEG}>Non-veg</option>
          <option value={FoodPreference.EGGETARIAN}>Eggetarian</option>
          <option value={FoodPreference.VEGAN}>Vegan</option>
        </Select>
      </Field>

      <div>
        <Label>
          Meals required <span className="text-brand-danger">*</span>
        </Label>
        <p className="text-brand-muted mt-1 text-xs">
          Kitchen packs veg or non-veg for each selected meal from that day’s
          menu.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {allowedMeals.map((meal) => {
            const on = selectedMeals.includes(meal);
            return (
              <button
                key={meal}
                type="button"
                onClick={() => toggleMeal(meal)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  on
                    ? "border-brand-green bg-brand-green-muted text-brand-navy"
                    : "border-brand-border text-brand-muted",
                )}
              >
                {meal === MealType.BREAKFAST
                  ? "Breakfast"
                  : meal === MealType.LUNCH
                    ? "Lunch"
                    : "Dinner"}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Subscription duration</Label>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChange({ durationKind: DurationKind.TRIAL })}
            className={cn(
              "rounded-2xl border p-4 text-left",
              state.durationKind === DurationKind.TRIAL
                ? "border-brand-green bg-brand-green-muted/50 ring-brand-green ring-1"
                : "border-brand-border",
            )}
          >
            <p className="text-brand-green text-xs tracking-wide uppercase">
              Try 7 days
            </p>
            <p className="font-display text-brand-navy mt-1 text-2xl font-semibold">
              {plan ? formatCurrency(trialPrice, plan.currency) : "—"}
            </p>
            <p className="text-brand-muted mt-1 text-xs">
              Plan ÷ 7. Sundays off. Taste the rhythm first.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onChange({ durationKind: DurationKind.FULL })}
            className={cn(
              "rounded-2xl border p-4 text-left",
              state.durationKind === DurationKind.FULL
                ? "border-brand-green bg-brand-green-muted/50 ring-brand-green ring-1"
                : "border-brand-border",
            )}
          >
            <p className="text-brand-muted text-xs tracking-wide uppercase">
              26 delivery days
            </p>
            <p className="font-display text-brand-navy mt-1 text-2xl font-semibold">
              {plan ? formatCurrency(plan.price, plan.currency) : "—"}
            </p>
            <p className="text-brand-muted mt-1 text-xs">
              Full cycle, Sundays excluded.
            </p>
          </button>
        </div>
      </div>

      <Field label="Start date" required>
        <Input
          type="date"
          value={state.startDate}
          onChange={(event) => onChange({ startDate: event.target.value })}
        />
      </Field>

      <Field label="Allergies or foods to avoid">
        <Textarea
          rows={2}
          value={state.allergies}
          onChange={(event) => onChange({ allergies: event.target.value })}
          placeholder="Peanuts, dairy, or write None"
        />
      </Field>

      <Field label="Health goal" required>
        <Select
          value={state.healthGoal}
          onChange={(event) =>
            onChange({ healthGoal: event.target.value as HealthGoal })
          }
        >
          <option value="">Select a goal</option>
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
      </Field>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="text-brand-danger"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

function StepAddress({
  addresses,
  selectedAddressId,
  onSelect,
  onBack,
  onNext,
}: {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelect: (addressId: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-brand-navy text-xl font-semibold">
        Delivery address
      </h2>
      <p className="text-brand-muted mt-1 text-sm">
        Pin your location on the map in Addresses if you can — it helps the
        kitchen and riders.
      </p>

      {addresses.length === 0 ? (
        <EmptyState
          className="py-10"
          title="Add an address first"
          description="You need a delivery address before checkout."
          action={
            <Link
              href="/customer/addresses"
              className="bg-brand-green inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white"
            >
              Manage addresses
            </Link>
          }
        />
      ) : (
        <ul className="mt-5 space-y-3">
          {addresses.map((address) => {
            const selected = address.id === selectedAddressId;
            return (
              <li key={address.id}>
                <button
                  type="button"
                  onClick={() => onSelect(address.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition",
                    selected
                      ? "border-brand-green bg-brand-green-muted/40 ring-brand-green ring-1"
                      : "border-brand-border hover:border-brand-green/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-brand-ink font-medium">
                      {address.fullName}
                    </p>
                    <Badge variant="muted">{address.addressType}</Badge>
                    {address.isDefault ? (
                      <Badge variant="success">Default</Badge>
                    ) : null}
                  </div>
                  <p className="text-brand-muted mt-1 text-sm">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  </p>
                  <p className="text-brand-muted text-sm">
                    {address.city}, {address.state} {address.pincode}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Link
            href="/customer/addresses"
            className="border-brand-border inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
          >
            Add / map pin
          </Link>
          <Button onClick={onNext} disabled={addresses.length === 0}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepVoucher({
  code,
  error,
  message,
  applied,
  discount,
  currency,
  loading,
  onChange,
  onApply,
  onSkip,
  onBack,
  onNext,
}: {
  code: string;
  error: string | null;
  message: string | null;
  applied: boolean;
  discount: number;
  currency?: string;
  loading: boolean;
  onChange: (code: string) => void;
  onApply: () => void;
  onSkip: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-brand-navy text-xl font-semibold">
        Voucher
      </h2>
      <p className="text-brand-muted mt-1 text-sm">
        Apply a code for an extra discount, or skip this step.
      </p>
      <div className="mt-5 flex gap-2">
        <Input
          value={code}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder="WELCOME10"
        />
        <Button type="button" onClick={onApply} disabled={loading || !code}>
          Apply
        </Button>
      </div>
      {error ? <p className="text-brand-danger mt-3 text-sm">{error}</p> : null}
      {applied ? (
        <p className="border-brand-success/20 bg-brand-success/5 text-brand-success mt-3 rounded-md border px-3 py-2 text-sm">
          {message} {discount ? `· ${formatCurrency(discount, currency)}` : ""}
        </p>
      ) : null}
      <div className="mt-6 flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={onNext}>Continue</Button>
        </div>
      </div>
    </div>
  );
}

function StepPayment({
  method,
  amount,
  currency,
  loading,
  onMethodChange,
  onBack,
  onPay,
}: {
  method: CheckoutState["paymentMethod"];
  amount: number;
  currency: string;
  loading: boolean;
  onMethodChange: (method: CheckoutState["paymentMethod"]) => void;
  onBack: () => void;
  onPay: () => void;
}) {
  const methods: Array<{ id: CheckoutState["paymentMethod"]; label: string }> =
    [
      { id: "upi", label: "UPI" },
      { id: "card", label: "Card" },
      { id: "netbanking", label: "Net banking" },
    ];

  return (
    <div>
      <h2 className="font-display text-brand-navy text-xl font-semibold">
        Payment
      </h2>
      <p className="text-brand-muted mt-1 text-sm">
        Mock payment — no real charge is made.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {methods.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onMethodChange(item.id)}
            className={cn(
              "rounded-xl border px-4 py-4 text-left transition",
              method === item.id
                ? "border-brand-green bg-brand-green-muted/40 ring-brand-green ring-1"
                : "border-brand-border hover:border-brand-green/40",
            )}
          >
            <CreditCard className="text-brand-green mb-2 size-5" />
            <p className="text-brand-ink font-medium">{item.label}</p>
          </button>
        ))}
      </div>
      <div className="bg-brand-sand mt-6 rounded-xl px-4 py-4">
        <p className="text-brand-muted text-sm">Amount due</p>
        <p className="font-display text-brand-navy text-3xl font-semibold">
          {formatCurrency(amount, currency)}
        </p>
      </div>
      <div className="mt-6 flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={onPay} disabled={loading}>
          {loading ? "Processing…" : "Pay now"}
        </Button>
      </div>
    </div>
  );
}

function StepConfirmation({
  result,
  planName,
  address,
  customerName,
}: {
  result: CreatePaymentResult;
  planName: string;
  address: Address | null;
  customerName: string;
}) {
  const { subscription, pricing, payment } = result;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-brand-navy text-2xl font-semibold">
          You are subscribed
        </h2>
        <p className="text-brand-muted mt-2">
          Keep this EatOmics card — kitchen and delivery will recognise it.
        </p>
      </div>
      <EatOmicsSuccessCard
        customerName={customerName || "Member"}
        planName={planName}
        subscription={subscription}
        address={address}
        amount={pricing.finalAmount}
        currency={payment.currency}
      />
      <div className="flex flex-wrap gap-2 print:hidden">
        <Link
          href={`/customer/subscriptions/${subscription.id}`}
          className="bg-brand-green hover:bg-brand-green-light inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white"
        >
          View subscription
        </Link>
        <Link
          href="/customer/menu"
          className="border-brand-border inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
        >
          Today’s menu
        </Link>
      </div>
    </div>
  );
}
