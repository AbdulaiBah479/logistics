import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { requireRole, STAFF_ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const { id } = await params;
    const rider = await prisma.rider.findUnique({
      where: { id },
      include: {
        user: true,
        orders: { orderBy: { createdAt: "desc" }, include: { customer: true } },
      },
    });

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    return NextResponse.json({ rider });
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
    const body = await request.json();

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }

    const rider = await prisma.rider.update({
      where: { id },
      data: { isActive: body.isActive },
      include: { user: true },
    });

    return NextResponse.json({ rider });
  } catch (error) {
    return errorResponse(error);
  }
}
