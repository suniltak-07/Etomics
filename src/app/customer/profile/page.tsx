"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/states";
import {
  useCustomer,
  useUpdateCustomer,
} from "@/features/dashboard/hooks/useCustomerDashboard";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { setClientUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { useQueryClient } from "@tanstack/react-query";
import { FoodPreference, HealthGoal } from "@/types/enums";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  mobile?: string;
  dateOfBirth?: string;
  foodPreference: FoodPreference | "";
  allergies?: string;
  healthGoal: HealthGoal | "";
};

const profileSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(80),
    lastName: z.string().min(1, "Last name is required").max(80),
    mobile: z
      .string()
      .min(8, "Enter a valid mobile")
      .max(20)
      .optional()
      .or(z.literal("")),
    dateOfBirth: z.string().optional(),
    foodPreference: z.union([z.nativeEnum(FoodPreference), z.literal("")]),
    allergies: z.string().optional(),
    healthGoal: z.union([z.nativeEnum(HealthGoal), z.literal("")]),
  })
  .superRefine((values, ctx) => {
    if (!values.foodPreference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["foodPreference"],
        message: "Select a food preference",
      });
    }
    if (!values.healthGoal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["healthGoal"],
        message: "Select a health goal",
      });
    }
  });

export default function CustomerProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const customerQuery = useCustomer(user?.id);
  const updateMutation = useUpdateCustomer();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      dateOfBirth: "",
      foodPreference: "",
      allergies: "",
      healthGoal: "",
    },
  });

  useEffect(() => {
    const customer = customerQuery.data?.data;
    if (!customer) return;
    form.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      mobile: customer.mobile ?? "",
      dateOfBirth: customer.dateOfBirth ?? "",
      foodPreference: customer.preferences?.foodPreference ?? "",
      allergies: customer.preferences?.allergies?.join(", ") ?? "",
      healthGoal: customer.preferences?.healthGoal ?? "",
    });
  }, [customerQuery.data, form]);

  if (customerQuery.isLoading) {
    return <LoadingState title="Loading profile" />;
  }

  if (customerQuery.isError || !customerQuery.data?.data) {
    return (
      <ErrorState
        action={
          <Button variant="outline" onClick={() => customerQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    try {
      const response = await updateMutation.mutateAsync({
        id: user.id,
        input: {
          firstName: values.firstName,
          lastName: values.lastName,
          mobile: values.mobile || undefined,
          dateOfBirth: values.dateOfBirth || undefined,
          preferences: {
            foodPreference: values.foodPreference || undefined,
            healthGoal: values.healthGoal || undefined,
            allergies: values.allergies
              ? values.allergies
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],
          },
        },
      });
      const updated = response.data;
      const nextUser = {
        ...user,
        firstName: updated.firstName,
        lastName: updated.lastName,
        mobile: updated.mobile,
      };
      setClientUser(nextUser);
      if (token) {
        dispatch(setCredentials({ user: nextUser, token }));
      }
      void queryClient.invalidateQueries({
        queryKey: ["customers", "detail", user.id],
      });
      dispatch(
        addToast({
          title: "Profile updated",
          variant: "success",
        }),
      );
    } catch (error) {
      dispatch(
        addToast({
          title: "Could not update profile",
          description:
            error instanceof ApiError ? error.message : "Please try again.",
          variant: "danger",
        }),
      );
    }
  }

  return (
    <div className="animate-[fade-up_0.5s_ease-out]">
      <PageHeader
        title="Profile"
        description="Tell us diet, allergies, and health goal so kitchen packs the right plate."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="First name"
                error={form.formState.errors.firstName?.message}
              >
                <Input {...form.register("firstName")} />
              </Field>
              <Field
                label="Last name"
                error={form.formState.errors.lastName?.message}
              >
                <Input {...form.register("lastName")} />
              </Field>
            </div>
            <Field label="Email">
              <Input value={user?.email ?? ""} disabled />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Mobile"
                error={form.formState.errors.mobile?.message}
              >
                <Input {...form.register("mobile")} />
              </Field>
              <Field label="Date of birth">
                <Input type="date" {...form.register("dateOfBirth")} />
              </Field>
            </div>
            <Field
              label="Food preference"
              error={form.formState.errors.foodPreference?.message}
            >
              <Select {...form.register("foodPreference")}>
                <option value="">Select</option>
                <option value={FoodPreference.VEG}>Veg</option>
                <option value={FoodPreference.NON_VEG}>Non-veg</option>
                <option value={FoodPreference.EGGETARIAN}>Eggetarian</option>
                <option value={FoodPreference.VEGAN}>Vegan</option>
              </Select>
            </Field>
            <Field
              label="Health goal"
              error={form.formState.errors.healthGoal?.message}
            >
              <Select {...form.register("healthGoal")}>
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
            <Field label="Allergies or foods to avoid">
              <Textarea
                rows={2}
                placeholder="Peanuts, dairy, or write None"
                {...form.register("allergies")}
              />
            </Field>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
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
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-brand-danger text-xs">{error}</p> : null}
    </div>
  );
}
