import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { ForbiddenError, UnauthorizedError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations";

async function assertAccess(orderId: string, session: Session | null) {
  if (!session?.user) throw new UnauthorizedError("Not authenticated");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  const { role, riderId } = session.user;
  const isStaff = role === "ADMIN" || role === "DISPATCHER";
  const isAssignedRider = role === "RIDER" && order.riderId === riderId;
  if (!isStaff && !isAssignedRider) {
    throw new ForbiddenError("Not authorized to view this order's messages");
  }

  return order;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const order = await assertAccess(id, session);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const order = await assertAccess(id, session);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { body } = messageSchema.parse(await request.json());
    const senderRole = session!.user.role === "RIDER" ? "RIDER" : "STAFF";

    const message = await prisma.message.create({
      data: { orderId: id, senderRole, senderName: session!.user.name ?? "Staff", body },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
