import { supabaseBrowser, isSupabaseConfigured } from "./supabase";

const STORAGE_KEY = "marginright.appraisals.v1";

export interface AppraisalRecord {
  id: string;
  registration: string;
  vehicle_type: string;
  purchase_price: number;
  retail_value: number;
  prep_cost: number;
  auction_fee: number;
  transport_cost: number;
  vat_scheme: string;
  vat_registered: string;
  max_bid: number;
  projected_profit: number;
  gross_margin: number;
  roi: number;
  buy_status: string;
  notes: string;
  created_at: string;
  user_id?: string;
}

export type AppraisalPayload = Omit<AppraisalRecord, "id" | "created_at" | "user_id">;

const sortByNewestFirst = (left: AppraisalRecord, right: AppraisalRecord) =>
  new Date(right.created_at).getTime() - new Date(left.created_at).getTime();

const createAppraisalId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getLocalStorageKey = (userId?: string) => `${STORAGE_KEY}${userId ? `:${userId}` : ""}`;

const toNumber = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const mapRowToAppraisal = (row: Record<string, any>): AppraisalRecord => ({
  id: row.id,
  registration: row.registration ?? "",
  vehicle_type: row.vehicle_type ?? "",
  purchase_price: toNumber(row.purchase_price ?? row.current_bid),
  retail_value: toNumber(row.retail_value),
  prep_cost: toNumber(row.prep_cost),
  auction_fee: toNumber(row.auction_fee),
  transport_cost: toNumber(row.transport_cost),
  vat_scheme: row.vat_scheme ?? "",
  vat_registered: row.vat_registered ?? "",
  max_bid: toNumber(row.max_bid),
  projected_profit: toNumber(row.projected_profit),
  gross_margin: toNumber(row.gross_margin),
  roi: toNumber(row.roi),
  buy_status: row.decision ?? row.buy_status ?? "",
  notes: row.notes ?? "",
  created_at: row.created_at,
  user_id: row.user_id,
});

export const getStoredAppraisal = async (id: string, userId?: string): Promise<AppraisalRecord | null> => {
  const allAppraisals = await getStoredAppraisals(userId);
  return allAppraisals.find((appraisal) => appraisal.id === id) ?? null;
};

export const getStoredAppraisals = async (userId?: string): Promise<AppraisalRecord[]> => {
  if (typeof window === "undefined") {
    return [];
  }

  // Prefer Supabase when configured and a userId is provided
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabaseBrowser
        .from("appraisals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase: failed to fetch appraisals", error);
        // fall back to localStorage on error
      } else if (Array.isArray(data)) {
        return data.map((row) => mapRowToAppraisal(row)).sort(sortByNewestFirst);
      }
    } catch (err) {
      console.error("Supabase fetch failed", err);
    }
  }

  // LocalStorage fallback
  try {
    const rawValue = window.localStorage.getItem(getLocalStorageKey(userId));
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as AppraisalRecord[];
    return Array.isArray(parsed) ? [...parsed].sort(sortByNewestFirst) : [];
  } catch (error) {
    console.error("Failed to read appraisals from storage", error);
    return [];
  }
};

export const saveAppraisal = async (payload: AppraisalPayload, userId?: string, appraisalId?: string): Promise<AppraisalRecord> => {
  if (typeof window === "undefined") {
    throw new Error("Appraisal persistence is only available in the browser.");
  }

  // If Supabase is available AND we have a userId, save to Supabase
  if (isSupabaseConfigured && userId) {
    try {
      const toNullableNumber = (value: unknown) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : null;
      };

      const toPersist: Record<string, any> = {
        user_id: userId,
        registration: payload.registration,
        vehicle_type: payload.vehicle_type,
        retail_value: toNullableNumber(payload.retail_value),
        max_bid: toNullableNumber(payload.max_bid),
        projected_profit: toNullableNumber(payload.projected_profit),
        gross_margin: toNullableNumber(payload.gross_margin),
        roi: toNullableNumber(payload.roi),
        decision: payload.buy_status,
        notes: payload.notes,
      };

      Object.entries(toPersist).forEach(([key, value]) => {
        if (value === undefined) {
          delete toPersist[key];
        }
      });

      const mutation = appraisalId
        ? supabaseBrowser.from("appraisals").update(toPersist).eq("id", appraisalId).eq("user_id", userId).select().single()
        : supabaseBrowser.from("appraisals").insert([toPersist]).select().single();

      const { data, error } = await mutation;

      if (error || !data) {
        const supabaseError = {
          message: error?.message ?? "Unknown Supabase error",
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        };

        console.error("Supabase: failed to save appraisal", supabaseError);
        throw new Error(
          [
            `message: ${supabaseError.message}`,
            `code: ${supabaseError.code ?? "n/a"}`,
            `details: ${supabaseError.details ?? "n/a"}`,
            `hint: ${supabaseError.hint ?? "n/a"}`,
          ].join(" | "),
        );
      }

      // Map returned row to AppraisalRecord shape
      return mapRowToAppraisal(data as Record<string, any>);
    } catch (err: any) {
      console.error("Supabase insert failed", err);
      throw new Error(err?.message ?? String(err));
    }
  }

  // LocalStorage fallback behaviour
  try {
    const existing = await getStoredAppraisals(userId);
    const createdAt = new Date().toISOString();
    const appraisal: AppraisalRecord = {
      id: appraisalId ?? createAppraisalId(),
      created_at: createdAt,
      user_id: userId,
      ...payload,
    };

    const nextAppraisals = [appraisal, ...existing.filter((item) => item.id !== appraisal.id)].sort(sortByNewestFirst);
    window.localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(nextAppraisals));

    return appraisal;
  } catch (error) {
    console.error("Failed to save appraisal", error);
    throw error;
  }
};

export const deleteAppraisal = async (id: string, userId?: string): Promise<AppraisalRecord[]> => {
  if (typeof window === "undefined") {
    return [];
  }

  if (isSupabaseConfigured && userId) {
    try {
      const { error } = await supabaseBrowser.from("appraisals").delete().eq("id", id).eq("user_id", userId);
      if (error) {
        console.error("Supabase: failed to delete appraisal", error);
        // fall back to local storage deletion
      } else {
        // return refreshed list
        return await getStoredAppraisals(userId);
      }
    } catch (err) {
      console.error("Supabase delete failed", err);
    }
  }

  try {
    const existing = await getStoredAppraisals(userId);
    const nextAppraisals = existing.filter((appraisal) => appraisal.id !== id);
    window.localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(nextAppraisals));
    return nextAppraisals.sort(sortByNewestFirst);
  } catch (error) {
    console.error("Failed to delete appraisal", error);
    return await getStoredAppraisals(userId);
  }
};

