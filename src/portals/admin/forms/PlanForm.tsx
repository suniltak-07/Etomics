"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createPlanSchema,
  type CreatePlanInput,
} from "@/features/plans/schemas/planSchemas";
import { DurationUnit, MealType, PlanStatus } from "@/types/enums";
import type { Plan } from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs } from "@/components/ui/tabs";
import { slugify } from "@/lib/utils/format";
import {
  useCreatePlan,
  useUpdatePlan,
} from "@/features/plans/queries/usePlans";

const SECTIONS = [
  { id: "basic", label: "Basic" },
  { id: "pricing", label: "Pricing" },
  { id: "configuration", label: "Configuration" },
  { id: "benefits", label: "Benefits" },
  { id: "media", label: "Media" },
  { id: "delivery", label: "Delivery" },
  { id: "seo", label: "SEO" },
  { id: "settings", label: "Settings" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function planToFormValues(plan?: Plan): CreatePlanInput {
  if (!plan) {
    return {
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
      gallery: [],
      price: 999,
      compareAtPrice: undefined,
      currency: "INR",
      duration: 7,
      durationUnit: DurationUnit.DAYS,
      mealCount: 7,
      mealTypes: [MealType.LUNCH],
      mealsPerDay: 1,
      servingsPerMeal: 1,
      calories: "",
      servingSize: "",
      features: [],
      ingredients: [],
      meals: [],
      deliveryInformation: "",
      terms: "",
      status: PlanStatus.DRAFT,
      isFeatured: false,
      displayOrder: 0,
      seoTitle: "",
      seoDescription: "",
    };
  }

  return {
    name: plan.name,
    slug: plan.slug,
    shortDescription: plan.shortDescription,
    description: plan.description,
    image: plan.image,
    gallery: plan.gallery ?? [],
    price: plan.price,
    compareAtPrice: plan.compareAtPrice,
    currency: plan.currency,
    duration: plan.duration,
    durationUnit: plan.durationUnit,
    mealCount: plan.mealCount,
    mealTypes: plan.mealTypes,
    mealsPerDay: plan.mealsPerDay,
    servingsPerMeal: plan.servingsPerMeal ?? 1,
    calories: plan.calories ?? "",
    servingSize: plan.servingSize ?? "",
    features: plan.features,
    ingredients: plan.ingredients,
    nutrition: plan.nutrition,
    meals: plan.meals.map((meal) => ({
      id: meal.id,
      mealType: meal.mealType,
      name: meal.name,
      description: meal.description,
      calories: meal.calories,
      servingSize: meal.servingSize,
      ingredients: meal.ingredients,
      nutrition: meal.nutrition,
      imageUrl: meal.imageUrl ?? "",
      displayOrder: meal.displayOrder,
    })),
    deliveryInformation: plan.deliveryInformation ?? "",
    terms: plan.terms ?? "",
    status: plan.status,
    isFeatured: plan.isFeatured,
    displayOrder: plan.displayOrder,
    seoTitle: plan.seoTitle ?? "",
    seoDescription: plan.seoDescription ?? "",
  };
}

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function PlanForm({
  planId,
  initialPlan,
}: {
  planId?: string;
  initialPlan?: Plan;
}) {
  const router = useRouter();
  const [section, setSection] = useState<SectionId>("basic");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan(planId ?? "");

  const defaults = useMemo(() => planToFormValues(initialPlan), [initialPlan]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlanInput>({
    resolver: zodResolver(createPlanSchema) as Resolver<CreatePlanInput>,
    defaultValues: defaults,
  });

  useEffect(() => {
    if (initialPlan) {
      // reset when edit data arrives
      Object.entries(planToFormValues(initialPlan)).forEach(([key, value]) => {
        setValue(key as keyof CreatePlanInput, value as never);
      });
    }
  }, [initialPlan, setValue]);

  const name = watch("name");
  const mealTypes = watch("mealTypes") ?? [];

  useEffect(() => {
    if (!planId && name) {
      setValue("slug", slugify(name));
    }
  }, [name, planId, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (planId) {
        await updateMutation.mutateAsync(values);
        router.push(`/admin/plans/${planId}`);
      } else {
        const res = await createMutation.mutateAsync(values);
        router.push(`/admin/plans/${res.data.id}`);
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save plan",
      );
    }
  });

  const toggleMealType = (type: MealType) => {
    const next = mealTypes.includes(type)
      ? mealTypes.filter((item) => item !== type)
      : [...mealTypes, type];
    setValue("mealTypes", next, { shouldValidate: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Tabs
        items={SECTIONS.map((item) => ({ id: item.id, label: item.label }))}
        value={section}
        onValueChange={(value) => setSection(value as SectionId)}
      >
        {section === "basic" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name ? (
                <p className="text-brand-danger text-xs">
                  {errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="shortDescription">Short description</Label>
              <Input id="shortDescription" {...register("shortDescription")} />
              {errors.shortDescription ? (
                <p className="text-brand-danger text-xs">
                  {errors.shortDescription.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                {...register("description")}
              />
              {errors.description ? (
                <p className="text-brand-danger text-xs">
                  {errors.description.message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {section === "pricing" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price ? (
                <p className="text-brand-danger text-xs">
                  {errors.price.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compareAtPrice">Compare at</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                {...register("compareAtPrice", {
                  setValueAs: (v) =>
                    v === "" || v === null || Number.isNaN(Number(v))
                      ? undefined
                      : Number(v),
                })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...register("currency")} />
            </div>
          </div>
        ) : null}

        {section === "configuration" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="number"
                {...register("duration", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationUnit">Duration unit</Label>
              <Select id="durationUnit" {...register("durationUnit")}>
                {Object.values(DurationUnit).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mealCount">Meal count</Label>
              <Input
                id="mealCount"
                type="number"
                {...register("mealCount", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mealsPerDay">Meals per day</Label>
              <Input
                id="mealsPerDay"
                type="number"
                {...register("mealsPerDay", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="servingsPerMeal">Servings per meal</Label>
              <Input
                id="servingsPerMeal"
                type="number"
                {...register("servingsPerMeal", {
                  setValueAs: (v) =>
                    v === "" || v === null || Number.isNaN(Number(v))
                      ? undefined
                      : Number(v),
                })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calories">Calories label</Label>
              <Input id="calories" {...register("calories")} />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label>Meal types</Label>
              <div className="mt-1 flex flex-wrap gap-3">
                {Object.values(MealType).map((type) => (
                  <label
                    key={type}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={mealTypes.includes(type)}
                      onChange={() => toggleMealType(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
              {errors.mealTypes ? (
                <p className="text-brand-danger text-xs">
                  {errors.mealTypes.message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {section === "benefits" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="features">Features (one per line)</Label>
              <Controller
                control={control}
                name="features"
                render={({ field }) => (
                  <Textarea
                    id="features"
                    rows={6}
                    value={(field.value ?? []).join("\n")}
                    onChange={(event) =>
                      field.onChange(linesToArray(event.target.value))
                    }
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ingredients">Ingredients (one per line)</Label>
              <Controller
                control={control}
                name="ingredients"
                render={({ field }) => (
                  <Textarea
                    id="ingredients"
                    rows={6}
                    value={(field.value ?? []).join("\n")}
                    onChange={(event) =>
                      field.onChange(linesToArray(event.target.value))
                    }
                  />
                )}
              />
            </div>
          </div>
        ) : null}

        {section === "media" ? (
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="image">Primary image URL</Label>
              <Input id="image" {...register("image")} />
              {errors.image ? (
                <p className="text-brand-danger text-xs">
                  {errors.image.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gallery">Gallery URLs (one per line)</Label>
              <Controller
                control={control}
                name="gallery"
                render={({ field }) => (
                  <Textarea
                    id="gallery"
                    rows={4}
                    value={(field.value ?? []).join("\n")}
                    onChange={(event) =>
                      field.onChange(linesToArray(event.target.value))
                    }
                  />
                )}
              />
            </div>
          </div>
        ) : null}

        {section === "delivery" ? (
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="deliveryInformation">Delivery information</Label>
              <Textarea
                id="deliveryInformation"
                rows={4}
                {...register("deliveryInformation")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="terms">Terms</Label>
              <Textarea id="terms" rows={4} {...register("terms")} />
            </div>
          </div>
        ) : null}

        {section === "seo" ? (
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" {...register("seoTitle")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea
                id="seoDescription"
                rows={3}
                {...register("seoDescription")}
              />
            </div>
          </div>
        ) : null}

        {section === "settings" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                {Object.values(PlanStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayOrder">Display order</Label>
              <Input
                id="displayOrder"
                type="number"
                {...register("displayOrder", {
                  setValueAs: (v) =>
                    v === "" || v === null || Number.isNaN(Number(v))
                      ? undefined
                      : Number(v),
                })}
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <label className="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Featured plan
                  </label>
                )}
              />
            </div>
          </div>
        ) : null}
      </Tabs>

      {submitError ? (
        <p className="text-brand-danger text-sm">{submitError}</p>
      ) : null}

      <div className="border-brand-border flex flex-wrap gap-2 border-t pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {planId ? "Save changes" : "Create plan"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/plans")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
