import { NextRequest, NextResponse } from "next/server";
import { DvlaVehicleLookupProvider } from "../../lib/dvlaVehicleLookup";

export async function GET(request: NextRequest) {
  const registration = request.nextUrl.searchParams.get("registration")?.trim() ?? "";

  if (!registration) {
    return NextResponse.json({ error: "Please enter a registration to look up." }, { status: 400 });
  }

  try {
    const provider = new DvlaVehicleLookupProvider();
    const details = await provider.lookup(registration);
    return NextResponse.json(details);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to look up vehicle details right now.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
