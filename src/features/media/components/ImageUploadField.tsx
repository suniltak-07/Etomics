"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { mediaService } from "@/features/media/services/mediaService";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/features/media/types";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

export interface ImageUploadFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  emptyLabel?: string;
  onBusyChange?: (busy: boolean) => void;
}

function isAcceptedImage(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

export function ImageUploadField({
  value,
  onChange,
  multiple = false,
  disabled = false,
  emptyLabel = "Upload an image",
  onBusyChange,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: File[]) {
    const picked = multiple ? files : files.slice(0, 1);
    if (!picked.length) return;

    const invalid = picked.find(
      (file) => !isAcceptedImage(file) || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid) {
      setError(
        invalid.size > MAX_IMAGE_BYTES
          ? "Each image must be 10 MB or smaller"
          : "Choose a JPEG, PNG, WebP, GIF, or AVIF image",
      );
      return;
    }

    setError(null);
    setUploading(true);
    onBusyChange?.(true);

    try {
      const results = await Promise.allSettled(
        picked.map((file) => mediaService.upload(file)),
      );
      const urls: string[] = [];
      let failed = 0;
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.data?.url) {
          urls.push(result.value.data.url);
        } else {
          failed += 1;
        }
      }

      if (urls.length) {
        onChange(multiple ? [...value, ...urls] : urls);
      }

      if (failed) {
        const firstRejected = results.find(
          (result) => result.status === "rejected",
        );
        const message =
          firstRejected &&
          firstRejected.status === "rejected" &&
          firstRejected.reason instanceof ApiError
            ? firstRejected.reason.message
            : `${failed} image${failed === 1 ? "" : "s"} failed to upload`;
        setError(message);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to upload image",
      );
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    void uploadFiles(files);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={handleSelect}
      />

      {value.length ? (
        <ul
          className={cn(
            "grid gap-3",
            multiple
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              : "max-w-md grid-cols-1",
          )}
        >
          {value.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="border-brand-border bg-brand-sand relative overflow-hidden rounded-lg border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={multiple ? `Gallery image ${index + 1}` : "Primary image"}
                className="aspect-4/3 w-full object-cover"
              />
              {!disabled ? (
                <button
                  type="button"
                  className="bg-brand-navy/80 hover:bg-brand-danger absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full text-white"
                  onClick={() => removeAt(index)}
                  aria-label={
                    multiple
                      ? `Remove gallery image ${index + 1}`
                      : "Remove image"
                  }
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
          {multiple && !disabled ? (
            <li>
              <label
                htmlFor={inputId}
                className={cn(
                  "border-brand-border text-brand-muted hover:border-brand-green hover:text-brand-green flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed",
                  uploading && "pointer-events-none opacity-60",
                )}
              >
                {uploading ? (
                  <Spinner size="sm" label="Uploading images" />
                ) : (
                  <ImagePlus className="size-6" aria-hidden />
                )}
                <span className="text-xs font-medium">Add images</span>
              </label>
            </li>
          ) : null}
        </ul>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "border-brand-border bg-brand-sand text-brand-muted hover:border-brand-green hover:text-brand-green flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center",
            (disabled || uploading) && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <Spinner size="md" label="Uploading image" />
          ) : (
            <ImagePlus className="size-8" aria-hidden />
          )}
          <span className="text-sm font-medium">
            {uploading ? "Uploading…" : emptyLabel}
          </span>
          <span className="text-xs">
            JPEG, PNG, WebP, GIF, or AVIF · max 10 MB
          </span>
        </label>
      )}

      {value.length && !multiple && !disabled ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Replace image"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-brand-danger text-xs">{error}</p> : null}
    </div>
  );
}
