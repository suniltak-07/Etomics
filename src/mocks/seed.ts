import type {
  Address,
  City,
  Customer,
  DailyMenu,
  DeliveryPerson,
  MealSkip,
  Notification,
  Order,
  Payment,
  PaymentTransaction,
  Plan,
  PlanMeal,
  ServicePincode,
  Subscription,
  User,
  Voucher,
} from "@/types/entities";
import {
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

/**
 * NOTE: Passwords are stored as plaintext for mock/dev only.
 * Never persist plaintext passwords in production — use a proper hash (e.g. argon2/bcrypt).
 */

const NOW = "2026-08-10T10:00:00.000Z";

function meal(
  partial: Omit<PlanMeal, "displayOrder"> & { displayOrder?: number },
): PlanMeal {
  return {
    displayOrder: 0,
    ...partial,
  };
}

function sampleMeals(planId: string, types: MealType[]): PlanMeal[] {
  const names: Record<MealType, string> = {
    [MealType.BREAKFAST]: "Wellness breakfast",
    [MealType.LUNCH]: "Balanced lunch",
    [MealType.DINNER]: "Light dinner",
    [MealType.SNACK]: "Nourish snack",
  };
  return types.map((mealType, index) =>
    meal({
      id: `meal_${planId}_${mealType.toLowerCase()}`,
      planId,
      mealType,
      name: names[mealType],
      description:
        "Chef-prepared wellness plate — low oil, clean spices, whole foods.",
      calories: 380 + index * 40,
      displayOrder: index + 1,
    }),
  );
}

function catalogPlan(
  input: Omit<
    Plan,
    | "currency"
    | "durationUnit"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "meals"
    | "gallery"
  > & {
    meals?: PlanMeal[];
    gallery?: string[];
  },
): Plan {
  return {
    currency: "INR",
    durationUnit: DurationUnit.DAYS,
    status: PlanStatus.ACTIVE,
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: NOW,
    terms:
      "26 delivery days excluding Sundays. Pause with 24 hours’ notice. EatOmics serves wellness food only.",
    ...input,
    meals: input.meals ?? sampleMeals(input.id, input.mealTypes),
    gallery: input.gallery ?? [input.image],
  };
}

function buildPlans(): Plan[] {
  return [
    catalogPlan({
      id: "plan_starter",
      name: "Starter",
      slug: "starter",
      shortDescription: "Breakfast-focused wellness for busy mornings.",
      description:
        "Starter is a 26-day breakfast subscription engineered for steady energy — portion-controlled, never oily or junk-style.",
      image:
        "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=1200&q=80",
      price: 2999,
      compareAtPrice: 3499,
      duration: 26,
      mealCount: 26,
      mealTypes: [MealType.BREAKFAST],
      mealsPerDay: 1,
      servingsPerMeal: 1,
      calories: "350–450 kcal/meal",
      servingSize: "1 breakfast",
      features: [
        "26 breakfasts",
        "Portion controlled",
        "7-day trial available",
      ],
      ingredients: ["oats", "fruit", "dairy / plant protein"],
      deliveryInformation: "Morning window 6:00–8:00 AM. Sundays off.",
      isFeatured: true,
      displayOrder: 1,
      seoTitle: "Starter Plan | EatOmics",
      seoDescription: "26-day breakfast wellness subscription from EatOmics.",
    }),
    catalogPlan({
      id: "plan_workday",
      name: "Workday",
      slug: "workday",
      shortDescription: "Office-friendly lunches, Monday to Saturday.",
      description:
        "Workday covers weekday lunches with clean, satiating plates designed for desk energy — not canteen oil.",
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80",
      price: 4499,
      compareAtPrice: 5299,
      duration: 26,
      mealCount: 26,
      mealTypes: [MealType.LUNCH],
      mealsPerDay: 1,
      servingsPerMeal: 1,
      calories: "450–550 kcal/meal",
      servingSize: "1 lunch",
      features: ["Lunch only", "Desk-friendly packing", "Macro tracked"],
      ingredients: ["grains", "lean protein", "salad"],
      deliveryInformation: "Lunch window 12:00–1:30 PM.",
      isFeatured: true,
      displayOrder: 2,
      seoTitle: "Workday Plan | EatOmics",
      seoDescription: "26-day lunch subscription for working professionals.",
    }),
    catalogPlan({
      id: "plan_lite",
      name: "Lite",
      slug: "lite",
      shortDescription: "Light dinners for evening recovery.",
      description:
        "Lite is dinner-only wellness — lean proteins, vegetables, and gentle seasoning. Not a tiffin-shop thali.",
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80",
      price: 5499,
      compareAtPrice: 6499,
      duration: 26,
      mealCount: 26,
      mealTypes: [MealType.DINNER],
      mealsPerDay: 1,
      servingsPerMeal: 1,
      calories: "400–500 kcal/meal",
      servingSize: "1 dinner",
      features: ["Dinner only", "Low oil cooking", "Chef-crafted"],
      ingredients: ["lean protein", "vegetables", "herbs"],
      deliveryInformation: "Evening window 6:00–8:00 PM.",
      isFeatured: true,
      displayOrder: 3,
      seoTitle: "Lite Plan | EatOmics",
      seoDescription: "26 light dinners delivered by EatOmics.",
    }),
    catalogPlan({
      id: "plan_balanced",
      name: "Balanced",
      slug: "balanced",
      shortDescription: "Lunch and dinner, evenly engineered.",
      description:
        "Balanced pairs lunch and dinner across 26 delivery days so you stay consistent without cooking twice.",
      image:
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
      price: 7999,
      compareAtPrice: 8999,
      duration: 26,
      mealCount: 52,
      mealTypes: [MealType.LUNCH, MealType.DINNER],
      mealsPerDay: 2,
      servingsPerMeal: 1,
      calories: "900–1,050 kcal/day",
      servingSize: "Lunch + dinner",
      features: ["Lunch + dinner", "26 delivery days", "Sundays off"],
      ingredients: ["whole grains", "proteins", "seasonal vegetables"],
      isFeatured: true,
      displayOrder: 4,
      seoTitle: "Balanced Plan | EatOmics",
      seoDescription: "Lunch and dinner wellness subscription.",
    }),
    catalogPlan({
      id: "plan_complete",
      name: "Complete",
      slug: "complete",
      shortDescription: "Breakfast, lunch, and dinner — full-day wellness.",
      description:
        "Complete covers three meals a day for 26 delivery days. One system, no junk, no heavy masala.",
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
      price: 11999,
      compareAtPrice: 13499,
      duration: 26,
      mealCount: 78,
      mealTypes: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
      mealsPerDay: 3,
      servingsPerMeal: 1,
      calories: "1,200–1,400 kcal/day",
      servingSize: "3 meals / day",
      features: ["All three meals", "Nutritionist designed", "Trial available"],
      ingredients: ["millets", "proteins", "greens"],
      isFeatured: true,
      displayOrder: 5,
      seoTitle: "Complete Plan | EatOmics",
      seoDescription: "Full-day meal subscription from EatOmics.",
    }),
    catalogPlan({
      id: "plan_lean",
      name: "Lean",
      slug: "lean",
      shortDescription: "Calorie-aware plates for a lighter routine.",
      description:
        "Lean keeps portions tight and oils minimal — built for people who want wellness, not crash diets.",
      image:
        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&q=80",
      price: 8999,
      compareAtPrice: 9999,
      duration: 26,
      mealCount: 52,
      mealTypes: [MealType.LUNCH, MealType.DINNER],
      mealsPerDay: 2,
      servingsPerMeal: 1,
      calories: "750–900 kcal/day",
      servingSize: "Lunch + dinner",
      features: ["Calorie aware", "High fibre", "Low oil"],
      ingredients: ["leafy greens", "lean protein", "millets"],
      isFeatured: false,
      displayOrder: 6,
      seoTitle: "Lean Plan | EatOmics",
      seoDescription: "Calorie-aware lunch and dinner subscription.",
    }),
    catalogPlan({
      id: "plan_protein",
      name: "Protein Plus",
      slug: "protein-plus",
      shortDescription: "Higher-protein lunches and dinners.",
      description:
        "Protein Plus emphasises lean protein at lunch and dinner for training days — still wellness cooking, not gym-bro junk.",
      image:
        "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=80",
      price: 9999,
      compareAtPrice: 11499,
      duration: 26,
      mealCount: 52,
      mealTypes: [MealType.LUNCH, MealType.DINNER],
      mealsPerDay: 2,
      servingsPerMeal: 1,
      calories: "1,000–1,150 kcal/day",
      servingSize: "Lunch + dinner",
      features: ["Higher protein", "Training friendly", "Clean cooking"],
      ingredients: ["eggs / paneer / chicken", "quinoa", "vegetables"],
      isFeatured: false,
      displayOrder: 7,
      seoTitle: "Protein Plus | EatOmics",
      seoDescription: "Higher-protein meal subscription from EatOmics.",
    }),
    catalogPlan({
      id: "plan_diabetic",
      name: "Diabetic-Friendly",
      slug: "diabetic-friendly",
      shortDescription: "Low-GI breakfast, lunch, and dinner.",
      description:
        "Diabetic-Friendly uses low-GI ingredients and controlled carbs. Supportive of wellness — not a medical treatment.",
      image:
        "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=1200&q=80",
      price: 12999,
      compareAtPrice: 14999,
      duration: 26,
      mealCount: 78,
      mealTypes: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
      mealsPerDay: 3,
      servingsPerMeal: 1,
      calories: "1,100–1,200 kcal/day",
      servingSize: "3 meals / day",
      features: ["Low-GI", "Three meals", "Nutritionist designed"],
      ingredients: ["millets", "non-starchy vegetables", "lean proteins"],
      isFeatured: true,
      displayOrder: 8,
      seoTitle: "Diabetic-Friendly Plan | EatOmics",
      seoDescription: "Low-GI three-meal subscription from EatOmics.",
      terms:
        "Consult your physician before starting any therapeutic meal program. EatOmics meals support wellness and are not medical treatment.",
    }),
    catalogPlan({
      id: "plan_plant",
      name: "Pure Plant",
      slug: "pure-plant",
      shortDescription: "Fully plant-based wellness plates.",
      description:
        "Pure Plant is vegan by default — legumes, millets, and vegetables, cooked for wellness rather than restaurant-style richness.",
      image:
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80",
      price: 8499,
      compareAtPrice: 9499,
      duration: 26,
      mealCount: 52,
      mealTypes: [MealType.LUNCH, MealType.DINNER],
      mealsPerDay: 2,
      servingsPerMeal: 1,
      calories: "850–1,000 kcal/day",
      servingSize: "Lunch + dinner",
      features: ["Vegan", "Whole foods", "No dairy"],
      ingredients: ["lentils", "millets", "seasonal vegetables"],
      isFeatured: false,
      displayOrder: 9,
      seoTitle: "Pure Plant | EatOmics",
      seoDescription: "Plant-based lunch and dinner subscription.",
    }),
    catalogPlan({
      id: "plan_family",
      name: "Family Duo",
      slug: "family-duo",
      shortDescription: "Lunch and dinner sized for two.",
      description:
        "Family Duo serves two people with shared lunch and dinner portions — wellness for the table, not takeaway spice.",
      image:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
      price: 15999,
      compareAtPrice: 17999,
      duration: 26,
      mealCount: 52,
      mealTypes: [MealType.LUNCH, MealType.DINNER],
      mealsPerDay: 2,
      servingsPerMeal: 2,
      calories: "500–550 kcal/serving",
      servingSize: "2 people × lunch & dinner",
      features: ["Serves 2", "Lunch + dinner", "26 delivery days"],
      ingredients: ["proteins", "grains", "vegetables"],
      isFeatured: false,
      displayOrder: 10,
      seoTitle: "Family Duo | EatOmics",
      seoDescription: "Wellness meals for two from EatOmics.",
    }),
  ];
}

function buildUsers(): User[] {
  return [
    {
      id: "user_admin",
      email: "admin@etomics.com",
      password: "Admin123!",
      role: UserRole.ADMIN,
      firstName: "Aisha",
      lastName: "Mehta",
      mobile: "+919876543210",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
      isActive: true,
      createdAt: "2025-12-01T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "user_customer_1",
      email: "customer@etomics.com",
      password: "Customer123!",
      role: UserRole.CUSTOMER,
      firstName: "Rohan",
      lastName: "Sharma",
      mobile: "+919811122233",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      isActive: true,
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "user_customer_2",
      email: "priya.nair@example.com",
      password: "Customer123!",
      role: UserRole.CUSTOMER,
      firstName: "Priya",
      lastName: "Nair",
      mobile: "+919822233344",
      isActive: true,
      createdAt: "2026-03-12T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "user_customer_3",
      email: "arjun.patel@example.com",
      password: "Customer123!",
      role: UserRole.CUSTOMER,
      firstName: "Arjun",
      lastName: "Patel",
      mobile: "+919833344455",
      isActive: true,
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "user_customer_4",
      email: "neha.gupta@example.com",
      password: "Customer123!",
      role: UserRole.CUSTOMER,
      firstName: "Neha",
      lastName: "Gupta",
      mobile: "+919844455566",
      isActive: true,
      createdAt: "2026-04-18T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "user_customer_5",
      email: "vikram.singh@example.com",
      password: "Customer123!",
      role: UserRole.CUSTOMER,
      firstName: "Vikram",
      lastName: "Singh",
      mobile: "+919855566677",
      isActive: false,
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: NOW,
    },
  ];
}

function buildCustomers(users: User[]): Customer[] {
  return users
    .filter((u) => u.role === UserRole.CUSTOMER)
    .map((u, index) => ({
      ...u,
      role: UserRole.CUSTOMER,
      dateOfBirth: `199${index}-06-15`,
      preferences: {
        foodPreference:
          index % 3 === 0
            ? FoodPreference.VEG
            : index % 3 === 1
              ? FoodPreference.NON_VEG
              : FoodPreference.EGGETARIAN,
        dietaryRestrictions: index % 2 === 0 ? ["vegetarian"] : [],
        allergies: index === 2 ? ["peanuts"] : [],
        healthGoal:
          index === 0
            ? HealthGoal.HEALTHY_LIFESTYLE
            : index === 2
              ? HealthGoal.DIABETES_FRIENDLY
              : HealthGoal.FITNESS,
        spiceLevel: "mild",
        preferredDeliveryTime: "07:00-09:00",
      },
    }));
}

function buildCities(): City[] {
  return [
    {
      id: "city_blr",
      name: "Bengaluru",
      slug: "bengaluru",
      state: "Karnataka",
      status: CityStatus.ACTIVE,
      centerLat: 12.9716,
      centerLng: 77.5946,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "city_mum",
      name: "Mumbai",
      slug: "mumbai",
      state: "Maharashtra",
      status: CityStatus.ACTIVE,
      centerLat: 19.076,
      centerLng: 72.8777,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "city_pun",
      name: "Pune",
      slug: "pune",
      state: "Maharashtra",
      status: CityStatus.ACTIVE,
      centerLat: 18.5204,
      centerLng: 73.8567,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: NOW,
    },
  ];
}

function buildServicePincodes(): ServicePincode[] {
  return [
    {
      id: "pin_blr_560001",
      cityId: "city_blr",
      pincode: "560001",
      areaName: "MG Road",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "pin_blr_560034",
      cityId: "city_blr",
      pincode: "560034",
      areaName: "Koramangala",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "pin_blr_560038",
      cityId: "city_blr",
      pincode: "560038",
      areaName: "Indiranagar",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "pin_blr_560045",
      cityId: "city_blr",
      pincode: "560045",
      areaName: "Hebbal",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "pin_blr_560102",
      cityId: "city_blr",
      pincode: "560102",
      areaName: "HSR Layout",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "pin_mum_400050",
      cityId: "city_mum",
      pincode: "400050",
      areaName: "Bandra West",
      isActive: true,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "pin_mum_400001",
      cityId: "city_mum",
      pincode: "400001",
      areaName: "Fort",
      isActive: true,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "pin_pun_411057",
      cityId: "city_pun",
      pincode: "411057",
      areaName: "Hinjewadi",
      isActive: true,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: NOW,
    },
  ];
}

function buildDeliveryPersons(): DeliveryPerson[] {
  return [
    {
      id: "dp_1",
      fullName: "Suresh Kumar",
      mobile: "+919900011122",
      email: "suresh.kumar@etomics.com",
      vehicleType: VehicleType.BIKE,
      vehicleNumber: "KA-01-AB-1234",
      status: DeliveryPersonStatus.ACTIVE,
      pincodeIds: ["pin_blr_560038", "pin_blr_560034", "pin_blr_560102"],
      lastLat: 12.9716,
      lastLng: 77.5946,
      notes: "Covers east Bengaluru",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "dp_2",
      fullName: "Anita Desai",
      mobile: "+919900022233",
      email: "anita.desai@etomics.com",
      vehicleType: VehicleType.SCOOTER,
      vehicleNumber: "KA-05-CD-5678",
      status: DeliveryPersonStatus.ACTIVE,
      pincodeIds: ["pin_blr_560001", "pin_blr_560045"],
      lastLat: 13.02,
      lastLng: 77.59,
      notes: "Central & north Bengaluru",
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "dp_3",
      fullName: "Rahul Mehta",
      mobile: "+919900033344",
      vehicleType: VehicleType.BIKE,
      vehicleNumber: "MH-02-EF-9012",
      status: DeliveryPersonStatus.ACTIVE,
      pincodeIds: ["pin_mum_400050", "pin_mum_400001"],
      lastLat: 19.076,
      lastLng: 72.8777,
      createdAt: "2026-06-10T00:00:00.000Z",
      updatedAt: NOW,
    },
  ];
}

function buildAddresses(): Address[] {
  return [
    {
      id: "addr_1",
      customerId: "user_customer_1",
      fullName: "Rohan Sharma",
      mobile: "+919811122233",
      addressLine1: "12, Palm Grove Apartments",
      addressLine2: "Flat 4B",
      landmark: "Near City Park",
      area: "Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      cityId: "city_blr",
      latitude: 12.9784,
      longitude: 77.6408,
      googleMapsUrl: "https://maps.google.com/?q=12.9784,77.6408",
      addressType: AddressType.HOME,
      isDefault: true,
      createdAt: "2026-03-02T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "addr_2",
      customerId: "user_customer_1",
      fullName: "Rohan Sharma",
      mobile: "+919811122233",
      addressLine1: "EatOmics Hub, 5th Floor",
      addressLine2: "Manyata Tech Park",
      area: "Hebbal",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560045",
      cityId: "city_blr",
      latitude: 13.0497,
      longitude: 77.5922,
      addressType: AddressType.WORK,
      isDefault: false,
      createdAt: "2026-03-05T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "addr_3",
      customerId: "user_customer_2",
      fullName: "Priya Nair",
      mobile: "+919822233344",
      addressLine1: "88 Lakeview Residency",
      area: "Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560034",
      cityId: "city_blr",
      latitude: 12.9352,
      longitude: 77.6245,
      addressType: AddressType.HOME,
      isDefault: true,
      createdAt: "2026-03-13T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "addr_4",
      customerId: "user_customer_3",
      fullName: "Arjun Patel",
      mobile: "+919833344455",
      addressLine1: "221B Baker Street Extension",
      area: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      cityId: "city_mum",
      latitude: 19.0596,
      longitude: 72.8295,
      addressType: AddressType.HOME,
      isDefault: true,
      createdAt: "2026-04-03T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "addr_5",
      customerId: "user_customer_4",
      fullName: "Neha Gupta",
      mobile: "+919844455566",
      addressLine1: "7 Green Heights",
      landmark: "Opposite Metro Gate 2",
      area: "Hinjewadi",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411057",
      cityId: "city_pun",
      latitude: 18.5912,
      longitude: 73.7389,
      addressType: AddressType.OTHER,
      isDefault: true,
      createdAt: "2026-04-19T08:00:00.000Z",
      updatedAt: NOW,
    },
  ];
}

function buildVouchers(): Voucher[] {
  return [
    {
      id: "voucher_welcome10",
      code: "WELCOME10",
      name: "Welcome 10%",
      description: "10% off your first subscription. Max discount ₹1,000.",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      maxDiscount: 1000,
      minimumOrderValue: 2000,
      startDate: "2026-01-01T00:00:00.000Z",
      expiryDate: "2026-12-31T23:59:59.000Z",
      usageLimit: 1000,
      usagePerCustomer: 1,
      usedCount: 42,
      applicablePlans: [],
      status: VoucherStatus.ACTIVE,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "voucher_flat500",
      code: "FLAT500",
      name: "Flat ₹500 Off",
      description: "Fixed ₹500 discount on plans above ₹4,000.",
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 500,
      minimumOrderValue: 4000,
      startDate: "2026-01-01T00:00:00.000Z",
      expiryDate: "2026-12-31T23:59:59.000Z",
      usageLimit: 500,
      usagePerCustomer: 2,
      usedCount: 18,
      applicablePlans: [
        "plan_starter",
        "plan_lite",
        "plan_diabetic",
        "plan_family",
        "plan_workday",
        "plan_balanced",
      ],
      status: VoucherStatus.ACTIVE,
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "voucher_expired20",
      code: "EXPIRED20",
      name: "Expired 20%",
      description: "Legacy campaign voucher — expired.",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      maxDiscount: 2000,
      minimumOrderValue: 1000,
      startDate: "2025-01-01T00:00:00.000Z",
      expiryDate: "2025-12-31T23:59:59.000Z",
      usageLimit: 100,
      usagePerCustomer: 1,
      usedCount: 100,
      applicablePlans: [],
      status: VoucherStatus.EXPIRED,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

function buildPayments(): Payment[] {
  return [
    {
      id: "pay_1",
      customerId: "user_customer_1",
      subscriptionId: "sub_1",
      amount: 4499.1,
      currency: "INR",
      status: PaymentStatus.SUCCESS,
      provider: "mock",
      providerPaymentId: "mock_pay_1",
      method: "upi",
      createdAt: "2026-06-01T09:00:00.000Z",
      updatedAt: "2026-06-01T09:01:00.000Z",
    },
    {
      id: "pay_2",
      customerId: "user_customer_2",
      subscriptionId: "sub_2",
      amount: 5499,
      currency: "INR",
      status: PaymentStatus.SUCCESS,
      provider: "mock",
      providerPaymentId: "mock_pay_2",
      method: "card",
      createdAt: "2026-06-15T11:00:00.000Z",
      updatedAt: "2026-06-15T11:02:00.000Z",
    },
    {
      id: "pay_3",
      customerId: "user_customer_3",
      subscriptionId: "sub_3",
      amount: 12999,
      currency: "INR",
      status: PaymentStatus.PROCESSING,
      provider: "mock",
      providerPaymentId: "mock_pay_3",
      method: "netbanking",
      createdAt: "2026-08-08T14:00:00.000Z",
      updatedAt: "2026-08-08T14:00:00.000Z",
    },
    {
      id: "pay_4",
      customerId: "user_customer_4",
      amount: 4999,
      currency: "INR",
      status: PaymentStatus.FAILED,
      provider: "mock",
      providerPaymentId: "mock_pay_4",
      method: "card",
      failureReason: "Insufficient funds",
      createdAt: "2026-07-20T16:00:00.000Z",
      updatedAt: "2026-07-20T16:01:00.000Z",
    },
  ];
}

function buildPaymentTransactions(): PaymentTransaction[] {
  return [
    {
      id: "txn_1",
      paymentId: "pay_1",
      type: "CAPTURE",
      amount: 4499.1,
      currency: "INR",
      status: PaymentStatus.SUCCESS,
      providerReference: "mock_pay_1",
      createdAt: "2026-06-01T09:01:00.000Z",
    },
    {
      id: "txn_2",
      paymentId: "pay_2",
      type: "CAPTURE",
      amount: 5499,
      currency: "INR",
      status: PaymentStatus.SUCCESS,
      providerReference: "mock_pay_2",
      createdAt: "2026-06-15T11:02:00.000Z",
    },
    {
      id: "txn_3",
      paymentId: "pay_3",
      type: "AUTHORIZATION",
      amount: 12999,
      currency: "INR",
      status: PaymentStatus.PROCESSING,
      providerReference: "mock_pay_3",
      createdAt: "2026-08-08T14:00:00.000Z",
    },
    {
      id: "txn_4",
      paymentId: "pay_4",
      type: "CAPTURE",
      amount: 4999,
      currency: "INR",
      status: PaymentStatus.FAILED,
      providerReference: "mock_pay_4",
      createdAt: "2026-07-20T16:01:00.000Z",
    },
  ];
}

function buildSubscriptions(): Subscription[] {
  return [
    {
      id: "sub_1",
      customerId: "user_customer_1",
      planId: "plan_starter",
      addressId: "addr_1",
      startDate: "2026-06-02",
      endDate: "2026-07-01",
      status: SubscriptionStatus.COMPLETED,
      durationKind: DurationKind.FULL,
      mealTypes: [MealType.BREAKFAST],
      price: 2999,
      planDiscount: 1000,
      voucherDiscount: 499.9,
      tax: 0,
      deliveryFee: 0,
      finalAmount: 4499.1,
      voucherId: "voucher_welcome10",
      paymentId: "pay_1",
      createdAt: "2026-06-01T09:01:00.000Z",
      updatedAt: "2026-07-01T23:00:00.000Z",
    },
    {
      id: "sub_2",
      customerId: "user_customer_2",
      planId: "plan_lite",
      addressId: "addr_3",
      startDate: "2026-06-16",
      endDate: "2026-09-15",
      status: SubscriptionStatus.ACTIVE,
      durationKind: DurationKind.FULL,
      mealTypes: [MealType.DINNER],
      price: 5499,
      planDiscount: 1000,
      voucherDiscount: 0,
      tax: 0,
      deliveryFee: 0,
      finalAmount: 5499,
      paymentId: "pay_2",
      createdAt: "2026-06-15T11:02:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "sub_3",
      customerId: "user_customer_3",
      planId: "plan_diabetic",
      addressId: "addr_4",
      startDate: "2026-08-10",
      endDate: "2026-09-08",
      status: SubscriptionStatus.PENDING,
      durationKind: DurationKind.FULL,
      mealTypes: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
      price: 12999,
      planDiscount: 2000,
      voucherDiscount: 0,
      tax: 0,
      deliveryFee: 0,
      finalAmount: 12999,
      paymentId: "pay_3",
      createdAt: "2026-08-08T14:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "sub_4",
      customerId: "user_customer_1",
      planId: "plan_family",
      addressId: "addr_1",
      startDate: "2026-07-10",
      endDate: "2026-08-08",
      status: SubscriptionStatus.PAUSED,
      durationKind: DurationKind.FULL,
      mealTypes: [MealType.LUNCH, MealType.DINNER],
      price: 15999,
      planDiscount: 2000,
      voucherDiscount: 500,
      tax: 0,
      deliveryFee: 0,
      finalAmount: 15499,
      voucherId: "voucher_flat500",
      pausedAt: "2026-07-25T10:00:00.000Z",
      createdAt: "2026-07-09T12:00:00.000Z",
      updatedAt: "2026-07-25T10:00:00.000Z",
    },
    {
      id: "sub_5",
      customerId: "user_customer_1",
      planId: "plan_complete",
      addressId: "addr_1",
      startDate: "2026-08-11",
      endDate: "2026-09-10",
      status: SubscriptionStatus.ACTIVE,
      durationKind: DurationKind.FULL,
      mealTypes: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
      price: 11999,
      planDiscount: 1500,
      voucherDiscount: 0,
      tax: 0,
      deliveryFee: 0,
      finalAmount: 11999,
      createdAt: "2026-08-10T09:00:00.000Z",
      updatedAt: NOW,
    },
  ];
}

function buildOrders(): Order[] {
  return [
    {
      id: "order_1",
      customerId: "user_customer_2",
      subscriptionId: "sub_2",
      planId: "plan_lite",
      addressId: "addr_3",
      paymentId: "pay_2",
      status: "CONFIRMED",
      scheduledDate: "2026-08-15",
      mealTypes: [MealType.DINNER],
      amount: 5499,
      currency: "INR",
      createdAt: "2026-08-09T08:00:00.000Z",
      updatedAt: NOW,
    },
    {
      id: "order_2",
      customerId: "user_customer_1",
      subscriptionId: "sub_4",
      planId: "plan_family",
      addressId: "addr_1",
      status: "CANCELLED",
      scheduledDate: "2026-07-26",
      mealTypes: [MealType.LUNCH, MealType.DINNER],
      amount: 15499,
      currency: "INR",
      notes: "Paused subscription — delivery skipped",
      createdAt: "2026-07-25T10:05:00.000Z",
      updatedAt: "2026-07-25T10:05:00.000Z",
    },
    {
      id: "order_3",
      customerId: "user_customer_1",
      subscriptionId: "sub_5",
      planId: "plan_complete",
      addressId: "addr_1",
      status: "CONFIRMED",
      scheduledDate: "2026-08-15",
      mealTypes: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
      amount: 11999,
      currency: "INR",
      createdAt: "2026-08-14T18:00:00.000Z",
      updatedAt: NOW,
    },
  ];
}

function buildNotifications(): Notification[] {
  return [
    {
      id: "notif_1",
      userId: "user_customer_1",
      type: "SUBSCRIPTION",
      title: "Subscription paused",
      message: "Your Family Duo Plan subscription has been paused.",
      isRead: false,
      link: "/customer/subscriptions/sub_4",
      createdAt: "2026-07-25T10:00:00.000Z",
    },
    {
      id: "notif_2",
      userId: "user_customer_2",
      type: "DELIVERY",
      title: "Dinner on the way",
      message: "Your Lite Plan dinner is scheduled for tonight 6–8 PM.",
      isRead: true,
      link: "/customer/orders/order_1",
      createdAt: "2026-08-09T08:00:00.000Z",
    },
    {
      id: "notif_3",
      userId: "user_customer_3",
      type: "PAYMENT",
      title: "Payment processing",
      message: "We are confirming your Diabetic Care Plan payment.",
      isRead: false,
      link: "/customer/payments/pay_3",
      createdAt: "2026-08-08T14:00:00.000Z",
    },
  ];
}

function buildDailyMenus(): DailyMenu[] {
  const days = [
    "2026-08-14",
    "2026-08-15",
    "2026-08-16",
    "2026-08-17",
    "2026-08-18",
    "2026-08-19",
    "2026-08-20",
  ];
  const vegBreakfast = ["Millet porridge", "Ragi dosa", "Vegetable upma"];
  const nonVegBreakfast = [
    "Egg-white millet scramble",
    "Chicken sausage millet toast",
    "Egg white omelette",
  ];
  const vegLunch = ["Quinoa bowl", "Millet khichdi", "Paneer millet plate"];
  const nonVegLunch = [
    "Grilled chicken bowl",
    "Fish millet khichdi",
    "Chicken protein plate",
  ];
  const vegDinner = [
    "Herb paneer plate",
    "Steamed vegetable supper",
    "Clear soup with tofu",
  ];
  const nonVegDinner = [
    "Herb grilled fish",
    "Steamed chicken supper",
    "Clear chicken soup",
  ];
  return days.map((date, index) => ({
    id: `menu_${date}`,
    date,
    published: true,
    breakfast: {
      veg: {
        name: vegBreakfast[index % 3],
        description: "Plant-based wellness breakfast.",
      },
      nonVeg: {
        name: nonVegBreakfast[index % 3],
        description: "Non-veg wellness breakfast.",
      },
    },
    lunch: {
      veg: {
        name: vegLunch[index % 3],
        description: "Low oil, high fibre veg lunch.",
      },
      nonVeg: {
        name: nonVegLunch[index % 3],
        description: "Low oil, high protein non-veg lunch.",
      },
    },
    dinner: {
      veg: {
        name: vegDinner[index % 3],
        description: "Light veg evening plate.",
      },
      nonVeg: {
        name: nonVegDinner[index % 3],
        description: "Light non-veg evening plate.",
      },
    },
    createdAt: NOW,
    updatedAt: NOW,
  }));
}

function buildMealSkips(): MealSkip[] {
  return [
    {
      id: "skip_1",
      subscriptionId: "sub_2",
      customerId: "user_customer_2",
      date: "2026-08-18",
      mealType: MealType.DINNER,
      createdAt: "2026-08-16T08:00:00.000Z",
    },
  ];
}

export interface MockDb {
  users: User[];
  customers: Customer[];
  plans: Plan[];
  cities: City[];
  servicePincodes: ServicePincode[];
  deliveryPersons: DeliveryPerson[];
  addresses: Address[];
  vouchers: Voucher[];
  subscriptions: Subscription[];
  payments: Payment[];
  paymentTransactions: PaymentTransaction[];
  orders: Order[];
  notifications: Notification[];
  dailyMenus: DailyMenu[];
  mealSkips: MealSkip[];
  /** Bearer token → userId for mock auth sessions */
  sessions: Record<string, string>;
}

function createSeedData(): MockDb {
  const users = buildUsers();
  return {
    users,
    customers: buildCustomers(users),
    plans: buildPlans(),
    cities: buildCities(),
    servicePincodes: buildServicePincodes(),
    deliveryPersons: buildDeliveryPersons(),
    addresses: buildAddresses(),
    vouchers: buildVouchers(),
    subscriptions: buildSubscriptions(),
    payments: buildPayments(),
    paymentTransactions: buildPaymentTransactions(),
    orders: buildOrders(),
    notifications: buildNotifications(),
    dailyMenus: buildDailyMenus(),
    mealSkips: buildMealSkips(),
    sessions: {},
  };
}

function cloneDb(db: MockDb): MockDb {
  return structuredClone(db);
}

/** Immutable snapshot of the original seed — used by resetDb() */
const SEED_SNAPSHOT: MockDb = createSeedData();

/** Module-level mutable in-memory store */
let store: MockDb = cloneDb(SEED_SNAPSHOT);

/** Returns a deep clone of the current in-memory database. */
export function getDb(): MockDb {
  return cloneDb(store);
}

/**
 * Apply a mutation against the live store.
 * The mutator receives the live store (not a clone) and may modify it in place.
 * Returns a deep clone of the store after mutation.
 */
export function mutate(mutator: (db: MockDb) => void): MockDb {
  mutator(store);
  return cloneDb(store);
}

export const mutateDb = mutate;

/** Reset the in-memory store back to the original seed snapshot. */
export function resetDb(): MockDb {
  store = cloneDb(SEED_SNAPSHOT);
  return cloneDb(store);
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return store.users.find((user) => user.email.toLowerCase() === normalized);
}

export function findUserById(id: string): User | undefined {
  return store.users.find((user) => user.id === id);
}

export function findSessionUserId(token: string): string | undefined {
  return store.sessions[token];
}

/** Durable mock token — survives server HMR because it embeds the user id. */
export function encodeAuthToken(userId: string): string {
  const payload = JSON.stringify({ uid: userId, v: 1 });
  const encoded =
    typeof Buffer !== "undefined"
      ? Buffer.from(payload, "utf8").toString("base64url")
      : btoa(payload);
  return `eo.${encoded}`;
}

export function decodeAuthTokenUserId(token: string): string | null {
  if (!token.startsWith("eo.")) return null;
  try {
    const raw = token.slice(3);
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(raw, "base64url").toString("utf8")
        : atob(raw);
    const parsed = JSON.parse(json) as { uid?: string };
    return typeof parsed.uid === "string" ? parsed.uid : null;
  } catch {
    return null;
  }
}

export function createSession(userId: string): string {
  const token = encodeAuthToken(userId);
  mutate((db) => {
    db.sessions[token] = userId;
  });
  return token;
}

export function destroySession(token: string): void {
  mutate((db) => {
    delete db.sessions[token];
  });
}

export const seedMeta = {
  adminEmail: "admin@etomics.com",
  adminPassword: "Admin123!",
  customerEmail: "customer@etomics.com",
  customerPassword: "Customer123!",
} as const;
