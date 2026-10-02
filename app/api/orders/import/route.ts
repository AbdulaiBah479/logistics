import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { parseOrdersCsv } from "@/lib/csv";
import { createOrder } from "@/lib/ordersRepo";
import { requireRole, STAFF_ROLES } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session?.user?.role, STAFF_ROLES);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "A CSV file is required" }, { status: 400 });
    }

    const text = await file.text();
    const { rows, errors } = parseOrdersCsv(text);

    const created: string[] = [];
    for (const [index, row] of rows.entries()) {
      try {
        const order = await createOrder(row, session!.user.id);
        created.push(order.trackingCode);
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error instanceof Error ? error.message : "Failed to create order",
        });
      }
    }

    return NextResponse.json({ created, errors });
  } catch (error) {
    return errorResponse(error);
  }
}
