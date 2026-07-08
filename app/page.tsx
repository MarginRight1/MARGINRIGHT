"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredAppraisal, saveAppraisal } from "./lib/appraisals";
import { supabaseBrowser } from "./lib/supabase";
import ConfidenceScore from "./components/ConfidenceScore";
import { getStoredDealerSettings } from "./lib/dealerSettings";

type VehicleType = "Car" | "Van / Commercial" | "Pickup" | "Minibus";
type VatStatus = "Margin Scheme" | "Plus VAT" | "VAT Inclusive";
type VatRegistered = "Yes" | "No";
// Valuation advanced options removed for beta; keep retailValue and mileage.

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default function Home() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appraisalQuery, setAppraisalQuery] = useState("");
  const [registration, setRegistration] = useState("AB22 XYZ");
  const [vehicleType, setVehicleType] = useState<VehicleType>("Car");
  const [vatStatus, setVatStatus] = useState<VatStatus>("Plus VAT");
  const [vatRegistered, setVatRegistered] = useState<VatRegistered>("Yes");
  const [retailValue, setRetailValue] = useState(16500);
  const [currentBid, setCurrentBid] = useState(12950);
  const [prepCosts, setPrepCosts] = useState(450);
  const [auctionFee, setAuctionFee] = useState(180);
  const [transportCost, setTransportCost] = useState(120);
  const [desiredProfit, setDesiredProfit] = useState(1500);
  const [mileage, setMileage] = useState(72000);
  const [loadedAppraisalId, setLoadedAppraisalId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalRegistration, setModalRegistration] = useState("");
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data } = await supabaseBrowser.auth.getSession();

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(data.session));
      setIsAuthChecked(true);
    };

    void checkSession();

    const { data: authListener } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsAuthChecked(true);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const openSaveModal = () => {
    setModalRegistration(registration.trim());
    if (!loadedAppraisalId) {
      setNotes("");
    }
    setSaveStatus(null);
    setShowSaveModal(true);
  };

  const handleSaveAppraisal = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const userId = data.session?.user.id;

      await saveAppraisal({
        registration: modalRegistration.trim() || registration.trim() || "Unknown",
        vehicle_type: vehicleType,
        purchase_price: currentBid,
        retail_value: retailValue,
        prep_cost: prepCosts,
        auction_fee: auctionFee,
        transport_cost: transportCost,
        vat_scheme: vatStatus,
        vat_registered: vatRegistered,
        max_bid: maxBid,
        projected_profit: projectedProfit,
        gross_margin: grossMargin,
        roi,
        buy_status: status.label,
        notes: notes.trim(),
      }, userId, loadedAppraisalId ?? undefined);

      setShowSaveModal(false);
      setSaveStatus(userId ? (loadedAppraisalId ? "Appraisal updated in your account." : "Appraisal saved to your account.") : "Appraisal saved locally. Sign in to sync across devices.");
    } catch (error: any) {
      const message = error?.message || String(error) || "Saving failed. Please try again.";
      setSaveStatus(message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppraisalQuery(new URLSearchParams(window.location.search).get("appraisal") ?? "");
    }
  }, []);

  useEffect(() => {
    const loadDefaults = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const userId = data.session?.user.id;

      const settings = await getStoredDealerSettings(userId);
      const appraisalId = appraisalQuery;

      setAuctionFee(settings.defaultAuctionFee);
      setTransportCost(settings.defaultTransportCost);
      setPrepCosts(settings.defaultPrepCost);
      setDesiredProfit(settings.defaultDesiredProfit);
      setVatStatus(settings.defaultVatScheme);
      setVatRegistered(settings.vatRegistered);

      if (appraisalId) {
        const appraisal = await getStoredAppraisal(appraisalId, userId);
        if (appraisal) {
          setLoadedAppraisalId(appraisal.id);
          setRegistration(appraisal.registration || registration);
          setVehicleType((appraisal.vehicle_type as VehicleType) || vehicleType);
          setRetailValue(appraisal.retail_value || retailValue);
          setCurrentBid(appraisal.purchase_price || currentBid);
          setVatStatus((appraisal.vat_scheme as VatStatus) || settings.defaultVatScheme);
          setVatRegistered((appraisal.vat_registered as VatRegistered) || settings.vatRegistered);
          setNotes(appraisal.notes || "");
          setModalRegistration(appraisal.registration || registration);
        }
      }
    };

    void loadDefaults();
  }, [appraisalQuery]);

  const vatOnBid = (() => {
    if (vatStatus === "Margin Scheme") return 0;
    if (vatStatus === "Plus VAT") return currentBid * 0.2;
    return currentBid * 0.2 / 1.2;
  })();

  const totalInvoice = currentBid + vatOnBid + auctionFee + transportCost + prepCosts;
  const recoverableVat = vatRegistered === "Yes" ? vatOnBid : 0;
  const effectiveCost = totalInvoice - recoverableVat;
  const projectedProfit = retailValue - effectiveCost;
  const grossMargin = retailValue > 0 ? (projectedProfit / retailValue) * 100 : 0;
  const roi = effectiveCost > 0 ? (projectedProfit / effectiveCost) * 100 : 0;

  const maxBid = (() => {
  const fixedCosts = auctionFee + transportCost + prepCosts;
  const target = retailValue - desiredProfit - fixedCosts;

    if (vatStatus === "Margin Scheme") return Math.max(0, target);

    if (vatStatus === "Plus VAT") {
      return vatRegistered === "Yes"
        ? Math.max(0, target)
        : Math.max(0, target / 1.2);
    }

    if (vatRegistered === "Yes") {
      return Math.max(0, target * 1.2);
    }

    return Math.max(0, target);
  })();

  const getStatus = () => {
    if (projectedProfit >= desiredProfit + 1000 && grossMargin >= 14) {
      return { label: "STRONG BUY", tone: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" };
    }
    if (projectedProfit >= desiredProfit && grossMargin >= 8) {
      return { label: "SAFE BUY", tone: "text-amber-300 border-amber-500/30 bg-amber-500/10" };
    }
    if (projectedProfit > 0 && grossMargin >= 4) {
      return { label: "TIGHT", tone: "text-orange-300 border-orange-500/30 bg-orange-500/10" };
    }
    return { label: "WALK AWAY", tone: "text-rose-300 border-rose-500/30 bg-rose-500/10" };
  };

  const bidGap = maxBid - currentBid;
  const bidPosition =
    bidGap < 0
      ? {
          label: "STOP - Above profitable bid",
          tone: "text-rose-300 border-rose-500/30 bg-rose-500/10",
          bar: "bg-rose-500",
          deltaText: `${formatCurrency(Math.abs(bidGap))} over maximum bid`,
          remainingText: "No bidding room left",
          summary: `${formatCurrency(Math.abs(bidGap))} above your profitable ceiling`,
        }
      : bidGap <= 250
        ? {
            label: "Amber - Near max bid",
            tone: "text-amber-300 border-amber-500/30 bg-amber-500/10",
            bar: "bg-amber-500",
            deltaText: `${formatCurrency(bidGap)} under maximum bid`,
            remainingText: `Only ${formatCurrency(bidGap)} remaining`,
            summary: `You are within ${formatCurrency(250)} of your profitable ceiling`,
          }
        : {
            label: "Green - Under maximum bid",
            tone: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
            bar: "bg-emerald-500",
            deltaText: `${formatCurrency(bidGap)} under maximum bid`,
            remainingText: `${formatCurrency(bidGap)} bidding room available`,
            summary: `There is still room to bid before you hit the profitable limit`,
          };

  const status = getStatus();

  if (!isAuthChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.2),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_44%),#050816] text-zinc-100">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <section className="overflow-hidden rounded-[34px] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-sm font-semibold text-emerald-400">
                  MR
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight text-white">
                    Margin<span className="text-emerald-400">Right</span>
                  </p>
                  <p className="text-sm text-zinc-400">Auction buying calculator</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/auth/login"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
                >
                  Create account
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Built for UK independent dealers
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Know your true maximum bid before you raise your hand.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
                  MarginRight is an auction buying calculator for UK independent dealers. It brings retail value, live bid pressure and deal costs into one instant decision surface so you avoid overpaying and protect margin on every vehicle.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/auth/signup"
                    className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/auth/login"
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
                  >
                    Login
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">What it factors in</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                  <li>Retail value and current bid</li>
                  <li>Auction fees, prep costs and transport</li>
                  <li>VAT scheme treatment and VAT status</li>
                  <li>Desired profit target and ROI visibility</li>
                </ul>
                <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  Vehicle lookup is coming soon.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[24px] border border-white/10 bg-zinc-950/75 p-5">
              <p className="text-sm font-semibold text-white">Maximum bid clarity</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Instantly calculate the ceiling bid that still supports your target margin.
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-zinc-950/75 p-5">
              <p className="text-sm font-semibold text-white">Margin protection</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                See projected profit and gross margin before committing to stock.
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-zinc-950/75 p-5">
              <p className="text-sm font-semibold text-white">ROI focus</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Keep buying disciplined with a live ROI readout as bids move.
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-zinc-950/75 p-5">
              <p className="text-sm font-semibold text-white">Post-login tools</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Saved appraisals and your dealer dashboard are available after login.
              </p>
            </article>
          </section>

          <section className="mt-6 rounded-[30px] border border-white/10 bg-zinc-950/78 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">How it works</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <article className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Step 1</p>
                <p className="mt-2 text-base font-semibold text-white">Enter live auction numbers</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Add retail value, current bid, fees, prep, transport and VAT setup.
                </p>
              </article>
              <article className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Step 2</p>
                <p className="mt-2 text-base font-semibold text-white">Set your target return</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Define desired profit and instantly view projected profit, margin and ROI.
                </p>
              </article>
              <article className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Step 3</p>
                <p className="mt-2 text-base font-semibold text-white">Bid with confidence</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Use your max-bid number to avoid overpaying and protect dealer margin.
                </p>
              </article>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[30px] border border-white/10 bg-zinc-950/78 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">Pricing</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Early beta pricing</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">
                Start with MarginRight at a founder-friendly rate while we expand vehicle lookup, reporting and team workflows.
              </p>

              <div className="mt-6 rounded-[24px] border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Beta plan</p>
                <p className="mt-2 text-4xl font-bold text-white">
                  GBP 19<span className="text-base font-medium text-zinc-300"> / month</span>
                </p>
                <p className="mt-2 text-sm text-zinc-300">Full calculator access, saved appraisals, and dealer dashboard.</p>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,12,24,0.98),rgba(5,8,16,0.96))] p-6 sm:p-8">
              <h3 className="text-2xl font-semibold tracking-tight text-white">Ready to protect your buying margin?</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Create your account to unlock saved appraisals and your dealer dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/auth/signup"
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
                >
                  Create account
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  Login
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),#050816] text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-3 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-[30px] border border-white/10 bg-zinc-950/80 p-4 shadow-[0_25px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-sm font-semibold text-emerald-400">
                  MR
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight text-white">
                    Margin<span className="text-emerald-400">Right</span>
                  </p>
                  <p className="text-sm text-zinc-400">Auction buying calculator</p>
                </div>
              </div>
              <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Buy the right stock at auction without leaving margin on the table.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Built for fast decisions on the forecourt, this calculator turns retail value, auction costs and VAT treatment into a clear buy/no-buy answer.
              </p>
              <p className="mt-3 text-sm text-zinc-500">MarginRight Beta: calculations are guidance only. Always verify figures before bidding.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/settings"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Settings
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </header>

        {loadedAppraisalId ? (
          <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Saved appraisal loaded for editing. Save again to update this record.
          </div>
        ) : null}

        <main className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-zinc-950/78 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">Inputs</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Fast buying setup</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                  Compact
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
                  <span>Registration</span>
                  <div className="flex gap-2">
                    <input
                      value={registration}
                      onChange={(event) => setRegistration(event.target.value.toUpperCase())}
                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                      placeholder="AB22 XYZ"
                    />
                    <button
                      type="button"
                      disabled
                      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
                    >
                      Coming soon
                    </button>
                  </div>
                </label>

                <label className="space-y-2 text-sm text-zinc-300">
                  <span>Mileage</span>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3">
                    <input
                      type="number"
                      value={mileage}
                      onChange={(event) => setMileage(Number(event.target.value))}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm text-zinc-300">
                  <span>Retail Value</span>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3">
                    <span className="mr-2 text-zinc-500">£</span>
                    <input
                      type="number"
                      value={retailValue}
                      onChange={(event) => setRetailValue(Number(event.target.value))}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm text-zinc-300">
                  <span>Current Bid / Purchase Price</span>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3">
                    <span className="mr-2 text-zinc-500">£</span>
                    <input
                      type="number"
                      value={currentBid}
                      onChange={(event) => setCurrentBid(Number(event.target.value))}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm text-zinc-300">
                  <span>Prep Cost</span>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3">
                    <span className="mr-2 text-zinc-500">£</span>
                    <input
                      type="number"
                      value={prepCosts}
                      onChange={(event) => setPrepCosts(Number(event.target.value))}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm text-zinc-300">
                  <span>Auction Fee</span>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3">
                    <span className="mr-2 text-zinc-500">£</span>
                    <input
                      type="number"
                      value={auctionFee}
                      onChange={(event) => setAuctionFee(Number(event.target.value))}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm text-zinc-300">
                  <span>Transport Cost</span>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3">
                    <span className="mr-2 text-zinc-500">£</span>
                    <input
                      type="number"
                      value={transportCost}
                      onChange={(event) => setTransportCost(Number(event.target.value))}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </label>

                <label className="space-y-2 text-sm text-zinc-300">
                  <span>VAT Scheme</span>
                  <select
                    value={vatStatus}
                    onChange={(event) => setVatStatus(event.target.value as VatStatus)}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  >
                    <option value="Margin Scheme">Margin Scheme</option>
                    <option value="Plus VAT">Plus VAT</option>
                    <option value="VAT Inclusive">VAT Inclusive</option>
                  </select>
                </label>

                <div className="space-y-2 text-sm text-zinc-300">
                  <span>VAT Registered</span>
                  <div className="flex gap-2">
                    {(["Yes", "No"] as VatRegistered[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setVatRegistered(option)}
                        className={`flex-1 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                          vatRegistered === option
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-white/10 bg-zinc-900/85 text-zinc-300"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
                  <span>Desired Profit</span>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/85 px-4 py-3">
                    <span className="mr-2 text-zinc-500">£</span>
                    <input
                      type="number"
                      value={desiredProfit}
                      onChange={(event) => setDesiredProfit(Number(event.target.value))}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openSaveModal}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
                >
                  Save Appraisal
                </button>
                <Link
                  href="/history"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  View History
                </Link>
              </div>
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(180deg,rgba(9,12,24,0.98),rgba(5,8,16,0.96))] p-5 shadow-[0_30px_140px_rgba(0,0,0,0.55)] sm:p-6 lg:p-8">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Decision panel</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Buying decision</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">This side is the decision surface: one number to rule the bid, then the live risk signals beneath it.</p>
                </div>
                <div className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${status.tone}`}>
                  {status.label}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[28px] border border-emerald-500/20 bg-white/5 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Maximum bid</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                      {formatCurrency(maxBid)}
                    </div>
                    <div className="max-w-xs text-sm leading-6 text-zinc-400">
                      Max you can pay and still protect the target margin.
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Remaining bidding room</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(Math.max(0, maxBid - currentBid))}</p>
                    <p className="mt-1 text-sm text-zinc-400">{bidPosition.summary}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Live bid position</p>
                    <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-zinc-200">
                      {bidPosition.label}
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${bidPosition.bar}`} style={{ width: `${Math.min(100, Math.max(0, (currentBid / Math.max(1, maxBid)) * 100))}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">{bidPosition.deltaText}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Projected profit</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(projectedProfit)}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">ROI</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatPercent(roi)}</p>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Gross margin</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{formatPercent(grossMargin)}</p>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Confidence score</p>
                      <div className="mt-2">
                        <ConfidenceScore compact projectedProfit={Math.round(projectedProfit)} roi={roi} grossMargin={grossMargin} maxBid={Math.round(maxBid)} currentBid={Math.round(currentBid)} retailValuation={Math.round(retailValue)} />
                      </div>
                    </div>
                    <div className="text-right text-sm text-zinc-400">
                      Premium, quick read
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </main>
        {showSaveModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-zinc-950/95 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">
                  Save appraisal
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Capture this buying decision</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm text-zinc-300">
                <span>Registration</span>
                <input
                  value={modalRegistration}
                  onChange={(event) => setModalRegistration(event.target.value.toUpperCase())}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  placeholder="AB22 XYZ"
                />
              </label>

              <label className="block space-y-2 text-sm text-zinc-300">
                <span>Optional notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  placeholder="Add a note for the team or your own future reference."
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAppraisal}
                disabled={isSaving}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving…" : loadedAppraisalId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  </div>
  );
}
