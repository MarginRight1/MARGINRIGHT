"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { deleteAppraisal, getStoredAppraisals, type AppraisalRecord } from "../lib/appraisals";
import { supabaseBrowser } from "../lib/supabase";
import { getStoredUserProfile } from "../lib/userProfile";
import ConfidenceScore from "../components/ConfidenceScore";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getStatusTone = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized.includes("strong")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (normalized.includes("safe")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  if (normalized.includes("tight")) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  return "border-rose-500/30 bg-rose-500/10 text-rose-300";
};

export default function DashboardPage() {
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([]);
  const [businessName, setBusinessName] = useState("Dealer");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const userId = data.session?.user.id;
      setUserEmail(data.session?.user.email ?? null);

      const profile = getStoredUserProfile(userId);
      if (profile?.businessName) {
        setBusinessName(profile.businessName);
      }

      const list = await getStoredAppraisals(userId);
      setAppraisals(list);
    };

    void loadDashboardData();
  }, []);

  const todayAppraisals = useMemo(() => {
    const today = new Date();
    const dateLabel = today.toLocaleDateString("en-GB");

    return appraisals.filter((appraisal) => new Date(appraisal.created_at).toLocaleDateString("en-GB") === dateLabel);
  }, [appraisals]);

  const thisMonthAppraisals = useMemo(() => {
    const now = new Date();
    return appraisals.filter((appraisal) => {
      const createdAt = new Date(appraisal.created_at);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    });
  }, [appraisals]);

  const summaryCards = [
    { label: "Appraisals today", value: todayAppraisals.length, subtle: "Fresh appraisals logged today" },
    { label: "Strong Buy decisions", value: todayAppraisals.filter((appraisal) => appraisal.buy_status.toLowerCase().includes("strong")).length, subtle: "High-confidence opportunities" },
    { label: "Tight decisions", value: todayAppraisals.filter((appraisal) => appraisal.buy_status.toLowerCase().includes("tight")).length, subtle: "Needs a closer look" },
    { label: "Walk Away decisions", value: todayAppraisals.filter((appraisal) => appraisal.buy_status.toLowerCase().includes("walk")).length, subtle: "Deals to avoid today" },
  ];

  const performanceCards = [
    {
      label: "Average projected profit",
      value: thisMonthAppraisals.length > 0 ? formatCurrency(thisMonthAppraisals.reduce((sum, appraisal) => sum + appraisal.projected_profit, 0) / thisMonthAppraisals.length) : formatCurrency(0),
      subtle: "Across this month’s appraisals",
    },
    {
      label: "Average ROI",
      value: thisMonthAppraisals.length > 0 ? formatPercent(thisMonthAppraisals.reduce((sum, appraisal) => sum + appraisal.roi, 0) / thisMonthAppraisals.length) : formatPercent(0),
      subtle: "Return on invested capital",
    },
    {
      label: "Average gross margin",
      value: thisMonthAppraisals.length > 0 ? formatPercent(thisMonthAppraisals.reduce((sum, appraisal) => sum + appraisal.gross_margin, 0) / thisMonthAppraisals.length) : formatPercent(0),
      subtle: "Typical margin on this month’s deals",
    },
    {
      label: "Total potential profit this month",
      value: thisMonthAppraisals.length > 0 ? formatCurrency(thisMonthAppraisals.reduce((sum, appraisal) => sum + appraisal.projected_profit, 0)) : formatCurrency(0),
      subtle: "Projected upside available this month",
    },
  ];

  const recentAppraisals = useMemo(() => [...appraisals].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()).slice(0, 6), [appraisals]);

  const handleDelete = async (id: string) => {
    const { data } = await supabaseBrowser.auth.getSession();
    const userId = data.session?.user.id;
    const list = await deleteAppraisal(id, userId);
    setAppraisals(list);
  };

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),#050816] text-zinc-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-3 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <header className="overflow-hidden rounded-[32px] border border-white/10 bg-zinc-950/80 p-4 shadow-[0_25px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">MarginRight dealer dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Welcome back, {businessName}
                </h1>
                <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-base">
                  Review today’s opportunities, track your margins, and keep your auction workflow moving without losing pace.
                </p>
                {userEmail ? <p className="mt-3 text-sm text-zinc-500">Signed in as {userEmail}</p> : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25">
                  New Appraisal
                </Link>
                <Link href="/history" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10">
                  Saved Appraisals
                </Link>
                <Link href="/settings" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10">
                  Account Settings
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10">
                  Logout
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-zinc-950/75 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Today’s summary</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">A quick health check on the day’s decisions</h2>
                </div>
                <p className="text-sm text-zinc-400">Live from your saved appraisals</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                  <article key={card.label} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-zinc-400">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
                    <p className="mt-2 text-sm text-zinc-500">{card.subtle}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-zinc-950/75 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Quick actions</p>
              <div className="mt-4 grid gap-3">
                <Link href="/" className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-4 transition hover:border-emerald-400 hover:bg-emerald-500/15">
                  <p className="text-sm font-semibold text-white">New appraisal</p>
                  <p className="mt-1 text-sm text-zinc-400">Run a fresh buying decision from the calculator.</p>
                </Link>
                <Link href="/history" className="rounded-[24px] border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/10">
                  <p className="text-sm font-semibold text-white">Saved appraisals</p>
                  <p className="mt-1 text-sm text-zinc-400">Browse every deal you have saved and reviewed.</p>
                </Link>
                <Link href="/settings" className="rounded-[24px] border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/10">
                  <p className="text-sm font-semibold text-white">Account settings</p>
                  <p className="mt-1 text-sm text-zinc-400">Tune your dealer defaults and margin targets.</p>
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-zinc-950/75 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Performance cards</p>
                <h2 className="mt-1 text-xl font-semibold text-white">How the month is shaping up</h2>
              </div>
              <p className="text-sm text-zinc-400">Rolling metrics across this month’s appraisals</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {performanceCards.map((card) => (
                <article key={card.label} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
                  <p className="mt-2 text-sm text-zinc-500">{card.subtle}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-zinc-950/75 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Recent appraisals</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Your latest buying decisions in one place</h2>
              </div>
              <Link href="/history" className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200">
                View all
              </Link>
            </div>

            {recentAppraisals.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
                No appraisals yet. Create your first one from the calculator to see the dashboard populate.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-zinc-400">
                    <tr className="border-b border-white/10">
                      <th className="px-3 py-3 font-medium">Registration</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Max Bid</th>
                      <th className="px-3 py-3 font-medium">Retail Value</th>
                      <th className="px-3 py-3 font-medium">Projected Profit</th>
                      <th className="px-3 py-3 font-medium">Decision</th>
                      <th className="px-3 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppraisals.map((appraisal) => (
                      <tr key={appraisal.id} className="border-b border-white/10 text-zinc-300 last:border-b-0">
                        <td className="px-3 py-4 font-semibold text-white">{appraisal.registration}</td>
                        <td className="px-3 py-4">{formatDate(appraisal.created_at)}</td>
                        <td className="px-3 py-4">{formatCurrency(appraisal.max_bid)}</td>
                        <td className="px-3 py-4">{formatCurrency(appraisal.retail_value)}</td>
                        <td className="px-3 py-4">{formatCurrency(appraisal.projected_profit)}</td>
                        <td className="px-3 py-4">
                          <ConfidenceScore compact projectedProfit={Math.round(appraisal.projected_profit)} roi={appraisal.roi} grossMargin={appraisal.gross_margin} maxBid={Math.round(appraisal.max_bid)} currentBid={Math.round(appraisal.purchase_price ?? 0)} retailValuation={Math.round(appraisal.retail_value)} />
                        </td>
                        <td className="px-3 py-4">
                          <Link href="/" className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
