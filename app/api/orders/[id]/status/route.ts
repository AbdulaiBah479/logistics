import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";
import { recordAndSendNotification } from "@/lib/notify";
import { STATUS_TIMESTAMP_FIELD } from "@/lib/orderStatus";
import {
  ForbiddenError,
  UnauthorizedError,
  isRiderTransitionAllowed,
  isStaffTransitionAllowed,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { statusTransitionSchema } from "@/lib/validations";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "proofs");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError("Not authenticated");

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const { toStatus, note, failureReason } = statusTransitionSchema.parse({
      toStatus: formData.get("toStatus"),
      note: formData.get("note") ?? undefined,
      failureReason: formData.get("failureReason") ?? undefined,
    });

    const { role, riderId } = session.user;
    const isRider = role === "RIDER";
    const isStaff = role === "ADMIN" || role === "DISPATCHER";

    if (isRider) {
      if (order.riderId !== riderId) {
        throw new ForbiddenError("This order is not assigned to you");
      }
      if (!isRiderTransitionAllowed(order.status, toStatus)) {
        throw new ForbiddenError(`Cannot move from ${order.status} to ${toStatus}`);
      }
    } else if (isStaff) {
      if (!isStaffTransitionAllowed(order.status, toStatus)) {
        throw new ForbiddenError(`Cannot move from ${order.status} to ${toStatus}`);
      }
    } else {
      throw new ForbiddenError("Not authorized for this action");
    }

    if (toStatus === "FAILED" && !failureReason) {
      return NextResponse.json(
        { error: "failureReason is required when marking an order as failed" },
        { status: 400 },
      );
    }

    let proofOfDeliveryPhotoUrl: string | undefined;
    if (toStatus === "DELIVERED") {
      const photo = formData.get("photo");
      if (!(photo instanceof File) || photo.size === 0) {
        return NextResponse.json(
          { error: "A proof-of-delivery photo is required to mark an order delivered" },
          { status: 400 },
        );
      }
      const ext = (photo.type.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
      const filename = `${id}-${randomUUID()}.${ext}`;
      await mkdir(UPLOAD_DIR, { recursive: true });
      const buffer = Buffer.from(await photo.arrayBuffer());
      await writeFile(path.join(UPLOAD_DIR, filename), buffer);
      proofOfDeliveryPhotoUrl = `/uploads/proofs/${filename}`;
    }

    const timestampField = STATUS_TIMESTAMP_FIELD[toStatus as OrderStatus];

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id },
        data: {
          status: toStatus,
          ...(timestampField ? { [timestampField]: new Date() } : {}),
          ...(failureReason ? { failureReason } : {}),
          ...(proofOfDeliveryPhotoUrl ? { proofOfDeliveryPhotoUrl } : {}),
        },
        include: { customer: true, rider: { include: { user: true } } },
      });

      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: toStatus,
          note: note ?? failureReason,
          createdById: session.user.id,
        },
      });

      return result;
    }, { timeout: 15000 });

    await recordAndSendNotification(
      id,
      toStatus,
      order.customer,
      order.trackingCode,
      failureReason,
    );

    return NextResponse.json({ order: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
