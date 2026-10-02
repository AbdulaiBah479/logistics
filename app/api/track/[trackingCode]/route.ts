import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { getPublicTrackingPayload } from "@/lib/trackingPayload";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackingCode: string }> },
) {
  try {
    const { trackingCode } = await params;
    const payload = await getPublicTrackingPayload(trackingCode);

    if (!payload) {
      return NextResponse.json({ error: "Tracking code not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return errorResponse(error);
  }
}
