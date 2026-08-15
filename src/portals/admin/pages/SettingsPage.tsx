"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/portals/admin/components/AdminUi";

interface AppSettings {
  appName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  taxRate: number;
  deliveryFee: number;
  maintenanceMode: boolean;
  announcement: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  appName: "EatOmics",
  supportEmail: "support@etomics.com",
  supportPhone: "+91 98765 00000",
  currency: "INR",
  taxRate: 5,
  deliveryFee: 0,
  maintenanceMode: false,
  announcement: "",
};

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const update = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    setSavedAt(new Date().toLocaleString());
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Application configuration (local mock — not persisted to API)."
      />

      <form
        onSubmit={handleSave}
        className="border-brand-border bg-brand-surface max-w-2xl space-y-4 rounded-lg border p-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="appName">App name</Label>
            <Input
              id="appName"
              value={settings.appName}
              onChange={(event) => update("appName", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Default currency</Label>
            <Input
              id="currency"
              value={settings.currency}
              onChange={(event) => update("currency", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(event) => update("supportEmail", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supportPhone">Support phone</Label>
            <Input
              id="supportPhone"
              value={settings.supportPhone}
              onChange={(event) => update("supportPhone", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="taxRate">Tax rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.1"
              value={settings.taxRate}
              onChange={(event) =>
                update("taxRate", Number(event.target.value))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deliveryFee">Default delivery fee</Label>
            <Input
              id="deliveryFee"
              type="number"
              step="0.01"
              value={settings.deliveryFee}
              onChange={(event) =>
                update("deliveryFee", Number(event.target.value))
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="announcement">Announcement banner</Label>
          <Textarea
            id="announcement"
            rows={3}
            value={settings.announcement}
            onChange={(event) => update("announcement", event.target.value)}
            placeholder="Optional storefront banner text"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <Checkbox
            checked={settings.maintenanceMode}
            onChange={(event) =>
              update("maintenanceMode", event.target.checked)
            }
          />
          Maintenance mode
        </label>

        <div className="border-brand-border flex items-center gap-3 border-t pt-4">
          <Button type="submit">Save settings</Button>
          {savedAt ? (
            <p className="text-brand-success text-xs">
              Saved locally at {savedAt}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
