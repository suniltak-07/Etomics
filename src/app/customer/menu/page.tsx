"use client";

import { useQuery } from "@tanstack/react-query";
import { menuService } from "@/features/menus/services/menuService";
import { toDateOnly } from "@/lib/calendar/deliveryCalendar";
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
} from "@/components/states";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useCustomer,
  useCustomerDashboard,
} from "@/features/dashboard/hooks/useCustomerDashboard";
import { useSubscriptions } from "@/features/subscriptions/hooks/useSubscriptions";
import { MealType, SubscriptionStatus } from "@/types/enums";
import { useAppSelector } from "@/store/hooks";
import { menuItemForPreference } from "@/lib/meals/menuByPreference";
import { formatFoodPreference, MEAL_TYPE_LABELS } from "@/lib/meals/labels";

export default function CustomerMenuPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dashboard = useCustomerDashboard();
  const customerQuery = useCustomer(user?.id);
  const subscriptions = useSubscriptions({ pageSize: 20 });
  const date = toDateOnly(new Date());
  const menusQuery = useQuery({
    queryKey: ["menus", date],
    queryFn: () => menuService.list(date),
  });

  const active = subscriptions.data?.data.find(
    (item) => item.status === SubscriptionStatus.ACTIVE,
  );
  const hasSub = Boolean(dashboard.data?.data.activeSubscription ?? active);

  if (dashboard.isLoading || menusQuery.isLoading || customerQuery.isLoading) {
    return <LoadingState title="Loading today’s menu" />;
  }

  if (!hasSub) {
    return (
      <ForbiddenState
        title="Menu is for subscribers"
        description="Start a plan to see breakfast, lunch, and dinner for today."
      />
    );
  }

  if (menusQuery.isError) {
    return <ErrorState title="Could not load the menu" />;
  }

  const preference = customerQuery.data?.data.preferences?.foodPreference;
  const menu = menusQuery.data?.data[0];
  const slots: Array<{ type: MealType; label: string }> = [
    { type: MealType.BREAKFAST, label: MEAL_TYPE_LABELS[MealType.BREAKFAST] },
    { type: MealType.LUNCH, label: MEAL_TYPE_LABELS[MealType.LUNCH] },
    { type: MealType.DINNER, label: MEAL_TYPE_LABELS[MealType.DINNER] },
  ];
  const opted = active?.mealTypes ?? [
    MealType.BREAKFAST,
    MealType.LUNCH,
    MealType.DINNER,
  ];

  return (
    <div>
      <PageHeader
        title="Today’s menu"
        description={`Packed for your diet: ${formatFoodPreference(preference)}. Veg, vegan, and eggetarian get the veg line; non-veg gets the non-veg line.`}
      />
      {!menu ? (
        <EmptyState title="No menu published for today yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {slots
            .filter((slot) => opted.includes(slot.type))
            .map((slot) => {
              const item = menuItemForPreference(
                slot.type === MealType.BREAKFAST
                  ? menu.breakfast
                  : slot.type === MealType.LUNCH
                    ? menu.lunch
                    : menu.dinner,
                preference,
              );
              return (
                <Card key={slot.type}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      {slot.label}
                      <Badge variant="muted">
                        {formatFoodPreference(preference)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-brand-navy text-xl">
                      {item?.name ?? "To be announced"}
                    </p>
                    {item?.description ? (
                      <p className="text-brand-muted mt-2 text-sm">
                        {item.description}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
