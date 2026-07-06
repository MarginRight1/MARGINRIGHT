const STORAGE_KEY = "marginright.user-profile.v1";

export interface UserProfile {
  businessName: string;
  monthlyVehiclesPurchased: number;
  targetGrossMargin: number;
  defaultAuctionFee: number;
  defaultTransportCost: number;
  defaultPrepCost: number;
  completedOnboarding: boolean;
  updatedAt: string;
}

export const createDefaultUserProfile = (): UserProfile => ({
  businessName: "",
  monthlyVehiclesPurchased: 8,
  targetGrossMargin: 12,
  defaultAuctionFee: 180,
  defaultTransportCost: 120,
  defaultPrepCost: 450,
  completedOnboarding: false,
  updatedAt: new Date().toISOString(),
});

const getStorageKey = (userId?: string) => `${STORAGE_KEY}${userId ? `:${userId}` : ""}`;

export const getStoredUserProfile = (userId?: string): UserProfile | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(userId));
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as UserProfile;
    return parsed;
  } catch (error) {
    console.error("Failed to read user profile", error);
    return null;
  }
};

export const saveUserProfile = async (profile: Partial<UserProfile>, userId?: string): Promise<UserProfile> => {
  if (typeof window === "undefined") {
    throw new Error("User profile persistence is only available in the browser.");
  }

  const nextProfile: UserProfile = {
    ...createDefaultUserProfile(),
    ...getStoredUserProfile(userId),
    ...profile,
    completedOnboarding: true,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(nextProfile));
  return nextProfile;
};
