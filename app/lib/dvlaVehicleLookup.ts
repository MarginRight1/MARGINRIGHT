import type { VehicleDetails, VehicleLookupProvider } from "./vehicleLookup";

const inferVehicleType = (data: Record<string, unknown>): string | undefined => {
  const values = [
    data.vehicleType,
    data.bodyType,
    data.typeApproval,
    data.vehicleClass,
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());

  const joined = values.join(" ");

  if (!joined) {
    return undefined;
  }

  if (/van|commercial|panel/.test(joined)) return "Van / Commercial";
  if (/pickup|pick-up/.test(joined)) return "Pickup";
  if (/minibus|bus/.test(joined)) return "Minibus";
  if (/car|saloon|hatchback|estate|coupe|convertible|mpv/.test(joined)) return "Car";

  return undefined;
};

export class DvlaVehicleLookupProvider implements VehicleLookupProvider {
  async lookup(registration: string): Promise<VehicleDetails> {
    const normalized = registration.replace(/\s+/g, "").toUpperCase();

    if (!/^[A-Z]{2}\d{2}[A-Z]{3}$/.test(normalized)) {
      throw new Error("That registration format looks invalid.");
    }

    const apiKey = process.env.DVLA_API_KEY;
    if (!apiKey) {
      throw new Error(
        "No DVLA API key is configured. Add DVLA_API_KEY to your environment and restart the app to enable live vehicle lookups.",
      );
    }

    const response = await fetch(
      "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ registrationNumber: normalized }),
      },
    );

    if (response.status === 400 || response.status === 404) {
      throw new Error("That registration could not be found.");
    }

    if (!response.ok) {
      throw new Error("Unable to fetch vehicle details from DVLA right now.");
    }

    const data = (await response.json()) as Record<string, unknown>;

    const getValue = (key: string) => {
      const value = data[key];
      if (typeof value === "string") return value.trim();
      if (typeof value === "number") return String(value);
      return value ? String(value) : "—";
    };

    const inferredVehicleType = inferVehicleType(data);

    return {
      registration: getValue("registrationNumber") || normalized,
      make: getValue("make") || "—",
      model: getValue("model") || "—",
      year: getValue("yearOfManufacture") || getValue("year") || "—",
      yearOfManufacture: getValue("yearOfManufacture") || "—",
      fuel: getValue("fuelType") || "—",
      fuelType: getValue("fuelType") || "—",
      engineSize: getValue("engineSize") || "—",
      engineCapacity: getValue("engineCapacity") || "—",
      colour: getValue("colour") || "—",
      motExpiry: getValue("motExpiry") || "—",
      motStatus: getValue("motStatus") || "—",
      taxStatus: getValue("taxStatus") || "—",
      dateOfLastV5CIssued: getValue("dateOfLastV5CIssued") || "—",
      wheelplan: getValue("wheelplan") || "—",
      revenueWeight: getValue("revenueWeight") || "—",
      vehicleType: inferredVehicleType,
      source: "DVLA",
    };
  }
}
