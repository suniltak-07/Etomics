import type { NextRequest } from "next/server";
import {
  jsonPaginated,
  paginate,
  parsePagination,
} from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";
import {
  customerFailedUpstream,
  mapOfoodCustomer,
  missingAccessToken,
  unwrapOfoodCustomers,
  type PublicCustomer,
} from "@/lib/backend/customers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  const result = await ofoodFetch<unknown>("/api/v1/customers", {
    accessToken,
  });
  if (!result.ok) {
    return customerFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to load customers",
    );
  }

  let customers = unwrapOfoodCustomers(result.data)
    .map(mapOfoodCustomer)
    .filter((customer): customer is PublicCustomer => customer !== null);

  const search = request.nextUrl.searchParams
    .get("search")
    ?.trim()
    .toLowerCase();
  if (search) {
    customers = customers.filter((customer) => {
      const haystack = [
        customer.email,
        customer.firstName,
        customer.lastName,
        customer.mobile ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  const { page, pageSize } = parsePagination(request.nextUrl.searchParams);
  const { items, meta } = paginate(customers, page, pageSize);
  return applyUpstreamCookies(jsonPaginated(items, meta), result.setCookies);
}
