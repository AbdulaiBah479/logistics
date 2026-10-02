import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ratingSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trackingCode: string }> },
) {
  try {
    const { trackingCode } = await params;
    const { rating, comment } = ratingSchema.parse(await request.json());

    const order = await prisma.order.findUnique({ where: { trackingCode } });
    if (!order) {
      return NextResponse.json({ error: "Tracking code not found" }, { status: 404 });
    }
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Only delivered orders can be rated" },
        { status: 400 },
      );
    }
    if (order.rating != null) {
      return NextResponse.json({ error: "This order has already been rated" }, { status: 400 });
    }

    await prisma.order.update({
      where: { trackingCode },
      data: { rating, ratingComment: comment, ratedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
