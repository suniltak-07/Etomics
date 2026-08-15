import type { Address, Plan, Subscription } from "@/types/entities";
import type { CheckoutPricingResult } from "@/lib/pricing/pricingEngine";
import type { CreatePaymentResult } from "@/features/payments/services/paymentService";
import type {
  DurationKind,
  FoodPreference,
  HealthGoal,
  MealType,
} from "@/types/enums";

export const CHECKOUT_STEPS = [
  { id: 0, label: "Plan" },
  { id: 1, label: "Details" },
  { id: 2, label: "Address" },
  { id: 3, label: "Voucher" },
  { id: 4, label: "Payment" },
  { id: 5, label: "Done" },
] as const;

export interface CheckoutState {
  planId: string | null;
  addressId: string | null;
  voucherCode: string;
  voucherApplied: boolean;
  voucherDiscount: number;
  voucherMessage: string | null;
  voucherError: string | null;
  paymentMethod: "upi" | "card" | "netbanking";
  durationKind: DurationKind;
  mealTypes: MealType[];
  startDate: string;
  firstName: string;
  lastName: string;
  mobile: string;
  foodPreference: FoodPreference | "";
  allergies: string;
  healthGoal: HealthGoal | "";
  result: CreatePaymentResult | null;
}

export interface CheckoutSummaryModel {
  plan: Plan | null;
  address: Address | null;
  pricing: CheckoutPricingResult | null;
  voucherCode?: string;
  durationKind?: DurationKind;
  startDate?: string;
}

export type { Subscription };
