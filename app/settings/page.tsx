"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabaseBrowser } from "../lib/supabase";
import { createDefaultDealerSettings, getStoredDealerSettings, saveDealerSettings, type DealerSettings } from "../lib/dealerSettings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<DealerSettings>(createDefaultDealerSettings());
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const userId = data.session?.user.id;
      const storedSettings = await getStoredDealerSettings(userId);
      setSettings(storedSettings);
    };

    loadProfile();
  }, []);

  const updateField = (field: keyof DealerSettings, value: string | number) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const userId = data.session?.user.id;
      await saveDealerSettings(settings, userId);
      setMessage("Dealer settings updated successfully.");
    } catch {
      setMessage("We could not update your dealer settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),#050816] text-zinc-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-3 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <header className="rounded-[30px] border border-white/10 bg-zinc-950/80 p-4 shadow-[0_25px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">Settings</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Dealer defaults</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                  Edit the starting values used for every appraisal and keep the buying engine aligned to your business.
                </p>
                <p className="mt-3 text-sm text-zinc-500">MarginRight Beta: calculations are guidance only. Always verify figures before bidding.</p>
              </div>
              <Link
                href="/"
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25"
              >
                Back to calculator
              </Link>
            </div>
          </header>

          <section className="rounded-[28px] border border-white/10 bg-zinc-950/75 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-300">
                <span>Default auction fee</span>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3">
                  <span className="mr-2 text-zinc-500">£</span>
                  <input
                    type="number"
                    min="0"
                    value={settings.defaultAuctionFee}
                    onChange={(event) => updateField("defaultAuctionFee", Number(event.target.value))}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm text-zinc-300">
                <span>Default transport cost</span>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3">
                  <span className="mr-2 text-zinc-500">£</span>
                  <input
                    type="number"
                    min="0"
                    value={settings.defaultTransportCost}
                    onChange={(event) => updateField("defaultTransportCost", Number(event.target.value))}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm text-zinc-300">
                <span>Default prep cost</span>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3">
                  <span className="mr-2 text-zinc-500">£</span>
                  <input
                    type="number"
                    min="0"
                    value={settings.defaultPrepCost}
                    onChange={(event) => updateField("defaultPrepCost", Number(event.target.value))}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm text-zinc-300">
                <span>Default desired profit</span>
                <div className="rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3">
                  <span className="mr-2 text-zinc-500">£</span>
                  <input
                    type="number"
                    min="0"
                    value={settings.defaultDesiredProfit}
                    onChange={(event) => updateField("defaultDesiredProfit", Number(event.target.value))}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm text-zinc-300">
                <span>Default VAT scheme</span>
                <select
                  value={settings.defaultVatScheme}
                  onChange={(event) => updateField("defaultVatScheme", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="Margin Scheme">Margin Scheme</option>
                  <option value="Plus VAT">Plus VAT</option>
                  <option value="VAT Inclusive">VAT Inclusive</option>
                </select>
              </label>

              <div className="space-y-2 text-sm text-zinc-300">
                <span>VAT registered</span>
                <div className="flex gap-2">
                  {(["Yes", "No"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateField("vatRegistered", option)}
                      className={`flex-1 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                        settings.vatRegistered === option
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-zinc-900/80 text-zinc-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {message ? <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p> : null}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving…" : "Save defaults"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
