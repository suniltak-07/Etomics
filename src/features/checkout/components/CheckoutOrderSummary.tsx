"use client";

import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";
import type { CheckoutSummaryModel } from "@/features/checkout/schemas/checkoutTypes";
import { cn } from "@/lib/utils/cn";

export function CheckoutOrderSummary({
  model,
  sticky = false,
  className,
}: {
  model: CheckoutSummaryModel;
  sticky?: boolean;
  className?: string;
}) {
  const { plan, address, pricing, voucherCode } = model;

  return (
    <aside
      className={cn(
        "border-brand-border bg-brand-surface rounded-2xl border p-5 shadow-[0_16px_50px_-34px_rgba(11,31,58,0.45)]",
        sticky && "lg:sticky lg:top-24",
        className,
      )}
    >
      <h2 className="font-display text-brand-navy text-lg font-semibold">
        Order summary
      </h2>

      {plan ? (
        <div className="mt-4 flex gap-3">
          <div className="bg-brand-sand relative size-16 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={plan.image}
              alt={plan.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div>
            <p className="text-brand-ink font-medium">{plan.name}</p>
            <p className="text-brand-muted text-sm">
              {model.durationKind === "TRIAL"
                ? "7-day trial · Sundays off"
                : `${plan.duration} delivery days · Sundays off`}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-brand-muted mt-4 text-sm">
          Select a plan to continue.
        </p>
      )}

      {address ? (
        <div className="border-brand-border mt-4 border-t pt-4 text-sm">
          <p className="text-brand-muted text-xs tracking-wide uppercase">
            Deliver to
          </p>
          <p className="text-brand-ink mt-1 font-medium">{address.fullName}</p>
          <p className="text-brand-muted">
            {address.addressLine1}, {address.city}
          </p>
        </div>
      ) : null}

      {pricing && plan ? (
        <dl className="border-brand-border mt-4 space-y-2 border-t pt-4 text-sm">
          <Row
            label="Plan price"
            value={formatCurrency(
              plan.compareAtPrice && plan.compareAtPrice > plan.price
                ? plan.compareAtPrice
                : pricing.planPrice,
              plan.currency,
            )}
          />
          {pricing.planDiscount > 0 ? (
            <Row
              label="Plan discount"
              value={`−${formatCurrency(pricing.planDiscount, plan.currency)}`}
              muted
            />
          ) : null}
          {pricing.voucherDiscount > 0 ? (
            <Row
              label={voucherCode ? `Voucher (${voucherCode})` : "Voucher"}
              value={`−${formatCurrency(pricing.voucherDiscount, plan.currency)}`}
              muted
            />
          ) : null}
          {pricing.deliveryFee > 0 ? (
            <Row
              label="Delivery"
              value={formatCurrency(pricing.deliveryFee, plan.currency)}
            />
          ) : null}
          {pricing.tax > 0 ? (
            <Row
              label="Tax"
              value={formatCurrency(pricing.tax, plan.currency)}
            />
          ) : null}
          <div className="border-brand-border flex items-center justify-between border-t pt-3">
            <dt className="text-brand-ink font-semibold">Total due</dt>
            <dd className="font-display text-brand-navy text-xl font-semibold">
              {formatCurrency(pricing.finalAmount, plan.currency)}
            </dd>
          </div>
        </dl>
      ) : null}

      <p className="text-brand-muted mt-4 text-xs">
        Preview uses the pricing engine. Final charge is recalculated securely
        when you pay.
      </p>
    </aside>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={muted ? "text-brand-muted" : "text-brand-ink"}>{label}</dt>
      <dd className={muted ? "text-brand-green" : "text-brand-ink"}>{value}</dd>
    </div>
  );
}
