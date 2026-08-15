import { getDb } from "@/mocks/seed";
import { CityStatus } from "@/types/enums";
import type { City, ServicePincode } from "@/types/entities";

export interface ServiceabilityResult {
  serviceable: boolean;
  pincode: string;
  city?: City;
  servicePincode?: ServicePincode;
  message: string;
}

export function checkPincodeServiceability(
  rawPincode: string,
): ServiceabilityResult {
  const pincode = rawPincode.trim();
  if (!/^\d{6}$/.test(pincode)) {
    return {
      serviceable: false,
      pincode,
      message: "Enter a valid 6-digit Indian pincode.",
    };
  }

  const db = getDb();
  const servicePincode = db.servicePincodes.find(
    (item) => item.pincode === pincode && item.isActive,
  );

  if (!servicePincode) {
    return {
      serviceable: false,
      pincode,
      message: "Sorry, we do not deliver to this pincode yet.",
    };
  }

  const city = db.cities.find((item) => item.id === servicePincode.cityId);
  if (!city || city.status !== CityStatus.ACTIVE) {
    return {
      serviceable: false,
      pincode,
      message: "This city is not currently accepting new deliveries.",
    };
  }

  return {
    serviceable: true,
    pincode,
    city,
    servicePincode,
    message: `Great news — we deliver to ${servicePincode.areaName ?? pincode}, ${city.name}.`,
  };
}
