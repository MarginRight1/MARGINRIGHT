"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    const userId = data.session?.user.id;
    if (userId) {
      const rawProfile = window.localStorage.getItem(`marginright.user-profile.v1:${userId}`);
      const completedOnboarding = rawProfile ? (JSON.parse(rawProfile) as { completedOnboarding?: boolean }).completedOnboarding : false;
      router.push(completedOnboarding ? "/dashboard" : "/onboarding");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),#050816] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">MarginRight</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Sign in to save appraisals and manage your buying history.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
            <label className="block space-y-2 text-sm text-zinc-300">
              <span>Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                type="email"
                placeholder="you@dealer.com"
                required
              />
            </label>
            <label className="block space-y-2 text-sm text-zinc-300">
              <span>Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                type="password"
                placeholder="Enter your password"
                required
              />
            </label>

            {message ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{message}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
            <Link href="/auth/signup" className="text-emerald-300 transition hover:text-emerald-200">Create account</Link>
            <Link href="/auth/forgot-password" className="transition hover:text-white">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
