import { useState, useMemo, useCallback, useEffect } from "react";
import React from "react";
import { useBlueskyAuth } from "./providers/bluesky-provider";
import CreateHypercertForm, { type ImpactClaim } from "./components/Form";
import { createImpactClaim } from "./api/create-impact";
import toast from "react-hot-toast";

/**
 * Reimagined UI
 *  - Keeps identical auth + submission logic
 *  - Radically different aesthetic: airy, light, editorial
 *  - Split layout with brand column and content panel
 */
export default function App() {
  const { signIn, signOut, session, isReady, state } = useBlueskyAuth();
  const [handle, setHandle] = useState("");

  const normalized = useMemo(() => handle.trim().replace(/^@/, ""), [handle]);
  const canLogin = normalized.length > 0 && isReady;

  const onSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!canLogin) return;
      signIn(normalized, { state: "bsky:direct-login" });
    },
    [canLogin, normalized, signIn]
  );

  useEffect(() => {
    if (state) console.debug("Bluesky OAuth state:", state);
  }, [state]);

  // Hypercert creation submit (unchanged logic)
  const handleCreate = useCallback(
    async (record: ImpactClaim) => {
      if (!session) return;
      await createImpactClaim(session, record);
      toast.success("Created Impact Claim!");
    },
    [session]
  );

  return (
    <div className="min-h-[100svh] bg-[#FAFAF7] text-zinc-900 selection:bg-amber-200/60">
      {/* Decorative backdrop */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-amber-200/50 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[22rem] w-[22rem] rounded-full bg-emerald-200/50 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_1.35fr]">
        {/* Brand / Left column */}
        <aside className="relative flex flex-col gap-8 px-8 py-10 lg:px-12 lg:py-16 border-b lg:border-b-0 lg:border-r border-zinc-200">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white font-bold">
              H
            </span>
            <div className="leading-tight">
              <h1 className="font-serif text-2xl tracking-tight">
                Hypercert Studio
              </h1>
              <p className="text-sm text-zinc-600">Make your impact legible.</p>
            </div>
          </div>

          <div className="mt-2 lg:mt-6">
            <h2 className="font-serif text-xl">Submit your hypercert</h2>
            <p className="mt-2 max-w-prose text-sm text-zinc-600">
              A gentle portal to authenticate with your Hypercerts handle and
              publish a verifiable impact claim.
            </p>
          </div>

          <IllustrationCluster />

          <footer className="mt-auto pt-8 text-xs text-zinc-500">
            © {new Date().getFullYear()} Hypercert Studio
          </footer>
        </aside>

        {/* Content / Right panel */}
        <main className="relative px-6 py-8 sm:px-10 md:px-12 lg:px-14 lg:py-16">
          <Panel>
            {!isReady ? (
              <div className="flex items-center justify-center py-14">
                <SpinnerLabel label="Preparing secure sign‑in…" />
              </div>
            ) : session ? (
              <div className="grid gap-10">
                {/* Profile summary bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-600 text-white font-bold">
                      {(session.sub?.[0] ?? "U").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Signed in
                      </p>
                      <p className="font-mono text-sm break-all text-zinc-800">
                        {session.sub}
                      </p>
                      {state && (
                        <p className="mt-1 text-xs text-zinc-500">
                          state: <span className="font-mono">{state}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-white transition hover:bg-zinc-800 active:scale-[0.99]"
                  >
                    Sign out
                  </button>
                </div>

                {/* Submission surface */}
                <section className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-8">
                  <Header
                    title="Create Impact Claim"
                    subtitle="Describe the work, scope, and evidence. Publish when ready."
                  />
                  <div className="mt-6">
                    <CreateHypercertForm onSubmit={handleCreate} />
                  </div>
                </section>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-8">
                <Header
                  title="Sign in to continue"
                  subtitle="Use your full Hypercerts handle."
                />

                <div className="grid gap-2">
                  <label
                    htmlFor="bsky"
                    className="text-xs font-medium text-zinc-700"
                  >
                    Hypercerts handle
                  </label>
                  <div className="relative">
                    <input
                      id="bsky"
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="yourname.hypercerts.climateai.org"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 pr-24 shadow-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center">
                      <kbd className="rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-600">
                        @handle
                      </kbd>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Example:{" "}
                    <code className="font-mono">
                      yourname.hypercerts.climateai.org
                    </code>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!canLogin}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>

                <p className="text-xs text-zinc-500">
                  You’ll be redirected to Hypercerts to authorize.
                </p>
              </form>
            )}
          </Panel>
        </main>
      </div>
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

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>}
    </div>
  );
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

function IllustrationCluster() {
  return (
    <div aria-hidden className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
      {["Impact", "Scope", "Evidence"].map((t, i) => (
        <div
          key={t}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
        >
          <svg viewBox="0 0 400 300" className="h-full w-full">
            <defs>
              <linearGradient id={`g${i}`} x1="0" x2="1">
                <stop offset="0%" stopOpacity="0.1" />
                <stop offset="100%" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="400" height="300" fill={`url(#g${i})`} />
            <g>
              <circle
                cx={70 + i * 20}
                cy={110}
                r={24}
                className="fill-emerald-400/40"
              />
              <circle
                cx={150 + i * 20}
                cy={150}
                r={18}
                className="fill-amber-400/40"
              />
              <circle
                cx={230 + i * 20}
                cy={90}
                r={28}
                className="fill-emerald-400/30"
              />
              <rect
                x={60}
                y={200}
                width={260}
                height={12}
                rx={6}
                className="fill-zinc-200"
              />
              <rect
                x={60}
                y={220}
                width={180}
                height={12}
                rx={6}
                className="fill-zinc-200"
              />
            </g>
            <text
              x="60"
              y="48"
              className="fill-zinc-500"
              style={{ font: "600 14px ui-sans-serif, system-ui" }}
            >
              {t}
            </text>
          </svg>
        </div>
      ))}
    </div>
  );
}
