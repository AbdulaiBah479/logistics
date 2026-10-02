import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { recordAndSendNotification } from "@/lib/notify";
import { requireRole, STAFF_ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assignRiderSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const { id } = await params;
    const { riderId } = assignRiderSchema.parse(await request.json());

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING" && existing.status !== "ASSIGNED") {
      return NextResponse.json(
        { error: `Cannot assign a rider to an order with status ${existing.status}` },
        { status: 400 },
      );
    }

    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    if (!rider || !rider.isActive) {
      return NextResponse.json({ error: "Rider not found or inactive" }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { riderId, status: "ASSIGNED", assignedAt: new Date() },
        include: { customer: true, rider: { include: { user: true } } },
      });

      await tx.orderEvent.create({
        data: { orderId: id, status: "ASSIGNED", createdById: session!.user.id },
      });

      return updated;
    }, { timeout: 15000 });

    await recordAndSendNotification(id, "ASSIGNED", existing.customer, existing.trackingCode);

    return NextResponse.json({ order });
  } catch (error) {
    return errorResponse(error);
  }
}
