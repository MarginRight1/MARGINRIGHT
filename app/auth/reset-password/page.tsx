"use client";

import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabaseBrowser.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Password updated. You can now log in.");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <form onSubmit={handleUpdate} className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 p-8">
        <h1 className="text-2xl font-bold">Set new password</h1>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3"
        />

        {message && <p>{message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-emerald-500/20 px-4 py-3 font-semibold text-emerald-300"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
