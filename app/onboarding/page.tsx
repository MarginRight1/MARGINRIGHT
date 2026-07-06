"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { saveUserProfile, type UserProfile, createDefaultUserProfile } from "../lib/userProfile";
import { supabaseBrowser } from "../lib/supabase";

const totalSteps = 6;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(createDefaultUserProfile());
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        router.replace("/auth/login");
        return;
      }

      const userId = data.session.user.id;
      const existingProfile = window.localStorage.getItem(`marginright.user-profile.v1:${userId}`);
      if (existingProfile) {
        const parsed = JSON.parse(existingProfile) as { completedOnboarding?: boolean };
        if (parsed.completedOnboarding) {
          router.replace("/dashboard");
        }
      }
    };

    loadSession();
  }, [router]);

  const updateField = (field: keyof UserProfile, value: string | number | boolean) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep((current) => current + 1);
      setMessage(null);
      return;
    }

    void handleSave();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const userId = data.session?.user.id;
      await saveUserProfile(profile, userId);
      router.replace("/dashboard");
    } catch {
      setMessage("We could not save your defaults. Please try again.");
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Business name</span>
            <input
              value={profile.businessName}
              onChange={(event) => updateField("businessName", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              placeholder="Example Motors"
            />
          </label>
        );
      case 2:
        return (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Monthly vehicles purchased</span>
            <input
              type="number"
              min="0"
              value={profile.monthlyVehiclesPurchased}
              onChange={(event) => updateField("monthlyVehiclesPurchased", Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            />
          </label>
        );
      case 3:
        return (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Target gross margin %</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={profile.targetGrossMargin}
              onChange={(event) => updateField("targetGrossMargin", Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            />
          </label>
        );
      case 4:
        return (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Default auction fees</span>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3">
              <span className="mr-2 text-zinc-500">£</span>
              <input
                type="number"
                min="0"
                value={profile.defaultAuctionFee}
                onChange={(event) => updateField("defaultAuctionFee", Number(event.target.value))}
                className="w-full bg-transparent text-white outline-none"
              />
            </div>
          </label>
        );
      case 5:
        return (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Default transport cost</span>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3">
              <span className="mr-2 text-zinc-500">£</span>
              <input
                type="number"
                min="0"
                value={profile.defaultTransportCost}
                onChange={(event) => updateField("defaultTransportCost", Number(event.target.value))}
                className="w-full bg-transparent text-white outline-none"
              />
            </div>
          </label>
        );
      default:
        return (
          <label className="space-y-2 text-sm text-zinc-300">
            <span>Default preparation cost</span>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3">
              <span className="mr-2 text-zinc-500">£</span>
              <input
                type="number"
                min="0"
                value={profile.defaultPrepCost}
                onChange={(event) => updateField("defaultPrepCost", Number(event.target.value))}
                className="w-full bg-transparent text-white outline-none"
              />
            </div>
          </label>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),#050816] text-zinc-100">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full rounded-[32px] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <p className="font-semibold uppercase tracking-[0.24em] text-emerald-400">Welcome to MarginRight</p>
              <p>
                Step {step} of {totalSteps}
              </p>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>

            <div className="mt-6">
              <h1 className="text-3xl font-semibold text-white">Set up your dealer defaults</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                These values become your starting point for every new appraisal and can be edited later in Settings.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {renderStepContent()}
              {message ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{message}</p> : null}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={step === 1}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={isSaving}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {step === totalSteps ? (isSaving ? "Saving…" : "Finish") : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
