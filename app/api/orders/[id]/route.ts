import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { getOrderDetail, orderDetailInclude } from "@/lib/ordersRepo";
import { requireRole, STAFF_ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { computeSimulatedPosition } from "@/lib/tracking";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const { id } = await params;
    const order = await getOrderDetail(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order, position: computeSimulatedPosition(order) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const { id } = await params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending orders can be edited" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const allowedFields = [
      "packageDescription",
      "codAmount",
      "pickupAddress",
      "pickupLat",
      "pickupLng",
      "dropoffAddress",
      "dropoffLat",
      "dropoffLng",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) data[field] = body[field];
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: orderDetailInclude,
    });

    return NextResponse.json({ order });
  } catch (error) {
    return errorResponse(error);
  }
}
