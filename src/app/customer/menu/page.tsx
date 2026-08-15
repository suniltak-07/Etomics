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
import { useCustomerDashboard } from "@/features/dashboard/hooks/useCustomerDashboard";
import { useSubscriptions } from "@/features/subscriptions/hooks/useSubscriptions";
import { MealType, SubscriptionStatus } from "@/types/enums";

export default function CustomerMenuPage() {
  const dashboard = useCustomerDashboard();
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

  if (dashboard.isLoading || menusQuery.isLoading) {
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

  const menu = menusQuery.data?.data[0];
  const slots: Array<{ type: MealType; label: string }> = [
    { type: MealType.BREAKFAST, label: "Breakfast" },
    { type: MealType.LUNCH, label: "Lunch" },
    { type: MealType.DINNER, label: "Dinner" },
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
        description="Published for subscribers. Sundays are rest days for the kitchen."
      />
      {!menu ? (
        <EmptyState title="No menu published for today yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {slots
            .filter((slot) => opted.includes(slot.type))
            .map((slot) => {
              const item =
                slot.type === MealType.BREAKFAST
                  ? menu.breakfast
                  : slot.type === MealType.LUNCH
                    ? menu.lunch
                    : menu.dinner;
              return (
                <Card key={slot.type}>
                  <CardHeader>
                    <CardTitle>{slot.label}</CardTitle>
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
