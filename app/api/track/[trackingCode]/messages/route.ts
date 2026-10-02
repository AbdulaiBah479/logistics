import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackingCode: string }> },
) {
  try {
    const { trackingCode } = await params;
    const order = await prisma.order.findUnique({ where: { trackingCode } });
    if (!order) return NextResponse.json({ error: "Tracking code not found" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trackingCode: string }> },
) {
  try {
    const { trackingCode } = await params;
    const order = await prisma.order.findUnique({
      where: { trackingCode },
      include: { customer: true },
    });
    if (!order) return NextResponse.json({ error: "Tracking code not found" }, { status: 404 });

    const { body } = messageSchema.parse(await request.json());

    const message = await prisma.message.create({
      data: {
        orderId: order.id,
        senderRole: "CUSTOMER",
        senderName: order.customer.name,
        body,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
