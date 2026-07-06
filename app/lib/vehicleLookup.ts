export type VehicleDetails = {
  registration: string;
  make: string;
  model?: string;
  year?: string;
  yearOfManufacture?: string;
  fuel?: string;
  fuelType?: string;
  engineSize?: string;
  engineCapacity?: string;
  transmission?: string;
  colour?: string;
  motExpiry?: string;
  motStatus?: string;
  taxStatus?: string;
  dateOfLastV5CIssued?: string;
  wheelplan?: string;
  revenueWeight?: string;
  vehicleType?: string;
  source: string;
};

export interface VehicleLookupProvider {
  lookup(registration: string): Promise<VehicleDetails>;
}

export class ApiVehicleLookupProvider implements VehicleLookupProvider {
  async lookup(registration: string): Promise<VehicleDetails> {
    const response = await fetch(`/api/vehicle-lookup?registration=${encodeURIComponent(registration)}`);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Unable to look up vehicle details right now.");
    }

    const data = (await response.json()) as VehicleDetails;
    return data;
  }
}

const defaultProvider: VehicleLookupProvider = new ApiVehicleLookupProvider();

export const lookupVehicleDetails = (registration: string) =>
  defaultProvider.lookup(registration);
