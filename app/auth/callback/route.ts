import { NextResponse } from "next/server";

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.marginright.co.uk";

  return NextResponse.redirect(new URL("/auth/reset-password", siteUrl));
}
