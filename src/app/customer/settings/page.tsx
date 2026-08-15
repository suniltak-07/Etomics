"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/portals/customer/components/PageHeader";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";

const STORAGE_KEY = "etomics_notification_prefs";

interface NotificationPrefs {
  emailDelivery: boolean;
  emailPayments: boolean;
  emailPromotions: boolean;
  pushSubscription: boolean;
}

const defaults: NotificationPrefs = {
  emailDelivery: true,
  emailPayments: true,
  emailPromotions: false,
  pushSubscription: true,
};

function readPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as NotificationPrefs) };
  } catch {
    return defaults;
  }
}

export default function CustomerSettingsPage() {
  const dispatch = useAppDispatch();
  const [prefs, setPrefs] = useState<NotificationPrefs>(readPrefs);

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      dispatch(
        addToast({
          title: "Preferences saved",
          variant: "success",
        }),
      );
    } catch {
      dispatch(
        addToast({
          title: "Could not save preferences",
          variant: "danger",
        }),
      );
    }
  }

  return (
    <div className="animate-[fade-up_0.5s_ease-out]">
      <PageHeader
        title="Settings"
        description="Choose how EatOmics keeps you informed."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["emailDelivery", "Email me about upcoming deliveries"],
              ["emailPayments", "Email me payment receipts"],
              ["emailPromotions", "Occasional wellness offers"],
              ["pushSubscription", "Subscription status alerts"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="hover:bg-brand-sand flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2"
            >
              <Checkbox
                checked={prefs[key]}
                onChange={() => toggle(key)}
                className="mt-0.5"
              />
              <span className="text-brand-ink block text-sm font-medium">
                {label}
              </span>
            </label>
          ))}
          <Button onClick={save}>Save preferences</Button>
          <p className="text-brand-muted text-xs">
            Preferences are stored on this device for the demo experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
