"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface StringListFieldProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StringListField({
  id,
  value,
  onChange,
  placeholder = "Type and add",
  disabled = false,
}: StringListFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [draft, setDraft] = useState("");

  function addItem() {
    const item = draft.trim();
    if (!item || disabled) return;
    const exists = value.some(
      (entry) => entry.toLowerCase() === item.toLowerCase(),
    );
    if (!exists) onChange([...value, item]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addItem();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />
        <Button
          type="button"
          disabled={disabled || !draft.trim()}
          onClick={addItem}
          aria-label="Add"
          className="size-10 shrink-0 px-0"
        >
          <Check className="size-4" aria-hidden />
        </Button>
      </div>
      {value.length ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="border-brand-border bg-brand-sand text-brand-ink inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-sm"
            >
              <span className="min-w-0 truncate">{item}</span>
              {disabled ? null : (
                <button
                  type="button"
                  className="text-brand-muted hover:text-brand-danger shrink-0"
                  onClick={() =>
                    onChange(
                      value.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  aria-label={`Remove ${item}`}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-brand-muted text-xs">None added yet</p>
      )}
    </div>
  );
}
