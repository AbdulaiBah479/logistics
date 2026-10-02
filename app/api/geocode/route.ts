import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { requireRole, STAFF_ROLES } from "@/lib/permissions";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

/** Server-side proxy to Nominatim — never call it directly from the browser (usage policy requires a real User-Agent and rate limiting). */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "sl");

    const upstream = await fetch(url, {
      headers: { "User-Agent": "sme-delivery-tracker-portfolio-project/1.0" },
    });

    if (!upstream.ok) {
      return NextResponse.json({ results: [] });
    }

    const data: NominatimResult[] = await upstream.json();
    const results = data.map((r) => ({
      label: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));

    return NextResponse.json({ results });
  } catch (error) {
    return errorResponse(error);
  }
}
