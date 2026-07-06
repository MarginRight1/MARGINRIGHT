"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabase";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) {
        router.replace("/auth/login");
        return;
      }

      setReady(true);
    };

    checkSession();
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
