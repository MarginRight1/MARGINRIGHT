import { supabaseBrowser, isSupabaseConfigured } from "./supabase";

export type VatScheme = "Margin Scheme" | "Plus VAT" | "VAT Inclusive";
export type VatRegistered = "Yes" | "No";

const STORAGE_KEY = "marginright.dealer-settings.v1";

export interface DealerSettings {
  defaultAuctionFee: number;
  defaultTransportCost: number;
  defaultPrepCost: number;
  defaultDesiredProfit: number;
  defaultVatScheme: VatScheme;
  vatRegistered: VatRegistered;
  updatedAt: string;
}

export const createDefaultDealerSettings = (): DealerSettings => ({
  defaultAuctionFee: 180,
  defaultTransportCost: 120,
  defaultPrepCost: 450,
  defaultDesiredProfit: 1500,
  defaultVatScheme: "Plus VAT",
  vatRegistered: "Yes",
  updatedAt: new Date().toISOString(),
});

const getStorageKey = (userId?: string) => `${STORAGE_KEY}${userId ? `:${userId}` : ""}`;

const normalizeSettings = (value: Partial<DealerSettings> | null | undefined): DealerSettings => ({
  ...createDefaultDealerSettings(),
  ...(value ?? {}),
});

export const getStoredDealerSettings = async (userId?: string): Promise<DealerSettings> => {
  if (typeof window === "undefined") {
    return createDefaultDealerSettings();
  }

  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabaseBrowser.auth.getUser();
      if (!error && data.user) {
        const metadata = data.user.user_metadata as Partial<DealerSettings> | undefined;
        if (metadata && typeof metadata === "object") {
          return normalizeSettings(metadata);
        }
      }
    } catch (err) {
      console.error("Failed to read dealer settings from Supabase", err);
    }
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(userId));
    if (!rawValue) {
      return createDefaultDealerSettings();
    }

    return normalizeSettings(JSON.parse(rawValue) as Partial<DealerSettings>);
  } catch (error) {
    console.error("Failed to read dealer settings", error);
    return createDefaultDealerSettings();
  }
};

export const saveDealerSettings = async (settings: Partial<DealerSettings>, userId?: string): Promise<DealerSettings> => {
  if (typeof window === "undefined") {
    throw new Error("Dealer settings persistence is only available in the browser.");
  }

  const nextSettings: DealerSettings = {
    ...createDefaultDealerSettings(),
    ...await getStoredDealerSettings(userId),
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(nextSettings));

  if (isSupabaseConfigured && userId) {
    try {
      const { error } = await supabaseBrowser.auth.updateUser({
        data: {
          defaultAuctionFee: nextSettings.defaultAuctionFee,
          defaultTransportCost: nextSettings.defaultTransportCost,
          defaultPrepCost: nextSettings.defaultPrepCost,
          defaultDesiredProfit: nextSettings.defaultDesiredProfit,
          defaultVatScheme: nextSettings.defaultVatScheme,
          vatRegistered: nextSettings.vatRegistered,
          updatedAt: nextSettings.updatedAt,
        },
      });

      if (error) {
        console.error("Failed to save dealer settings to Supabase", error);
      }
    } catch (err) {
      console.error("Supabase dealer settings save failed", err);
    }
  }

  return nextSettings;
};
