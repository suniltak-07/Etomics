export const PlanStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  DRAFT: "DRAFT",
  ARCHIVED: "ARCHIVED",
} as const;
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];

export const MealType = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
  SNACK: "SNACK",
} as const;
export type MealType = (typeof MealType)[keyof typeof MealType];

export const AddressType = {
  HOME: "HOME",
  WORK: "WORK",
  OTHER: "OTHER",
} as const;
export type AddressType = (typeof AddressType)[keyof typeof AddressType];

export const SubscriptionStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  COMPLETED: "COMPLETED",
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const VoucherStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  EXPIRED: "EXPIRED",
  DRAFT: "DRAFT",
} as const;
export type VoucherStatus = (typeof VoucherStatus)[keyof typeof VoucherStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const DurationUnit = {
  DAYS: "DAYS",
  WEEKS: "WEEKS",
  MONTHS: "MONTHS",
} as const;
export type DurationUnit = (typeof DurationUnit)[keyof typeof DurationUnit];

export const DurationKind = {
  FULL: "FULL",
  TRIAL: "TRIAL",
} as const;
export type DurationKind = (typeof DurationKind)[keyof typeof DurationKind];

export const FoodPreference = {
  VEG: "VEG",
  NON_VEG: "NON_VEG",
  EGGETARIAN: "EGGETARIAN",
  VEGAN: "VEGAN",
} as const;
export type FoodPreference =
  (typeof FoodPreference)[keyof typeof FoodPreference];

export const HealthGoal = {
  WEIGHT_LOSS: "WEIGHT_LOSS",
  WEIGHT_GAIN: "WEIGHT_GAIN",
  FITNESS: "FITNESS",
  DIABETES_FRIENDLY: "DIABETES_FRIENDLY",
  HEALTHY_LIFESTYLE: "HEALTHY_LIFESTYLE",
} as const;
export type HealthGoal = (typeof HealthGoal)[keyof typeof HealthGoal];

export const CityStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type CityStatus = (typeof CityStatus)[keyof typeof CityStatus];

export const DeliveryPersonStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type DeliveryPersonStatus =
  (typeof DeliveryPersonStatus)[keyof typeof DeliveryPersonStatus];

export const VehicleType = {
  BIKE: "BIKE",
  SCOOTER: "SCOOTER",
  VAN: "VAN",
  OTHER: "OTHER",
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];
