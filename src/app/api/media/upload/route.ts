import type { NextRequest } from "next/server";
import { ErrorCode } from "@/lib/api/errors";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { applyUpstreamCookies, ofoodFetch } from "@/lib/backend/proxy";
import { getRequestAccessToken } from "@/lib/backend/session";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/features/media/types";
import {
  mapOfoodMediaUpload,
  mediaFailedUpstream,
  mediaUnreadable,
  missingAccessToken,
} from "@/lib/backend/media";

export const dynamic = "force-dynamic";

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export async function POST(request: NextRequest) {
  const accessToken = getRequestAccessToken(request);
  if (!accessToken) return missingAccessToken();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("A file is required", 400, ErrorCode.VALIDATION_ERROR);
  }

  const file = formData.get("file");
  if (!isFile(file) || file.size === 0) {
    return jsonError(
      "Upload an image in the file field",
      400,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return jsonError(
      "Image must be 10 MB or smaller",
      400,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  const type = file.type.toLowerCase();
  if (
    type &&
    !type.startsWith("image/") &&
    !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type)
  ) {
    return jsonError(
      "Only image files can be uploaded",
      400,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name);

  const result = await ofoodFetch<unknown>("/api/v1/media/upload", {
    method: "POST",
    accessToken,
    body: upstream,
  });

  if (!result.ok) {
    return mediaFailedUpstream(
      result.status,
      result.error,
      result.setCookies,
      "Unable to upload image",
    );
  }

  const media = mapOfoodMediaUpload(result.data);
  if (!media) {
    return mediaUnreadable(
      result.setCookies,
      "Image was uploaded but the response could not be read.",
    );
  }

  return applyUpstreamCookies(
    jsonOk(media, { status: 201, message: "Image uploaded" }),
    result.setCookies,
  );
}
