import type {
  AddressType,
  CityStatus,
  DeliveryPersonStatus,
  DiscountType,
  DurationKind,
  DurationUnit,
  FoodPreference,
  HealthGoal,
  MealType,
  PaymentStatus,
  PlanStatus,
  SubscriptionStatus,
  UserRole,
  VehicleType,
  VoucherStatus,
} from "@/types/enums";

export interface User {
  id: string;
  email: string;
  /** Plaintext for mock/dev only — never store plaintext passwords in production. */
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  mobile?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPreferences {
  foodPreference?: FoodPreference;
  dietaryRestrictions?: string[];
  allergies?: string[];
  allergyNotes?: string;
  healthGoal?: HealthGoal;
  spiceLevel?: "mild" | "medium" | "hot";
  preferredDeliveryTime?: string;
  notes?: string;
}

export interface Customer extends User {
  role: Extract<UserRole, "CUSTOMER">;
  dateOfBirth?: string;
  preferences?: CustomerPreferences;
}

export interface NutritionInfo {
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  /** Free-form nutrition facts for flexible admin configuration */
  additional?: Record<string, string | number>;
}

export interface PlanMeal {
  id: string;
  planId: string;
  mealType: MealType;
  name: string;
  description?: string;
  calories?: number;
  servingSize?: string;
  ingredients?: string[];
  nutrition?: NutritionInfo;
  imageUrl?: string;
  displayOrder: number;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  image: string;
  gallery?: string[];
  price: number;
  compareAtPrice?: number;
  currency: string;
  duration: number;
  durationUnit: DurationUnit;
  mealCount: number;
  /** Primary / summary meal type(s) for listing cards */
  mealTypes: MealType[];
  mealsPerDay: number;
  /** For multi-person plans (e.g. Family Duo = 2) */
  servingsPerMeal?: number;
  calories?: string;
  servingSize?: string;
  features: string[];
  ingredients: string[];
  nutrition?: NutritionInfo;
  meals: PlanMeal[];
  deliveryInformation?: string;
  terms?: string;
  status: PlanStatus;
  isFeatured: boolean;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  customerId: string;
  fullName: string;
  mobile: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  /** Linked operating city when address is in a serviceable area */
  cityId?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  addressType: AddressType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  status: CityStatus;
  centerLat: number;
  centerLng: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceAreaPolygon {
  /** Closed ring of [lat, lng] points (at least 3). */
  ring: [number, number][];
}

export interface ServicePincode {
  id: string;
  cityId: string;
  pincode: string;
  areaName?: string;
  isActive: boolean;
  serviceArea?: ServiceAreaPolygon;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPerson {
  id: string;
  firstName: string;
  lastName: string;
  /** Convenience display name from first + last. */
  fullName: string;
  mobile: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  status: DeliveryPersonStatus;
  /** Mapped from API `servicePincodes` (ids or codes). */
  pincodeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  addressId: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  durationKind: DurationKind;
  mealTypes: MealType[];
  price: number;
  planDiscount: number;
  voucherDiscount: number;
  tax: number;
  deliveryFee: number;
  finalAmount: number;
  voucherId?: string;
  paymentId?: string;
  pausedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Voucher {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minimumOrderValue?: number;
  startDate: string;
  expiryDate: string;
  usageLimit?: number;
  usagePerCustomer?: number;
  usedCount: number;
  /** Empty / undefined means applicable to all plans */
  applicablePlans?: string[];
  status: VoucherStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  providerPaymentId?: string;
  method?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  type: "CHARGE" | "REFUND" | "AUTHORIZATION" | "CAPTURE";
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerReference?: string;
  rawResponse?: Record<string, unknown>;
  createdAt: string;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED";

export interface Order {
  id: string;
  customerId: string;
  subscriptionId: string;
  planId: string;
  addressId: string;
  paymentId?: string;
  status: OrderStatus;
  scheduledDate?: string;
  mealTypes?: MealType[];
  amount: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  "SUBSCRIPTION" | "PAYMENT" | "DELIVERY" | "PROMOTION" | "SYSTEM" | "ACCOUNT";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DailyMenuItem {
  name: string;
  description?: string;
}

/** Veg and non-veg lines for one meal slot on a given day. */
export interface DailyMenuSlot {
  veg?: DailyMenuItem;
  nonVeg?: DailyMenuItem;
}

export interface DailyMenu {
  id: string;
  date: string;
  published: boolean;
  breakfast?: DailyMenuSlot;
  lunch?: DailyMenuSlot;
  dinner?: DailyMenuSlot;
  createdAt: string;
  updatedAt: string;
}

export interface MealSkip {
  id: string;
  subscriptionId: string;
  customerId: string;
  date: string;
  mealType: MealType;
  createdAt: string;
}
