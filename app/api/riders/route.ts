import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { requireRole, STAFF_ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createRiderSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const riders = await prisma.rider.findMany({
      include: {
        user: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ riders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const input = createRiderSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const rider = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: "RIDER",
          phone: input.phone,
        },
      });

      return tx.rider.create({
        data: {
          userId: user.id,
          phone: input.phone,
          vehicleType: input.vehicleType,
        },
        include: { user: true },
      });
    }, { timeout: 15000 });

    return NextResponse.json({ rider }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
