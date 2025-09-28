/**
 * ============================================
 * components/Form.tsx — Reimagined for light/editorial UI
 * - Keeps the exact data + validation + submit logic
 * - Visuals updated to match the new App.tsx aesthetic (light, airy, emerald accents)
 * - Accessible focus styles, clearer errors
 * - Same helpers (fill example, reset, dynamic rows)
 * ============================================
 */

import React, { useMemo, useState } from "react";
import { z } from "zod";

export type ImpactClaim = {
  impact_claim_id: string;
  work_scope: string;
  uri: string[];
  work_start_time: string;
  work_end_time: string;
  description?: string;
  contributors_uri?: string[];
  rights_uri?: string;
  location_uri?: string;
};

const uriSchema = z.string().url({ message: "Must be a valid URI" });
const dateSchema = z
  .string()
  .datetime({ message: "Must be an ISO date-time (RFC3338)" });

const ImpactClaimSchema = z.object({
  impact_claim_id: z.string().min(0).max(255),
  work_scope: z.string().min(0, "Required"),
  uri: z.array(uriSchema).min(0, "At least one URI is required"),
  work_start_time: dateSchema,
  work_end_time: dateSchema,
  description: z.string().optional(),
  contributors_uri: z.array(z.string()).optional(),
  rights_uri: z.string().optional(),
  location_uri: z.string().optional(),
});

export interface CreateHypercertFormProps {
  onSubmit?: (record: ImpactClaim) => void | Promise<void>;
  initial?: Partial<ImpactClaim>;
  disabled?: boolean;
}

function localDateTimeToISO(dt: string) {
  if (!dt) return "";
  const d = new Date(dt);
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    )
  ).toISOString();
}

function isoToLocalDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function CreateHypercertForm({
  onSubmit,
  initial,
  disabled,
}: CreateHypercertFormProps) {
  const [impactClaimId, setImpactClaimId] = useState(
    initial?.impact_claim_id ?? ""
  );
  const [workScope, setWorkScope] = useState(initial?.work_scope ?? "");
  const [uris, setUris] = useState<string[]>(initial?.uri ?? [""]);
  const [startLocal, setStartLocal] = useState(
    isoToLocalDateTime(initial?.work_start_time)
  );
  const [endLocal, setEndLocal] = useState(
    isoToLocalDateTime(initial?.work_end_time)
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [contributors, setContributors] = useState<string[]>(
    initial?.contributors_uri ?? []
  );
  const [rightsUri, setRightsUri] = useState(initial?.rights_uri ?? "");
  const [locationUri, setLocationUri] = useState(initial?.location_uri ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const record = useMemo<ImpactClaim>(
    () => ({
      impact_claim_id: impactClaimId.trim(),
      work_scope: workScope.trim(),
      uri: uris.map((u) => u.trim()).filter(Boolean),
      work_start_time: localDateTimeToISO(startLocal),
      work_end_time: localDateTimeToISO(endLocal),
      description: description.trim() || undefined,
      contributors_uri: contributors.map((c) => c.trim()).filter(Boolean),
      rights_uri: rightsUri.trim() || undefined,
      location_uri: locationUri.trim() || undefined,
    }),
    [
      impactClaimId,
      workScope,
      uris,
      startLocal,
      endLocal,
      description,
      contributors,
      rightsUri,
      locationUri,
    ]
  );

  const parseResult = ImpactClaimSchema.safeParse(record);
  const hasErrors = !parseResult.success;

  function setFieldError(path: string, message: string) {
    setErrors((prev) => ({
      ...prev,
      [path]: Array.from(new Set([...(prev[path] ?? []), message])),
    }));
  }

  function validateInline() {
    setErrors({});
    const res = ImpactClaimSchema.safeParse(record);
    if (!res.success) {
      for (const issue of res.error.issues) {
        const key = issue.path.join(".") || "form";
        setFieldError(key, issue.message);
      }
    }
    return res.success;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || submitting) return;
    setErrors({});
    const ok = validateInline();
    if (!ok) return;
    try {
      setSubmitting(true);
      await onSubmit?.(record);
    } finally {
      setSubmitting(false);
    }
  }

  // helpers for dynamic lists
  const updateArray = (
    index: number,
    value: string,
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const next = [...arr];
    next[index] = value;
    setter(next);
  };

  const addRow = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    seed = ""
  ) => setter((a) => [...a, seed]);

  const removeRow = (
    index: number,
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => setter(arr.length > 0 ? arr.filter((_, i) => i !== index) : arr);

  // 🧪 Fill example button
  function fillExample() {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
      8,
      -1,
      -1
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 13,
      16,
      -1,
      -1
    );

    setImpactClaimId("claim-000-demo");
    setWorkScope("Open-source climate modeling tools");
    setDescription(
      "Released v0.0 of a reproducible climate impact toolkit; documented methods and published benchmarks."
    );
    setUris([
      "https://github.com/example/hypercerts-climate-toolkit",
      "https://example.org/report/2024-q3",
    ]);
    setContributors([
      "did:plc:abcd1233efgh5678",
      "https://bsky.app/profile/alice.example.com",
    ]);
    setRightsUri("https://creativecommons.org/licenses/by/3.0/");
    setLocationUri("https://maps.google.com/?q=Thimphu,Bhutan");
    setStartLocal(isoToLocalDateTime(start.toISOString()));
    setEndLocal(isoToLocalDateTime(end.toISOString()));
    setErrors({});
  }

  function resetForm() {
    setImpactClaimId(initial?.impact_claim_id ?? "");
    setWorkScope(initial?.work_scope ?? "");
    setUris(initial?.uri ?? [""]);
    setStartLocal(isoToLocalDateTime(initial?.work_start_time));
    setEndLocal(isoToLocalDateTime(initial?.work_end_time));
    setDescription(initial?.description ?? "");
    setContributors(initial?.contributors_uri ?? []);
    setRightsUri(initial?.rights_uri ?? "");
    setLocationUri(initial?.location_uri ?? "");
    setErrors({});
  }

  return (
    <div className="relative rounded-2xl">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-0 lg:grid-cols-[320px,1fr]">
        {/* Left rail */}
        <aside className="h-max rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
          <h1 className="font-serif text-xl">Create Hypercert</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Fill in the impact claim per the lexicon.
          </p>
          <ul className="mt-4 list-disc space-y-1 text-sm text-zinc-600 pl-5">
            <li>
              <strong>Required:</strong> impact_claim_id, work_scope, uri,
              work_start_time, work_end_time
            </li>
            <li>URIs must be valid links</li>
            <li>Dates are stored as ISO timestamps</li>
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              onClick={fillExample}
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99]"
            >
              Fill example
            </button>
            <button
              onClick={resetForm}
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-800 transition hover:bg-zinc-50"
            >
              Reset
            </button>
          </div>

          <button
            onClick={handleSubmit as any}
            disabled={disabled || submitting}
            className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>

          {hasErrors && (
            <div className="mt-4 rounded-xl border border-rose-300/60 bg-rose-50 p-3">
              <p className="text-sm font-medium text-rose-700">
                Please fix the highlighted fields
              </p>
            </div>
          )}
        </aside>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
            <h2 className="font-medium">Identity</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Impact Claim ID"
                required
                error={errors["impact_claim_id"]?.[0]}
              >
                <input
                  value={impactClaimId}
                  onChange={(e) => setImpactClaimId(e.target.value)}
                  className="Input"
                  placeholder="claim-124"
                  disabled={disabled}
                />
              </Field>

              <Field
                label="Work Scope"
                required
                error={errors["work_scope"]?.[0]}
              >
                <input
                  value={workScope}
                  onChange={(e) => setWorkScope(e.target.value)}
                  className="Input"
                  placeholder="Public goods research, open-source, …"
                  disabled={disabled}
                />
              </Field>
            </div>

            <Field label="Description" optional>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="Input min-h-28"
                placeholder="Describe the work and impact…"
                disabled={disabled}
              />
            </Field>
          </section>

          {/* Resources */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
            <h2 className="font-medium">Resources & Links</h2>

            <div className="mt-4 space-y-3">
              <LabelRow
                label="URI (one or more)"
                required
                error={errors["uri"]?.[0]}
              />
              {uris.map((u, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    value={u}
                    onChange={(e) =>
                      updateArray(i, e.target.value, uris, setUris)
                    }
                    className={`Input flex-1 ${
                      errors["uri"] ? "ring-2 ring-rose-300" : ""
                    }`}
                    placeholder="https://…"
                    disabled={disabled}
                  />
                  <IconButton
                    title="Remove"
                    onClick={() => removeRow(i, uris, setUris)}
                    disabled={disabled}
                  >
                    −
                  </IconButton>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addRow(setUris)}
                className="BtnGhost"
                disabled={disabled}
              >
                + Add URI
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <LabelRow label="Contributors URI (optional)" />
              {contributors.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    value={c}
                    onChange={(e) =>
                      updateArray(
                        i,
                        e.target.value,
                        contributors,
                        setContributors
                      )
                    }
                    className="Input flex-1"
                    placeholder="did:plc:… or https://…"
                    disabled={disabled}
                  />
                  <IconButton
                    title="Remove"
                    onClick={() => removeRow(i, contributors, setContributors)}
                    disabled={disabled}
                  >
                    −
                  </IconButton>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addRow(setContributors)}
                className="BtnGhost"
                disabled={disabled}
              >
                + Add Contributor
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Rights URI" optional>
                <input
                  value={rightsUri}
                  onChange={(e) => setRightsUri(e.target.value)}
                  className="Input"
                  placeholder="https://license.example.com/…"
                  disabled={disabled}
                />
              </Field>
              <Field label="Location URI" optional>
                <input
                  value={locationUri}
                  onChange={(e) => setLocationUri(e.target.value)}
                  className="Input"
                  placeholder="https://maps.example.com/… or geo:…"
                  disabled={disabled}
                />
              </Field>
            </div>
          </section>

          {/* Timing */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
            <h2 className="font-medium">Timing</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Work Start"
                required
                error={errors["work_start_time"]?.[0]}
              >
                <input
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="Input"
                  disabled={disabled}
                />
              </Field>
              <Field
                label="Work End"
                required
                error={errors["work_end_time"]?.[0]}
              >
                <input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className="Input"
                  disabled={disabled}
                />
              </Field>
            </div>
          </section>

          {/* Live Preview */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
            <h2 className="font-medium">JSON Preview</h2>
            <pre className="mt-4 max-h-60 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-800">
              {JSON.stringify(record, null, 2)}
            </pre>
            {!hasErrors ? (
              <p className="mt-3 text-sm text-emerald-700">
                Record matches lexicon constraints.
              </p>
            ) : (
              <p className="mt-3 text-sm text-rose-700">
                Record has validation errors.
              </p>
            )}
          </section>

          <div className="h-8" />
        </form>
      </div>

      {/* Tailwind tokens for this component */}
      <style>{`
        .Input { @apply w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 outline-none placeholder:text-zinc-400 text-zinc-900 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200; }
        .BtnGhost { @apply inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800 transition hover:bg-zinc-50; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  optional,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  error?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm text-zinc-700">
          {label}
          {required && <span className="ml-2 text-rose-600">*</span>}
          {optional && <span className="ml-2 text-zinc-400">(optional)</span>}
        </label>
        {error && <span className="text-xs text-rose-700">{error}</span>}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function LabelRow({
  label,
  required,
  error,
}: {
  label: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-700">
        {label}
        {required && <span className="ml-2 text-rose-600">*</span>}
      </span>
      {error && <span className="text-xs text-rose-700">{error}</span>}
    </div>
  );
}

function IconButton({
  title,
  children,
  onClick,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-300 bg-white text-xl text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
