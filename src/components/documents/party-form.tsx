"use client";
import { useState } from "react";
import { partySchema, type Party } from "@/types/domain";
import { Field, Input } from "@/components/ui/shared";
import { Button } from "@/components/ui/button";
export function PartyForm({
  initial,
  onSave,
  label = "Save details",
}: {
  initial: Party;
  onSave: (p: Party) => void | Promise<void>;
  label?: string;
}) {
  const [value, set] = useState(initial);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = partySchema.safeParse(value);
        if (!parsed.success) {
          setError("Please enter a valid email address.");
          return;
        }
        try {
          await onSave(parsed.data);
        } catch {
          setError("Unable to save. Please try again.");
        }
      }}
      className="form-stack"
    >
      <div className="grid-2">
        {(
          [
            "name",
            "company",
            "email",
            "phone",
            "website",
            "taxNumber",
            "registration",
            "country",
          ] as const
        ).map((key) => (
          <Field
            key={key}
            label={
              {
                name: "Name",
                company: "Company",
                email: "Email",
                phone: "Phone",
                website: "Website",
                taxNumber: "Tax number",
                registration: "Registration number",
                country: "Country",
              }[key]
            }
          >
            <Input
              maxLength={300}
              value={value[key]}
              onChange={(e) => set({ ...value, [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <Field label="Address">
        <textarea
          value={value.address}
          onChange={(e) => set({ ...value, address: e.target.value })}
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={value.notes}
          onChange={(e) => set({ ...value, notes: e.target.value })}
        />
      </Field>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <Button type="submit">{label}</Button>
    </form>
  );
}
