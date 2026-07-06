"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { deleteAppraisal, getStoredAppraisals, type AppraisalRecord } from "../lib/appraisals";
import { exportAppraisalReport } from "../lib/appraisalReport";
import { supabaseBrowser } from "../lib/supabase";
import ConfidenceScore from "../components/ConfidenceScore";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function HistoryPage() {
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const userId = data.session?.user.id;
      const list = await getStoredAppraisals(userId);
      setAppraisals(list);
    };

    void load();
  }, []);

  const filteredAppraisals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return appraisals;
    }

    return appraisals.filter((appraisal) => appraisal.registration.toLowerCase().includes(query));
  }, [appraisals, search]);

  const handleDelete = async (id: string) => {
    const { data } = await supabaseBrowser.auth.getSession();
    const userId = data.session?.user.id;
    const list = await deleteAppraisal(id, userId);
    setAppraisals(list);
  };

  const handleExport = async (appraisal: AppraisalRecord) => {
    setMessage(null);

    try {
      await exportAppraisalReport(appraisal);
      setMessage(`PDF export started for ${appraisal.registration}.`);
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || "PDF export failed.";
      setMessage(`Export failed: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),#050816] text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-3 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <header className="rounded-[30px] border border-white/10 bg-zinc-950/80 p-4 shadow-[0_25px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Appraisal history</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Review every deal you saved.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Search by registration, sort by recency and keep your buying decisions organised in one premium dashboard.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
            >
              Back to calculator
            </Link>
          </div>
        </header>

        {message ? (
          <div className="rounded-[22px] border border-white/10 bg-zinc-950/75 px-4 py-3 text-sm text-zinc-300 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
            {message}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-white/10 bg-zinc-950/75 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Saved appraisals</p>
              <p className="mt-1 text-sm text-zinc-400">Newest first, with instant search by registration.</p>
            </div>
            <label className="w-full max-w-sm space-y-2 text-sm text-zinc-300">
              <span>Search registration</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                placeholder="AB22 XYZ"
              />
            </label>
          </div>

          {filteredAppraisals.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
              No appraisals yet. Save one from the calculator to see it appear here.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {filteredAppraisals.map((appraisal) => (
                <article key={appraisal.id} className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">{appraisal.registration}</p>
                      <div className="mt-2">
                        <ConfidenceScore compact projectedProfit={Math.round(appraisal.projected_profit)} roi={appraisal.roi} grossMargin={appraisal.gross_margin} maxBid={Math.round(appraisal.max_bid)} currentBid={Math.round(appraisal.purchase_price ?? 0)} retailValuation={Math.round(appraisal.retail_value)} />
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/?appraisal=${appraisal.id}`}
                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleExport(appraisal)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
                      >
                        Export PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(appraisal.id)}
                        className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Purchase price</p>
                      <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(appraisal.purchase_price)}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Max bid</p>
                      <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(appraisal.max_bid)}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Expected profit</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-300">{formatCurrency(appraisal.projected_profit)}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-black/20 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Date saved</p>
                      <p className="mt-1 text-sm font-semibold text-white">{formatDate(appraisal.created_at)}</p>
                    </div>
                  </div>

                  {appraisal.notes ? (
                    <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-3 text-sm leading-6 text-zinc-400">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Notes</p>
                      <p className="mt-2">{appraisal.notes}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
