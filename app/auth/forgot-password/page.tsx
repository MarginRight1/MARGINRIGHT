"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Password reset instructions have been sent to your email.");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),#050816] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">MarginRight</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Reset your password</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">We’ll send a secure reset link to your inbox.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleReset}>
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

            {message ? <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Sending reset link…" : "Send reset link"}
            </button>
          </form>

          <div className="mt-5 text-sm text-zinc-400">
            <Link href="/auth/login" className="text-emerald-300 transition hover:text-emerald-200">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
