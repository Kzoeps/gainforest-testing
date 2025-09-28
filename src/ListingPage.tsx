import React, { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useBlueskyAuth } from "./providers/bluesky-provider";
import type { ImpactClaim } from "./components/Form";
import {
  listImpactClaims,
  type ListImpactClaimsResult,
} from "./api/create-impact";

// NOTE: API sometimes returns `uri` as an array; the original type extended it as string.
// We'll accept either to preserve logic while avoiding runtime issues.
export type ListedClaim = ImpactClaim & { uri: any };

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
      {children}
    </div>
  );
}


export default function HypercertsListPage() {
  const { session, isReady } = useBlueskyAuth();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ListedClaim[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([]); // for Back support
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (nextCursor: string | null, pushHistory: boolean) => {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        const res: ListImpactClaimsResult = await listImpactClaims(session, {
          cursor: nextCursor,
          limit: 20,
          reverse: true,
        });
        setItems(res.items as ListedClaim[]);
        setCursor(res.cursor ?? null);
        if (pushHistory) setHistory((h) => [...h, nextCursor]);
      } catch (e) {
        console.error(e);
        const msg = "Failed to load hypercerts.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  useEffect(() => {
    if (isReady && session) fetchPage(null, true);
  }, [isReady, session, fetchPage]);

  const handleNext = () => fetchPage(cursor ?? null, true);
  const handleBack = () => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const nextHistory = h.slice(0, -1);
      const prevCursor = nextHistory[nextHistory.length - 1] ?? null;
      fetchPage(prevCursor, false);
      return nextHistory;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = JSON.stringify(it).toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  if (!isReady)
    return (
      <Shell>
        <CenterCard>
          <SpinnerLabel label="Preparing session…" />
        </CenterCard>
      </Shell>
    );
  if (!session)
    return (
      <Shell>
        <main className="mx-auto max-w-6xl px-6 py-14">
          <Panel>
            <div className="text-center py-16">
              <h2 className="font-serif text-2xl">Authentication Required</h2>
              <p className="mt-2 text-zinc-600">
                Please sign in to view your hypercerts.
              </p>
            </div>
          </Panel>
        </main>
      </Shell>
    );

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-6 py-14">
        <header className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight">
            Your Hypercerts
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Listing records from{" "}
            <code className="font-mono">org.hypercert.impactClaims</code>
          </p>
        </header>

        <Panel>
          {/* Controls */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search (id, scope, uri, contributor, etc.)"
                className="Input"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading || history.length <= 1}
                className="Btn"
                title="Previous page"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={loading || !cursor}
                className="BtnPrimary"
                title="Next page"
              >
                Next →
              </button>
            </div>
          </div>

          {loading && (
            <CenterCard>
              <SpinnerLabel label="Loading hypercerts…" />
            </CenterCard>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-rose-300/60 bg-rose-50 p-4 text-rose-700 mb-6">
              <div className="flex items-center gap-3">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <CenterCard>
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl border border-zinc-200 bg-white">
                <svg
                  className="h-7 w-7 text-zinc-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-medium">No hypercerts found</h3>
              <p className="mt-1 text-sm text-zinc-600">
                {query.trim()
                  ? "Try adjusting your search terms."
                  : "Create your first hypercert to get started."}
              </p>
            </CenterCard>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((item) => (
                <article
                  key={
                    (Array.isArray(item.uri) ? item.uri[0] : item.uri) ??
                    item.impact_claim_id
                  }
                  className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                          Impact Claim
                        </span>
                        <code className="truncate rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs text-zinc-700">
                          {(Array.isArray(item.uri) ? item.uri[0] : item.uri) ||
                            "—"}
                        </code>
                      </div>

                      <h3 className="text-xl font-semibold tracking-tight break-words">
                        {item.impact_claim_id || "(no id)"}
                      </h3>
                      <p className="mt-1 text-zinc-700 break-words">
                        {item.work_scope}
                      </p>
                      {item.description && (
                        <p className="mt-2 text-sm text-zinc-600 break-words">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <MetaCard label="Work Period">
                          <div className="space-y-1">
                            <div className="text-xs text-zinc-500">Start:</div>
                            <Time iso={item.work_start_time} />
                            <div className="mt-2 text-xs text-zinc-500">
                              End:
                            </div>
                            <Time iso={item.work_end_time} />
                          </div>
                        </MetaCard>

                        <MetaCard label="URIs">
                          {Array.isArray(item.uri) ? (
                            <div className="space-y-2">
                              {item.uri.map((u: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={u}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block truncate text-sm text-emerald-700 underline decoration-emerald-300/40 transition-colors hover:text-emerald-800 hover:decoration-emerald-500"
                                >
                                  {u}
                                </a>
                              ))}
                            </div>
                          ) : item.uri ? (
                            <a
                              href={item.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-sm text-emerald-700 underline decoration-emerald-300/40 transition-colors hover:text-emerald-800 hover:decoration-emerald-500"
                            >
                              {item.uri}
                            </a>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </MetaCard>

                        <MetaCard label="Contributors">
                          {item.contributors_uri &&
                          item.contributors_uri.length > 0 ? (
                            <div className="space-y-2">
                              {item.contributors_uri.map((c, idx) => (
                                <div key={idx}>
                                  {c.startsWith("http") ? (
                                    <a
                                      href={c}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block truncate text-sm text-emerald-700 underline decoration-emerald-300/40 transition-colors hover:text-emerald-800 hover:decoration-emerald-500"
                                    >
                                      {c}
                                    </a>
                                  ) : (
                                    <span className="block truncate text-sm text-zinc-700">
                                      {c}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </MetaCard>

                        <MetaCard label="Rights & Location">
                          <div className="space-y-3">
                            {item.rights_uri ? (
                              <div>
                                <div className="mb-1 text-xs text-zinc-500">
                                  Rights:
                                </div>
                                <a
                                  href={item.rights_uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="break-all text-sm text-emerald-700 underline decoration-emerald-300/40 transition-colors hover:text-emerald-800 hover:decoration-emerald-500"
                                >
                                  {item.rights_uri}
                                </a>
                              </div>
                            ) : null}
                            {item.location_uri ? (
                              <div>
                                <div className="mb-1 text-xs text-zinc-500">
                                  Location:
                                </div>
                                <a
                                  href={item.location_uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="break-all text-sm text-emerald-700 underline decoration-emerald-300/40 transition-colors hover:text-emerald-800 hover:decoration-emerald-500"
                                >
                                  {item.location_uri}
                                </a>
                              </div>
                            ) : null}
                            {!item.rights_uri && !item.location_uri && (
                              <span className="text-zinc-500">—</span>
                            )}
                          </div>
                        </MetaCard>
                      </div>
                    </div>

                    {/* Raw JSON toggle */}
                    <div className="lg:w-80 lg:flex-shrink-0">
                      <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <summary className="cursor-pointer text-sm text-zinc-700 hover:text-zinc-900">
                          Raw JSON Data
                        </summary>
                        <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-800">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && !error && filtered.length > 0 && (
            <>
              <hr className="my-8 border-zinc-200" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-600">
                  Page {history.length} • Showing {filtered.length} items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading || history.length <= 1}
                    className="Btn"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || !cursor}
                    className="BtnPrimary"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </Panel>

        <footer className="mt-10 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} — Hypercerts Dashboard
        </footer>
      </main>
    </Shell>
  );
}

function MetaCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="text-sm text-zinc-800">{children}</div>
    </div>
  );
}

function Time({ iso }: { iso: string }) {
  if (!iso) return <span className="text-zinc-500">—</span>;
  const d = new Date(iso);
  const s = isNaN(d.getTime()) ? iso : d.toLocaleString();
  return <span className="text-zinc-800">{s}</span>;
}

function SpinnerLabel({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-3 text-zinc-700">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-20"
        />
        <path
          d="M21 12a9 9 0 0 1-9 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}

/* ---------- Shared shell + tokens to match reimagined App.tsx ---------- */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-[#FAFAF7] text-zinc-900 selection:bg-amber-200/60">
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-amber-200/50 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[22rem] w-[22rem] rounded-full bg-emerald-200/50 blur-3xl" />
      </div>
      {children}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-emerald-200/40 via-transparent to-amber-200/40" />
      <div className="rounded-3xl border border-zinc-200 bg-[#FFFEFC]/80 p-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)] sm:p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
