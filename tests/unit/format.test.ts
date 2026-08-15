import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, slugify } from "@/lib/utils/format";

describe("slugify", () => {
  it("normalizes spaces, case, and punctuation", () => {
    expect(slugify("  Starter Plan!  ")).toBe("starter-plan");
    expect(slugify("Diabetic Care Plan")).toBe("diabetic-care-plan");
    expect(slugify("Family---Duo")).toBe("family-duo");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Déjeuner")).toBe("cafe-dejeuner");
  });
});

describe("formatCurrency", () => {
  it("formats INR amounts for en-IN", () => {
    const formatted = formatCurrency(4999, "INR", "en-IN");
    expect(formatted).toContain("4,999");
    expect(formatted).toMatch(/₹|INR/);
  });
});

describe("formatDate", () => {
  it("formats ISO dates with the default pattern", () => {
    expect(formatDate("2026-08-10")).toBe("10 Aug 2026");
  });

  it("returns empty string for invalid dates", () => {
    expect(formatDate("not-a-date")).toBe("");
  });
});
