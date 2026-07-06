"use client";

import React from "react";

interface Props {
  projectedProfit: number;
  roi: number;
  grossMargin: number;
  maxBid: number;
  currentBid: number;
  retailValuation: number;
  targetGrossMarginPercent?: number;
  compact?: boolean; // smaller layout for tables
}

const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

const getBand = (score: number) => {
  if (score >= 90) return { stars: "★★★★★", label: "Exceptional Buy", tone: "text-emerald-300" };
  if (score >= 75) return { stars: "★★★★", label: "Strong Buy", tone: "text-emerald-300" };
  if (score >= 60) return { stars: "★★★", label: "Worth Considering", tone: "text-amber-300" };
  if (score >= 40) return { stars: "★★", label: "Tight", tone: "text-orange-300" };
  return { stars: "★", label: "Walk Away", tone: "text-rose-300" };
};

export default function ConfidenceScore({ compact, projectedProfit, roi, grossMargin, maxBid, currentBid, retailValuation, targetGrossMarginPercent }: Props) {
  // Sub-scores (0-100)
  const profitRatio = retailValuation > 0 ? projectedProfit / retailValuation : 0; // relative to retail
  const profitScore = clamp(profitRatio * 300); // generous scaling

  const roiScore = clamp(roi); // ROI is already percent-ish

  const marginScore = clamp(grossMargin * 2); // scale margin to 0-100

  const valuationBuffer = retailValuation - currentBid;
  const bufferRatio = retailValuation > 0 ? valuationBuffer / retailValuation : 0;
  const bufferScore = clamp(bufferRatio * 200);

  const bidGap = maxBid - currentBid;
  const bidGapScore = maxBid > 0 ? clamp((bidGap / maxBid) * 100 + 50) : clamp(bidGap > 0 ? 75 : 25); // center around 50

  // weights
  const score = Math.round(
    profitScore * 0.25 +
      roiScore * 0.2 +
      marginScore * 0.2 +
      bufferScore * 0.2 +
      bidGapScore * 0.15,
  );

  const band = getBand(score);

  const meetsTarget = typeof targetGrossMarginPercent === "number" ? grossMargin >= targetGrossMarginPercent : undefined;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-3">
        <div className={`rounded-full px-3 py-1 text-sm font-semibold border ${band.tone} border-white/10 bg-black/20`}>{score}</div>
        <div className="text-xs text-zinc-300">{band.stars} <span className="ml-1 text-zinc-400">{band.label}</span></div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-white/10 bg-zinc-900/75 p-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Confidence score</p>
          <div className="mt-2 flex items-baseline gap-3">
            <div className={`text-4xl font-extrabold ${band.tone}`}>{score}</div>
            <div className="text-sm text-zinc-400">/100</div>
            <div className="ml-4 text-sm font-semibold text-white">{band.stars} <span className="ml-2 text-zinc-300">{band.label}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="flex items-start gap-3">
          <div className="text-emerald-300">✓</div>
          <div className="text-sm text-zinc-300">{projectedProfit >= 0 ? `£${projectedProfit.toLocaleString()} projected profit` : `£${Math.abs(projectedProfit).toLocaleString()} projected loss`}</div>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-emerald-300">✓</div>
          <div className="text-sm text-zinc-300">{`${roi.toFixed(1)}% ROI`}</div>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-emerald-300">✓</div>
          <div className="text-sm text-zinc-300">{`£${(retailValuation - currentBid).toLocaleString()} below valuation`}</div>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-emerald-300">✓</div>
          <div className="text-sm text-zinc-300">{bidGap >= 0 ? `£${bidGap.toLocaleString()} buying buffer` : `£${Math.abs(bidGap).toLocaleString()} over profitable ceiling`}</div>
        </div>
        <div className="flex items-start gap-3">
          <div className={`text-${meetsTarget === true ? "emerald" : meetsTarget === false ? "rose" : "zinc"}-300`}>✓</div>
          <div className="text-sm text-zinc-300">{meetsTarget === undefined ? "Target margin not set" : meetsTarget ? "Meets target margin" : "Below target margin"}</div>
        </div>
      </div>
    </div>
  );
}
