import { describe, expect, it } from "vitest";
import { resetDb } from "@/mocks/seed";
import { checkPincodeServiceability } from "@/lib/serviceability/checkPincode";

describe("checkPincodeServiceability", () => {
  it("accepts an active Bengaluru pincode", () => {
    resetDb();
    const result = checkPincodeServiceability("560038");
    expect(result.serviceable).toBe(true);
    expect(result.city?.name).toBe("Bengaluru");
    expect(result.servicePincode?.areaName).toBe("Indiranagar");
  });

  it("rejects unknown or inactive coverage", () => {
    resetDb();
    expect(checkPincodeServiceability("999999").serviceable).toBe(false);
    expect(checkPincodeServiceability("12").serviceable).toBe(false);
  });
});
