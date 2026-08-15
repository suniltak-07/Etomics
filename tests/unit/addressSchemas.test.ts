import { describe, expect, it } from "vitest";
import { createAddressSchema } from "@/features/addresses/schemas/addressSchemas";
import { AddressType } from "@/types/enums";

const validAddress = {
  fullName: "Rohan Sharma",
  mobile: "+919811122233",
  addressLine1: "12, Palm Grove Apartments",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560038",
  latitude: 12.9784,
  longitude: 77.6408,
  addressType: AddressType.HOME,
};

describe("createAddressSchema", () => {
  it("accepts a valid address and defaults addressType to HOME", () => {
    const withType = createAddressSchema.parse(validAddress);
    expect(withType.fullName).toBe("Rohan Sharma");
    expect(withType.addressType).toBe(AddressType.HOME);

    const withoutType = {
      fullName: validAddress.fullName,
      mobile: validAddress.mobile,
      addressLine1: validAddress.addressLine1,
      city: validAddress.city,
      state: validAddress.state,
      pincode: validAddress.pincode,
      latitude: validAddress.latitude,
      longitude: validAddress.longitude,
    };
    const parsed = createAddressSchema.parse(withoutType);
    expect(parsed.addressType).toBe(AddressType.HOME);
  });

  it("accepts optional fields", () => {
    const parsed = createAddressSchema.parse({
      ...validAddress,
      addressLine2: "Flat 4B",
      landmark: "Near City Park",
      area: "Indiranagar",
      isDefault: true,
      customerId: "user_customer_1",
    });

    expect(parsed.area).toBe("Indiranagar");
    expect(parsed.isDefault).toBe(true);
    expect(parsed.customerId).toBe("user_customer_1");
  });

  it("rejects short mobile numbers and missing required location fields", () => {
    const shortMobile = createAddressSchema.safeParse({
      ...validAddress,
      mobile: "1234567",
    });
    expect(shortMobile.success).toBe(false);

    const missingCity = createAddressSchema.safeParse({
      ...validAddress,
      city: "",
    });
    expect(missingCity.success).toBe(false);

    const shortPincode = createAddressSchema.safeParse({
      ...validAddress,
      pincode: "12",
    });
    expect(shortPincode.success).toBe(false);

    const missingCoords = createAddressSchema.safeParse({
      fullName: validAddress.fullName,
      mobile: validAddress.mobile,
      addressLine1: validAddress.addressLine1,
      city: validAddress.city,
      state: validAddress.state,
      pincode: validAddress.pincode,
    });
    expect(missingCoords.success).toBe(false);
  });

  it("rejects invalid addressType values", () => {
    const result = createAddressSchema.safeParse({
      ...validAddress,
      addressType: "VACATION",
    });
    expect(result.success).toBe(false);
  });
});
