import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { createOrder, listOrders } from "@/lib/ordersRepo";
import { requireRole, STAFF_ROLES } from "@/lib/permissions";
import { createOrderSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const { searchParams } = new URL(request.url);
    const orders = await listOrders({
      status: searchParams.get("status"),
      riderId: searchParams.get("riderId"),
      q: searchParams.get("q"),
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const input = createOrderSchema.parse(await request.json());
    const order = await createOrder(input, session!.user.id);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
