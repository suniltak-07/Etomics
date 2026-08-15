"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/states";
import {
  useCancelSubscription,
  useChangeSubscriptionAddress,
  useMealSkips,
  usePauseSubscription,
  useRestoreMeal,
  useResumeSubscription,
  useSkipMeal,
  useSubscription,
  useUpdateSubscriptionMeals,
} from "@/features/subscriptions/hooks/useSubscriptions";
import { useAddresses } from "@/features/addresses/hooks/useAddresses";
import { usePlan } from "@/features/plans/hooks/usePlans";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { formatMealTypes } from "@/lib/meals/labels";
import { subscriptionBadgeVariant } from "@/lib/utils/statusBadges";
import { SubscriptionStatus } from "@/types/enums";
import { MealType } from "@/types/enums";
import {
  canSkipMeal,
  upcomingDeliveryDates,
} from "@/lib/calendar/deliveryCalendar";
import { ApiError } from "@/lib/api/errors";

export default function CustomerSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const subscriptionQuery = useSubscription(id);
  const planQuery = usePlan(subscriptionQuery.data?.data.planId);
  const addressesQuery = useAddresses();

  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const cancelMutation = useCancelSubscription();
  const changeAddressMutation = useChangeSubscriptionAddress();
  const skipsQuery = useMealSkips(id);
  const skipMutation = useSkipMeal();
  const restoreMutation = useRestoreMeal();
  const mealsMutation = useUpdateSubscriptionMeals();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const sub = subscriptionQuery.data?.data;
  const plan = planQuery.data?.data;
  const addresses = useMemo(
    () => addressesQuery.data?.data ?? [],
    [addressesQuery.data?.data],
  );

  const address = useMemo(
    () => addresses.find((item) => item.id === sub?.addressId),
    [addresses, sub?.addressId],
  );

  async function runAction(
    action: () => Promise<unknown>,
    successTitle: string,
  ) {
    try {
      await action();
      dispatch(addToast({ title: successTitle, variant: "success" }));
    } catch (error) {
      dispatch(
        addToast({
          title: "Action failed",
          description:
            error instanceof ApiError
              ? error.message
              : "Please try again shortly.",
          variant: "danger",
        }),
      );
    }
  }

  if (subscriptionQuery.isLoading) {
    return <LoadingState title="Loading subscription" />;
  }

  if (subscriptionQuery.isError || !sub) {
    return (
      <ErrorState
        title="Subscription not found"
        action={
          <Link
            href="/customer/subscriptions"
            className="text-brand-green text-sm font-medium"
          >
            Back to subscriptions
          </Link>
        }
      />
    );
  }

  const canPause = sub.status === SubscriptionStatus.ACTIVE;
  const canResume = sub.status === SubscriptionStatus.PAUSED;
  const canCancel =
    sub.status === SubscriptionStatus.ACTIVE ||
    sub.status === SubscriptionStatus.PAUSED ||
    sub.status === SubscriptionStatus.PENDING;
  const canChangeAddress =
    sub.status === SubscriptionStatus.ACTIVE ||
    sub.status === SubscriptionStatus.PAUSED ||
    sub.status === SubscriptionStatus.PENDING;

  return (
    <div className="animate-[fade-up_0.5s_ease-out]">
      <PageHeader
        title={plan?.name ?? "Subscription"}
        description={`Subscription ${sub.id}`}
        action={
          <Link
            href="/customer/subscriptions"
            className="text-brand-green hover:text-brand-green-light text-sm font-medium"
          >
            ← All subscriptions
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Overview</CardTitle>
            <Badge variant={subscriptionBadgeVariant(sub.status)}>
              {sub.status}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label="Start" value={formatDate(sub.startDate)} />
            <Detail label="End" value={formatDate(sub.endDate)} />
            <Detail
              label="Amount paid"
              value={formatCurrency(sub.finalAmount)}
            />
            <Detail label="Plan price" value={formatCurrency(sub.price)} />
            {sub.voucherDiscount > 0 ? (
              <Detail
                label="Voucher discount"
                value={`−${formatCurrency(sub.voucherDiscount)}`}
              />
            ) : null}
            {sub.pausedAt ? (
              <Detail label="Paused on" value={formatDate(sub.pausedAt)} />
            ) : null}
            {sub.cancelledAt ? (
              <Detail
                label="Cancelled on"
                value={formatDate(sub.cancelledAt)}
              />
            ) : null}
            <Detail
              label="Duration"
              value={
                sub.durationKind === "TRIAL"
                  ? "7-day trial"
                  : "26 delivery days"
              }
            />
            <Detail
              label="Meals opted"
              value={formatMealTypes(sub.mealTypes)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery address</CardTitle>
          </CardHeader>
          <CardContent>
            {address ? (
              <div className="text-brand-ink space-y-1 text-sm">
                <p className="font-medium">{address.fullName}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
                <p>
                  {address.city}, {address.state} {address.pincode}
                </p>
                <p className="text-brand-muted">{address.mobile}</p>
              </div>
            ) : (
              <p className="text-brand-muted text-sm">Address unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>

      {sub.status === SubscriptionStatus.ACTIVE ? (
        <MealSkipPanel
          subscriptionId={sub.id}
          startDate={sub.startDate}
          endDate={sub.endDate}
          mealTypes={sub.mealTypes}
          skips={skipsQuery.data?.data ?? []}
          onSkip={(date, mealType) =>
            runAction(
              () => skipMutation.mutateAsync({ id: sub.id, date, mealType }),
              "Meal skipped",
            )
          }
          onRestore={(date, mealType) =>
            runAction(
              () => restoreMutation.mutateAsync({ id: sub.id, date, mealType }),
              "Meal restored",
            )
          }
          onUpdateMeals={(mealTypes) =>
            runAction(
              () => mealsMutation.mutateAsync({ id: sub.id, mealTypes }),
              "Meal choices updated",
            )
          }
        />
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {canPause ? (
          <Button
            variant="outline"
            disabled={pauseMutation.isPending}
            onClick={() =>
              runAction(
                () => pauseMutation.mutateAsync(sub.id),
                "Subscription paused",
              )
            }
          >
            Pause
          </Button>
        ) : null}
        {canResume ? (
          <Button
            disabled={resumeMutation.isPending}
            onClick={() =>
              runAction(
                () => resumeMutation.mutateAsync(sub.id),
                "Subscription resumed",
              )
            }
          >
            Resume
          </Button>
        ) : null}
        {canChangeAddress ? (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedAddressId(sub.addressId);
              setAddressOpen(true);
            }}
          >
            Change address
          </Button>
        ) : null}
        {canCancel ? (
          <Button variant="danger" onClick={() => setCancelOpen(true)}>
            Cancel
          </Button>
        ) : null}
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel subscription"
        description="Your remaining deliveries for this cycle will stop."
      >
        <Label htmlFor="cancel-reason">Reason (optional)</Label>
        <Textarea
          id="cancel-reason"
          className="mt-2"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          placeholder="Tell us why you're cancelling"
        />
        <ModalFooter>
          <Button variant="outline" onClick={() => setCancelOpen(false)}>
            Keep subscription
          </Button>
          <Button
            variant="danger"
            disabled={cancelMutation.isPending}
            onClick={async () => {
              await runAction(
                () =>
                  cancelMutation.mutateAsync({
                    id: sub.id,
                    cancellationReason: cancelReason || undefined,
                  }),
                "Subscription cancelled",
              );
              setCancelOpen(false);
            }}
          >
            Confirm cancel
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        title="Change delivery address"
      >
        <Label htmlFor="address-select">Select address</Label>
        <Select
          id="address-select"
          className="mt-2"
          value={selectedAddressId}
          onChange={(event) => setSelectedAddressId(event.target.value)}
        >
          {addresses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.fullName} — {item.addressLine1}, {item.city}
              {item.isDefault ? " (Default)" : ""}
            </option>
          ))}
        </Select>
        <ModalFooter>
          <Button variant="outline" onClick={() => setAddressOpen(false)}>
            Close
          </Button>
          <Button
            disabled={
              !selectedAddressId ||
              selectedAddressId === sub.addressId ||
              changeAddressMutation.isPending
            }
            onClick={async () => {
              await runAction(
                () =>
                  changeAddressMutation.mutateAsync({
                    id: sub.id,
                    addressId: selectedAddressId,
                  }),
                "Delivery address updated",
              );
              setAddressOpen(false);
            }}
          >
            Save address
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function MealSkipPanel({
  subscriptionId,
  startDate,
  endDate,
  mealTypes,
  skips,
  onSkip,
  onRestore,
  onUpdateMeals,
}: {
  subscriptionId: string;
  startDate: string;
  endDate: string;
  mealTypes: MealType[];
  skips: Array<{ date: string; mealType: MealType }>;
  onSkip: (date: string, mealType: MealType) => Promise<void> | void;
  onRestore: (date: string, mealType: MealType) => Promise<void> | void;
  onUpdateMeals: (mealTypes: MealType[]) => Promise<void> | void;
}) {
  const dates = upcomingDeliveryDates(startDate, endDate, 10);
  const now = new Date();
  const allMeals = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Upcoming meals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-brand-muted text-sm">
          Skip at least 5 hours before the meal window. Change which meals you
          receive at least 24 hours ahead.
        </p>
        <div className="flex flex-wrap gap-2">
          {allMeals.map((meal) => {
            const on = mealTypes.includes(meal);
            return (
              <Button
                key={meal}
                size="sm"
                variant={on ? "primary" : "outline"}
                onClick={() => {
                  const next = on
                    ? mealTypes.filter((item) => item !== meal)
                    : [...mealTypes, meal];
                  if (next.length === 0) return;
                  void onUpdateMeals(next);
                }}
              >
                {meal}
              </Button>
            );
          })}
        </div>
        <ul className="space-y-3">
          {dates.map((date) => (
            <li
              key={`${subscriptionId}-${date}`}
              className="border-brand-border rounded-xl border px-3 py-3"
            >
              <p className="text-brand-navy text-sm font-medium">
                {formatDate(date)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {mealTypes.map((meal) => {
                  const skipped = skips.some(
                    (item) => item.date === date && item.mealType === meal,
                  );
                  const open = canSkipMeal(date, meal, now);
                  return (
                    <Button
                      key={meal}
                      size="sm"
                      variant={skipped ? "danger" : "outline"}
                      disabled={!open}
                      onClick={() =>
                        skipped ? onRestore(date, meal) : onSkip(date, meal)
                      }
                    >
                      {skipped ? `Restore ${meal}` : `Skip ${meal}`}
                    </Button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-brand-muted text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className="text-brand-ink mt-1 font-medium">{value}</p>
    </div>
  );
}
