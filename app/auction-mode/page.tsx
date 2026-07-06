"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { computeBuyingMetrics, type VatRegistered, type VatStatus } from "../lib/buyingEngine";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default function AuctionModePage() {
  const [currentBid, setCurrentBid] = useState(12950);
  const [retailValue, setRetailValue] = useState(16500);
  const [prepCosts, setPrepCosts] = useState(450);
  const [auctionFee, setAuctionFee] = useState(180);
  const [transportCost, setTransportCost] = useState(120);
  const [desiredProfit, setDesiredProfit] = useState(1500);
  const [vatStatus, setVatStatus] = useState<VatStatus>("Plus VAT");
  const [vatRegistered, setVatRegistered] = useState<VatRegistered>("Yes");
  const [selectedValuation, setSelectedValuation] = useState(16500);

  const metrics = useMemo(
    () =>
      computeBuyingMetrics({
        currentBid,
        retailValue,
        prepCosts,
        auctionFee,
        transportCost,
        desiredProfit,
        vatStatus,
        vatRegistered,
        selectedValuation,
      }),
    [auctionFee, currentBid, desiredProfit, prepCosts, retailValue, selectedValuation, transportCost, vatRegistered, vatStatus],
  );

  const bidGap = metrics.maxBid - currentBid;
  const progress = metrics.maxBid > 0 ? Math.min(100, Math.max(0, (currentBid / metrics.maxBid) * 100)) : 0;

  const getState = () => {
    if (currentBid > metrics.maxBid) {
      return {
        label: "RED",
        headline: "WALK AWAY",
        description: "Current bid above maximum bid.",
        tone: "border-rose-500/40 bg-rose-500/15 text-rose-200",
        bar: "bg-rose-500",
      };
    }

    if (bidGap <= 100) {
      return {
        label: "ORANGE",
        headline: "FINAL BID",
        description: "Within £100 of maximum bid.",
        tone: "border-orange-500/40 bg-orange-500/15 text-orange-200",
        bar: "bg-orange-500",
      };
    }

    if (bidGap <= 250) {
      return {
        label: "AMBER",
        headline: "TIGHT",
        description: "Within £250 of maximum bid.",
        tone: "border-amber-500/40 bg-amber-500/15 text-amber-200",
        bar: "bg-amber-500",
      };
    }

    return {
      label: "GREEN",
      headline: "STRONG BUY",
      description: "Current bid safely below maximum bid.",
      tone: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
      bar: "bg-emerald-500",
    };
  };

  const state = getState();

  const remainingRoom = currentBid > metrics.maxBid
    ? "Maximum bid exceeded"
    : bidGap <= 0
      ? "£0 remaining"
      : `${formatCurrency(bidGap)} remaining`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),#050816] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="flex-1 rounded-[32px] border border-white/10 bg-zinc-950/80 p-4 shadow-[0_25px_100px_rgba(0,0,0,0.36)] backdrop-blur sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Auction mode</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Live bidding assistant</h1>
            </div>
            <Link
              href="/"
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
            >
              Return to Buying Engine
            </Link>
          </div>

          <section className="mt-5 rounded-[28px] border border-white/10 bg-black/20 p-4 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">Maximum bid</p>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-white sm:text-7xl">{formatCurrency(metrics.maxBid)}</p>
          </section>

          <section className="mt-5 rounded-[28px] border border-white/10 bg-zinc-950/70 p-4 sm:p-6">
            <label className="block text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">
              Current Bid
            </label>
            <div className="mt-3 rounded-[24px] border border-white/10 bg-zinc-900/80 px-4 py-4">
              <span className="mr-2 text-zinc-500">£</span>
              <input
                type="number"
                value={currentBid}
                onChange={(event) => setCurrentBid(Number(event.target.value))}
                className="w-full bg-transparent text-3xl font-semibold text-white outline-none sm:text-4xl"
              />
            </div>

            <div className={`mt-4 rounded-[24px] border p-4 ${state.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em]">{state.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{state.headline}</p>
                  <p className="mt-2 text-sm opacity-90">{state.description}</p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold">
                  Live
                </div>
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-black/20">
                <div className={`h-full rounded-full transition-all ${state.bar}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[24px] border border-white/10 bg-zinc-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Projected Profit</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-300">{formatCurrency(metrics.projectedProfit)}</p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-zinc-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Gross Margin %</p>
              <p className="mt-3 text-2xl font-semibold text-white">{formatPercent(metrics.grossMargin)}</p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-zinc-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">ROI %</p>
              <p className="mt-3 text-2xl font-semibold text-white">{formatPercent(metrics.roi)}</p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-zinc-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Remaining Bidding Room</p>
              <p className="mt-3 text-xl font-semibold text-white">{remainingRoom}</p>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
